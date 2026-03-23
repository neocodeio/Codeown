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

  // Hourly Streak Monitor (Runs every hour)
  const hourlyStreakMonitor = new CronJob('0 * * * *', async () => {
    console.log('[Cron] Running Hourly Streak Monitor...');
    try {
      const now = new Date();
      
      // 1. Fetch users with active streaks
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, streak_count, last_active_at')
        .gt('streak_count', 0);

      if (error) throw error;
      if (!users || users.length === 0) return;

      let resetCount = 0;
      let warningCount = 0;

      for (const user of users) {
        if (!user.last_active_at) continue;

        const lastActive = new Date(user.last_active_at);
        const hoursSince = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

        // A. BREAK STREAK: If inactive for > 24 hours
        if (hoursSince > 24) {
          await supabase
            .from('users')
            .update({ streak_count: 0 })
            .eq('id', user.id);
          resetCount++;
        } 
        // B. WARN USER: If inactive for 16-17 hours (exactly 8 hours before break)
        else if (hoursSince >= 16 && hoursSince < 17) {
          // 1. Email Warning
          if (user.email) {
            await sendStreakWarningEmail(user.email, user.name || 'User', user.streak_count);
          }
          
          // 2. In-app Notification
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'streak_warning',
            content: `Your ${user.streak_count}-day streak is about to break! You have 8 hours left.`,
            read: false
          });

          warningCount++;
        }
      }

      console.log(`[Cron] Streak Monitor: ${resetCount} streaks reset, ${warningCount} warnings sent.`);
    } catch (error) {
      console.error('[Cron] Error in Hourly Streak Monitor:', error);
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
  hourlyStreakMonitor.start();
  personalRecapJob.start();

  // Daily Milestone Job (Every day at 9:00 AM)
  const milestoneJob = new CronJob('0 9 * * *', async () => {
    console.log('[Cron] Running Daily Milestone Job...');
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Fetch all users to check their join dates
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, username, created_at');

      if (usersError || !users) return;

      for (const user of users) {
        if (!user.created_at) continue;

        const joinedAt = new Date(user.created_at);
        const joinDay = new Date(joinedAt.getFullYear(), joinedAt.getMonth(), joinedAt.getDate());
        
        // Calculate diff in days
        const diffTime = Math.abs(today.getTime() - joinDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let milestoneTitle = '';
        let milestoneEmoji = '';
        const milestones = [
          { days: 7, label: '1 Week', emoji: '🌱' },
          { days: 30, label: '1 Month', emoji: '✨' },
          { days: 182, label: '6 Months', emoji: '🚀' },
          { days: 365, label: '1 Year', emoji: '👑' },
          { days: 730, label: '2 Years', emoji: '🔥' },
          { days: 1095, label: '3 Years', emoji: '💎' }
        ];

        const reachedMilestone = milestones.find(m => m.days === diffDays);

        if (reachedMilestone) {
          console.log(`[Cron] User ${user.username} reached ${reachedMilestone.label} milestone!`);
          
          // 1. Send Email
          if (user.email) {
            const { sendMilestoneEmail } = await import('../lib/email.js');
            await sendMilestoneEmail(user.email, user.name || 'User', reachedMilestone.label, reachedMilestone.emoji);
          }

          // 2. In-app Notification
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'milestone',
            content: `${reachedMilestone.emoji} Milestone Unlocked: You've been with Codeown for ${reachedMilestone.label}!`,
            read: false,
            metadata: {
              milestone: reachedMilestone.label,
              emoji: reachedMilestone.emoji
            }
          });
        }
      }
    } catch (error) {
      console.error('[Cron] Error in Milestone Job:', error);
    }
  });

  milestoneJob.start();

  console.log('[Cron] Jobs scheduled.');
}
