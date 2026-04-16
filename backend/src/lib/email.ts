import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Standard Premium Email Layout wrapper
 */
function renderEmailLayout(content: string, options: { title: string; showFooter?: boolean } = { title: "Codeown", showFooter: true }) {
  const currentYear = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;800&display=swap');
        
        body {
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .wrapper {
          width: 100%;
          background-color: #f8fafc;
          padding: 48px 16px;
        }
        .card {
          max-width: 560px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
          border: 1px solid #e2e8f0;
        }
        .header-banner {
          background-color: #000000;
          height: 8px;
          width: 100%;
        }
        .inner-padding {
          padding: 48px;
        }
        .logo-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          color: #000000;
          background: #e7f5ed;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 32px;
          display: inline-block;
        }
        h1 {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px 0;
          letter-spacing: -0.04em;
          line-height: 1.1;
        }
        .text {
          font-size: 16px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 32px;
        }
        .btn {
          background-color: #000000;
          color: #ffffff !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          display: inline-block;
          transition: all 0.2s ease;
        }
        .footer {
          padding: 32px 48px 48px;
          background-color: #f8fafc;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 12px;
          font-weight: 500;
        }
        .footer-links a {
          color: #64748b;
          text-decoration: none;
          margin: 0 8px;
          font-weight: 600;
          font-size: 12px;
        }
        @media (max-width: 600px) {
          .inner-padding { padding: 32px 24px; }
          .footer { padding: 32px 24px 40px; }
          h1 { font-size: 26px; }
          .btn { width: 100%; text-align: center; box-sizing: border-box; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header-banner"></div>
          <div class="inner-padding">
            <span class="logo-label">CODEOWN // ${options.title.toUpperCase()}</span>
            ${content}
          </div>
          ${options.showFooter ? `
          <div class="footer">
            <p class="footer-text">The Developer Operating System.</p>
            <div class="footer-links">
              <a href="https://codeown.space/ship">Ship</a>
              <a href="https://codeown.space/search">Explore</a>
              <a href="https://codeown.space/privacy">Privacy</a>
            </div>
            <p class="footer-text" style="margin-top: 24px; opacity: 0.5;">
              &copy; ${currentYear} Codeown
            </p>
          </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendShipWeekLaunchEmail(email: string, name: string, competitionName: string, deadline: string) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "Codeown <founders@codeown.space>",
      to: email,
      subject: `🚀 New Ship Week is LIVE: ${competitionName}`,
      html: renderEmailLayout(`
        <h1>Season 1 is Here.</h1>
        <p class="text">
          Hi ${name}, a new high-stakes competition has just been launched on Codeown. It's time to build in public.
        </p>
        <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
          <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #0f172a;">${competitionName}</h2>
          <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 600;">DEADLINE: ${new Date(deadline).toLocaleDateString()} 11:59PM</p>
        </div>
        <p class="text" style="font-size: 14px; opacity: 0.8;">
          Requirement: You must ship <strong>3 daily updates</strong> this week to unlock the submission button.
        </p>
        <a href="https://codeown.space/ship" class="btn">Enter the Hub &rarr;</a>
      `, { title: "Competition" })
    });
  } catch (err) {
    console.error("Failed to send competition email", err);
  }
}

/**
 * Send competition emails in hardware-optimized batches
 */
export async function sendShipWeekBatchEmail(recipients: { email: string; name: string }[], competitionName: string, deadline: string) {
  if (!resend || !recipients.length) return;

  const batchSize = 100;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const chunk = recipients.slice(i, i + batchSize);
    try {
      await resend.batch.send(chunk.map(u => ({
        from: "Codeown <founders@codeown.space>",
        to: u.email,
        subject: `🚀 New Ship Week: ${competitionName}`,
        html: renderEmailLayout(`
          <h1>Season 1 Begins.</h1>
          <p class="text">
            Hi ${u.name}, a new high-stakes competition is live! Are you ready to ship?
          </p>
          <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
            <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #0f172a;">${competitionName}</h2>
            <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 600;">DEADLINE: ${new Date(deadline).toLocaleDateString()}</p>
          </div>
          <a href="https://codeown.space/ship" class="btn">Enter the Hub &rarr;</a>
        `, { title: "Launch" })
      })));
    } catch (err) {
      console.error("Batch email failure", err);
    }
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (!resend) {
    console.warn("Resend is not configured. Skipping welcome email.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Codeown Team <welcome@codeown.space>",
      to: email,
      subject: "Welcome to Codeown! 🚀",
      html: renderEmailLayout(`
        <h1>Your journey begins here.</h1>
        <p class="text">Welcome, ${name}. You're now connected to the Developer Operating System. Here's what's next on your roadmap:</p>
        
        <div style="margin-bottom: 40px;">
          <div style="margin-bottom: 24px; position: relative; padding-left: 28px;">
            <div style="position: absolute; left: 0; top: 2px; width: 14px; height: 14px; border: 2px solid #000; border-radius: 50%;"></div>
            <div style="font-weight: 700; color: #0f172a; font-size: 15px;">Claim Your Identity</div>
            <div style="color: #64748b; font-size: 13px;">Complete your profile to secure your unique handle.</div>
          </div>
          <div style="margin-bottom: 24px; position: relative; padding-left: 28px;">
            <div style="position: absolute; left: 0; top: 2px; width: 14px; height: 14px; border: 2px solid #000; border-radius: 50%;"></div>
            <div style="font-weight: 700; color: #0f172a; font-size: 15px;">Ship Your First Project</div>
            <div style="color: #64748b; font-size: 13px;">Turn your repositories into beautiful showcases.</div>
          </div>
          <div style="position: relative; padding-left: 28px;">
            <div style="position: absolute; left: 0; top: 2px; width: 14px; height: 14px; border: 2px solid #000; border-radius: 50%;"></div>
            <div style="font-weight: 700; color: #0f172a; font-size: 15px;">Connect & Grow</div>
            <div style="color: #64748b; font-size: 13px;">Follow other creators and share insights.</div>
          </div>
        </div>

        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/profile" class="btn">Enter Codeown &rarr;</a>
      `, { title: "v1.0.0" })
    });


    if (error) {
      console.error("Error sending welcome email:", error);
    } else {
      console.log("Welcome email sent successfully:", data?.id);
    }
  } catch (err) {
    console.error("Unexpected error sending welcome email:", err);
  }
}

export async function sendOrgRegistrationNotification(adminEmail: string, orgData: any) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "Codeown System <system@codeown.space>",
      to: adminEmail,
      subject: `New Organization Registration: ${orgData.name}`,
      html: renderEmailLayout(`
        <h1>New Request.</h1>
        <p class="text">A new organization has requested registration on the platform.</p>
        <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Name:</strong> ${orgData.name}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Website:</strong> ${orgData.website}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Industry:</strong> ${orgData.industry}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Domain:</strong> ${orgData.domain_email}</p>
        </div>
        <p class="text" style="font-size: 14px;">Please review this registration in Supabase and update the status.</p>
      `, { title: "Admin" })
    });
  } catch (err) {
    console.error("Error sending org registration notification:", err);
  }
}

export async function sendOrgStatusUpdateEmail(email: string, orgName: string, status: string) {
  if (!resend) return;
  const isApproved = status === 'approved';
  const subject = isApproved ? `Organization Approved: ${orgName} 🎉` : `Update on your Organization Registration: ${orgName}`;
  const message = isApproved
    ? `Great news! Your organization ${orgName} has been approved. You can now access organization features.`
    : `Your registration for ${orgName} has been ${status}. If you have any questions, please reply to this email.`;

  try {
    await resend.emails.send({
      from: "Codeown <support@codeown.space>",
      to: email,
      subject: subject,
      html: renderEmailLayout(`
        <h1>Status Update.</h1>
        <p class="text">Regarding your registration for <strong>${orgName}</strong>:</p>
        <p class="text" style="font-weight: 700; color: #000;">${message}</p>
        ${isApproved ? `<a href="https://codeown.space/search" class="btn">Discover Developers &rarr;</a>` : ''}
      `, { title: "Organization" })
    });
  } catch (err) {
    console.error("Error sending org status update email:", err);
  }
}

export async function sendNewFollowerEmail(email: string, userName: string, followerName: string, followerUsername: string) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: email,
      subject: `${followerName} just followed you on Codeown! 🎉`,
      html: renderEmailLayout(`
        <h1>New Connection.</h1>
        <p class="text">
          <strong>${followerName}</strong> (@${followerUsername}) just started following you on Codeown. Your network is growing.
        </p>
        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/${followerUsername}" class="btn">View Profile &rarr;</a>
      `, { title: "Network" })
    });
  } catch (err) {
    console.error("Error sending new follower email:", err);
  }
}

export async function sendNewLikeEmail(
  email: string,
  userName: string,
  likerName: string,
  contentType: 'post' | 'project' | 'comment',
  contentId: number,
  isSave: boolean = false
) {
  if (!resend) return;
  try {
    const url =
      contentType === 'project'
        ? `/project/${contentId}`
        : contentType === 'comment'
          ? `/comment/${contentId}`
          : `/`;

    const actionLabel = isSave ? 'saved' : 'liked';
    const subjectEmoji = isSave ? '🔖' : '❤️';
    const typeLabel = contentType === 'comment' ? 'comment' : contentType;

    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: email,
      subject: `${likerName} ${actionLabel} your ${typeLabel}! ${subjectEmoji}`,
      html: renderEmailLayout(`
        <h1>Content ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}.</h1>
        <p class="text">
          <strong>${likerName || 'Someone'}</strong> just ${actionLabel} your ${typeLabel}. Your work is being noticed by the community.
        </p>
        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}${url}" class="btn">View ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} &rarr;</a>
      `, { title: "Activity" })
    });
  } catch (err) {
    console.error("Error sending like/save email:", err);
  }
}

export async function sendNewCommentEmail(
  email: string,
  userName: string,
  commenterName: string,
  contentId: number,
  contentType: 'post' | 'project' = 'post',
  isReply: boolean = false
) {
  if (!resend) {
    console.warn("[EmailService] Resend not configured. Skipping comment email.");
    return;
  }
  try {
    const url = contentType === 'project' ? `/project/${contentId}` : `/`;
    const typeLabel = contentType === 'project' ? 'project' : 'post';
    const actionLabel = isReply ? 'replied to you' : `commented on your ${typeLabel}`;

    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: email,
      subject: `${commenterName} ${actionLabel}! 💬`,
      html: renderEmailLayout(`
        <h1>New Discussion.</h1>
        <p class="text">
          <strong>${commenterName || 'Someone'}</strong> just ${actionLabel} on Codeown. Join the conversation.
        </p>
        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}${url}" class="btn">View Conversation &rarr;</a>
      `, { title: "Community" })
    });
  } catch (err) {
    console.error("Error sending comment email:", err);
  }
}

export async function sendNewMentionEmail(email: string, userName: string, actorName: string, contentId: number, contentType: 'post' | 'project' | 'comment') {
  if (!resend) return;
  try {
    const url = contentType === 'project' ? `/project/${contentId}` : contentType === 'comment' ? `/comment/${contentId}` : `/`;

    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: email,
      subject: `${actorName} mentioned you on Codeown! ✨`,
      html: renderEmailLayout(`
        <h1>You're Mentioned.</h1>
        <p class="text">
          <strong>${actorName}</strong> just tagged you in a ${contentType}. Check out what they said.
        </p>
        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}${url}" class="btn">View Mention &rarr;</a>
      `, { title: "Alert" })
    });
  } catch (err) {
    console.error("Error sending mention email:", err);
  }
}

export async function sendStreakWarningEmail(email: string, userName: string, streakCount: number) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: email,
      subject: `Urgent: You have 8 hours to save your ${streakCount}-day streak! 🔥`,
      html: renderEmailLayout(`
        <h1>Don't Stop Now.</h1>
        <p class="text">
          Hey ${userName}, you're about to lose your <strong>${streakCount}-day coding streak</strong>! You have exactly <strong>8 hours left</strong> to log in and keep your momentum alive.
        </p>
        <div style="background: #fff; border: 2px solid #000; padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 32px;">
          <div style="font-size: 48px; margin-bottom: 8px;">🔥</div>
          <div style="font-size: 24px; font-weight: 800;">${streakCount} DAYS</div>
          <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Current Momentum</div>
        </div>
        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/" class="btn">Save My Streak &rarr;</a>
      `, { title: "Retention" })
    });
  } catch (err) {
    console.error("Error sending streak email:", err);
  }
}

export async function sendWeeklyDigestEmail(email: string, userName: string, projects: any[]) {
  if (!resend) return;
  if (!projects || projects.length === 0) return;

  const projectsHtml = projects.map(p => `
    <div style="margin-bottom: 24px; padding: 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">${p.title}</h3>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.5;">${p.description || 'Check out this trending project on Codeown.'}</p>
      <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/project/${p.id}" style="color: #000000; text-decoration: none; font-weight: 700; font-size: 13px;">View Project &rarr;</a>
    </div>
  `).join('');

  try {
    await resend.emails.send({
      from: "Codeown Weekly <digest@codeown.space>",
      to: email,
      subject: "Here are the top trending projects on Codeown this week 🚀",
      html: renderEmailLayout(`
        <h1>Weekly Hotlist.</h1>
        <p class="text">Happy Friday, ${userName}! Here are the top projects launched this week that you don't want to miss.</p>
        <div style="margin-top: 32px;">
          ${projectsHtml}
        </div>
        <div style="text-align: center; margin-top: 16px;">
          <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/search?type=projects" class="btn">Explore All Projects &rarr;</a>
        </div>
      `, { title: "Digest" })
    });
  } catch (err) {
    console.error("Error sending weekly digest:", err);
  }
}

export async function sendPersonalWeeklyRecapEmail(email: string, userName: string, stats: any) {
  if (!resend) return;

  try {
    const { data, error } = await resend.emails.send({
      from: "Codeown Activity <stats@codeown.space>",
      to: email,
      subject: `Your Week on Codeown: +${stats.new_followers} new followers! 🔥`,
      html: renderEmailLayout(`
        <h1>Weekly Recap.</h1>
        <p class="text">You're killing it, ${userName}! Here is your activity for the past 7 days across the platform.</p>
        
        <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-bottom: 32px;">
          <div style="display: table-row;">
            <div style="display: table-cell; background: #e0f2fe; border-radius: 16px; padding: 20px; text-align: center; width: 50%;">
              <div style="font-size: 24px; font-weight: 800; color: #0369a1;">+${stats.new_followers}</div>
              <div style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase;">Followers</div>
            </div>
            <div style="display: table-cell; background: #fef3c7; border-radius: 16px; padding: 20px; text-align: center; width: 50%;">
              <div style="font-size: 24px; font-weight: 800; color: #b45309;">${stats.project_views + stats.post_views}</div>
              <div style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">Views</div>
            </div>
          </div>
        </div>
        
        <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-bottom: 32px;">
          <div style="display: table-row;">
            <div style="display: table-cell; background: #fce7f3; border-radius: 16px; padding: 20px; text-align: center; width: 50%;">
              <div style="font-size: 24px; font-weight: 800; color: #be185d;">${stats.new_likes}</div>
              <div style="font-size: 11px; font-weight: 700; color: #be185d; text-transform: uppercase;">Likes</div>
            </div>
            <div style="display: table-cell; background: #ffedd5; border-radius: 16px; padding: 20px; text-align: center; width: 50%;">
              <div style="font-size: 24px; font-weight: 800; color: #ea580c;">${stats.streak}d</div>
              <div style="font-size: 11px; font-weight: 700; color: #ea580c; text-transform: uppercase;">Streak</div>
            </div>
          </div>
        </div>

        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}" class="btn" style="width: 100%; text-align: center; box-sizing: border-box;">View Full Report &rarr;</a>
      `, { title: "Activity" })
    });

    if (error) console.error("Error sending weekly recap email:", error);
  } catch (err) {
    console.error("Unexpected error in sendPersonalWeeklyRecapEmail:", err);
  }
}

export async function sendCofounderRequestEmail(
  ownerEmail: string,
  ownerName: string,
  requesterName: string,
  requesterUsername: string,
  projectTitle: string,
  applicationData: {
    skills: string[];
    hoursPerWeek: string;
    reason: string;
    contribution: string;
  }
) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: ownerEmail,
      subject: `New Co-Founder Request for "${projectTitle}" from @${requesterUsername}! 🚀`,
      html: renderEmailLayout(`
        <h1>New Partner.</h1>
        <p class="text">
          <strong>${requesterName}</strong> (@${requesterUsername}) is interested in becoming a Co-Founder for <strong>${projectTitle}</strong>.
        </p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
          <h3 style="font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-top: 0; letter-spacing: 0.1em; font-family: 'JetBrains Mono', monospace;">Application Details</h3>
          <p style="margin: 16px 0 8px 0; font-size: 14px; color: #0f172a;"><strong>Skills:</strong> ${applicationData.skills.join(", ") || "N/A"}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;"><strong>Commitment:</strong> ${applicationData.hoursPerWeek} hours/week</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;"><strong>Reason:</strong> ${applicationData.reason.substring(0, 100)}${applicationData.reason.length > 100 ? '...' : ''}</p>
        </div>
        
        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/messages?userId=${requesterUsername}" class="btn">Message @${requesterUsername} &rarr;</a>
      `, { title: "Founders" })
    });
  } catch (err) {
    console.error("Error sending cofounder request email:", err);
  }
}

export async function sendNewMessageEmail(email: string, userName: string, senderName: string, senderUsername: string) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "Codeown <messages@codeown.space>",
      to: email,
      subject: `${senderName} sent you a message on Codeown! 💬`,
      html: renderEmailLayout(`
        <h1>New Message.</h1>
        <p class="text">
          <strong>${senderName}</strong> (@${senderUsername}) just sent you a new message.
        </p>
        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/messages?userId=${senderUsername}" class="btn">View Message &rarr;</a>
      `, { title: "Chat" })
    });
  } catch (err) {
    console.error("Error sending new message email:", err);
  }
}

export async function sendMilestoneEmail(email: string, name: string, milestone: string, emoji: string) {
  if (!resend) return;

  try {
    const { data, error } = await resend.emails.send({
      from: "Codeown Team <welcome@codeown.space>",
      to: email,
      subject: `${emoji} Milestone Reached: ${milestone} at Codeown!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@800&display=swap');
             body { background-color: #000; margin: 0; padding: 0; }
             .milestone-card {
                max-width: 500px;
                margin: 40px auto;
                background: #000;
                border: 0.5px solid rgba(255,255,255,0.1);
                border-radius: 24px;
                padding: 48px;
                text-align: center;
                box-shadow: 0 40px 100px rgba(0,0,0,0.5);
             }
             .milestone-title { color: #fff; font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -0.04em; text-transform: uppercase; }
             .milestone-desc { color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.05em; }
             .badge { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.1); padding: 32px; border-radius: 16px; margin: 40px 0; }
             .badge-value { color: #fff; font-size: 40px; font-weight: 900; margin: 0; font-family: 'Inter', sans-serif; }
             .btn-white { background: #fff; color: #000; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 900; font-family: 'JetBrains Mono', monospace; font-size: 13px; text-transform: uppercase; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="milestone-card">
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; color: #fff; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 40px;">CODEOWN // MILESTONE</div>
            <div style="font-size: 64px; margin-bottom: 24px;">${emoji}</div>
            <h1 class="milestone-title">Time flies.</h1>
            <p class="milestone-desc">${name || 'DEVELOPER'} REACHED A NEW RECORD</p>
            
            <div class="badge">
              <div class="badge-value">${milestone.toUpperCase()}</div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.3); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 8px;">MEMBERSHIP_DURATION</div>
            </div>

            <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin-bottom: 40px;">
              Exactly one ${milestone.toLowerCase()} has passed since you initialized your core directory on Codeown.
            </p>

            <a href="https://codeown.space/profile" class="btn-white">ENTER DASHBOARD &rarr;</a>
          </div>
        </body>
        </html>
      `
    });

    if (error) console.error("Unexpected error in sendMilestoneEmail:", error);
  } catch (err) {
    console.error("Unexpected error in sendMilestoneEmail:", err);
  }
}

export async function sendStartupUpvoteEmail(email: string, userName: string, upvoterName: string, startupName: string, startupId: string) {
  if (!resend) return;
  try {
    const url = `/startup/${startupId}`;
    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: email,
      subject: `New Upvote for "${startupName}"! 🚀`,
      html: renderEmailLayout(`
        <h1>Project Upvoted.</h1>
        <p class="text">
          <strong>${upvoterName}</strong> just upvoted your project <strong>${startupName}</strong>. You're climbing the ranks.
        </p>
        <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}${url}" class="btn">View Project &rarr;</a>
      `, { title: "Station" })
    });
  } catch (err) {
    console.error("Error sending startup upvote email:", err);
  }
}
