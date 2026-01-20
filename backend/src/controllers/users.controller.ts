import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Ensure user exists in Supabase (create if doesn't exist)
export async function ensureUserExists(userId: string, userData?: any) {
  // Helper function to extract user info from different Clerk data formats
  const getUserInfo = (data: any) => {
    console.log("Extracting user info from:", JSON.stringify(data, null, 2));
    
    // Handle Clerk API format (from clerkClient.users.getUser)
    if (data?.firstName || data?.lastName || data?.emailAddresses) {
      const email = data.emailAddresses?.[0]?.emailAddress || data.email || null;
      let name = null;
      if (data.firstName && data.lastName) {
        name = `${data.firstName} ${data.lastName}`;
      } else if (data.firstName) {
        name = data.firstName;
      } else if (data.lastName) {
        name = data.lastName;
      } else if (data.username) {
        name = data.username;
      } else if (email) {
        name = email.split("@")[0]; // Use email username as fallback
      }
      
      return {
        email: email,
        name: name || "User",
        avatar_url: data.imageUrl || null,
      };
    }
    
    // Handle JWT token format (from verifyToken)
    if (data?.email_addresses || data?.first_name || data?.last_name) {
      const email = data.email_addresses?.[0]?.email_address || data.email || null;
      let name = null;
      if (data.first_name && data.last_name) {
        name = `${data.first_name} ${data.last_name}`;
      } else if (data.first_name) {
        name = data.first_name;
      } else if (data.last_name) {
        name = data.last_name;
      } else if (data.username) {
        name = data.username;
      } else if (email) {
        name = email.split("@")[0]; // Use email username as fallback
      }
      
      return {
        email: email,
        name: name || "User",
        avatar_url: data.image_url || null,
      };
    }
    
    // Fallback - try to extract from any available fields
    const email = data?.email || data?.email_address || null;
    const name = data?.username || data?.name || (email ? email.split("@")[0] : null) || "User";
    
    return {
      email: email,
      name: name,
      avatar_url: data?.avatar_url || data?.image_url || null,
    };
  };

  const userInfo = userData ? getUserInfo(userData) : { email: null, name: "User", avatar_url: null };
  
  console.log("User info extracted:", userInfo);

  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching user:", fetchError);
  }

  if (existingUser) {
    // User exists, optionally update their data
    if (userData) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          email: userInfo.email,
          name: userInfo.name,
          avatar_url: userInfo.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      
      if (updateError) {
        console.error("Error updating user:", updateError);
      } else {
        console.log("User updated successfully");
      }
    }
    return existingUser;
  }

  // Create new user
  console.log("Creating new user in Supabase:", { userId, userInfo });
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email: userInfo.email,
      name: userInfo.name,
      avatar_url: userInfo.avatar_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user in Supabase:", error);
    throw error;
  }

  console.log("User created successfully:", newUser);
  return newUser;
}

// Get user profile
export async function getUserProfile(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const currentUserId = currentUser?.sub || currentUser?.id || currentUser?.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Supabase error:", userError);
      return res.status(500).json({ error: "Failed to fetch user", details: userError.message });
    }

    // If user not in Supabase, try Clerk
    let userData = user;
    if (!user && process.env.CLERK_SECRET_KEY) {
      try {
        console.log(`User ${userId} not found in Supabase, fetching from Clerk`);
        const clerkUser = await clerkClient.users.getUser(userId);
        console.log(`Clerk user data for ${userId}:`, {
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          username: clerkUser.username,
          email: clerkUser.emailAddresses?.[0]?.emailAddress,
          imageUrl: clerkUser.imageUrl,
        });
        
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
        
        const emailAddress = clerkUser.emailAddresses?.[0]?.emailAddress || null;
        
        userData = {
          id: userId,
          name: userName,
          email: emailAddress,
          avatar_url: clerkUser.imageUrl || null,
          bio: null,
          username: clerkUser.username || null,
          username_changed_at: null,
          pinned_post_id: null,
          follower_count: 0,
          following_count: 0,
          total_likes: 0,
        };
        
        // Sync user to Supabase for future requests
        try {
          await ensureUserExists(userId, clerkUser);
          console.log(`User ${userId} synced to Supabase`);
        } catch (syncError: any) {
          console.error(`Could not sync user ${userId} to Supabase:`, syncError?.message);
          // Continue anyway - we have the data from Clerk
        }
      } catch (clerkError: any) {
        console.error("Error fetching user from Clerk:", clerkError?.message || clerkError);
        console.error("Full Clerk error:", clerkError);
        return res.status(404).json({ error: "User not found" });
      }
    }

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get accurate follow counts
    const [followerResult, followingResult] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId),
    ]);

    // Get total likes on user's posts
    const { data: userPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);
    
    let totalLikes = 0;
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map((p: any) => p.id);
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds);
      totalLikes = likesCount || 0;
    }

    // Fetch pinned post if exists
    let pinnedPost = null;
    if (userData.pinned_post_id) {
      const { data: post } = await supabase
        .from("posts")
        .select("*")
        .eq("id", userData.pinned_post_id)
        .single();
      
      if (post) {
        pinnedPost = {
          ...post,
          user: {
            name: userData.name,
            email: userData.email,
            avatar_url: userData.avatar_url,
          },
        };
      }
    }

    // Build response data
    const responseData: any = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url,
      bio: userData.bio || null,
      username: userData.username || null,
      follower_count: followerResult.count || 0,
      following_count: followingResult.count || 0,
      total_likes: totalLikes,
      pinned_post_id: userData.pinned_post_id || null,
      pinned_post: pinnedPost,
    };

    if (currentUserId === userId) {
      responseData.username_changed_at = userData.username_changed_at || null;
    }

    return res.json(responseData);
  } catch (error: any) {
    console.error("Unexpected error in getUserProfile:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}

// Update user profile
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const user = req.user;
    const authenticatedUserId = user?.sub || user?.id || user?.userId;
    
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Validate that the userId in the URL matches the authenticated user
    const { userId: urlUserId } = req.params;
    if (urlUserId && urlUserId !== authenticatedUserId) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    const userId = authenticatedUserId;
    const { name, username, bio, avatar_url } = req.body;

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("username, username_changed_at")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError);
    }

    // Check username change restriction (14 days)
    if (username && username !== currentUser?.username) {
      if (currentUser?.username_changed_at) {
        const lastChanged = new Date(currentUser.username_changed_at);
        const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceChange < 14) {
          const daysRemaining = Math.ceil(14 - daysSinceChange);
          return res.status(400).json({ 
            error: `Username can only be changed once every 14 days. You can change it again in ${daysRemaining} day(s).` 
          });
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    
    if (username && username !== currentUser?.username) {
      updateData.username = username;
      updateData.username_changed_at = new Date().toISOString();
    }

    // Update in Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return res.status(500).json({ 
        error: "Failed to update profile", 
        details: updateError.message 
      });
    }

    // Update in Clerk if name or username changed
    if (process.env.CLERK_SECRET_KEY && (name || username)) {
      try {
        const updateClerkData: any = {};
        if (name) {
          const nameParts = name.split(" ");
          updateClerkData.firstName = nameParts[0] || "";
          updateClerkData.lastName = nameParts.slice(1).join(" ") || "";
        }
        if (username) {
          updateClerkData.username = username;
        }
        
        if (Object.keys(updateClerkData).length > 0) {
          await clerkClient.users.updateUser(userId, updateClerkData);
        }
      } catch (clerkError) {
        console.error("Error updating Clerk user:", clerkError);
        // Continue even if Clerk update fails
      }
    }

    return res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Unexpected error in updateUserProfile:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}

// Pin or unpin a post to user's profile
export async function pinPost(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // If postId is "unpin", unpin the current post
    if (postId === "unpin") {
      const { error: updateError } = await supabase
        .from("users")
        .update({ pinned_post_id: null })
        .eq("id", userId);

      if (updateError) {
        console.error("Error unpinning post:", updateError);
        return res.status(500).json({ error: "Failed to unpin post" });
      }

      return res.json({ success: true, message: "Post unpinned" });
    }

    const postIdNum = parseInt(postId, 10);
    if (isNaN(postIdNum)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Verify the post exists and belongs to the user
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id")
      .eq("id", postIdNum)
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: "You can only pin your own posts" });
    }

    // Pin the post
    const { error: updateError } = await supabase
      .from("users")
      .update({ pinned_post_id: postIdNum })
      .eq("id", userId);

    if (updateError) {
      console.error("Error pinning post:", updateError);
      return res.status(500).json({ error: "Failed to pin post" });
    }

    return res.json({ success: true, message: "Post pinned", pinnedPostId: postIdNum });
  } catch (error: any) {
    console.error("Unexpected error in pinPost:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

// Get user's total likes
export async function getUserTotalLikes(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get all posts by user
    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);

    if (!posts || posts.length === 0) {
      return res.json({ totalLikes: 0 });
    }

    const postIds = posts.map((p: any) => p.id);
    
    // Count likes on all user's posts
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .in("post_id", postIds);

    return res.json({ totalLikes: count || 0 });
  } catch (error: any) {
    console.error("Unexpected error in getUserTotalLikes:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
