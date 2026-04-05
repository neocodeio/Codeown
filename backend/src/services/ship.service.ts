import { supabase } from "../lib/supabase.js";

export class ShipService {
  /**
   * Check if a user is eligible to submit for the current week.
   * Requires at least 3 posts of type 'Update' or 'Milestone' within the week.
   */
  static async checkEligibility(userId: string, weekId: string) {
    const { data: week } = await supabase
      .from("ship_weeks")
      .select("start_date, end_date")
      .eq("id", weekId)
      .single();

    if (!week) throw new Error("Competition week not found");

    const { count, error } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("post_type", ["Update", "Milestone"])
      .gte("created_at", week.start_date)
      .lte("created_at", week.end_date);

    if (error) throw error;

    const { data: participation } = await supabase
      .from("ship_participants")
      .select("id")
      .eq("user_id", userId)
      .eq("week_id", weekId)
      .maybeSingle();

    return {
      eligible: (count || 0) >= 3,
      count: count || 0,
      required: 3,
      isJoined: !!participation
    };
  }

  /**
   * Join a competition
   */
  static async joinWeek(userId: string, weekId: string) {
    const { data, error } = await supabase
      .from("ship_participants")
      .insert({ user_id: userId, week_id: weekId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Submit a project
   */
  static async submitProject(userId: string, weekId: string, submission: any) {
    const { eligible } = await this.checkEligibility(userId, weekId);
    if (!eligible) throw new Error("You must ship at least 3 updates this week to submit your project!");

    const { data, error } = await supabase
      .from("ship_submissions")
      .insert({
        user_id: userId,
        week_id: weekId,
        ...submission
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Vote for a submission
   */
  static async vote(userId: string, submissionId: string) {
    // 1. Check if already voted
    const { data: existing } = await supabase
      .from("ship_votes")
      .select("id")
      .eq("user_id", userId)
      .eq("submission_id", submissionId)
      .single();

    if (existing) throw new Error("You have already voted for this submission");

    // 2. Perform vote
    const { error: voteErr } = await supabase
      .from("ship_votes")
      .insert({ user_id: userId, submission_id: submissionId });

    if (voteErr) throw voteErr;

    // 3. Increment counter atomically
    const { error: rpcErr } = await supabase.rpc("increment_ship_vote", { sub_id: submissionId });
    if (rpcErr) throw rpcErr;

    return { success: true };
  }

  /**
   * Admin: Score a submission and update final rankings
   */
  static async setFounderScore(submissionId: string, score: number) {
    const { data: sub } = await supabase
      .from("ship_submissions")
      .select("*, week:ship_weeks(*)")
      .eq("id", submissionId)
      .single();

    if (!sub) throw new Error("Submission not found");

    // Calculate Community Part
    // We need the max votes in the week to normalize
    const { data: allSubs } = await supabase
      .from("ship_submissions")
      .select("votes_count")
      .eq("week_id", sub.week_id);

    const maxVotes = Math.max(...(allSubs?.map(s => s.votes_count) || [1]), 1);
    const communityPart = (sub.votes_count / maxVotes) * 50;
    const founderPart = (score / 100) * 50;
    const finalScore = communityPart + founderPart;

    const { data, error } = await supabase
      .from("ship_submissions")
      .update({ founder_score: score, final_score: finalScore })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
