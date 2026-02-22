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
            body {
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            .wrapper {
              width: 100%;
              background-color: #ffffff;
              padding: 64px 24px;
            }
            .container {
              max-width: 520px;
              margin: 0 auto;
            }
            .logo {
              text-align: left;
              margin-bottom: 64px;
            }
            .logo-text {
              font-size: 22px;
              font-weight: 800;
              color: #000000;
              letter-spacing: -0.5px;
              text-decoration: none;
            }
            .content {
              margin-bottom: 64px;
            }
            h1 {
              font-size: 36px;
              font-weight: 800;
              color: #000000;
              margin: 0 0 24px 0;
              letter-spacing: -1.2px;
              line-height: 1.1;
            }
            p {
              font-size: 16px;
              line-height: 1.6;
              color: #4b5563;
              margin: 0 0 32px 0;
              font-weight: 400;
            }
            .features {
              margin-bottom: 40px;
            }
            .feature-row {
              margin-bottom: 20px;
            }
            .feature-icon {
              font-size: 20px;
              margin-bottom: 4px;
            }
            .feature-text {
              font-size: 15px;
              color: #1f2937;
              line-height: 1.5;
            }
            .btn-container {
              margin-top: 48px;
            }
            .btn {
              background-color: #212121;
              color: #ffffff !important;
              padding: 18px 36px;
              text-decoration: none;
              border-radius: 14px;
              font-weight: 700;
              font-size: 16px;
              display: inline-block;
              text-align: center;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .footer {
              border-top: 1px solid #f3f4f6;
              padding-top: 48px;
              margin-top: 64px;
              text-align: center;
            }
            .footer-text {
              font-size: 13px;
              color: #9ca3af;
              margin-bottom: 12px;
            }
            .footer-links a {
              color: #6b7280;
              text-decoration: none;
              margin: 0 10px;
              font-weight: 600;
              font-size: 13px;
            }
            @media (max-width: 600px) {
              h1 { font-size: 32px; }
              .wrapper { padding: 48px 20px; }
              .btn { width: 100%; box-sizing: border-box; }
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="logo">
                <span class="logo-text">Codeown</span>
              </div>
              
              <div class="content">
                <h1>Welcome, ${name}.</h1>
                <p>You've officially joined the platform built for those who love to create. We're glad to have you building with us.</p>
                
                <div class="features">
                  <div class="feature-row">
                    <div class="feature-icon">🚀</div>
                    <div class="feature-text"><strong>Launch project showcases</strong> that highlight your technical depth.</div>
                  </div>
                  <div class="feature-row">
                    <div class="feature-icon">🌎</div>
                    <div class="feature-text"><strong>Find your collaborators</strong> among a global community of developers.</div>
                  </div>
                  <div class="feature-row">
                    <div class="feature-icon">✨</div>
                    <div class="feature-text"><strong>Build your developer OS</strong> and claim your unique username.</div>
                  </div>
                </div>

                <div class="btn-container">
                  <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/profile" class="btn">Get Started &rarr;</a>
                </div>
              </div>
              
              <div class="footer">
                <p class="footer-text">Codeown &bull; The Developer Operating System</p>
                <div class="footer-links">
                  <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/about">About</a>
                  <a href="${process.env.FRONTEND_URL || 'https://codeown.space'}/privacy">Privacy</a>
                </div>
                <p class="footer-text" style="margin-top: 32px; opacity: 0.6;">
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
