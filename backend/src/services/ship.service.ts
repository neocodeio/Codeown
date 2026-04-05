import { supabase } from '../lib/supabase.js';
import { notify } from './notification.service.js';

export interface ShipWeek {
  id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed';
  theme?: string;
}

export interface ShipSubmission {
  id: string;
  user_id: string;
  week_id: string;
  title: string;
  description: string;
  demo_url?: string;
  github_url?: string;
  votes_count: number;
  founder_score: number;
  final_score: number;
}

export class ShipService {
  static async getCurrentWeek(): Promise<ShipWeek | null> {
    const { data, error } = await supabase
      .from('ship_weeks')
      .select('*')
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('[ShipService] Error fetching current week:', error);
      return null;
    }

    // If no active week exists, create one starting today
    if (!data) {
      return this.initializeNewWeek();
    }

    return data;
  }

  static async initializeNewWeek(): Promise<ShipWeek | null> {
    const start = new Date();
    // Set to Monday 00:00:00
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('ship_weeks')
      .insert({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('[ShipService] Failed to initialize new week:', error);
      return null;
    }

    return data;
  }

  static async checkEligibility(userId: string, weekId: string): Promise<{ eligible: boolean; count: number }> {
    const { data: week } = await supabase
      .from('ship_weeks')
      .select('start_date')
      .eq('id', weekId)
      .single();

    if (!week) return { eligible: false, count: 0 };

    // Count updates/milestones by this user since week started
    const { count, error } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', week.start_date)
      .in('post_type', ['Update', 'Milestone']);

    if (error) {
      console.error('[ShipService] Error checking eligibility:', error);
      return { eligible: false, count: 0 };
    }

    const currentCount = count || 0;
    return {
      eligible: currentCount >= 3,
      count: currentCount
    };
  }

  static async calculateAllScores(weekId: string) {
    // 1. Get all submissions for the week
    const { data: submissions, error } = await supabase
      .from('ship_submissions')
      .select('*')
      .eq('week_id', weekId);

    if (error || !submissions || submissions.length === 0) return;

    // 2. Find max votes for normalization
    const maxVotes = Math.max(...submissions.map(s => s.votes_count), 1);

    // 3. Update each submission
    for (const sub of submissions) {
      const communityPart = (sub.votes_count / maxVotes) * 50;
      const founderPart = (sub.founder_score / 100) * 50;
      const finalScore = communityPart + founderPart;

      await supabase
        .from('ship_submissions')
        .update({ final_score: finalScore })
        .eq('id', sub.id);
    }
  }

  static async closeWeek() {
    const week = await this.getCurrentWeek();
    if (!week) return;

    console.log(`[ShipService] Closing week ${week.id}...`);

    // 1. Calculate final scores
    await this.calculateAllScores(week.id);

    // 2. Identify winner
    const { data: topShip, error: winnerErr } = await supabase
      .from('ship_submissions')
      .select('*')
      .eq('week_id', week.id)
      .order('final_score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (winnerErr) {
      console.error('[ShipService] Error finding winner:', winnerErr);
    }

    // 3. Archive & Reward
    if (topShip) {
      // Award Golden Ship Badge
      await supabase
        .from('users')
        .update({ has_golden_ship_badge: true })
        .eq('id', topShip.user_id);

      // Add to Hall of Fame
      await supabase
        .from('hall_of_fame')
        .insert({
          user_id: topShip.user_id,
          week_id: week.id,
          winning_project_id: topShip.id
        });

      // Notify winner via system-wide notification
      await notify({
        userId: topShip.user_id,
        actorId: 'system',
        type: 'startup_upvote', // Reusing a type or creating a new specific one later
        data: {
          message: `👑 Congratulations! Your project "${topShip.title}" won The Ship Week! You've been awarded the Golden Ship Badge.`
        }
      });
    }

    // 4. Set status to completed
    await supabase
      .from('ship_weeks')
      .update({ status: 'completed' })
      .eq('id', week.id);

    // 5. Initialize next week
    await this.initializeNewWeek();
  }
}
