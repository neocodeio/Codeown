import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { emitUpdate } from "../lib/socket.js";
import { GamificationService } from "../services/gamification.service.js";

export async function getPosts(req: Request, res: Response) {
  try {
    const { page = "1", limit = "10", filter = "all", tag, projectId } = req.query;
    console.log("getPosts query params:", { page, limit, filter, tag, projectId });

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Use join to fetch user data in the same query
    let postsQuery = supabase
      .from("posts")
      .select(`
        id, title, content, user_id, created_at, images, attachments, tags, like_count, comment_count, view_count, poll, post_type, code_snippet, project_id,
        projects!posts_project_id_fkey(id, title),
        user:users!posts_user_id_fkey(id, name, avatar_url, username, is_hirable, is_pro, is_og),
        reposted_post:posts!reposted_post_id(
          id, title, content, created_at, images, post_type,
          user:users!posts_user_id_fkey(id, name, avatar_url, username)
        ),
        reposted_project:projects!posts_reposted_project_id_fkey(id, title, description, cover_image, created_at, user:users!user_id(id, name, avatar_url, username))
      `, { count: "exact" })
      .order("is_pro", { foreignTable: "user", ascending: false })
      .order("created_at", { ascending: false });



    if (tag) {
      postsQuery = postsQuery.contains("tags", [tag]);
    }

    if (projectId) {
      const numProjectId = parseInt(projectId as string, 10);
      if (!isNaN(numProjectId)) {
        postsQuery = postsQuery.eq("project_id", numProjectId);
      } else {
        // If projectId is provided but is not a number (e.g. a slug passed by mistake),
        // we return 0 results to avoid showing a generic feed on a specific project page.
        return res.json({ posts: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
      }
    }

    if (String(filter).toLowerCase() === "following") {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Sign in to view the Following feed." });
      }
      const { data: followingRows } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      const followingIds = (followingRows || []).map((r: any) => r.following_id);
      if (followingIds.length === 0) {
        return res.json({ posts: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
      }
      postsQuery = postsQuery.in("user_id", followingIds);
    }

    const { data: posts, error: postsError, count } = await postsQuery.range(offset, offset + limitNum - 1);

    if (postsError) {
      console.error("Supabase error in getPosts:", postsError);
      return res.status(500).json({ error: "Failed to fetch posts", details: postsError.message });
    }

    if (!posts || posts.length === 0) {
      return res.json({ posts: [], total: count || 0, page: pageNum, limit: limitNum, totalPages: Math.ceil((count || 0) / limitNum) });
    }

    // Process posts and ensure user data exists (fallback to "User" if missing)
    const processedPosts = posts.map((post: any) => {
      // 1. Map projects
      const projectData = post.projects || null;

      // 2. Unpack top-level user
      const rawUser = post.user || null;
      const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;

      // 3. Unpack reposted post
      let rpRaw = post.reposted_post || null;
      let repostedPost = Array.isArray(rpRaw) ? rpRaw[0] : rpRaw;
      if (repostedPost) {
        const rpUserRaw = repostedPost.user;
        const rpUser = Array.isArray(rpUserRaw) ? rpUserRaw[0] : rpUserRaw;
        repostedPost = {
          ...repostedPost,
          user: rpUser || { name: "User", avatar_url: null }
        };
      }

      // 4. Unpack reposted project
      let rpjRaw = post.reposted_project || null;
      let repostedProject = Array.isArray(rpjRaw) ? rpjRaw[0] : rpjRaw;
      if (repostedProject) {
        const rpjUserRaw = repostedProject.user;
        const rpjUser = Array.isArray(rpjUserRaw) ? rpjUserRaw[0] : rpjUserRaw;
        repostedProject = {
          ...repostedProject,
          user: rpjUser || { name: "User", avatar_url: null }
        };
      }

      return {
        ...post,
        project: Array.isArray(projectData) ? projectData[0] : projectData,
        reposted_post: repostedPost,
        reposted_project: repostedProject,
        user: {
          name: user?.name || "User",
          avatar_url: user?.avatar_url || null,
          username: user?.username || null,
          is_hirable: user?.is_hirable || false,
          is_pro: user?.is_pro ?? false,
          is_og: user?.is_og ?? false
        }
      };
    });

    // FETCH LIKE AND SAVE STATUS FOR CURRENT USER IN PARALLEL
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    let finalPosts = processedPosts;

    if (currentUserId && processedPosts.length > 0) {
      const postIds = processedPosts.map(p => p.id);

      const [likesRes, savesRes] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
        supabase.from("saved_posts").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
      ]);

      const likedPostIds = new Set((likesRes.data || []).map(l => l.post_id));
      const savedPostIds = new Set((savesRes.data || []).map(s => s.post_id));

      finalPosts = processedPosts.map(p => {
        const poll = p.poll as any;
        return {
          ...p,
          isLiked: likedPostIds.has(p.id),
          isSaved: savedPostIds.has(p.id),
          poll: poll ? {
            options: poll.options,
            votes: poll.votes,
            userVoted: poll.voters?.[currentUserId]
          } : null
        };
      });
    }

    // Final cleanup of polls and mapping stats
    const finalFormattedPosts = finalPosts.map((p: any) => {
      const poll = p.poll as any;
      return {
        ...p,
        poll: poll ? {
          options: poll.options,
          votes: poll.votes,
          userVoted: p.userVoted ?? (currentUserId && poll.voters ? poll.voters[currentUserId] : undefined)
        } : null
      };
    });

    return res.json({
      posts: finalFormattedPosts,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (error: any) {
    console.error("Unexpected error in getPosts:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function getPostById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    // Fetch the post and user data in one join query
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select(`
        id, title, content, user_id, created_at, images, attachments, tags, like_count, comment_count, view_count, poll, post_type, code_snippet, project_id,
        projects!posts_project_id_fkey(id, title),
        user:users!posts_user_id_fkey(id, name, avatar_url, username, is_hirable, is_pro, is_og),
        reposted_post:posts!reposted_post_id(
          id, title, content, created_at, images, post_type,
          user:users!posts_user_id_fkey(id, name, avatar_url, username)
        ),
        reposted_project:projects!posts_reposted_project_id_fkey(id, title, description, cover_image, created_at, user:users!user_id(id, name, avatar_url, username))
      `)
      .eq("id", id)
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Unpack top level user
    const user = Array.isArray(post.user) ? post.user[0] : post.user;
    const userData = {
      name: user?.name || "User",
      avatar_url: user?.avatar_url || null,
      username: user?.username || null,
      is_pro: user?.is_pro ?? false,
      is_og: user?.is_og ?? false,
      is_hirable: user?.is_hirable ?? false
    };

    // Unpack nested reposted data
    const rpRaw = (post as any).reposted_post || null;
    let repostedPost = Array.isArray(rpRaw) ? rpRaw[0] : rpRaw;
    if (repostedPost) {
      const rpUser = Array.isArray((repostedPost as any).user) ? (repostedPost as any).user[0] : (repostedPost as any).user;
      repostedPost = { ...repostedPost, user: rpUser };
    }

    const rpjRaw = (post as any).reposted_project || null;
    let repostedProject = Array.isArray(rpjRaw) ? rpjRaw[0] : rpjRaw;
    if (repostedProject) {
      const rpjUser = Array.isArray((repostedProject as any).user) ? (repostedProject as any).user[0] : (repostedProject as any).user;
      repostedProject = { ...repostedProject, user: rpjUser };
    }

    // Check if the post is already liked/saved by the current user
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    const [viewResult, stats] = await Promise.all([
      // Increment view count (non-blocking)
      (async () => {
        try {
          const { error } = await supabase.rpc('increment_view_count', { row_id: id, table_name: 'posts' });
          if (error) throw error;
        } catch (e) {
          await supabase.from("posts").update({ view_count: (post.view_count || 0) + 1 }).eq("id", id);
        }
      })(),

      // Fetch stats if user is logged in
      currentUserId ? Promise.all([
        supabase.from("likes").select("id").eq("user_id", currentUserId).eq("post_id", id).maybeSingle(),
        supabase.from("saved_posts").select("id").eq("user_id", currentUserId).eq("post_id", id).maybeSingle()
      ]) : Promise.resolve([null, null])
    ]);

    const [likeRes, saveRes] = stats as any;
    const poll = post.poll as any;

    return res.json({
      ...post,
      project: post.projects || null, // Map back for frontend
      user: userData,
      isLiked: !!(likeRes?.data),
      isSaved: !!(saveRes?.data),
      poll: poll ? {
        options: poll.options,
        votes: poll.votes,
        userVoted: currentUserId ? poll.voters?.[currentUserId] : undefined
      } : null
    });
  } catch (error) {
    console.error("Unexpected error in getPostById:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function getPostsByUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch posts for the user with specific columns only
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, title, content, user_id, created_at, images, attachments, tags, like_count, comment_count, view_count, poll, post_type, code_snippet, project_id, projects!posts_project_id_fkey(id, title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Supabase error in getPostsByUser:", postsError);
      return res.status(500).json({
        error: "Failed to fetch posts",
        details: postsError.message
      });
    }

    if (!posts || posts.length === 0) {
      return res.json([]);
    }

    // Get user data for the post author (we already know it's the same user)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, avatar_url, username, is_hirable, is_pro, is_og")
      .eq("id", userId)
      .single();

    // If user not in Supabase, try Clerk
    let userData = user;
    if (!user && process.env.CLERK_SECRET_KEY) {
      try {
        console.log(`User ${userId} not found in Supabase for getPostsByUser, fetching from Clerk`);
        const clerkUser = await clerkClient.users.getUser(userId);

        // Extract user name with better fallback logic
        let userName: string | null = null;
        if (clerkUser.firstName && clerkUser.lastName) {
          userName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();
        } else if (clerkUser.firstName) {
          userName = clerkUser.firstName;
        } else if (clerkUser.lastName) {
          userName = clerkUser.lastName;
        } else if (clerkUser.username) {
          userName = clerkUser.username;
        } else if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
          const emailAddress = clerkUser.emailAddresses[0]?.emailAddress;
          if (emailAddress) {
            userName = (emailAddress?.split("@")[0] as string) || null; // Use email username as fallback
          }
        }

        // If still no name, use a default
        if (!userName) {
          userName = "User";
        }

        const emailAddress = clerkUser.emailAddresses?.[0]?.emailAddress || null;

        userData = {
          id: userId,
          name: userName,
          avatar_url: clerkUser.imageUrl || null,
          username: clerkUser.username || null,
          is_hirable: false,
          is_pro: false,
          is_og: false
        };

        // Sync user to Supabase for future requests
        try {
          await ensureUserExists(userId, clerkUser);
          console.log(`User ${userId} synced to Supabase from getPostsByUser`);
        } catch (syncError: any) {
          console.error(`Could not sync user ${userId} to Supabase:`, syncError?.message);
          // Continue anyway - we have the data from Clerk
        }
      } catch (clerkError: any) {
        console.error("Error fetching user from Clerk:", clerkError?.message || clerkError);
        console.error("Full Clerk error:", clerkError);
      }
    }

    // Combine posts with user data
    const postsWithUsers = posts.map((post: any) => {
      let userDisplayData;
      if (userData) {
        // Extract name with proper fallback
        const userName = (userData as any).name || "User";

        userDisplayData = {
          name: userName,
          avatar_url: (userData as any).avatar_url || null,
          username: (userData as any).username || null,
          is_pro: (userData as any).is_pro ?? false,
          is_og: (userData as any).is_og ?? false,
        };
      } else {
        // No user data found
        userDisplayData = {
          name: "User",
          avatar_url: null,
          is_pro: false,
        };
      }

      return {
        ...post,
        user: userDisplayData
      };
    });

    // FETCH LIKE AND SAVE STATUS FOR CURRENT USER
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    let postsWithStats = postsWithUsers;

    if (currentUserId && postsWithUsers.length > 0) {
      const postIds = postsWithUsers.map(p => p.id);

      const [likesRes, savesRes] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
        supabase.from("saved_posts").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
      ]);

      const likedPostIds = new Set((likesRes.data || []).map(l => l.post_id));
      const savedPostIds = new Set((savesRes.data || []).map(s => s.post_id));

      postsWithStats = postsWithUsers.map(p => {
        const poll = p.poll as any;
        return {
          ...p,
          isLiked: likedPostIds.has(p.id),
          isSaved: savedPostIds.has(p.id),
          poll: poll ? {
            options: poll.options,
            votes: poll.votes,
            userVoted: poll.voters?.[currentUserId]
          } : null
        };
      });
    }

    // Final cleanup of polls for non-logged in users/contributors if not already handled
    const finalFormattedPosts = postsWithStats.map((p: any) => {
      if (!p.poll) return p;
      const poll = p.poll as any;
      return {
        ...p,
        poll: {
          options: poll.options,
          votes: poll.votes,
          userVoted: poll.userVoted ?? (currentUserId && poll.voters ? poll.voters[currentUserId] : undefined)
        }
      };
    });

    return res.json({
      posts: finalFormattedPosts,
      total: posts.length,
      page: 1,
      limit: posts.length,
      totalPages: 1,
    });
  } catch (error: any) {
    console.error("Unexpected error in getPostsByUser:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function createPost(req: Request, res: Response) {
  try {
    const user = req.user;
    const { title, content, images, attachments, tags, poll, post_type, code_snippet, project_id, reposted_post_id, reposted_project_id } = req.body;

    // Validate input - Title is now optional
    const finalTitle = (title && title.trim().length > 0) ? title.trim() : "";

    // Validate input - Content is required UNLESS it's a Re-Ship
    const safeContent = content ? content.trim() : "";
    const isRepost = !!(reposted_post_id || reposted_project_id);

    if (safeContent.length === 0 && !isRepost) {
      return res.status(400).json({ error: "Content is required" });
    }

    if (safeContent.length > 2000) {
      return res.status(400).json({ error: "Content must be 2000 characters or less" });
    }

    // Validate images array if provided
    let imageUrls: string[] = [];
    if (images && Array.isArray(images)) {
      imageUrls = images.filter((img: any) => typeof img === "string" && img.trim().length > 0);
    }

    // Extract and validate tags/hashtags
    let postTags: string[] = [];
    if (tags && Array.isArray(tags)) {
      postTags = tags
        .map((tag: any) => {
          const tagStr = typeof tag === "string" ? tag.trim().toLowerCase() : String(tag).trim().toLowerCase();
          // Remove # if present, we'll add it back when displaying
          return tagStr.startsWith("#") ? tagStr.substring(1) : tagStr;
        })
        .filter((tag: string) => tag.length > 0 && tag.length <= 50)
        .slice(0, 10); // Limit to 10 tags
    }

    // Also extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const contentHashtags = safeContent.match(hashtagRegex) || [];
    const extractedTags = contentHashtags.map((tag: string) => tag.substring(1).toLowerCase());

    // Merge tags from both sources, remove duplicates
    const allTags = [...new Set([...postTags, ...extractedTags])].slice(0, 10);

    // Log user object to debug
    console.log("User object from Clerk:", JSON.stringify(user, null, 2));

    // Get user ID - Clerk uses 'sub' for the user ID
    const userId = user?.sub || user?.id || user?.userId;

    if (!userId) {
      console.error("No user ID found in user object:", user);
      return res.status(401).json({ error: "User ID not found" });
    }

    // Ensure user exists in Supabase (creates if doesn't exist)
    // If JWT token doesn't have full user data, fetch from Clerk API
    let userDataForSync = user as any;
    if (!user?.email_addresses && !user?.emailAddresses && process.env.CLERK_SECRET_KEY) {
      try {
        console.log("JWT token missing user data, fetching from Clerk API for userId:", userId);
        const fullUserData = await clerkClient.users.getUser(userId as string);
        userDataForSync = fullUserData;
        console.log("Fetched full user data from Clerk:", {
          firstName: fullUserData.firstName,
          lastName: fullUserData.lastName,
          email: fullUserData.emailAddresses?.[0]?.emailAddress,
        });
      } catch (clerkError: any) {
        console.error("Error fetching user from Clerk API:", clerkError?.message);
        // Continue with JWT token data
      }
    }

    try {
      const syncedUser = await ensureUserExists(userId as string, userDataForSync);
      console.log("User synced to Supabase:", syncedUser?.id || userId);
    } catch (error: any) {
      console.error("Error ensuring user exists:", error?.message || error);
      console.error("Full error:", error);
      // Continue anyway - user might already exist, or we'll fetch from Clerk when displaying posts
    }



    const { data: createdPost, error } = await supabase.from("posts")
      .insert({
        title: finalTitle,
        content: safeContent,
        user_id: userId,
        images: imageUrls.length > 0 ? imageUrls : null,
        attachments: attachments || null,
        tags: allTags.length > 0 ? allTags : null,
        poll: poll || null,
        post_type: post_type || "Update",
        code_snippet: code_snippet || null,
        project_id: project_id || null,
        reposted_post_id: reposted_post_id || null,
        reposted_project_id: reposted_project_id || null,
      })
      .select(`
        id, title, content, user_id, created_at, images, attachments, tags, like_count, comment_count, view_count, poll, post_type, code_snippet, project_id,
        projects!posts_project_id_fkey(id, title),
        user:users!posts_user_id_fkey(id, name, avatar_url, username, is_hirable, is_pro, is_og),
        reposted_post:posts!reposted_post_id(
          id, title, content, created_at, images, post_type,
          user:users!posts_user_id_fkey(id, name, avatar_url, username)
        ),
        reposted_project:projects!posts_reposted_project_id_fkey(id, title, description, cover_image, created_at, user:users!user_id(id, name, avatar_url, username))
      `)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        error: "Failed to create post",
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    console.log("Post created successfully:", createdPost);

    const formattedPost = {
      ...createdPost,
      user: Array.isArray(createdPost.user) ? createdPost.user[0] : createdPost.user,
    };

    // Emit real-time update
    emitUpdate("post_created", formattedPost);

    // Award XP (non-blocking)
    GamificationService.awardXP(userId as string, 'post', String(createdPost.id));

    // Track post creation analytics (non-blocking)
    supabase.from("analytics_events").insert({
      event_type: 'post_created',
      actor_id: userId,
      target_user_id: userId,
      post_id: createdPost.id
    }).then(({ error }) => {
      if (error) console.error("Error logging post creation analytics:", error);
    });

    // Create notifications for mentioned users (@username)
    try {
      const mentionRegex = /(?:^|\s)@(\w+(?:\.\w+)*)/g;
      const contentForMentions = content || "";
      let match;
      const mentionedUsernames: string[] = [];
      while ((match = mentionRegex.exec(contentForMentions)) !== null) {
        mentionedUsernames.push((match[1] as string).toLowerCase());
      }

      if (mentionedUsernames.length > 0) {
        const { data: mentionedUsers } = await supabase
          .from("users")
          .select("id")
          .in("username", mentionedUsernames);

        if (mentionedUsers && mentionedUsers.length > 0) {
          const mentionNotifications = mentionedUsers
            .filter((u: any) => u.id !== userId)
            .map((u: any) => ({
              user_id: u.id,
              type: "mention",
              actor_id: userId,
              post_id: createdPost.id,
              read: false,
            }));

          if (mentionNotifications.length > 0) {
            const { error: mentionNotifError } = await supabase.from("notifications").insert(mentionNotifications);
            if (mentionNotifError) {
              console.error("Error creating post mention notifications:", mentionNotifError);
            } else {
              console.log(`Created ${mentionNotifications.length} mention notifications for post ${createdPost.id}`);
            }
          }
        }
      }
    } catch (mentionError) {
      console.error("Error processing post mentions:", mentionError);
    }

    // Create notification for original author if it's a Re-Ship
    try {
      if (reposted_post_id) {
        const { data: originalPost } = await supabase.from("posts").select("user_id").eq("id", reposted_post_id).single();
        if (originalPost && originalPost.user_id !== userId) {
          await supabase.from("notifications").insert({
            user_id: originalPost.user_id,
            type: "reship",
            actor_id: userId,
            post_id: createdPost.id,
            read: false
          });
        }
      } else if (reposted_project_id) {
        const { data: originalProject } = await supabase.from("projects").select("user_id").eq("id", reposted_project_id).single();
        if (originalProject && originalProject.user_id !== userId) {
          await supabase.from("notifications").insert({
            user_id: originalProject.user_id,
            type: "reship",
            actor_id: userId,
            post_id: createdPost.id,
            read: false
          });
        }
      }
    } catch (reshipNotifError) {
      console.error("Error creating Re-Ship notification:", reshipNotifError);
    }

    return res.status(201).json({ success: true, data: formattedPost });
  } catch (error: any) {
    console.error("Unexpected error in createPost:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function updatePost(req: Request, res: Response) {
  try {
    const { user } = req;
    const { id } = req.params;
    const { title, content, images, attachments, code_snippet, project_id } = req.body;

    const userId = user?.sub || user?.id || user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Validate input - Title is now optional
    if (content !== undefined && (!content || content.trim().length === 0)) {
      return res.status(400).json({ error: "Content cannot be empty" });
    }

    if (content !== undefined && content.trim().length > 2000) {
      return res.status(400).json({ error: "Content must be 2000 characters or less" });
    }

    // Check if post exists and belongs to user
    const { data: existingPost, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.user_id !== userId) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    // Update post
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim() || "";
    if (content !== undefined) updateData.content = content.trim();

    if (code_snippet !== undefined) {
      updateData.code_snippet = code_snippet || null;
    }
    if (project_id !== undefined) {
      updateData.project_id = project_id || null;
    }
    if (images !== undefined) {
      if (Array.isArray(images)) {
        const imageUrls = images.filter((img: any) => typeof img === "string" && img.trim().length > 0);
        updateData.images = imageUrls.length > 0 ? imageUrls : null;
      } else {
        updateData.images = null;
      }
    }
    if (attachments !== undefined) {
      updateData.attachments = attachments || null;
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase error:", updateError);
      return res.status(500).json({
        error: "Failed to update post",
        details: updateError.message
      });
    }


    // Emit real-time update
    emitUpdate("post_updated", updatedPost);

    return res.json({ success: true, data: updatedPost });
  } catch (error: any) {
    console.error("Unexpected error in updatePost:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function deletePost(req: Request, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;

    const userId = user?.sub || user?.id || user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Check if post exists and belongs to user
    const { data: existingPost, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.user_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    // MANUALLY DELETE DEPENDENCIES to prevent foreign key constraint errors
    await Promise.all([
      supabase.from("likes").delete().eq("post_id", id),
      supabase.from("comments").delete().eq("post_id", id),
      supabase.from("saved_posts").delete().eq("post_id", id),
      supabase.from("notifications").delete().eq("post_id", id),
      supabase.from("analytics_events").delete().eq("post_id", id)
    ]);

    // Delete post
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase error:", deleteError);
      return res.status(500).json({
        error: "Failed to delete post",
        details: deleteError.message
      });
    }


    // Emit real-time update
    emitUpdate("post_deleted", { id });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error in deletePost:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function votePost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch the current post
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("poll")
      .eq("id", id)
      .single();

    if (fetchError || !post || !post.poll) {
      return res.status(404).json({ error: "Post or poll not found" });
    }

    const poll = post.poll as any;
    const voters = poll.voters || {};
    const votes = poll.votes || {};

    // Check if user already voted
    if (voters[userId] !== undefined) {
      return res.status(400).json({ error: "User already voted" });
    }

    // Update poll data
    voters[userId] = optionIndex;
    votes[optionIndex] = (votes[optionIndex] || 0) + 1;

    const updatedPoll = {
      ...poll,
      voters,
      votes
    };

    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update({ poll: updatedPoll })
      .eq("id", id)
      .select("id, title, content, user_id, created_at, images, attachments, tags, like_count, comment_count, view_count, poll, post_type, code_snippet, project_id, user:users!posts_user_id_fkey(id, name, avatar_url, username, is_pro, is_og), projects!posts_project_id_fkey(id, title)")
      .single();

    if (updateError) {
      console.error("Error updating vote:", updateError);
      return res.status(500).json({ error: "Failed to update vote" });
    }

    // Emit real-time update
    emitUpdate("post_updated", updatedPost);

    return res.json({ success: true, data: updatedPost });
  } catch (error: any) {
    console.error("Unexpected error in votePost:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTrendingTags(req: Request, res: Response) {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("tags, created_at")
      .not("tags", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    const tagData: { [key: string]: { count: number; last_posted_at: string } } = {};
    posts.forEach((post: any) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          const lowerTag = tag.toLowerCase().trim();
          if (lowerTag) {
            if (!tagData[lowerTag]) {
              tagData[lowerTag] = { count: 0, last_posted_at: post.created_at };
            }
            tagData[lowerTag].count++;
          }
        });
      }
    });

    const trending = Object.entries(tagData)
      .map(([name, data]) => ({
        name,
        count: data.count,
        last_posted_at: data.last_posted_at
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // If no tags found yet, provide some sensible defaults to keep the UI "alive"
    if (trending.length === 0) {
      const now = new Date().toISOString();
      return res.json([
        { name: "Codeown2026", count: 142, last_posted_at: now },
        { name: "BuildInPublic", count: 98, last_posted_at: now },
        { name: "ShipIt", count: 74, last_posted_at: now },
        { name: "100Commits", count: 51, last_posted_at: now },
        { name: "OpenSource", count: 39, last_posted_at: now }
      ]);
    }

    return res.json(trending);
  } catch (error: any) {
    console.error("Error in getTrendingTags:", error);
    return res.status(500).json({ error: "Failed to fetch trending tags" });
  }
}
