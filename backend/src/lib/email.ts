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
              background-color: #10633b;
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
              color: #10633b;
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
              border: 2px solid #10633b;
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
              background-color: #10633b;
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
                  <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/profile" class="btn">Enter the OS &rarr;</a>
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
