import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
            
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
            .logo-section {
              margin-bottom: 40px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .logo-label {
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              font-weight: 500;
              color: #000000;
              background: #e7f5ed;
              padding: 4px 8px;
              border-radius: 6px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            h1 {
              font-size: 32px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 16px 0;
              letter-spacing: -0.04em;
              line-height: 1.1;
            }
            .intro-text {
              font-size: 16px;
              line-height: 1.6;
              color: #475569;
              margin-bottom: 40px;
            }
            .steps-container {
              position: relative;
              margin-bottom: 48px;
            }
            .step {
              position: relative;
              padding-left: 32px;
              margin-bottom: 24px;
            }
            .step-line {
              position: absolute;
              left: 11px;
              top: 24px;
              bottom: -12px;
              width: 2px;
              background-color: #f1f5f9;
            }
            .step:last-child .step-line {
              display: none;
            }
            .step-dot {
              position: absolute;
              left: 0;
              top: 4px;
              width: 24px;
              height: 24px;
              background: #ffffff;
              border: 2px solid #000000;
              border-radius: 50%;
              box-sizing: border-box;
            }
            .step-title {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .step-desc {
              font-size: 14px;
              color: #64748b;
              line-height: 1.5;
            }
            .cta-container {
              margin-top: 48px;
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
              margin-bottom: 16px;
              font-weight: 500;
            }
            .footer-links a {
              color: #64748b;
              text-decoration: none;
              margin: 0 12px;
              font-weight: 600;
              font-size: 12px;
            }
            @media (max-width: 600px) {
              .inner-padding { padding: 32px 24px; }
              .footer { padding: 32px 24px 40px; }
              h1 { font-size: 28px; }
              .btn { width: 100%; text-align: center; box-sizing: border-box; }
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="card">
              <div class="header-banner"></div>
              <div class="inner-padding">
                <div class="logo-section">
                  <span class="logo-label">Codeown.v1.0</span>
                </div>
                
                <h1>Your journey begins here.</h1>
                <p class="intro-text">Welcome, ${name}. You're now connected to the Developer Operating System. Here's what's next on your roadmap:</p>
                
                <div class="steps-container">
                  <div class="step">
                    <div class="step-line"></div>
                    <div class="step-dot"></div>
                    <div class="step-title">Claim Your Identity</div>
                    <div class="step-desc">Complete your profile to secure your unique handle and showcase your stack.</div>
                  </div>
                  <div class="step">
                    <div class="step-line"></div>
                    <div class="step-dot"></div>
                    <div class="step-title">Ship Your First Project</div>
                    <div class="step-desc">Turn your repositories into beautiful showcases that capture the attention of the community.</div>
                  </div>
                  <div class="step">
                    <div class="step-dot"></div>
                    <div class="step-title">Connect & Grow</div>
                    <div class="step-desc">Follow other creators, share insights, and collaborate on the next big thing.</div>
                  </div>
                </div>

                <div class="cta-container">
                  <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/profile" class="btn">Enter Codeown &rarr;</a>
                </div>
              </div>
              
              <div class="footer">
                <p class="footer-text">Built for the next generation of developers.</p>
                <div class="footer-links">
                  <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/about">About</a>
                  <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/privacy">Privacy</a>
                  <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/terms">Terms</a>
                </div>
                <p class="footer-text" style="margin-top: 24px; opacity: 0.5;">
                  &copy; ${new Date().getFullYear()} Codeown
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
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
      html: `
                <h2>New Organization Request</h2>
                <p><strong>Name:</strong> ${orgData.name}</p>
                <p><strong>Website:</strong> ${orgData.website}</p>
                <p><strong>Domain Email:</strong> ${orgData.domain_email}</p>
                <p><strong>Industry:</strong> ${orgData.industry}</p>
                <p><strong>Description:</strong> ${orgData.description}</p>
                <p>Please review this registration in Supabase and update the status.</p>
            `
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
      html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Status Update: ${orgName}</h2>
                    <p>${message}</p>
                    ${isApproved ? '<a href="https://codeown.space/search" style="padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Discover Developers</a>' : ''}
                </div>
            `
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
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hey ${userName},</h2>
          <p><strong>${followerName}</strong> (@${followerUsername}) just started following you on Codeown.</p>
          <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/${followerUsername}" style="padding: 10px 20px; background: #0f172a; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View their Profile</a>
        </div>
      `
    });
  } catch (err) {
    console.error("Error sending new follower email:", err);
  }
}

export async function sendNewLikeEmail(email: string, userName: string, likerName: string, contentType: 'post' | 'project' | 'comment', contentId: number) {
  if (!resend) return;
  try {
    const url =
      contentType === 'project'
        ? `/project/${contentId}`
        : contentType === 'comment'
        ? `/comment/${contentId}`
        : `/`;
    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: email,
      subject: `${likerName} liked your ${contentType === 'comment' ? 'comment' : contentType}! ❤️`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hey ${userName},</h2>
          <p><strong>${likerName}</strong> just liked your ${contentType}.</p>
          <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}${url}" style="padding: 10px 20px; background: #0f172a; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View ${contentType}</a>
        </div>
      `
    });
  } catch (err) {
    console.error("Error sending like email:", err);
  }
}

export async function sendNewCommentEmail(email: string, userName: string, commenterName: string, contentId: number, contentType: 'post' | 'project' = 'post') {
  if (!resend) return;
  try {
    const url = contentType === 'project' ? `/project/${contentId}` : `/`;
    const typeLabel = contentType === 'project' ? 'project' : 'post';
    
    await resend.emails.send({
      from: "Codeown <notifications@codeown.space>",
      to: email,
      subject: `${commenterName} commented on your ${typeLabel}! 💬`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hey ${userName},</h2>
          <p><strong>${commenterName}</strong> just commented on your ${typeLabel}.</p>
          <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}${url}" style="padding: 10px 20px; background: #0f172a; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Comment</a>
        </div>
      `
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
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hey ${userName},</h2>
          <p><strong>${actorName}</strong> just mentioned you in a ${contentType}.</p>
          <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}${url}" style="padding: 10px 20px; background: #0f172a; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Mention</a>
        </div>
      `
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
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hey ${userName},</h2>
          <p>You're about to lose your <strong>${streakCount}-day coding streak</strong>!</p>
          <p>You haven't been active in 16 hours. You have exactly <strong>8 hours left</strong> to log in and keep your momentum going before it resets to zero.</p>
          <div style="margin-top: 24px;">
            <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/" style="padding: 12px 24px; background: #000000; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">Save My Streak &rarr;</a>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error("Error sending streak email:", err);
  }
}

export async function sendWeeklyDigestEmail(email: string, userName: string, projects: any[]) {
  if (!resend) return;
  if (!projects || projects.length === 0) return;
  
  const projectsHtml = projects.map(p => `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eef2f7;">
      <h3 style="margin-bottom: 5px;">${p.title}</h3>
      <p style="color: #64748b; margin-top: 0;">${p.description || 'Check out this awesome new project.'}</p>
      <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/project/${p.id}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">View Project &rarr;</a>
    </div>
  `).join('');

  try {
    await resend.emails.send({
      from: "Codeown Weekly <digest@codeown.space>",
      to: email,
      subject: "Here are the top trending projects on Codeown this week 🚀",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2>Happy Friday, ${userName}!</h2>
          <p>Here are the top projects launched this week that you don't want to miss.</p>
          <div style="margin-top: 30px;">
            ${projectsHtml}
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/search?type=projects" style="padding: 12px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Discover More Projects</a>
          </div>
        </div>
      `
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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .stat-box {
              padding: 20px;
              background: #f8fafc;
              border-radius: 16px;
              text-align: center;
              margin-bottom: 20px;
            }
            .stat-value {
              font-size: 28px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
            }
            .stat-label {
              font-size: 14px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body style="font-family: sans-serif; background-color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 24px; padding: 40px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="background: #000; color: #fff; display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 12px; margin-bottom: 16px;">WEEKLY RECAP</div>
              <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -1px;">You're killing it, ${userName}!</h1>
              <p style="color: #64748b; font-size: 16px; margin-top: 8px;">Here is your activity for the past 7 days.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div class="stat-box" style="background: #e0f2fe;">
                <p class="stat-value" style="color: #0369a1;">+${stats.new_followers}</p>
                <p class="stat-label">Followers</p>
              </div>
              <div class="stat-box" style="background: #fef3c7;">
                <p class="stat-value" style="color: #b45309;">${stats.project_views + stats.post_views}</p>
                <p class="stat-label">Views</p>
              </div>
              <div class="stat-box" style="background: #fce7f3;">
                <p class="stat-value" style="color: #be185d;">${stats.new_likes}</p>
                <p class="stat-label">Likes</p>
              </div>
              <div class="stat-box" style="background: #ffedd5;">
                <p class="stat-value" style="color: #ea580c;">${stats.streak}d</p>
                <p class="stat-label">Streak</p>
              </div>
            </div>

            <div style="margin-top: 32px; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}" style="background: #000; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block;">View Profile Highlights</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;">
            
            <p style="text-align: center; font-size: 12px; color: #94a3b8;">
              You received this because you're a member of the Codeown community.
            </p>
          </div>
        </body>
        </html>
      `
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
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 24px;">Hey ${ownerName},</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            <strong>${requesterName}</strong> (@${requesterUsername}) is interested in becoming a Co-Founder for your project <strong>${projectTitle}</strong>.
          </p>
          
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-top: 0; letter-spacing: 0.05em;">Application Details</h3>
            
            <p style="margin-bottom: 16px;">
              <strong style="display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Skills:</strong>
              <span style="font-size: 14px; color: #0f172a;">${applicationData.skills.join(", ") || "N/A"}</span>
            </p>
            
            <p style="margin-bottom: 16px;">
              <strong style="display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Weekly Commitment:</strong>
              <span style="font-size: 14px; color: #0f172a;">${applicationData.hoursPerWeek} hours</span>
            </p>
            
            <p style="margin-bottom: 16px;">
              <strong style="display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Why join?</strong>
              <span style="font-size: 14px; color: #0f172a;">${applicationData.reason}</span>
            </p>
            
            <p style="margin-bottom: 0;">
              <strong style="display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase;">What I bring:</strong>
              <span style="font-size: 14px; color: #0f172a;">${applicationData.contribution}</span>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/messages?userId=${requesterUsername}" style="padding: 12px 32px; background: #000000; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">Message @${requesterUsername} &rarr;</a>
          </div>
        </div>
      `
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
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 24px;">Hey ${userName},</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            <strong>${senderName}</strong> (@${senderUsername}) just sent you a new message on Codeown.
          </p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/messages?userId=${senderUsername}" style="padding: 12px 32px; background: #000000; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">View Message &rarr;</a>
          </div>
        </div>
      `
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
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@800&display=swap');
          </style>
        </head>
        <body style="font-family: 'Inter', sans-serif; background-color: #000; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #000; border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 48px; position: relative; overflow: hidden;">
            
            <!-- Logo Section -->
            <div style="margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                 <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; color: #fff; letter-spacing: 0.2em; text-transform: uppercase;">CODEOWN.SYSTEM</div>
                 <div style="font-size: 8px; color: rgba(255,255,255,0.4); margin-top: 4px; font-family: 'JetBrains Mono', monospace;">ARCHIVE • MILSTONE_STATION_v2.0</div>
              </div>
              <div style="background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 2px; color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 800;">
                CORE_EVENT
              </div>
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
              <div style="font-size: 64px; margin-bottom: 24px;">${emoji}</div>
              <h1 style="color: #fff; font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -1.5px; text-transform: uppercase; font-family: 'Inter', sans-serif;">
                Time flies.
              </h1>
              <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.05em;">
                ${name || 'DEVELOPER'} REACHED A NEW RECORD
              </p>
            </div>

            <!-- Card Logic -->
            <div style="background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.1); padding: 32px; border-radius: 8px; margin-bottom: 40px; text-align: center;">
              <div style="color: #fff; font-size: 40px; font-weight: 900; margin-bottom: 8px; font-family: 'Inter', sans-serif;">${milestone.toUpperCase()}</div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.3); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em;">MEMBERSHIP_DURATION</div>
            </div>

            <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 40px;">
              Exactly one ${milestone.toLowerCase()} has passed since you initialized your core directory on Codeown. Thank you for being a vital part of the next generation of builders.
            </p>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/profile" style="background: #fff; color: #000; padding: 18px 36px; border-radius: 4px; text-decoration: none; font-weight: 900; font-family: 'JetBrains Mono', monospace; font-size: 13px; text-transform: uppercase; display: inline-block;">
                ENTER_DASHBOARD &rarr;
              </a>
            </div>

            <div style="margin-top: 64px; border-top: 0.5px solid rgba(255,255,255,0.1); padding-top: 24px; text-align: center;">
               <div style="font-family: 'JetBrains Mono', monospace; font-size: 8px; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.2em;">
                 &copy; ${new Date().getFullYear()} CODEOWN • DECENTRALIZED_OPERATING_SYSTEM
               </div>
            </div>
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
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 24px;">Hey ${userName},</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            <strong>${upvoterName}</strong> just upvoted your startup <strong>${startupName}</strong> on Codeown!
          </p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}${url}" style="padding: 12px 32px; background: #000000; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">View Startup &rarr;</a>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error("Error sending startup upvote email:", err);
  }
}

