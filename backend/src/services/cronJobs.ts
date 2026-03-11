import { CronJob } from 'cron';
import { supabase } from '../lib/supabase.js';
import { sendWeeklyDigestEmail, sendStreakWarningEmail } from '../lib/email.js';

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

  weeklyDigestJob.start();
  streakReminderJob.start();
  console.log('[Cron] Jobs scheduled.');
}
