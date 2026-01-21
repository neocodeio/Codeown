import type { Request, Response } from "express";
import nodemailer from "nodemailer";

const FEEDBACK_TO = "ameen65022@gmail.com";

export async function submitFeedback(req: Request, res: Response) {
  try {
    const { fullName, email, username, message } = req.body;
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return res.status(400).json({ error: "Full name is required." });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const host = process.env.SMTP_HOST || process.env.FEEDBACK_SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || process.env.FEEDBACK_SMTP_PORT || "587", 10);
    let user = (process.env.SMTP_USER || process.env.FEEDBACK_SMTP_USER)?.trim();
    let pass = (process.env.SMTP_PASS || process.env.FEEDBACK_SMTP_PASS)?.trim();

    // Remove spaces from password (common mistake when copying Gmail App Password)
    if (pass) {
      pass = pass.replace(/\s+/g, "");
    }

    if (!host || !user || !pass) {
      console.error("Feedback: SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS (or FEEDBACK_*).");
      return res.status(503).json({ error: "Feedback email is not configured. Please try again later." });
    }

    // Basic email validation
    if (user && !user.includes("@")) {
      console.error("Feedback: SMTP_USER appears to be invalid (missing @):", user);
      return res.status(500).json({ error: "Invalid SMTP_USER format in .env. Check your email address." });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const un = typeof username === "string" && username.trim() ? username.trim() : "(not provided)";
    const body = `Feedback from Codeown\n\nFull name: ${fullName}\nEmail: ${email}\nUsername: ${un}\n\nMessage:\n${message}`;

    await transporter.sendMail({
      from: user,
      to: FEEDBACK_TO,
      subject: `[Codeown Feedback] from ${fullName}`,
      text: body,
    });

    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error("Feedback send error:", e);
    console.error("Error details:", {
      message: e?.message,
      code: e?.code,
      command: e?.command,
      response: e?.response,
      responseCode: e?.responseCode,
    });

    // Provide more specific error messages
    if (e?.code === "EAUTH" || e?.command === "AUTH") {
      return res.status(500).json({ error: "SMTP authentication failed. Check your SMTP_USER and SMTP_PASS in .env" });
    }
    if (e?.code === "ECONNECTION" || e?.code === "ETIMEDOUT") {
      return res.status(500).json({ error: "Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT in .env" });
    }
    if (e?.responseCode === 550 || e?.responseCode === 554) {
      return res.status(500).json({ error: "Email rejected by server. Check your SMTP configuration." });
    }

    return res.status(500).json({ 
      error: e?.message || "Failed to send feedback. Please check your SMTP configuration in .env",
      details: process.env.NODE_ENV === "development" ? e?.message : undefined
    });
  }
}
