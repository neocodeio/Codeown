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

        // 1. Get all conversation IDs where user is a participant
        const { data: myConvos, error: err1 } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", userId);

        if (err1) throw err1;

        const participantConvoIds = myConvos.map(c => c.conversation_id);

        // 2. Get all group conversations (anyone can see these)
        const { data: groupConvos, error: groupErr } = await supabase
            .from("conversations")
            .select("id, name, is_group, avatar_url")
            .eq("is_group", true);

        if (groupErr) throw groupErr;

        const groupConvosRaw = groupConvos || [];
        const groupConvoIds = groupConvosRaw.map(c => c.id);
        
        // Combine all unique IDs
        const allConvoIds = Array.from(new Set([...participantConvoIds, ...groupConvoIds]));

        if (allConvoIds.length === 0) return res.json([]);

        // 3. Fetch details for each conversation
        const conversations = await Promise.all(allConvoIds.map(async (convoId) => {
            const groupInfo = groupConvosRaw.find(g => g.id === convoId);
            
            let partner = null;
            if (!groupInfo) {
                // Fetch other participant for private convo
                const { data: participants } = await supabase
                    .from("conversation_participants")
                    .select("user_id")
                    .eq("conversation_id", convoId)
                    .neq("user_id", userId)
                    .limit(1);
                
                if (participants && participants.length > 0) {
                    const { data: user } = await supabase
                        .from("users")
                        .select("id, name, username, avatar_url, is_og")
                        .eq("id", participants?.[0]?.user_id)
                        .single();
                    partner = user;
                }
            }

            const [lastMsgRes, unreadRes] = await Promise.all([
                supabase
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", convoId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from("messages")
                    .select("id", { count: 'exact' })
                    .eq("conversation_id", convoId)
                    .eq("is_read", false)
                    .neq("sender_id", userId)
            ]);

            return {
                id: convoId,
                is_group: groupInfo?.is_group || false,
                name: groupInfo?.name || null,
                avatar_url: groupInfo?.avatar_url || null,
                partner: partner || (groupInfo ? { id: 'group', name: groupInfo.name || 'Group', username: 'group', avatar_url: groupInfo.avatar_url || null } : { id: 'unknown', name: 'Unknown', username: 'unknown', avatar_url: null }),
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

        // Verify participation OR if it is a group chat
        const { data: convo } = await supabase
            .from("conversations")
            .select("is_group")
            .eq("id", id)
            .single();

        if (!convo?.is_group) {
            const { data: participation } = await supabase
                .from("conversation_participants")
                .select("*")
                .eq("conversation_id", id)
                .eq("user_id", userId)
                .maybeSingle();

            if (!participation) {
                return res.status(403).json({ error: "Access denied" });
            }
        }

        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
                *,
                sender:sender_id (
                    id,
                    name,
                    username,
                    avatar_url,
                    is_og
                ),
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

        if (error) throw error;

        // Mark messages as read (those sent by partner)
        await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("conversation_id", id)
            .neq("sender_id", userId)
            .eq("is_read", false);

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
            targetConvoId = await getOrCreateConversation(userId, recipientId);
        }

        if (!targetConvoId) {
            return res.status(400).json({ error: "Recipient or Conversation ID required" });
        }

        // Check if it is a group chat
        const { data: convo } = await supabase
            .from("conversations")
            .select("is_group, name")
            .eq("id", targetConvoId)
            .single();

        if (!convo?.is_group) {
            // Verify participation for private convos
            const { data: participation } = await supabase
                .from("conversation_participants")
                .select("*")
                .eq("conversation_id", targetConvoId)
                .eq("user_id", userId)
                .single();

            if (!participation) {
                return res.status(403).json({ error: "You are not a participant in this conversation" });
            }
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
                sender:sender_id (
                    id,
                    name,
                    username,
                    avatar_url,
                    is_og
                ),
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

        if (error) throw error;

        // Emit real-time message
        try {
            const { getIO } = await import("../lib/socket.js");
            const io = getIO();
            
            if (convo?.is_group) {
                // Broadcast to everyone for public group chat
                io.emit("new_message", message);
            } else {
                // Private message: emit to participants
                const { data: participants } = await supabase
                    .from("conversation_participants")
                    .select("user_id")
                    .eq("conversation_id", targetConvoId);

                if (participants) {
                    participants.forEach(p => {
                        if (p.user_id !== userId) {
                            io.to(p.user_id).emit("new_message", message);
                            // Also create notification
                            notify({
                                userId: p.user_id,
                                actorId: userId,
                                type: "message"
                            }).catch(console.error);
                        }
                    });
                }
            }
        } catch (socketErr) {
            console.error("Error emitting socket message:", socketErr);
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

        const { data: message, error: fetchErr } = await supabase
            .from("messages")
            .select("reactions, conversation_id")
            .eq("id", messageId)
            .single();

        if (fetchErr || !message) return res.status(404).json({ error: "Message not found" });

        // Check if group or participant
        const { data: convo } = await supabase.from("conversations").select("is_group").eq("id", message.conversation_id).single();

        if (!convo?.is_group) {
            const { data: participation } = await supabase
                .from("conversation_participants")
                .select("*")
                .eq("conversation_id", message.conversation_id)
                .eq("user_id", userId)
                .single();

            if (!participation) return res.status(403).json({ error: "Access denied" });
        }

        let reactions = message.reactions || {};
        let userIds = reactions[emoji] || [];

        if (userIds.includes(userId)) {
            userIds = userIds.filter((id: string) => id !== userId);
        } else {
            userIds = [...userIds, userId];
        }

        if (userIds.length === 0) {
            delete reactions[emoji];
        } else {
            reactions[emoji] = userIds;
        }

        const { error: updateErr } = await supabase
            .from("messages")
            .update({ reactions })
            .eq("id", messageId);

        if (updateErr) throw updateErr;

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

        const { data: message, error: fetchErr } = await supabase
            .from("messages")
            .select("conversation_id, sender_id")
            .eq("id", messageId)
            .single();

        if (fetchErr || !message) return res.status(404).json({ error: "Message not found" });

        // Only sender can delete their own message in group, 
        // OR any participant in private? Usually only sender.
        if (message.sender_id !== userId) {
             return res.status(403).json({ error: "Access denied" });
        }

        const { error: deleteErr } = await supabase
            .from("messages")
            .delete()
            .eq("id", messageId);

        if (deleteErr) throw deleteErr;

        try {
            const { getIO } = await import("../lib/socket.js");
            const io = getIO();
            io.emit("message_deleted", { messageId, conversationId: message.conversation_id });
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

        const { data: convo } = await supabase.from("conversations").select("is_group").eq("id", id).single();
        if (convo?.is_group) {
            return res.status(403).json({ error: "Cannot delete public group chats" });
        }

        const { data: participation } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", id)
            .eq("user_id", userId)
            .single();

        if (!participation) return res.status(403).json({ error: "Access denied" });

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
