# Feedback email setup

The floating Feedback button sends messages to **ameen65022@gmail.com**.

To enable it, set these environment variables for the **backend** (e.g. in `.env`):

```env
# Option 1: generic names
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-app-password

# Option 2: feedback-specific names
FEEDBACK_SMTP_HOST=smtp.gmail.com
FEEDBACK_SMTP_PORT=587
FEEDBACK_SMTP_USER=your-sender@gmail.com
FEEDBACK_SMTP_PASS=your-app-password
```

For Gmail: use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password.

If these are not set, the `/feedback` API returns 503 and the frontend shows an error.
