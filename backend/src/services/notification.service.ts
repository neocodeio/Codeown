
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
    commentId?: number | undefined;
    startupId?: string | undefined;
    data?: any; // Extra info for email
}

export async function notify(params: SendNotificationParams) {
    const { userId, actorId, type, postId, projectId, commentId, startupId, data } = params;

    console.log(`[NotificationService] Processing ${type} notification for user ${userId} from ${actorId}`);

    // 1. Always create the notification in the DB
    const insertData: any = {
        user_id: userId,
        type,
        actor_id: actorId,
        read: false,
        metadata: data || {}
    };

    if (postId) insertData.post_id = postId;
    if (projectId) insertData.project_id = projectId;
    if (commentId) insertData.comment_id = commentId;
    if (startupId) insertData.startup_id = startupId;

    let { error: notifError } = await supabase.from("notifications").insert(insertData);

    // If it fails with 'startup_upvote' (likely due to missing enum value), retry with a fallback type
    if (notifError && type === 'startup_upvote') {
        const fallbackData = { ...insertData, type: 'like' as any };
        const { error: retryError } = await supabase.from("notifications").insert(fallbackData);
        notifError = retryError;
    }

    if (notifError) {
        console.error(`[NotificationService] DB Insert Error:`, notifError);
    }

    // 1.5 Emit socket event for the specific user so the UI updates instantly
    try {
        const { getIO } = await import("../lib/socket.js");
        const io = getIO();
        io.to(userId).emit("new_notification", { type, actorId, data });
    } catch (sErr) {
        // Socket initialization may not be ready
    }

    // 2. Check if user is active on the platform
    const active = await isUserActive(userId);
    if (active) {
        console.log(`[NotificationService] User ${userId} is active (Socket or recent DB ping). Skipping email.`);
        return;
    }

    // 3. If not active, dispatch the appropriate email
    try {
        // More robust actor/recipient lookup
        const [{ data: actor }, { data: recipient }] = await Promise.all([
            supabase.from("users").select("name, username").eq("id", actorId).single(),
            supabase.from("users").select("name, email, username").eq("id", userId).single()
        ]);

        if (!recipient?.email) {
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
                    postId ? 'post' : projectId ? 'project' : 'comment',
                    postId || projectId || commentId || 0
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
                    postId || projectId || 0,
                    projectId ? 'project' : 'post',
                    type === 'reply'
                );
                break;
            case 'mention':
                await sendNewMentionEmail(
                    recipient.email,
                    rName,
                    aName,
                    postId || projectId || commentId || 0,
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

    // 1. Get all users
    const { data: users } = await supabase
        .from("users")
        .select("id, email, name, last_active_at");

    if (!users) return;

    // 2. Insert notifications in bulk for efficiency
    const notifs = users.map(u => ({
        user_id: u.id,
        type: 'ship_week_launch' as any,
        actor_id: adminId,
        metadata: { competitionName, deadline }
    }));

    await supabase.from("notifications").insert(notifs);

    // 3. Send emails in batch
    const validRecipients = users
        .filter(u => u.email)
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
        } catch (e) {}
    }
}
