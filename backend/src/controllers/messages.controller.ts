import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { notify } from "../services/notification.service.js";

// Helper to ensure conversation exists or create one
export async function getOrCreateConversation(user1Id: string, user2Id: string) {
    // 1. Check if conversation already exists between these two
    // logic: find conversation_id where participants = [user1, user2]
    // This is a bit complex in SQL/Supabase client without stored procedures, 
    // so we'll do a simpler approach: get all convos for user1, check if user2 is in them.

    const { data: user1Convos, error: err1 } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user1Id);

    if (err1 || !user1Convos) throw err1 || new Error("Failed to fetch user1 conversations");

    const convoIds = user1Convos.map(c => c.conversation_id);

    if (convoIds.length > 0) {
        const { data: commonConvo, error: err2 } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .in("conversation_id", convoIds)
            .eq("user_id", user2Id)
            .single();

        if (commonConvo) {
            return commonConvo.conversation_id;
        }
    }

    // 2. Create new conversation
    const { data: newConvo, error: createErr } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

    if (createErr || !newConvo) throw createErr || new Error("Failed to create conversation");

    // 3. Add participants
    const { error: partErr } = await supabase
        .from("conversation_participants")
        .insert([
            { conversation_id: newConvo.id, user_id: user1Id },
            { conversation_id: newConvo.id, user_id: user2Id }
        ]);

    if (partErr) throw partErr;

    return newConvo.id;
}

export async function getConversations(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Get all conversation IDs for user
        const { data: myConvos, error: err1 } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", userId);

        if (err1) throw err1;

        const convoIds = myConvos.map(c => c.conversation_id);
        if (convoIds.length === 0) return res.json([]);

        // Get details: last message (optional optimization) and other participant
        // For simplicity, we just fetch participants and filter out self
        const { data: participants, error: err2 } = await supabase
            .from("conversation_participants")
            .select("conversation_id, user_id")
            .in("conversation_id", convoIds)
            .neq("user_id", userId);

        if (err2) throw err2;

        // Get users details
        const otherUserIds = participants.map(p => p.user_id);
        const { data: users, error: err3 } = await supabase
            .from("users")
            .select("id, name, username, avatar_url, is_og, created_at")
            .in("id", otherUserIds);

        if (err3) throw err3;

        // Get last messages and unread counts
        const conversations = await Promise.all(participants.map(async (p) => {
            const user = users.find(u => u.id === p.user_id);

            const [lastMsgRes, unreadRes] = await Promise.all([
                supabase
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", p.conversation_id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single(),
                supabase
                    .from("messages")
                    .select("id", { count: 'exact' })
                    .eq("conversation_id", p.conversation_id)
                    .eq("is_read", false)
                    .neq("sender_id", userId)
            ]);

            return {
                id: p.conversation_id,
                partner: user || { id: p.user_id, name: 'Unknown', username: 'unknown', avatar_url: null },
                last_message: lastMsgRes.data,
                unread_count: unreadRes.count || 0
            };
        }));

        // Sort by last message time
        conversations.sort((a, b) => {
            const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
            const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
            return timeB - timeA;
        });

        return res.json(conversations);
    } catch (error: any) {
        console.error("Error getting conversations:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getMessages(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params; // conversationId

        // Verify participation
        const { data: participation, error: partError } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", id)
            .eq("user_id", userId)
            .maybeSingle();

        if (partError || !participation) {
            console.error("Participation check failed:", partError);
            return res.status(403).json({ error: "Access denied" });
        }

        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
                *,
                reply_to:reply_to_message_id (
                    id,
                    content,
                    sender_id,
                    image_url,
                    audio_url
                ),
                reactions,
                shared_post:shared_post_id (
                    id,
                    title,
                    content,
                    images,
                    user:users!posts_user_id_fkey (
                        id,
                        name,
                        username,
                        avatar_url
                    )
                ),
                shared_project:shared_project_id (
                    id,
                    title,
                    description,
                    cover_image,
                    user:user_id (
                        id,
                        name,
                        username,
                        avatar_url
                    )
                )
            `)
            .eq("conversation_id", id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Primary selection failed, falling back to basic:", error);
            // Fallback for when new columns don't exist yet
            const { data: basicMessages, error: basicError } = await supabase
                .from("messages")
                .select(`
                    *,
                    reply_to:reply_to_message_id (
                        id,
                        content,
                        sender_id,
                        image_url
                    )
                `)
                .eq("conversation_id", id)
                .order("created_at", { ascending: true });

            if (basicError) throw basicError;
            return res.json(basicMessages);
        }

        // Mark messages as read (those sent by partner)
        await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("conversation_id", id)
            .neq("sender_id", userId)
            .eq("is_read", false);

        // Mark related notifications as read
        // Find other participant id first
        const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", id)
            .neq("user_id", userId)
            .single();

        if (otherParticipant) {
            await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", userId)
                .eq("actor_id", otherParticipant.user_id)
                .eq("type", "message")
                .eq("read", false);
        }

        return res.json(messages);

    } catch (error: any) {
        console.error("Error getting messages:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function sendMessage(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { conversationId, content, recipientId, replyToMessageId, imageUrl, audioUrl, sharedPostId, sharedProjectId } = req.body;

        let targetConvoId = conversationId;

        if (!targetConvoId && recipientId) {
            // Start new conversation flow
            targetConvoId = await getOrCreateConversation(userId, recipientId);
        }

        if (targetConvoId) {
            // Verify participation to prevent IDOR
            const { data: participation, error: partError } = await supabase
                .from("conversation_participants")
                .select("*")
                .eq("conversation_id", targetConvoId)
                .eq("user_id", userId)
                .single();

            if (partError || !participation) {
                return res.status(403).json({ error: "You are not a participant in this conversation" });
            }
        } else {
            return res.status(400).json({ error: "Recipient or Conversation ID required" });
        }

        let { data: message, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: targetConvoId,
                sender_id: userId,
                content: content || "",
                reply_to_message_id: replyToMessageId,
                image_url: imageUrl,
                audio_url: audioUrl,
                shared_post_id: sharedPostId,
                shared_project_id: sharedProjectId
            })
            .select(`
                *,
                reply_to:reply_to_message_id (
                    id,
                    content,
                    sender_id,
                    image_url,
                    audio_url
                ),
                reactions,
                shared_post:shared_post_id (
                    id,
                    title,
                    content,
                    images,
                    user:users!posts_user_id_fkey (
                        id,
                        name,
                        username,
                        avatar_url
                    )
                ),
                shared_project:shared_project_id (
                    id,
                    title,
                    description,
                    cover_image,
                    user:user_id (
                        id,
                        name,
                        username,
                        avatar_url
                    )
                )
            `)
            .single();

        if (error) {
            console.error("SendMessage PRIMARY failed:", error);
            // Fallback to basic message if columns don't exist OR if selection fails
            const { data: basicMsg, error: basicErr } = await supabase
                .from("messages")
                .insert({
                    conversation_id: targetConvoId,
                    sender_id: userId,
                    content: content || (sharedPostId || sharedProjectId ? "Shared content (please update DB to view previews)" : ""),
                    reply_to_message_id: replyToMessageId,
                    image_url: imageUrl
                })
                .select(`
                    *,
                    reply_to:reply_to_message_id (
                        id,
                        content,
                        sender_id,
                        image_url
                    )
                `)
                .single();

            if (basicErr) {
                console.error("SendMessage FALLBACK also failed:", basicErr);
                throw basicErr;
            }
            message = basicMsg;
        }

        // Create notification for recipient
        try {
            let finalRecipientId = recipientId;

            // If we don't have recipientId (returning to existing convo), find it
            if (!finalRecipientId) {
                const { data: participants } = await supabase
                    .from("conversation_participants")
                    .select("user_id")
                    .eq("conversation_id", targetConvoId)
                    .neq("user_id", userId);

                if (participants && participants.length > 0) {
                    finalRecipientId = (participants[0] as any).user_id;
                }
            }

            if (finalRecipientId) {
                try {
/* 
                    await notify({
                        userId: finalRecipientId,
                        actorId: userId,
                        type: "message"
                    });
                    */

                    // Emit real-time message to recipient
                    const { getIO } = await import("../lib/socket.js");
                    const io = getIO();

                    const { data: senderInfo } = await supabase
                        .from("users")
                        .select("name, username, avatar_url")
                        .eq("id", userId)
                        .single();

                    io.to(finalRecipientId).emit("new_message", {
                        ...message,
                        sender: senderInfo || { name: "Someone", username: null, avatar_url: null }
                    });
                } catch (notifError) {
                    console.error("Error creating message notification or socket emission:", notifError);
                }
            }
        } catch (notifError) {
            console.error("Crash error creating message notification:", notifError);
        }

        // Update conversation updated_at for sorting
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", targetConvoId);

        return res.json(message);

    } catch (error: any) {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function toggleReaction(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { messageId } = req.params;
        const { emoji } = req.body;

        if (!emoji) return res.status(400).json({ error: "Emoji required" });

        // 1. Get current message and reactions
        const { data: message, error: fetchErr } = await supabase
            .from("messages")
            .select("reactions, conversation_id")
            .eq("id", messageId)
            .single();

        if (fetchErr || !message) return res.status(404).json({ error: "Message not found" });

        // Verify participation
        const { data: participation } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", message.conversation_id)
            .eq("user_id", userId)
            .single();

        if (!participation) return res.status(403).json({ error: "Access denied" });

        let reactions = message.reactions || {};
        let userIds = reactions[emoji] || [];

        if (userIds.includes(userId)) {
            // Remove
            userIds = userIds.filter((id: string) => id !== userId);
        } else {
            // Add
            userIds = [...userIds, userId];
        }

        if (userIds.length === 0) {
            delete reactions[emoji];
        } else {
            reactions[emoji] = userIds;
        }

        // 2. Update
        const { error: updateErr } = await supabase
            .from("messages")
            .update({ reactions })
            .eq("id", messageId);

        if (updateErr) throw updateErr;

        // 3. Emit real-time reaction update
        try {
            const { getIO } = await import("../lib/socket.js");
            const io = getIO();

            // Find other participant to notify
            const { data: otherParticipant } = await supabase
                .from("conversation_participants")
                .select("user_id")
                .eq("conversation_id", message.conversation_id)
                .neq("user_id", userId)
                .single();

            if (otherParticipant) {
                io.to(otherParticipant.user_id).emit("message_reaction", {
                    messageId,
                    reactions,
                    userId // sender of reaction
                });
            }
        } catch (socketErr) {
            console.error("Error emitting message_reaction:", socketErr);
        }

        return res.json({ success: true, reactions });

    } catch (error: any) {
        console.error("Error toggling reaction:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function deleteMessage(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { messageId } = req.params;

        // 1. Get message to check ownership/participation
        const { data: message, error: fetchErr } = await supabase
            .from("messages")
            .select("conversation_id, sender_id")
            .eq("id", messageId)
            .single();

        if (fetchErr || !message) return res.status(404).json({ error: "Message not found" });

        // 2. Verify participation (only participants can delete messages in the convo)
        const { data: participation } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", message.conversation_id)
            .eq("user_id", userId)
            .single();

        if (!participation) return res.status(403).json({ error: "Access denied" });

        // 3. Delete
        const { error: deleteErr } = await supabase
            .from("messages")
            .delete()
            .eq("id", messageId);

        if (deleteErr) throw deleteErr;

        // 4. Emit socket event for real-time deletion
        try {
            const { getIO, isUserOnline } = await import("../lib/socket.js");
            const io = getIO();

            // Find other participant to notify
            const { data: otherParticipant } = await supabase
                .from("conversation_participants")
                .select("user_id")
                .eq("conversation_id", message.conversation_id)
                .neq("user_id", userId)
                .single();

            if (otherParticipant) {
                io.to(otherParticipant.user_id).emit("message_deleted", {
                    messageId,
                    conversationId: message.conversation_id
                });
            }
        } catch (socketErr) {
            console.error("Error emitting message_deleted:", socketErr);
        }

        return res.json({ success: true });

    } catch (error: any) {
        console.error("Error deleting message:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function deleteConversation(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;

        // Verify participation
        const { data: participation } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", id)
            .eq("user_id", userId)
            .single();

        if (!participation) return res.status(403).json({ error: "Access denied" });

        // Delete messages first to handle missing ON DELETE CASCADE, then participants, then conversation
        await supabase.from("messages").delete().eq("conversation_id", id);
        await supabase.from("conversation_participants").delete().eq("conversation_id", id);
        const { error: deleteErr } = await supabase.from("conversations").delete().eq("id", id);

        if (deleteErr) throw deleteErr;

        return res.json({ success: true });

    } catch (error: any) {
        console.error("Error deleting conversation:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
