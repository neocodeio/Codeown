import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function getComments(req: Request, res: Response) {
  try {
    const { postId } = req.params;

    // Fetch comments for the post
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Supabase error in getComments:", commentsError);
      return res.status(500).json({ 
        error: "Failed to fetch comments", 
        details: commentsError.message 
      });
    }

    if (!comments || comments.length === 0) {
      return res.json([]);
    }

    // Get unique user IDs
    const userIds = [...new Set(comments.map((c: any) => c.user_id))];
    
    // Fetch users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .in("id", userIds);

    if (usersError) {
      console.error("Supabase error fetching users:", usersError);
    }

    // Create a map of user_id to user data from Supabase
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Find user IDs that don't have data in Supabase
    const missingUserIds = userIds.filter((id: string) => !userMap.has(id));

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

    // Combine comments with user data
    const commentsWithUsers = comments.map((comment: any) => {
      const supabaseUser = userMap.get(comment.user_id);
      const clerkUser = clerkUserMap.get(comment.user_id);
      const user = supabaseUser || clerkUser;

      // Extract user data with better fallback logic
      let userData;
      if (user) {
        // Handle both Supabase format and Clerk format
        const userName = user.name || 
                        (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
                        user.firstName || 
                        user.lastName || 
                        user.username ||
                        null;
        
        const userEmail = user.email || 
                         (user.emailAddresses?.[0]?.emailAddress) ||
                         null;
        
        const avatarUrl = user.avatar_url || 
                         user.imageUrl || 
                         null;

        userData = {
          name: userName || (userEmail ? userEmail.split("@")[0] : "User"),
          email: userEmail,
          avatar_url: avatarUrl,
        };
      } else {
        userData = {
          name: "User",
          email: null,
          avatar_url: null,
        };
      }

      return {
        ...comment,
        user: userData
      };
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
    const user = (req as any).user;
    const { post_id, content } = req.body;

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
        const fullUserData = await clerkClient.users.getUser(userId);
        userDataForSync = fullUserData;
      } catch (clerkError: any) {
        console.error("Error fetching user from Clerk API:", clerkError?.message);
        // Continue with JWT token data
      }
    }
    
    try {
      await ensureUserExists(userId, userDataForSync);
    } catch (error: any) {
      console.error("Error ensuring user exists:", error?.message || error);
    }

    console.log("Creating comment with:", { post_id, content, userId });

    // Ensure post_id is an integer (posts table uses INTEGER/SERIAL, not UUID)
    const postIdInt = typeof post_id === 'string' ? parseInt(post_id, 10) : post_id;
    
    if (isNaN(postIdInt)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const { data, error } = await supabase.from("comments").insert({
      post_id: postIdInt,
      content: content.trim(),
      user_id: userId,
    });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ 
        error: "Failed to create comment", 
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    console.log("Comment created successfully:", data);
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error("Unexpected error in createComment:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}

