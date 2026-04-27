
import { supabase } from "../lib/supabase.js";
import { isUserOnline } from "../lib/socket.js";
import {
    sendNewLikeEmail,
    sendNewFollowerEmail,
    sendNewCommentEmail,
    sendNewMessageEmail,
    sendNewMentionEmail,
    sendCofounderRequestEmail,
    sendStartupUpvoteEmail,
    sendShipWeekLaunchEmail,
    sendShipWeekBatchEmail
} from "../lib/email.js";

export async function isUserActive(userId: string): Promise<boolean> {
    // 1. Check socket presence (Real-time). Most reliable "Is here right now" check.
    if (isUserOnline(userId)) {
        return true;
    }

    // 2. Check DB last_active_at (Reducing to 2 minutes to allow for page reloads)
    // If they aren't on a socket and haven't pinged in 2 mins, they are likely away.
    const { data: user, error } = await supabase
        .from("users")
        .select("last_active_at")
        .eq("id", userId)
        .single();

    if (error || !user) return false;

    if (user.last_active_at) {
        const lastActive = new Date(user.last_active_at);
        const now = new Date();
        const diffMins = (now.getTime() - lastActive.getTime()) / (1000 * 60);

        // 2 minutes is safer for "Just left the site" window
        if (diffMins < 2) {
            return true;
        }
    }

    return false;
}

export type NotificationType = 'like' | 'follow' | 'comment' | 'message' | 'mention' | 'reply' | 'cofounder_request' | 'save' | 'startup_upvote' | 'ship_week_launch' | 'profile_view';

interface SendNotificationParams {
    userId: string; // Recipient
    actorId: string; // Doer
    type: NotificationType;
    postId?: number | undefined;
    projectId?: number | undefined;
    articleId?: number | undefined;
    commentId?: number | undefined;
    startupId?: string | undefined;
    data?: any; // Extra info for email
}

export async function notify(params: SendNotificationParams) {
    const { userId, actorId, type, postId, projectId, articleId, commentId, startupId, data } = params;

    console.log(`[NotificationService] Processing ${type} notification for user ${userId} from ${actorId}`);

    // High Level Preference Check
    const { data: recipient, error: userError } = await supabase
        .from("users")
        .select("id, name, email, username, notifications_enabled, email_notifications_enabled")
        .eq("id", userId)
        .single();

    if (userError || !recipient) {
        console.error(`[NotificationService] Recipient not found: ${userId}`);
        return;
    }

    const prefs = {
        notifications: recipient.notifications_enabled !== false,
        email: recipient.email_notifications_enabled !== false
    };

    // 1. Create In-Platform Notification (If enabled)
    if (prefs.notifications) {
        const insertData: any = {
            user_id: userId,
            type,
            actor_id: actorId,
            read: false,
            metadata: data || {}
        };

        if (postId) insertData.post_id = postId;
        if (projectId) insertData.project_id = projectId;
        if (articleId) insertData.article_id = articleId;
        if (commentId) insertData.comment_id = commentId;
        if (startupId) insertData.startup_id = startupId;

        const { error: notifError } = await supabase.from("notifications").insert(insertData);
        if (notifError) console.error(`[NotificationService] DB Insert Error:`, notifError);

        // 1.5 Emit socket event for the specific user
        try {
            const { getIO } = await import("../lib/socket.js");
            const io = getIO();
            io.to(userId).emit("new_notification", { type, actorId, data });
        } catch (sErr) { }
    } else {
        console.log(`[NotificationService] Skipping DB notification for ${userId} (Platform alerts disabled)`);
    }

    // 2. Check if user is active (to avoid spamming emails if they are online)
    const active = await isUserActive(userId);
    if (active) {
        console.log(`[NotificationService] User ${userId} is active. Skipping email.`);
        return;
    }

    // 3. Dispatch Email (If enabled)
    if (!prefs.email) {
        console.log(`[NotificationService] Skipping email for ${userId} (Email alerts disabled)`);
        return;
    }

    try {
        const { data: actor } = await supabase.from("users").select("name, username").eq("id", actorId).single();

        if (!recipient.email) {
            console.warn(`[NotificationService] Missing recipient email for ${userId}. Skipping email.`);
            return;
        }

        // Fallback names/usernames to ensure the email doesn't fail due to missing fields
        const rName = recipient.name || recipient.username || "User";
        const aName = actor?.name || actor?.username || "A user";
        const aUsername = actor?.username || "user";

        console.log(`[NotificationService] Sending ${type} email to ${recipient.email}`);

        switch (type) {
            case 'like':
                await sendNewLikeEmail(
                    recipient.email,
                    rName,
                    aName,
                    commentId ? 'comment' : postId ? 'post' : projectId ? 'project' : articleId ? 'article' : 'post',
                    commentId || postId || projectId || articleId || 0
                );
                break;
            case 'follow':
                await sendNewFollowerEmail(
                    recipient.email,
                    rName,
                    aName,
                    aUsername
                );
                break;
            case 'comment':
            case 'reply':
                await sendNewCommentEmail(
                    recipient.email,
                    rName,
                    aName,
                    postId || projectId || articleId || 0,
                    projectId ? 'project' : articleId ? 'article' : 'post',
                    type === 'reply'
                );
                break;
            case 'mention':
                await sendNewMentionEmail(
                    recipient.email,
                    rName,
                    aName,
                    commentId || postId || projectId || 0,
                    projectId ? 'project' : commentId ? 'comment' : 'post'
                );
                break;
            case 'message':
                await sendNewMessageEmail(
                    recipient.email,
                    rName,
                    aName,
                    aUsername
                );
                break;
            case 'cofounder_request':
                if (data?.applicationData && data?.projectTitle) {
                    await sendCofounderRequestEmail(
                        recipient.email,
                        rName,
                        aName,
                        aUsername,
                        data.projectTitle,
                        data.applicationData
                    );
                }
                break;
            case 'startup_upvote':
                if (data?.startupName && startupId) {
                    await sendStartupUpvoteEmail(
                        recipient.email,
                        rName,
                        aName,
                        data.startupName,
                        startupId
                    );
                }
                break;
            case 'save':
                // For 'save', we'll send a specialized notification email
                await sendNewLikeEmail(
                    recipient.email,
                    rName,
                    aName,
                    'project', // Save is usually for projects in this context
                    projectId || 0,
                    true // isSave
                );
                break;
        }
    } catch (emailErr) {
        console.error(`[NotificationService] Notification Processing / Email Error:`, emailErr);
    }
}

/**
 * Broadcast a new competition launch to everyone
 */
export async function broadcastShipWeek(adminId: string, competitionName: string, deadline: string) {
    console.log(`[NotificationService] Broadcasting competition launch: ${competitionName}`);

    // 1. Get all users with their preferences
    const { data: users } = await supabase
        .from("users")
        .select("id, email, name, last_active_at, notifications_enabled, email_notifications_enabled");

    if (!users) return;

    // 2. Insert notifications in bulk for users who have them enabled
    const notifs = users
        .filter(u => u.notifications_enabled !== false)
        .map(u => ({
            user_id: u.id,
            type: 'ship_week_launch' as any,
            actor_id: adminId,
            metadata: { competitionName, deadline }
        }));

    if (notifs.length > 0) {
        await supabase.from("notifications").insert(notifs);
    }

    // 3. Send emails in batch to users who have them enabled
    const validRecipients = users
        .filter(u => u.email && u.email_notifications_enabled !== false)
        .map(u => ({ email: u.email!, name: u.name || "Builder" }));

    sendShipWeekBatchEmail(validRecipients, competitionName, deadline).catch(e => console.error("Batch fail", e));

    // 4. Emit socket events (Real-time updates)
    for (const u of users) {
        try {
            const { getIO } = await import("../lib/socket.js");
            getIO().to(u.id).emit("new_notification", {
                type: "ship_week_launch",
                actorId: adminId,
                data: { competitionName, deadline }
            });
        } catch (e) { }
    }
}
