import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function getPosts(req: Request, res: Response) {
  try {
    // Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Supabase error in getPosts:", postsError);
      return res.status(500).json({ 
        error: "Failed to fetch posts", 
        details: postsError.message 
      });
    }

    if (!posts || posts.length === 0) {
      return res.json([]);
    }

    // Get unique user IDs
    const userIds = [...new Set(posts.map((p: any) => p.user_id))];
    
    // Fetch users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .in("id", userIds);
    
    console.log(`Fetched ${users?.length || 0} users from Supabase for ${userIds.length} user IDs`);

    if (usersError) {
      console.error("Supabase error fetching users:", usersError);
      // Continue without user data if users fetch fails
    }

    // Create a map of user_id to user data from Supabase
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Find user IDs that don't have data in Supabase
    const missingUserIds = userIds.filter((id: string) => !userMap.has(id));

    // Fetch missing users from Clerk as fallback
    const clerkUserMap = new Map();
    if (missingUserIds.length > 0 && process.env.CLERK_SECRET_KEY) {
      console.log(`Fetching ${missingUserIds.length} missing users from Clerk:`, missingUserIds);
      try {
        for (const userId of missingUserIds) {
          try {
            console.log(`Fetching Clerk user: ${userId}`);
            const clerkUser = await clerkClient.users.getUser(userId);
            console.log(`Clerk user data for ${userId}:`, {
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              username: clerkUser.username,
              email: clerkUser.emailAddresses?.[0]?.emailAddress,
              imageUrl: clerkUser.imageUrl,
            });
            
            // Get username - try multiple fields
            let userName = "Unknown User";
            if (clerkUser.firstName && clerkUser.lastName) {
              userName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();
            } else if (clerkUser.firstName) {
              userName = clerkUser.firstName;
            } else if (clerkUser.lastName) {
              userName = clerkUser.lastName;
            } else if (clerkUser.username) {
              userName = clerkUser.username;
            } else if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
              userName = clerkUser.emailAddresses[0].emailAddress.split("@")[0];
            }
            
            const userData = {
              name: userName,
              email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
              avatar_url: clerkUser.imageUrl || null,
            };
            
            console.log(`Setting user data for ${userId}:`, userData);
            clerkUserMap.set(userId, userData);

            // Also try to sync this user to Supabase for future requests
            try {
              await ensureUserExists(userId, clerkUser);
              console.log(`User ${userId} synced to Supabase`);
            } catch (syncError: any) {
              // Ignore sync errors, we already have the data from Clerk
              console.error(`Could not sync user ${userId} to Supabase:`, syncError?.message);
            }
          } catch (clerkError: any) {
            console.error(`Error fetching user ${userId} from Clerk:`, clerkError?.message);
            console.error(`Full Clerk error:`, clerkError);
          }
        }
      } catch (error: any) {
        console.error("Error fetching users from Clerk:", error?.message);
        console.error("Full error:", error);
      }
    }

    // Combine posts with user data (prefer Supabase, fallback to Clerk)
    const postsWithUsers = posts.map((post: any) => {
      const supabaseUser = userMap.get(post.user_id);
      const clerkUser = clerkUserMap.get(post.user_id);
      const user = supabaseUser || clerkUser;

      // Log for debugging
      if (!user) {
        console.log(`No user data found for user_id: ${post.user_id}`);
      }

      const userData = user ? {
        name: user.name || user.email?.split("@")[0] || "Unknown User",
        email: user.email || null,
        avatar_url: user.avatar_url || null,
      } : {
        name: "Unknown User",
        email: null,
        avatar_url: null,
      };
      
      console.log(`Post ${post.id}: User data:`, userData);
      
      return {
        ...post,
        user: userData
      };
    });
    
    return res.json(postsWithUsers);
  } catch (error: any) {
    console.error("Unexpected error in getPosts:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}

export async function getPostsByUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch posts for the user
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
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
      .select("id, name, email, avatar_url")
      .eq("id", userId)
      .single();

    // If user not in Supabase, try Clerk
    let userData = user;
    if (!user && process.env.CLERK_SECRET_KEY) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        let userName = "Unknown User";
        if (clerkUser.firstName && clerkUser.lastName) {
          userName = `${clerkUser.firstName} ${clerkUser.lastName}`;
        } else if (clerkUser.username) {
          userName = clerkUser.username;
        } else if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
          userName = clerkUser.emailAddresses[0].emailAddress;
        }
        
        userData = {
          id: userId,
          name: userName,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
          avatar_url: clerkUser.imageUrl || null,
        };
      } catch (clerkError) {
        console.error("Error fetching user from Clerk:", clerkError);
      }
    }

    // Combine posts with user data
    const postsWithUsers = posts.map((post: any) => ({
      ...post,
      user: userData ? {
        name: userData.name || userData.email || "Unknown User",
        email: userData.email || null,
        avatar_url: userData.avatar_url || null,
      } : {
        name: "Unknown User",
        email: null,
        avatar_url: null,
      }
    }));
    
    return res.json(postsWithUsers);
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
    const user = (req as any).user;
    const { title, content, images } = req.body;

    // Validate input
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Validate images array if provided
    let imageUrls: string[] = [];
    if (images && Array.isArray(images)) {
      imageUrls = images.filter((img: any) => typeof img === "string" && img.trim().length > 0);
    }

    // Log user object to debug
    console.log("User object from Clerk:", JSON.stringify(user, null, 2));

    // Get user ID - Clerk uses 'sub' for the user ID
    const userId = user?.sub || user?.id || user?.userId;
    
    if (!userId) {
      console.error("No user ID found in user object:", user);
      return res.status(401).json({ error: "User ID not found" });
    }

    // Ensure user exists in Supabase (creates if doesn't exist)
    try {
      const syncedUser = await ensureUserExists(userId, user);
      console.log("User synced to Supabase:", syncedUser);
    } catch (error: any) {
      console.error("Error ensuring user exists:", error);
      // Continue anyway - user might already exist, or we'll fetch from Clerk
    }

    console.log("Creating post with:", { title, content, userId });

    // Note: user_id column in Supabase must be TEXT/VARCHAR, not UUID
    // Clerk user IDs are strings like "user_xxxxx", not UUIDs
    // images column should be JSONB or TEXT[] type in the database
    const { data, error } = await supabase.from("posts").insert({
      title: title.trim(),
      content: content.trim(),
      user_id: userId, // This should be TEXT type in the database
      images: imageUrls.length > 0 ? imageUrls : null, // Store as JSON array
    });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ 
        error: "Failed to create post", 
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    console.log("Post created successfully:", data);
    return res.status(201).json({ success: true, data });
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
    const user = (req as any).user;
    const { id } = req.params;
    const { title, content, images } = req.body;

    const userId = user?.sub || user?.id || user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Validate input
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }

    if (content !== undefined && (!content || content.trim().length === 0)) {
      return res.status(400).json({ error: "Content cannot be empty" });
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
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (images !== undefined) {
      if (Array.isArray(images)) {
        const imageUrls = images.filter((img: any) => typeof img === "string" && img.trim().length > 0);
        updateData.images = imageUrls.length > 0 ? imageUrls : null;
      } else {
        updateData.images = null;
      }
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
    const user = (req as any).user;
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

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error in deletePost:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}
