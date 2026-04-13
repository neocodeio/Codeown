import { supabase } from "../lib/supabase.js";

export type XPReason = 'post' | 'project' | 'comment' | 'like' | 'follow' | 'referral';

const XP_VALUES: Record<XPReason, number> = {
    post: 50,
    project: 100,
    comment: 10,
    like: 5,
    follow: 20,
    referral: 200
};

const POST_DAILY_LIMIT = 3;

export class GamificationService {
    /**
     * Awards XP to a user and handles leveling logic.
     */
    static async awardXP(userId: string, reason: XPReason, targetId?: string): Promise<void> {
        try {
            const amount = XP_VALUES[reason];

            // 1. Handle daily limit for posts
            if (reason === 'post') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { count, error: countError } = await supabase
                    .from("xp_history")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", userId)
                    .eq("reason", "post")
                    .gte("created_at", today.toISOString());

                if (countError) throw countError;
                if (count !== null && count >= POST_DAILY_LIMIT) {
                    console.log(`[XP] User ${userId} reached daily limit for posts.`);
                    return;
                }
            }

            // 2. Fetch current XP
            const { data: user, error: userError } = await supabase
                .from("users")
                .select("xp, level")
                .eq("id", userId)
                .single();

            if (userError || !user) throw userError || new Error("User not found");

            const newXP = (Number(user.xp) || 0) + amount;

            // 3. Simple Level Calculation: Level = floor(sqrt(total_xp / 50)) + 1
            // Level 1: 0 XP
            // Level 2: 50 XP
            // Level 3: 200 XP
            // Level 4: 450 XP etc.
            const newLevel = Math.floor(Math.sqrt(newXP / 50)) + 1;
            const levelUp = newLevel > (user.level || 1);

            // 4. Update User
            const { error: updateError } = await supabase
                .from("users")
                .update({
                    xp: newXP,
                    level: newLevel
                })
                .eq("id", userId);

            if (updateError) throw updateError;

            // 5. Log History
            await supabase.from("xp_history").insert({
                user_id: userId,
                amount,
                reason,
                target_id: targetId ? String(targetId) : null
            });

            console.log(`[XP] Awarded ${amount} XP to ${userId} for ${reason}. New Total: ${newXP}, Level: ${newLevel}`);

            // 6. Real-time feedback via Sockets
            try {
                const { getIO } = await import("../lib/socket.js");
                const io = getIO();
                io.to(userId).emit("xp_gain", { amount, reason, newXP, newLevel });

                if (levelUp) {
                    io.to(userId).emit("level_up", { newLevel });

                    // Also create a persistent notification for level up
                    await supabase.from("notifications").insert({
                        user_id: userId,
                        type: "system",
                        actor_id: userId,
                        data: {
                            title: "Level Up!",
                            message: `Congratulations! You've reached Level ${newLevel}.`,
                            new_level: newLevel
                        }
                    });
                }
            } catch (socketErr) {
                console.error("[GamificationService] Socket broadcast error:", socketErr);
            }

        } catch (err) {
            console.error("[GamificationService.awardXP] Error:", err);
        }
    }
}
