import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function getComments(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    const sort = ((req.query.sort as string) || "newest").toLowerCase() === "top" ? "top" : "newest";

    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId);

    if (commentsError) {
      console.error("Supabase error in getComments:", commentsError);
      return res.status(500).json({ error: "Failed to fetch comments", details: commentsError.message });
    }

    if (!comments || comments.length === 0) {
      return res.json([]);
    }

    const commentIds = comments.map((c: any) => c.id);
    const { data: likeRows } = await supabase
      .from("likes")
      .select("comment_id")
      .in("comment_id", commentIds)
      .not("comment_id", "is", null);

    const likeCountMap = new Map<number, number>();
    for (const r of likeRows || []) {
      const id = (r as any).comment_id;
      if (id != null) likeCountMap.set(id, (likeCountMap.get(id) || 0) + 1);
    }

    const withLikes = comments.map((c: any) => ({
      ...c,
      like_count: likeCountMap.get(c.id) || 0,
    }));

    if (sort === "top") {
      withLikes.sort((a: any, b: any) => {
        if (b.like_count !== a.like_count) return b.like_count - a.like_count;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      withLikes.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    const userIds = new Set<string>(withLikes.map((c: any) => c.user_id));
    for (const c of withLikes) {
      if (c.parent_id) {
        const p = withLikes.find((x: any) => x.id === c.parent_id);
        if (p) userIds.add(p.user_id);
      }
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .in("id", [...userIds]);

    if (usersError) {
      console.error("Supabase error fetching users:", usersError);
    }

    // Create a map of user_id to user data from Supabase
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    const missingUserIds = [...userIds].filter((id: string) => !userMap.has(id));

    // Fetch missing users from Clerk as fallback
    const clerkUserMap = new Map();
    if (missingUserIds.length > 0 && process.env.CLERK_SECRET_KEY) {
      try {
        for (const userId of missingUserIds) {
          try {
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
                userName = emailAddress.split("@")[0]; // Use email username as fallback
              }
            }
            
            // If still no name, use a default
            if (!userName) {
              userName = "User";
            }
            
            clerkUserMap.set(userId, {
              name: userName,
              email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
              avatar_url: clerkUser.imageUrl || null,
            });

            // Sync user to Supabase
            try {
              await ensureUserExists(userId, clerkUser);
            } catch (syncError) {
              console.log("Could not sync user to Supabase, but using Clerk data:", userId);
            }
          } catch (clerkError: any) {
            console.error(`Error fetching user ${userId} from Clerk:`, clerkError?.message);
          }
        }
      } catch (error: any) {
        console.error("Error fetching users from Clerk:", error?.message);
      }
    }

    const commentsWithUsers = withLikes.map((comment: any) => {
      const supabaseUser = userMap.get(comment.user_id);
      const clerkUser = clerkUserMap.get(comment.user_id);
      const user = supabaseUser || clerkUser;

      let userData: { name: string; email: string | null; avatar_url: string | null };
      if (user) {
        const userName = user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) || user.firstName || user.lastName || user.username || null;
        const userEmail = user.email || (user.emailAddresses?.[0]?.emailAddress) || null;
        const avatarUrl = user.avatar_url || user.imageUrl || null;
        userData = { name: userName || (userEmail ? userEmail.split("@")[0] : "User"), email: userEmail, avatar_url: avatarUrl };
      } else {
        userData = { name: "User", email: null, avatar_url: null };
      }

      let parent_author_name: string | null = null;
      if (comment.parent_id) {
        const p = withLikes.find((x: any) => x.id === comment.parent_id);
        if (p) {
          const pu = userMap.get(p.user_id) || clerkUserMap.get(p.user_id);
          parent_author_name = pu?.name ?? null;
        }
      }

      return { ...comment, user: userData, parent_author_name };
    });

    return res.json(commentsWithUsers);
  } catch (error: any) {
    console.error("Unexpected error in getComments:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}

export async function createComment(req: Request, res: Response) {
  try {
    const user = req.user;
    const { post_id, content, parent_id: parentIdRaw } = req.body;

    // Validate input
    if (!post_id) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Get user ID
    const userId = user?.sub || user?.id || user?.userId;
    
    if (!userId) {
      console.error("No user ID found in user object:", user);
      return res.status(401).json({ error: "User ID not found" });
    }

    // Ensure user exists in Supabase
    // If JWT token doesn't have full user data, fetch from Clerk API
    let userDataForSync = user;
    if (!user?.email_addresses && !user?.emailAddresses && process.env.CLERK_SECRET_KEY) {
      try {
        console.log("JWT token missing user data, fetching from Clerk API for userId:", userId);
        const fullUserData = await clerkClient.users.getUser(userId as string);
        userDataForSync = fullUserData as any;
      } catch (clerkError: any) {
        console.error("Error fetching user from Clerk API:", clerkError?.message);
        // Continue with JWT token data
      }
    }
    
    try {
      await ensureUserExists(userId as string, userDataForSync as unknown as any);
    } catch (error: any) {
      console.error("Error ensuring user exists:", error?.message || error);
    }

    console.log("Creating comment with:", { post_id, content, userId });

    // Extract mentions from content (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex) || [];
    const mentionedUsernames = mentions.map((m: string) => m.substring(1).toLowerCase());

    // Ensure post_id is an integer (posts table uses INTEGER/SERIAL, not UUID)
    const postIdInt = typeof post_id === 'string' ? parseInt(post_id, 10) : post_id;
    
    if (isNaN(postIdInt)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    let parentIdInt: number | null = null;
    if (parentIdRaw != null) {
      parentIdInt = typeof parentIdRaw === "string" ? parseInt(parentIdRaw, 10) : parentIdRaw;
      if (parentIdInt != null && isNaN(parentIdInt)) {
        parentIdInt = null;
        console.error("Invalid parent ID:", parentIdRaw);
        return res.status(400).json({ error: "Invalid parent ID" });
      }
    }

    const insertRow: Record<string, unknown> = {
      post_id: postIdInt,
      content: content.trim(),
      user_id: userId,
    };
    if (parentIdInt != null) insertRow.parent_id = parentIdInt;

    const { data, error } = await supabase.from("comments").insert(insertRow);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ 
        error: "Failed to create comment", 
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    // Get the created comment ID
    const { data: newComment } = await supabase
      .from("comments")
      .select("id")
      .eq("post_id", postIdInt)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const commentId = newComment?.id || null;

    // Get post owner for notification
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postIdInt)
      .single();

    // Create notification for post owner (if not the commenter)
    if (post && post.user_id !== userId) {
      try {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          type: "comment",
          actor_id: userId,
          post_id: postIdInt,
          comment_id: commentId,
          read: false,
        });
      } catch (notifError) {
        console.error("Error creating comment notification:", notifError);
      }
    }

    // Create "reply" notification for parent comment author
    if (parentIdInt != null) {
      const { data: parentComment } = await supabase.from("comments").select("user_id").eq("id", parentIdInt).single();
      if (parentComment && parentComment.user_id !== userId) {
        try {
          await supabase.from("notifications").insert({
            user_id: parentComment.user_id,
            type: "reply",
            actor_id: userId,
            post_id: postIdInt,
            comment_id: commentId,
            read: false,
          });
        } catch (replyNotifErr) {
          console.error("Error creating reply notification:", replyNotifErr);
        }
      }
    }

    // Create notifications for mentioned users
    if (mentionedUsernames.length > 0) {
      const { data: mentionedUsers } = await supabase
        .from("users")
        .select("id")
        .in("username", mentionedUsernames);

      if (mentionedUsers && mentionedUsers.length > 0) {
        const mentionNotifications = mentionedUsers
          .filter((u: any) => u.id !== userId && u.id !== post?.user_id) // Don't notify commenter or post owner
          .map((u: any) => ({
            user_id: u.id,
            type: "mention",
            actor_id: userId,
            post_id: postIdInt,
            comment_id: commentId,
            read: false,
          }));

        if (mentionNotifications.length > 0) {
          try {
            const { error: mentionNotifError } = await supabase.from("notifications").insert(mentionNotifications);
            if (mentionNotifError) {
              console.error("Error creating mention notifications:", mentionNotifError);
            } else {
              console.log(`Created ${mentionNotifications.length} mention notifications`);
            }
          } catch (mentionNotifError) {
            console.error("Error creating mention notifications:", mentionNotifError);
          }
        }
      }
    }

    console.log("Comment created successfully:", data);
    return res.status(201).json({ success: true, data, commentId });
  } catch (error: any) {
    console.error("Unexpected error in createComment:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}

