import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ShipService } from "../services/ship.service.js";

/**
 * Admin check helper
 */
async function isAdmin(userId: string) {
  const { data } = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .single();
  return data?.username === "amin.ceo";
}

export async function createCompetition(req: Request, res: Response) {
  try {
    const userId = String(req.user?.sub || req.user?.id || "");
    if (!userId || !(await isAdmin(userId))) {
      return res.status(403).json({ error: "Only amin.ceo can launch competitions." });
    }

    const { name, description, deadline } = req.body;
    const startDate = new Date();
    const endDate = new Date(deadline);

    const { data, error } = await supabase
      .from("ship_weeks")
      .insert({
        name,
        description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active"
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getActiveCompetition(req: Request, res: Response) {
  try {
    const { data: week, error } = await supabase
      .from("ship_weeks")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!week) return res.json(null);

    // Get submissions for this week
    const { data: submissions } = await supabase
      .from("ship_submissions")
      .select("*, user:users(id, name, avatar_url, username, is_pro, is_og, has_golden_ship_badge)")
      .eq("week_id", week.id)
      .order("final_score", { ascending: false })
      .order("votes_count", { ascending: false });

    return res.json({ ...week, submissions: submissions || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function joinCompetition(req: Request, res: Response) {
  try {
    const userId = String(req.user?.sub || req.user?.id || "");
    const weekId = String(req.params.weekId || "");
    if (!userId || !weekId) return res.status(401).json({ error: "Unauthorized" });

    const data = await ShipService.joinWeek(userId, weekId);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function submitProject(req: Request, res: Response) {
  try {
    const userId = String(req.user?.sub || req.user?.id || "");
    const { weekId } = req.params as { weekId: string };
    const submission = req.body;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const data = await ShipService.submitProject(userId, weekId, submission);
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function voteProject(req: Request, res: Response) {
  try {
    const userId = String(req.user?.sub || req.user?.id || "");
    const { submissionId } = req.params as { submissionId: string };
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const data = await ShipService.vote(userId, submissionId);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function checkEligibility(req: Request, res: Response) {
  try {
    const userId = String(req.user?.sub || req.user?.id || "");
    const { weekId } = req.params as { weekId: string };
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const data = await ShipService.checkEligibility(userId, weekId);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function setFounderScore(req: Request, res: Response) {
  try {
    const userId = String(req.user?.sub || req.user?.id || "");
    if (!userId || !(await isAdmin(userId))) {
      return res.status(403).json({ error: "Only amin.ceo can score projects." });
    }

    const { submissionId } = req.params as { submissionId: string };
    const { score } = req.body;

    const data = await ShipService.setFounderScore(submissionId, score);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getHallOfFame(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("hall_of_fame")
      .select("*, user:users(id, name, avatar_url, username, has_golden_ship_badge), project:ship_submissions(*), week:ship_weeks(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
