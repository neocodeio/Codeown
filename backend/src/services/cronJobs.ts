import { CronJob } from 'cron';
import { supabase } from '../lib/supabase.js';
import { sendWeeklyDigestEmail, sendStreakWarningEmail, sendPersonalWeeklyRecapEmail } from '../lib/email.js';

export function initializeCronJobs() {
  console.log('[Cron] Initializing scheduled jobs...');

  // Weekly Top Projects Digest (Every Friday at 10:00 AM)
  const weeklyDigestJob = new CronJob('0 10 * * 5', async () => {
    console.log('[Cron] Running Weekly Digest Job...');
    try {
      // 1. Fetch top 3 projects launched this week
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, description, like_count')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('like_count', { ascending: false })
        .limit(3);

      if (projectsError) {
        throw projectsError;
      }

      if (!projects || projects.length === 0) {
        console.log('[Cron] No projects this week, skipping digest.');
        return;
      }

      // 2. Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('email, name');

      if (usersError) {
        throw usersError;
      }

      if (users && users.length > 0) {
        console.log(`[Cron] Sending weekly digest to ${users.length} users.`);
        // Batch send
        for (const user of users) {
          if (user.email && user.name) {
            await sendWeeklyDigestEmail(user.email, user.name, projects);
          }
        }
      }
    } catch (error) {
      console.error('[Cron] Error in Weekly Digest Job:', error);
    }
  });

  // Daily Streak Reminder (Every day at 6:00 PM)
  const streakReminderJob = new CronJob('0 18 * * *', async () => {
    console.log('[Cron] Running Streak Reminder Job...');
    try {
      // Fetch users with streak > 0
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, streak_count, last_active_at')
        .gt('streak_count', 0);

      if (usersError) {
        throw usersError;
      }

      if (users && users.length > 0) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let count = 0;
        for (const user of users) {
          if (!user.last_active_at || !user.email) continue;
          
          const lastActive = new Date(user.last_active_at);
          const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
          const dayDiff = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));

          // If dayDiff is exactly 1, they were active yesterday but haven't been active today yet
          // They are at risk of losing their streak if they don't log in before midnight!
          if (dayDiff === 1) {
            await sendStreakWarningEmail(user.email, user.name || 'User', user.streak_count);
            count++;
          }
        }
        console.log(`[Cron] Sent streak reminders to ${count} users.`);
      }
    } catch (error) {
      console.error('[Cron] Error in Streak Reminder Job:', error);
    }
  });

  // Personal Weekly Recap (Every Sunday at 8:00 PM)
  const personalRecapJob = new CronJob('0 20 * * 0', async () => {
    console.log('[Cron] Running Personal Weekly Recap Job...');
    try {
      const statsEnd = new Date();
      const statsStart = new Date();
      statsStart.setDate(statsStart.getDate() - 7);
      const startIso = statsStart.toISOString();

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, streak_count');

      if (usersError || !users) return;

      console.log(`[Cron] Preparing recaps for ${users.length} users.`);

      for (const user of users) {
        if (!user.email) continue;

        try {
          // 1. New followers
          const { count: newFollowers } = await supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", user.id)
            .gte("created_at", startIso);

          // 2. Views
          const { count: projectViews } = await supabase
            .from("analytics_events")
            .select("id", { count: "exact", head: true })
            .eq("target_user_id", user.id)
            .eq("event_type", "project_view")
            .gte("created_at", startIso);

          const { count: postViews } = await supabase
            .from("analytics_events")
            .select("id", { count: "exact", head: true })
            .eq("target_user_id", user.id)
            .eq("event_type", "post_view")
            .gte("created_at", startIso);

          // 3. Likes
          const [{ data: userPosts }, { data: userProjects }] = await Promise.all([
            supabase.from("posts").select("id").eq("user_id", user.id),
            supabase.from("projects").select("id").eq("user_id", user.id)
          ]);

          const postIds = userPosts?.map(p => p.id) || [];
          const projectIds = userProjects?.map(p => p.id) || [];

          let newLikes = 0;
          if (postIds.length > 0) {
            const { count } = await supabase.from("likes").select("id", { count: "exact", head: true }).in("post_id", postIds).gte("created_at", startIso);
            newLikes += (count || 0);
          }
          if (projectIds.length > 0) {
            const { count } = await supabase.from("likes").select("id", { count: "exact", head: true }).in("project_id", projectIds).gte("created_at", startIso);
            newLikes += (count || 0);
          }

          const stats = {
            new_followers: newFollowers || 0,
            project_views: projectViews || 0,
            post_views: postViews || 0,
            new_likes: newLikes,
            streak: user.streak_count || 0
          };

          // Only send if there was SOME activity
          if (stats.new_followers > 0 || stats.project_views > 0 || stats.post_views > 0 || stats.new_likes > 0) {
            await sendPersonalWeeklyRecapEmail(user.email, user.name || 'User', stats);
          }
        } catch (err) {
          console.error(`[Cron] Error generating recap for user ${user.id}:`, err);
        }
      }
    } catch (error) {
      console.error('[Cron] Error in Personal Weekly Recap Job:', error);
    }
  });

  weeklyDigestJob.start();
  streakReminderJob.start();
  personalRecapJob.start();
  console.log('[Cron] Jobs scheduled.');
}
