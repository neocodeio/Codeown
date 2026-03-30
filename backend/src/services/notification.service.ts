
import { supabase } from "../lib/supabase.js";
import { isUserOnline } from "../lib/socket.js";
import { 
  sendNewLikeEmail, 
  sendNewFollowerEmail, 
  sendNewCommentEmail, 
  sendNewMessageEmail,
  sendNewMentionEmail,
  sendCofounderRequestEmail 
} from "../lib/email.js";

// A reference to the active sessions map if we can access it, 
// or we rely on last_active_at and socket.
// For now, let's use socket + last_active_at (DB).

export async function isUserActive(userId: string): Promise<boolean> {
    // 1. Check socket presence (Real-time)
    if (isUserOnline(userId)) {
        return true;
    }

    // 2. Check DB last_active_at (within 5 minutes)
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
        
        if (diffMins < 5) {
            return true;
        }
    }

    return false;
}

export type NotificationType = 'like' | 'follow' | 'comment' | 'message' | 'mention' | 'reply' | 'cofounder_request';

interface SendNotificationParams {
    userId: string; // Recipient
    actorId: string; // Doer
    type: NotificationType;
    postId?: number;
    projectId?: number;
    commentId?: number;
    data?: any; // Extra info for email
}

export async function notify(params: SendNotificationParams) {
    const { userId, actorId, type, postId, projectId, commentId, data } = params;

    // 1. Always create the notification in the DB
    const { error: notifError } = await supabase.from("notifications").insert({
        user_id: userId,
        type,
        actor_id: actorId,
        post_id: postId,
        project_id: projectId,
        comment_id: commentId,
        read: false,
    });

    if (notifError) {
        console.error(`[NotificationService] DB Insert Error:`, notifError);
        return;
    }

    // 2. Check if user is active on the platform
    const active = await isUserActive(userId);
    if (active) {
        console.log(`[NotificationService] User ${userId} is active. Skipping email for type: ${type}`);
        return;
    }

    // 3. If not active, dispatch the appropriate email
    try {
        const [{ data: actor }, { data: recipient }] = await Promise.all([
            supabase.from("users").select("name, username").eq("id", actorId).single(),
            supabase.from("users").select("name, email").eq("id", userId).single()
        ]);

        if (!recipient?.email || !actor?.name) return;

        switch (type) {
            case 'like':
                await sendNewLikeEmail(
                    recipient.email,
                    recipient.name,
                    actor.name,
                    postId ? 'post' : projectId ? 'project' : 'comment',
                    postId || projectId || commentId || 0
                );
                break;
            case 'follow':
                await sendNewFollowerEmail(
                    recipient.email,
                    recipient.name,
                    actor.name,
                    actor.username || 'user'
                );
                break;
            case 'comment':
            case 'reply':
                await sendNewCommentEmail(
                    recipient.email,
                    recipient.name,
                    actor.name,
                    postId || projectId || 0,
                    projectId ? 'project' : 'post'
                );
                break;
            case 'mention':
                await sendNewMentionEmail(
                    recipient.email,
                    recipient.name,
                    actor.name,
                    postId || projectId || commentId || 0,
                    projectId ? 'project' : commentId ? 'comment' : 'post'
                );
                break;
            case 'message':
                await sendNewMessageEmail(
                    recipient.email,
                    recipient.name,
                    actor.name,
                    actor.username || 'user'
                );
                break;
            case 'cofounder_request':
                if (data?.applicationData && data?.projectTitle) {
                    await sendCofounderRequestEmail(
                        recipient.email,
                        recipient.name,
                        actor.name,
                        actor.username || 'user',
                        data.projectTitle,
                        data.applicationData
                    );
                }
                break;
        }
    } catch (emailErr) {
        console.error(`[NotificationService] Email Dispatch Error:`, emailErr);
    }
}
