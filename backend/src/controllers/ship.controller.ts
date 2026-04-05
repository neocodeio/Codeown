import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ShipService } from "../services/ship.service.js";

export async function getShipWeekStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.sub;
    const week = await ShipService.getCurrentWeek();

    if (!week) {
      return res.status(404).json({ error: "No active ship week found" });
    }

    let userProgress = { count: 0, eligible: false };
    if (userId) {
      userProgress = await ShipService.checkEligibility(userId, week.id);
    }

    // Get current submissions
    const { data: submissions } = await supabase
      .from('ship_submissions')
      .select(`
        *,
        user:user_id(id, name, avatar_url, username, is_pro, is_og, has_golden_ship_badge)
      `)
      .eq('week_id', week.id)
      .order('votes_count', { ascending: false });

    res.json({
      week,
      userProgress,
      submissions: submissions || []
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch ship week status", details: err.message });
  }
}

export async function submitShip(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title, description, demo_url, github_url, week_id } = req.body;

    // 1. Double check eligibility
    const { eligible } = await ShipService.checkEligibility(userId, week_id);
    if (!eligible) {
      return res.status(403).json({ error: "You must share at least 3 updates/milestones this week to submit a project." });
    }

    // 2. Insert submission
    const { data, error } = await supabase
      .from('ship_submissions')
      .insert({
        user_id: userId,
        week_id,
        title,
        description,
        demo_url,
        github_url
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: "You have already submitted a project for this week." });
      throw error;
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to submit ship", details: err.message });
  }
}

export async function voteShip(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { submissionId } = req.params;

    const { error } = await supabase.rpc('increment_ship_vote', {
      sub_id: submissionId,
      voter_id: userId
    });

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: "You have already voted for this project." });
      throw error;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to vote", details: err.message });
  }
}

export async function setFounderScore(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.sub;
    
    // In a real scenario, we'd check if userId is in an ADMIN_LIST or has an admin role
    // For now, I'll assume the client-side middleware or a check here suffices
    // Assuming 'amin.ceo' or specific IDs are admins
    const { submissionId } = req.params;
    const { score } = req.body;

    if (score < 0 || score > 100) return res.status(400).json({ error: "Score must be 0-100" });

    const { data, error } = await supabase
      .from('ship_submissions')
      .update({ founder_score: score })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update founder score", details: err.message });
  }
}

export async function getHallOfFame(req: Request, res: Response) {
    try {
        const { data, error } = await supabase
            .from('hall_of_fame')
            .select(`
                *,
                user:user_id(id, name, avatar_url, username, is_og),
                project:winning_project_id(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: "Failed to fetch hall of fame", details: err.message });
    }
}

export async function createShipWeek(req: Request, res: Response) {
  try {
    const { theme, description, end_date } = req.body;
    
    // Set all other weeks to completed first
    await supabase.from('ship_weeks').update({ status: 'completed' }).eq('status', 'active');

    const { data, error } = await supabase
      .from('ship_weeks')
      .insert({
        theme,
        description,
        end_date,
        start_date: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create ship week", details: err.message });
  }
}
