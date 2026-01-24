import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

// Helper to ensure conversation exists or create one
async function getOrCreateConversation(user1Id: string, user2Id: string) {
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
            .select("id, name, username, avatar_url")
            .in("id", otherUserIds);

        if (err3) throw err3;

        // Get last messages (basic approach)
        // A better way would be a view or a separate query per convo if list is small
        const conversations = await Promise.all(participants.map(async (p) => {
            const user = users.find(u => u.id === p.user_id);
            const { data: lastMsg } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", p.conversation_id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            return {
                id: p.conversation_id,
                partner: user || { id: p.user_id, name: 'Unknown', username: 'unknown', avatar_url: null },
                last_message: lastMsg,
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
        const { data: participation } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", id)
            .eq("user_id", userId)
            .single();

        if (!participation) return res.status(403).json({ error: "Access denied" });

        const { data: messages, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true });

        if (error) throw error;

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

        const { conversationId, content, recipientId } = req.body;

        let targetConvoId = conversationId;

        if (!targetConvoId && recipientId) {
            // Start new conversation flow
            targetConvoId = await getOrCreateConversation(userId, recipientId);
        }

        if (!targetConvoId) {
            return res.status(400).json({ error: "Recipient or Conversation ID required" });
        }

        const { data: message, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: targetConvoId,
                sender_id: userId,
                content: content
            })
            .select()
            .single();

        if (error) throw error;

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
                const { error: notifErr } = await supabase.from("notifications").insert({
                    user_id: finalRecipientId,
                    type: "message",
                    actor_id: userId,
                    read: false,
                });

                if (notifErr) {
                    console.error("Database error creating message notification:", notifErr);
                } else {
                    console.log(`Notification sent to ${finalRecipientId}`);
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
