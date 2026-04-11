import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { sendWelcomeEmail } from "../lib/email.js";
import { getOrCreateConversation } from "./messages.controller.js";

/**
 * Internal helper to update user streak.
 * Logic:
 * 1. If never active, set to 1.
 * 2. If already active TODAY (calendar day), do nothing.
 * 3. If active YESTERDAY (calendar day) AND within 24hr window, increment.
 * 4. If more than 24hr window since last activity, reset to 1.
 */
async function internalUpdateStreak(userId: string): Promise<number | null> {
    try {
        // Fetch current streak info
        let userData: any = null;
        let fetchError: any = null;

        const initialRes = await supabase
            .from("users")
            .select("streak_count, last_active_at")
            .eq("id", userId)
            .single();

        if (initialRes.error && initialRes.error.message?.includes("does not exist")) {
            // Fallback if last_active_at is missing
            const fallbackRes = await supabase
                .from("users")
                .select("streak_count")
                .eq("id", userId)
                .single();
            userData = fallbackRes.data;
            fetchError = fallbackRes.error;
        } else {
            userData = initialRes.data;
            fetchError = initialRes.error;
        }

        if (fetchError || !userData) return null;

        const now = new Date();
        const lastActive = userData.last_active_at ? new Date(userData.last_active_at) : null;
        let newStreak = userData.streak_count || 0;

        if (!lastActive) {
            newStreak = 1;
        } else {
            // Check if it's the same calendar day
            const isSameDay = 
                now.getDate() === lastActive.getDate() &&
                now.getMonth() === lastActive.getMonth() &&
                now.getFullYear() === lastActive.getFullYear();

            if (isSameDay) {
                // Already checked in today, update last_active only if it's been a while
                const minsSince = (now.getTime() - lastActive.getTime()) / (1000 * 60);
                if (minsSince > 5) { // Only update timestamp every 5 mins to save DB writes
                    await supabase.from("users").update({ last_active_at: now.toISOString() }).eq("id", userId);
                }
                return newStreak;
            }

            const hoursSince = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

            if (hoursSince > 24) {
                // Streak broken, start over
                newStreak = 1;
            } else {
                // New day and within 24h, increment!
                newStreak += 1;
            }
        }

        // Update DB
        await supabase
            .from("users")
            .update({
                streak_count: newStreak,
                last_active_at: now.toISOString(),
            })
            .eq("id", userId);

        return newStreak;
    } catch (err) {
        console.error("[internalUpdateStreak] Error:", err);
        return null;
    }
}

export async function updateStreak(req: Request, res: Response) {
    try {
        const user = req.user;
        const userId = user?.sub || user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const newStreak = await internalUpdateStreak(String(userId));
        
        if (newStreak === null) {
            return res.status(500).json({ error: "Failed to update streak" });
        }

        return res.json({ streak_count: newStreak });
    } catch (error: any) {
        console.error("Unexpected error in updateStreak:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


async function createWelcomeExperienceForNewUser(newUserId: string) {
    try {
        console.log(`[Welcome Message] Starting welcome experience for new user: ${newUserId}`);

        // First, try to find CEO in Supabase by username
        let ceoId: string | null = null;
        const { data: ceoUser, error: ceoError } = await supabase
            .from("users")
            .select("id")
            .eq("username", "amin.ceo")
            .single();

        if (ceoUser && !ceoError) {
            ceoId = ceoUser.id as string;
            console.log(`[Welcome Message] Found CEO in Supabase: ${ceoId}`);
        } else {
            // CEO not found in Supabase, try multiple methods to find them
            console.log(`[Welcome Message] CEO not found in Supabase, searching Clerk...`);

            // Method 1: Check environment variable for CEO Clerk ID (most reliable)
            const ceoClerkIdFromEnv = process.env.CEO_CLERK_ID;
            if (ceoClerkIdFromEnv) {
                ceoId = ceoClerkIdFromEnv;
                console.log(`[Welcome Message] Using CEO ID from environment variable: ${ceoId}`);

                // Verify this user exists and has the correct username
                try {
                    const clerkCeo = await clerkClient.users.getUser(ceoId);
                    if (clerkCeo.username === "amin.ceo") {
                        // Ensure CEO exists in Supabase
                        try {
                            await ensureUserExists(ceoId, clerkCeo);
                            console.log(`[Welcome Message] Synced CEO to Supabase`);
                        } catch (syncError) {
                            console.error(`[Welcome Message] Failed to sync CEO to Supabase:`, syncError);
                        }
                    } else {
                        console.error(`[Welcome Message] CEO_CLERK_ID doesn't match username 'amin.ceo'. Found username: ${clerkCeo.username}`);
                        ceoId = null; // Reset and try other methods
                    }
                } catch (verifyError: any) {
                    console.error(`[Welcome Message] Error verifying CEO from env var:`, verifyError?.message);
                    ceoId = null; // Reset and try other methods
                }
            }

            // Method 2: Search through Clerk users (if env var didn't work)
            if (!ceoId && process.env.CLERK_SECRET_KEY) {
                try {
                    console.log(`[Welcome Message] Searching Clerk users for username 'amin.ceo'...`);

                    // Search through users in batches (Clerk doesn't support username filtering)
                    let foundCeo = null;
                    let offset = 0;
                    const limit = 500;
                    let hasMore = true;

                    while (hasMore && !foundCeo && offset < 5000) { // Limit search to first 5000 users
                        const clerkUsersResponse = await clerkClient.users.getUserList({
                            limit,
                            offset,
                        });

                        // Handle both response formats: { data: User[] } or User[]
                        const clerkUsers = Array.isArray(clerkUsersResponse)
                            ? clerkUsersResponse
                            : (clerkUsersResponse as any).data || [];

                        if (clerkUsers && clerkUsers.length > 0) {
                            foundCeo = clerkUsers.find((u: any) => u.username === "amin.ceo");
                            if (foundCeo && foundCeo.id) {
                                const foundCeoId = foundCeo.id;
                                ceoId = foundCeoId;
                                console.log(`[Welcome Message] Found CEO in Clerk (offset ${offset}): ${foundCeoId}`);

                                // Ensure CEO exists in Supabase
                                try {
                                    await ensureUserExists(foundCeoId, foundCeo);
                                    console.log(`[Welcome Message] Synced CEO to Supabase`);
                                } catch (syncError) {
                                    console.error(`[Welcome Message] Failed to sync CEO to Supabase:`, syncError);
                                }
                                break;
                            }

                            hasMore = clerkUsers.length === limit;
                            offset += limit;
                        } else {
                            hasMore = false;
                        }
                    }

                    if (!foundCeo) {
                        console.error(`[Welcome Message] CEO user 'amin.ceo' not found in Clerk after searching ${offset} users`);
                    }
                } catch (clerkError: any) {
                    console.error(`[Welcome Message] Error searching Clerk for CEO:`, clerkError?.message || clerkError);
                }
            }
        }

        if (!ceoId) {
            console.error(`[Welcome Message] CEO user 'amin.ceo' not found in Supabase or Clerk. Cannot send welcome message.`);
            return;
        }

        // Do not send a welcome message to the CEO account itself
        if (ceoId === newUserId) {
            console.log(`[Welcome Message] Skipping welcome message - new user is the CEO`);
            return;
        }

        console.log(`[Welcome Message] Creating conversation between CEO (${ceoId}) and new user (${newUserId})`);

        // Ensure there is a conversation between CEO and the new user
        const conversationId = await getOrCreateConversation(ceoId, newUserId);
        console.log(`[Welcome Message] Conversation created/found: ${conversationId}`);

        // Send a personal welcome message from the CEO
        const welcomeMessage =
            "Hey, welcome to Codeown! I'm Amin, the CEO & Founder (amin.ceo). " +
            "Great to have you here — if you have any questions or feedback, just reply to this message.";

        console.log(`[Welcome Message] Inserting welcome message into conversation ${conversationId}`);
        const { data: insertedMessage, error: messageError } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: ceoId,
                content: welcomeMessage,
            })
            .select()
            .single();

        if (messageError) {
            console.error(`[Welcome Message] Error creating CEO welcome message:`, messageError);
            return;
        }

        console.log(`[Welcome Message] Welcome message created successfully:`, insertedMessage?.id);

        // Create a notification so the new user clearly sees the welcome
        console.log(`[Welcome Message] Creating notification for new user`);
        const { error: notifError } = await supabase
            .from("notifications")
            .insert({
                user_id: newUserId,
                type: "message",
                actor_id: ceoId,
                read: false,
            });

        if (notifError) {
            console.error(`[Welcome Message] Error creating CEO welcome notification:`, notifError);
        } else {
            console.log(`[Welcome Message] Notification created successfully`);
        }

        // Auto-follow CEO to populate the user's feed initially
        console.log(`[Welcome Message] Auto-following CEO for new user to prepopulate feed`);
        const { error: followError } = await supabase
            .from("follows")
            .insert({
                follower_id: newUserId,
                following_id: ceoId,
            });

        if (followError) {
            console.error(`[Welcome Message] Error auto-following CEO:`, followError);
        } else {
            // Give the new user a welcome notification that they are following someone!
            await supabase.from("notifications").insert({
                user_id: ceoId,
                type: "follow",
                actor_id: newUserId,
                read: false,
            });
            console.log(`[Welcome Message] Auto-followed CEO successfully`);
        }

        console.log(`[Welcome Message] Welcome experience completed successfully for user ${newUserId}`);
    } catch (error: any) {
        console.error(`[Welcome Message] Unexpected error creating welcome experience for new user:`, error?.message || error);
        console.error(`[Welcome Message] Full error stack:`, error);
    }
}


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
                username: data.username || name || null, // Use name as fallback for username
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
                avatar_url: data?.avatar_url || data?.image_url || null,
                username: data.username || name || null, // Use name as fallback for username
            };
        }

        // Fallback - try to extract from any available fields
        const email = data?.email || data?.email_address || (Array.isArray(data?.email_addresses) ? data.email_addresses[0]?.email_address : null) || null;
        const name = data?.username || data?.name || (email ? email.split("@")[0] : null) || "User";

        return {
            email: email,
            name: name,
            avatar_url: data?.avatar_url || data?.image_url || null,
            username: data?.username || name || null, // Use name as fallback for username
        };
    };

    const userInfo = userData ? getUserInfo(userData) : { email: null, name: "User", avatar_url: null, username: null };

    console.log("User info extracted:", userInfo);

    // Check if user exists - try full columns, fallback to safe set
    let existingUser: any = null;
    let fetchError: any = null;

    const fullCols = "id, name, email, username, avatar_url, banner_url, bio, location, job_title, skills, experience_level, is_hirable, is_pro, is_og, pinned_post_id, streak_count, created_at, updated_at, username_changed_at, onboarding_completed, is_organization, github_url, twitter_url, linkedin_url, instagram_url, website_url, lemon_customer_id, lemon_subscription_id, lemon_subscription_status, xp, level";
    const safeCols = "id, name, email, username, avatar_url, banner_url, bio, location, job_title, skills, experience_level, is_hirable, is_pro, is_og, pinned_post_id, streak_count, created_at, updated_at, username_changed_at, onboarding_completed, is_organization, github_url, twitter_url, linkedin_url, website_url, xp, level";

    const fullRes = await supabase.from("users").select(fullCols).eq("id", userId).single();
    if (fullRes.error && fullRes.error.code !== "PGRST116" && fullRes.error.message?.includes("does not exist")) {
        console.warn("ensureUserExists: full select failed, falling back:", fullRes.error.message);
        const safeRes = await supabase.from("users").select(safeCols).eq("id", userId).single();
        existingUser = safeRes.data;
        fetchError = safeRes.error;
    } else {
        existingUser = fullRes.data;
        fetchError = fullRes.error;
    }

    if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching user:", fetchError);
    }

    if (existingUser) {
        // User exists, optionally update their data
        if (userData) {
            // Build update object - ONLY update fields that are currently null or empty in Supabase
            // This protects custom uploads and changes from being overwritten by Clerk defaults
            const updatePayload: any = {
                updated_at: new Date().toISOString(),
            };

            if (!existingUser.email && userInfo.email) updatePayload.email = userInfo.email;
            if (!existingUser.name && userInfo.name) updatePayload.name = userInfo.name;
            if (!existingUser.username && userInfo.username) updatePayload.username = userInfo.username;
            if (!existingUser.avatar_url && userInfo.avatar_url) updatePayload.avatar_url = userInfo.avatar_url;

            // Only perform update if there are fields to change
            if (Object.keys(updatePayload).length > 1) {
                const { data: updatedUser, error: updateError } = await supabase
                    .from("users")
                    .update(updatePayload)
                    .eq("id", userId)
                    .select()
                    .single();

                if (updateError) {
                    console.error("Error updating user during sync:", updateError);
                } else {
                    console.log("User updated successfully during sync");
                    return updatedUser;
                }
            }
        }
        return existingUser;
    }

    // Create new user
    console.log("Creating new user in Supabase:", { userId, userInfo });
    
    // Check if new user should be OG (Founding 100)
    const { count: userCount } = await supabase.from("users").select("id", { count: "exact", head: true });
    const isNewUserOG = (userCount || 0) < 100;

    const { data: newUser, error } = await supabase
        .from("users")
        .insert({
            id: userId,
            email: userInfo.email,
            name: userInfo.name,
            avatar_url: userInfo.avatar_url,
            username: userInfo.username,
            onboarding_completed: false,
            is_og: isNewUserOG,
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

    // Create a CEO welcome DM + notification for this brand new user
    try {
        await createWelcomeExperienceForNewUser(userId);
    } catch (welcomeError) {
        console.error("Error during CEO welcome experience:", welcomeError);
    }

    // Send welcome email if email exists
    if (userInfo.email) {
        // We don't await this to avoid delaying the response
        sendWelcomeEmail(userInfo.email, userInfo.name || "User");
    }

    return newUser;
}

export async function completeOnboarding(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { error } = await supabase
            .from("users")
            .update({ onboarding_completed: true })
            .eq("id", userId);

        if (error) return res.status(500).json({ error: "Failed to complete onboarding" });

        return res.json({ success: true });
    } catch (error: any) {
        console.error("[completeOnboarding] Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
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

        // Determine query field
        // Check if it's a standard UUID or a Clerk ID (starts with "user_")
        const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) || userId.startsWith("user_");
        const field = isId ? "id" : "username";

        // Fetch user from Supabase - try full columns first, fallback to safe set
        let user: any = null;
        let userError: any = null;

        const fullSelect = "id, name, email, username, avatar_url, banner_url, bio, location, job_title, skills, experience_level, is_hirable, is_pro, is_og, created_at, pinned_post_id, streak_count, updated_at, username_changed_at, onboarding_completed, is_organization, github_url, twitter_url, linkedin_url, instagram_url, website_url, lemon_customer_id, lemon_subscription_id, lemon_subscription_status, xp, level";
        const safeSelect = "id, name, email, username, avatar_url, banner_url, bio, location, job_title, skills, experience_level, is_hirable, is_pro, is_og, created_at, pinned_post_id, streak_count, updated_at, username_changed_at, onboarding_completed, is_organization, github_url, twitter_url, linkedin_url, website_url, xp, level";

        const fullRes = await supabase
            .from("users")
            .select(fullSelect)
            .eq(field, userId)
            .single();

        if (fullRes.error && fullRes.error.code !== "PGRST116" && fullRes.error.message?.includes("does not exist")) {
            // Column missing — retry with safe column set
            console.warn("getUserProfile: full select failed, falling back to safe columns:", fullRes.error.message);
            const safeRes = await supabase
                .from("users")
                .select(safeSelect)
                .eq(field, userId)
                .single();
            user = safeRes.data;
            userError = safeRes.error;
        } else {
            user = fullRes.data;
            userError = fullRes.error;
        }

        if (userError && userError.code !== "PGRST116") {
            console.error("Supabase error:", userError);
            return res.status(500).json({ error: "Failed to fetch user", details: userError.message });
        }

        // If user not in Supabase, try Clerk
        let userData: any = user;
        if (!user && process.env.CLERK_SECRET_KEY) {
            try {
                let clerkUser;

                if (isId) {
                    console.log(`User ${userId} not found in Supabase, fetching from Clerk by ID`);
                    clerkUser = await clerkClient.users.getUser(userId);
                } else {
                    console.log(`User ${userId} not found in Supabase, scouting Clerk by username`);
                    const clerkUsers = await clerkClient.users.getUserList({ username: [userId], limit: 1 });
                    // Handle both array/object return types from Clerk SDK
                    const usersList = Array.isArray(clerkUsers) ? clerkUsers : (clerkUsers as any).data;
                    clerkUser = usersList && usersList.length > 0 ? usersList[0] : null;
                }

                if (clerkUser) {
                    console.log(`Clerk user data for ${userId}:`, {
                        id: clerkUser.id,
                        firstName: clerkUser.firstName,
                        lastName: clerkUser.lastName,
                        username: clerkUser.username,
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
                            userName = emailAddress.split("@")[0] || null;
                        }
                    }

                    if (!userName) userName = "User";

                    const emailAddress = clerkUser.emailAddresses?.[0]?.emailAddress || null;

                    userData = {
                        id: clerkUser.id, // Ensure we use the actual UUID from Clerk
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
                        github_url: null,
                        twitter_url: null,
                        linkedin_url: null,
                        instagram_url: null,
                        website_url: null,
                        created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString()
                    } as any;

                    // Sync user to Supabase for future requests
                    try {
                        const syncedUser = await ensureUserExists(clerkUser.id, clerkUser);
                        if (syncedUser) {
                            userData = syncedUser;
                            console.log(`User ${clerkUser.id} synced and loaded from Supabase`);
                        }
                    } catch (syncError: any) {
                        console.error(`Could not sync user ${clerkUser.id} to Supabase:`, syncError?.message);
                    }
                }
            } catch (clerkError: any) {
                console.error("Error fetching user from Clerk:", clerkError?.message || clerkError);
                console.error("Full Clerk error:", clerkError);
                // Fallback to 404
            }
        }

        if (!userData) {
            return res.status(404).json({ error: "User not found" });
        }

        // Dynamic OG Logic: If is_og is null/false, check if they are in the first 100
        let userIsOG = userData.is_og || false;
        if (!userIsOG && userData.created_at) {
            const { count: ogCount } = await supabase
                .from("users")
                .select("id", { count: 'exact', head: true })
                .lt("created_at", userData.created_at);
            
            if (ogCount !== null && ogCount < 100) {
                userIsOG = true;
                // Auto-sync flag to DB for future speed (non-blocking)
                supabase.from("users").update({ is_og: true }).eq("id", userData.id).then(({error}) => {
                    if (error) console.error("Error auto-syncing OG flag:", error);
                });
            }
        }
        
        // Calculate Founder Rank (join order)
        let founderNumber = 1;
        if (userData.created_at) {
            const { count: fCount } = await supabase
                .from("users")
                .select("id", { count: 'exact', head: true })
                .lt("created_at", userData.created_at);
            founderNumber = (fCount || 0) + 1;
        }

        // For other queries, we need the UUID
        const targetUserId = userData.id;

        // Get accurate follow counts
        const [followerResult, followingResult, projectCount, startupCount, postCount, commentCount, pCommentCount] = await Promise.all([
            supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("following_id", targetUserId),
            supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("follower_id", targetUserId),
            supabase
                .from("projects")
                .select("*", { count: "exact", head: true })
                .eq("user_id", targetUserId),
            supabase
                .from("startups")
                .select("*", { count: "exact", head: true })
                .eq("owner_id", targetUserId),
            supabase
                .from("posts")
                .select("*", { count: "exact", head: true })
                .eq("user_id", targetUserId),
            supabase
                .from("comments")
                .select("*", { count: "exact", head: true })
                .eq("user_id", targetUserId),
            supabase
                .from("project_comments")
                .select("*", { count: "exact", head: true })
                .eq("user_id", targetUserId),
        ]);

        const totalContributions = 
            (projectCount.count || 0) + 
            (startupCount.count || 0) + 
            (postCount.count || 0) + 
            (commentCount.count || 0) + 
            (pCommentCount.count || 0);

        // Get total likes on user's posts
        const { data: userPosts } = await supabase
            .from("posts")
            .select("id")
            .eq("user_id", targetUserId);

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
                .select("id, title, content, user_id, created_at, images, tags, like_count, comment_count, view_count, language")
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

        // Fetch pinned project if exists (column may not exist yet)
        let pinnedProject = null;
        let pinnedProjectId: number | null = null;
        try {
            const { data: pinnedData, error: pinnedError } = await supabase
                .from("users")
                .select("pinned_project_id")
                .eq("id", targetUserId)
                .single();
            if (!pinnedError && pinnedData) {
                pinnedProjectId = pinnedData.pinned_project_id || null;
            }
        } catch {
            // Column doesn't exist yet, ignore
        }
        if (pinnedProjectId) {
            const { data: project } = await supabase
                .from("projects")
                .select("id, title, description, cover_image, user_id, created_at, like_count, comment_count, view_count, status, technologies_used, looking_for_contributors")
                .eq("id", pinnedProjectId)
                .single();

            if (project) {
                pinnedProject = {
                    ...project,
                    user: {
                        name: userData.name,
                        email: userData.email,
                        avatar_url: userData.avatar_url,
                        username: userData.username,
                    },
                };
            }
        }

        // Build response data
        const responseData: any = {
            id: userData.id,
            name: userData.name,
            avatar_url: userData.avatar_url,
            banner_url: userData.banner_url || null,
            bio: userData.bio || null,
            username: userData.username || null,
            follower_count: followerResult.count || 0,
            following_count: followingResult.count || 0,
            total_likes: totalLikes,
            pinned_post_id: userData.pinned_post_id || null,
            pinned_post: pinnedPost,
            pinned_project_id: pinnedProjectId,
            pinned_project: pinnedProject,
            // Professional info
            location: userData.location || null,
            job_title: userData.job_title || null,
            skills: userData.skills || null,
            experience_level: userData.experience_level || null,
            is_hirable: userData.is_hirable ?? false,
            is_pro: userData.is_pro ?? false,
            is_og: userIsOG,
            founder_number: founderNumber,
            is_organization: userData.is_organization ?? false,
            // Social links
            github_url: userData.github_url || null,
            twitter_url: userData.twitter_url || null,
            linkedin_url: userData.linkedin_url || null,
            instagram_url: userData.instagram_url || null,
            website_url: userData.website_url || null,
            streak_count: userData.streak_count || 0,
            contribution_count: totalContributions,
            // Gamification
            xp: userData.xp || 0,
            level: userData.level || 1,
            // Metadata
            created_at: userData.created_at || null,
            updated_at: userData.updated_at || null,
        };

        if (currentUserId === targetUserId) {
            responseData.username_changed_at = userData.username_changed_at || null;
            responseData.onboarding_completed = userData.onboarding_completed ?? true;
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
        const {
            name,
            username,
            bio,
            avatar_url,
            banner_url,
            location,
            job_title,
            skills,
            is_hirable,
            experience_level,
            is_organization,
            onboarding_completed,
            github_url,
            twitter_url,
            linkedin_url,
            instagram_url,
            website_url
        } = req.body;

        // Get current user data
        let currentUser: any = null;
        const { data: fullUser, error: fetchError } = await supabase
            .from("users")
            .select("username, username_changed_at, is_pro, lemon_subscription_status")
            .eq("id", userId)
            .single();

        if (fetchError && fetchError.code !== "PGRST116" && fetchError.message?.includes("does not exist")) {
            // Column missing, fallback
            const { data: safeUser } = await supabase
                .from("users")
                .select("username, username_changed_at, is_pro")
                .eq("id", userId)
                .single();
            currentUser = safeUser;
        } else if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error fetching user:", fetchError);
        } else {
            currentUser = fullUser;
        }

        // Security: No one can self-verify. Strip verified fields from request.
        delete req.body.is_verified;
        delete req.body.verified;

        // Check username change restriction (14 days)
        if (username && username !== currentUser?.username) {
            if (username.trim().length > 0 && username.trim().length < 8) {
                return res.status(400).json({
                    error: "Username must be at least 8 characters long."
                });
            }

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

            // Check if username is already taken by another user (case-insensitive)
            const { data: existingUser } = await supabase
                .from("users")
                .select("id")
                .ilike("username", username.trim())
                .neq("id", userId)
                .maybeSingle();

            if (existingUser) {
                return res.status(400).json({
                    error: "Username is already taken."
                });
            }
        }

        // Prepare update data
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
        if (banner_url !== undefined) updateData.banner_url = banner_url;
        if (location !== undefined) updateData.location = location;
        if (job_title !== undefined) updateData.job_title = job_title;
        if (skills !== undefined) updateData.skills = skills;
        if (is_hirable !== undefined) {
            updateData.is_hirable = currentUser?.is_pro ? is_hirable : false;
        }
        if (experience_level !== undefined) updateData.experience_level = experience_level;
        if (is_organization !== undefined) updateData.is_organization = is_organization;
        if (onboarding_completed !== undefined) updateData.onboarding_completed = onboarding_completed;
        if (github_url !== undefined) updateData.github_url = github_url;
        if (twitter_url !== undefined) updateData.twitter_url = twitter_url;
        if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
        if (instagram_url !== undefined) updateData.instagram_url = instagram_url;
        if (website_url !== undefined) updateData.website_url = website_url;

        if (username && username !== currentUser?.username) {
            updateData.username = username;
            updateData.username_changed_at = new Date().toISOString();
        }

        // Update in Supabase - try with all fields, fallback if columns missing
        let updatedUser: any = null;
        let updateError: any = null;

        const supabaseRes = await supabase
            .from("users")
            .update(updateData)
            .eq("id", userId)
            .select()
            .single();

        if (supabaseRes.error && supabaseRes.error.message?.includes("does not exist")) {
            console.warn("updateUserProfile: update failed due to missing columns, retrying with safe set");
            // Remove problematic columns and retry
            const safeUpdateData = { ...updateData };
            delete safeUpdateData.instagram_url;
            delete safeUpdateData.lemon_customer_id;
            delete safeUpdateData.lemon_subscription_id;
            delete safeUpdateData.lemon_subscription_status;

            const retryRes = await supabase
                .from("users")
                .update(safeUpdateData)
                .eq("id", userId)
                .select()
                .single();
            
            updatedUser = retryRes.data;
            updateError = retryRes.error;
        } else {
            updatedUser = supabaseRes.data;
            updateError = supabaseRes.error;
        }

        if (updateError) {
            console.error("Error updating user:", updateError);
            return res.status(500).json({
                error: "Failed to update profile",
                details: updateError.message
            });
        }

        // Update in Clerk if name or username changed
        if (process.env.CLERK_SECRET_KEY && userId && (name || username)) {
            try {
                const updateClerkData: Record<string, any> = {};
                if (name) {
                    const nameParts = name.split(" ");
                    updateClerkData.firstName = nameParts[0] || "";
                    updateClerkData.lastName = nameParts.slice(1).join(" ") || "";
                }
                if (username) {
                    updateClerkData.username = username;
                }

                const hasUpdates = Object.keys(updateClerkData).length > 0;
                if (hasUpdates && userId) {
                    await clerkClient.users.updateUser(userId as string, updateClerkData);
                }
            } catch (clerkError: any) {
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

        if (!postId) {
            return res.status(400).json({ error: "Post ID is required" });
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

// Pin or unpin a project to user's profile
export async function pinProject(req: Request, res: Response) {
    try {
        const user = req.user;
        const userId = user?.sub || user?.id || user?.userId;
        const { projectId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "User ID not found" });
        }

        // If projectId is "unpin", unpin the current project
        if (projectId === "unpin") {
            const { error: updateError } = await supabase
                .from("users")
                .update({ pinned_project_id: null })
                .eq("id", userId);

            if (updateError) {
                console.error("Error unpinning project:", updateError);
                return res.status(500).json({ error: "Failed to unpin project" });
            }

            return res.json({ success: true, message: "Project unpinned" });
        }

        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const projectIdNum = parseInt(projectId, 10);
        if (isNaN(projectIdNum)) {
            return res.status(400).json({ error: "Invalid project ID" });
        }

        // Verify the project exists and belongs to the user
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id, user_id")
            .eq("id", projectIdNum)
            .single();

        if (projectError || !project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (project.user_id !== userId) {
            return res.status(403).json({ error: "You can only pin your own projects" });
        }

        // Pin the project
        const { error: updateError } = await supabase
            .from("users")
            .update({ pinned_project_id: projectIdNum })
            .eq("id", userId);

        if (updateError) {
            console.error("Error pinning project:", updateError);
            return res.status(500).json({ error: "Failed to pin project" });
        }

        return res.json({ success: true, message: "Project pinned", pinnedProjectId: projectIdNum });
    } catch (error: any) {
        console.error("Unexpected error in pinProject:", error);
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

export async function getRecommendedUsers(req: Request, res: Response) {
    try {
        const { limit = 8 } = req.query;
        const currentUserId = (req as any).user?.sub || (req as any).user?.id;

        // Fetch users with highest streaks
        let usersQuery = supabase
            .from("users")
            .select("id, name, username, avatar_url, streak_count, is_pro, skills")
            .order("streak_count", { ascending: false })
            .limit(Number(limit));

        const { data: users, error: fetchError } = await usersQuery;

        if (fetchError) {
            console.error("Error fetching recommended users:", fetchError);
            return res.status(500).json({ error: "Internal server error" });
        }

        // If signed in, check follow status
        let usersWithFollowStatus = users.map((u: any) => ({ ...u, isFollowing: false }));

        if (currentUserId && users.length > 0) {
            const userIds = users.map((u: any) => u.id);
            const { data: followRows } = await supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", currentUserId)
                .in("following_id", userIds);

            const followingIds = new Set((followRows || []).map((r: any) => r.following_id));
            usersWithFollowStatus = users.map((u: any) => ({
                ...u,
                isFollowing: followingIds.has(u.id)
            }));
        }

        return res.json(usersWithFollowStatus);
    } catch (error: any) {
        console.error("Unexpected error in getRecommendedUsers:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// --- ACTIVE SESSION TRACKER (REAL-TIME) ---
const activeSessions = new Map<string, number>();

/**
 * Registers a heartbeat from a client.
 * Tracks both authenticated users and anonymous guests.
 */
export function trackActiveSession(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id;
        const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

        // Create a unique key: use userId if logged in, otherwise use IP
        const sessionKey = userId ? `u:${userId}` : `g:${ip}`;

        // Update or set last seen timestamp
        activeSessions.set(sessionKey, Date.now());

        // IF LOGGED IN: Update streak logic automatically on ping
        if (userId) {
            // We don't await this to keep the ping response fast
            internalUpdateStreak(userId).catch(err => {
                console.error("[trackActiveSession] Streak update background error:", err);
            });
        }

        // Periodically prune stale sessions (older than 60s)
        if (Math.random() < 0.1) { // 10% chance to prune on ping
            const now = Date.now();
            for (const [key, timestamp] of activeSessions.entries()) {
                if (now - timestamp > 60000) {
                    activeSessions.delete(key);
                }
            }
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("[trackActiveSession] Error:", error);
        return res.status(500).json({ error: "Failed to track session" });
    }
}

/**
 * Returns the current active session count.
 */
export function getActiveCount(req: Request, res: Response) {
    try {
        const now = Date.now();
        let count = 0;

        for (const [key, timestamp] of activeSessions.entries()) {
            if (now - timestamp <= 60000) {
                count++;
            } else {
                activeSessions.delete(key);
            }
        }

        // Return realistic count (ensure at least 1 if the current user is checking)
        return res.json({ count: Math.max(count, 1) });
    } catch (error: any) {
        console.error("[getActiveCount] Error:", error);
        return res.status(200).json({ count: 1 }); // Fallback
    }
}
/**
 * Returns the first 100 users (Founding OGs)
 */
export async function getOGUsers(req: Request, res: Response) {
    try {
        const { data: users, error } = await supabase
            .from("users")
            .select("id, name, username, avatar_url, bio, created_at, is_pro, is_og, streak_count")
            .order("created_at", { ascending: true })
            .limit(100);

        if (error) {
            console.error("[getOGUsers] Error:", error);
            return res.status(500).json({ error: "Failed to fetch OG users" });
        }

        return res.json(users);
    } catch (error: any) {
        console.error("[getOGUsers] Unexpected error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

/**
 * GET DASHBOARD STATS
 * Aggregates all user performance metrics into one dashboard view.
 */
export async function getDashboardStats(req: Request, res: Response) {
    try {
        const user = req.user;
        const userId = user?.sub || user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Parallel fetch for speed
        const [
            postsCount,
            projectsCount,
            postLikes,
            projectLikes,
            postComments,
            projectComments,
            followers,
            userStreak
        ] = await Promise.all([
            // 1. Posts count
            supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
            // 2. Projects count
            supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", userId),
            // 3. Post Likes (summing performance column for efficiency)
            supabase.from("posts").select("like_count").eq("user_id", userId),
            // 4. Project Upvotes
            supabase.from("projects").select("like_count").eq("user_id", userId),
            // 5. Post Comments (on posts)
            supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
            // 6. Project Comments (on projects)
            supabase.from("project_comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
            // 7. Followers
            supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
            // 8. Streak (direct from user)
            supabase.from("users").select("streak_count").eq("id", userId).single()
        ]);

        // 9. Profile Views (Analytics) - Separated and defensive
        let profileViewsCount = 0;
        try {
            const { count } = await supabase
                .from("analytics_events")
                .select("*", { count: "exact", head: true })
                .eq("target_user_id", userId)
                .eq("event_type", "profile_view");
            profileViewsCount = count || 0;
        } catch (err) {
            console.error("[getDashboardStats] Analytics fetch failed:", err);
        }

        // Aggregate sums
        const totalPostLikes = (postLikes.data || []).reduce((acc: number, curr: any) => acc + (curr.like_count || 0), 0);
        const totalProjectLikes = (projectLikes.data || []).reduce((acc: number, curr: any) => acc + (curr.like_count || 0), 0);
        const totalComments = (postComments.count || 0) + (projectComments.count || 0);

        return res.json({
            posts_count: postsCount.count || 0,
            projects_count: projectsCount.count || 0,
            total_post_likes: totalPostLikes,
            total_project_upvotes: totalProjectLikes,
            total_comments: totalComments,
            follower_count: followers.count || 0,
            profile_views: profileViewsCount,
            streak_count: userStreak.data?.streak_count || 0
        });

    } catch (error: any) {
        console.error("[getDashboardStats] Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
