# Resend Setup Guide for Codeown

## ✅ What We Did

1. Installed Resend package in backend
2. Updated feedback controller to use Resend API
3. Added RESEND_API_KEY to .env

## 🔑 Get Your API Key

1. Go to https://resend.com
2. Sign up (free, no credit card)
3. Dashboard → API Keys → Create API Key
4. Copy the key (starts with `re_`)

## 🚀 Setup Steps

### Local Development
1. Open `backend/.env`
2. Replace `re_your_key_here` with your actual Resend API key
3. Restart your backend server

### Production (Railway)
1. Go to Railway dashboard
2. Select your backend service
3. Variables tab → Add variable:
   - Name: `RESEND_API_KEY`
   - Value: `re_your_actual_key_here`
4. Railway will auto-redeploy

## 📧 Email Sending Details

- **From**: `onboarding@resend.dev` (Resend's test domain)
- **To**: `ameen65022@gmail.com`
- **Reply-To**: User's email (so you can reply directly)

## 🎯 Verify Your Domain (Optional, for production)

To send from `feedback@codeown.com` instead of `onboarding@resend.dev`:

1. Resend Dashboard → Domains → Add Domain
2. Add `codeown.com` or `codeown.vercel.app`
3. Add DNS records (Resend will show you which ones)
4. Update the controller:
   ```typescript
   from: "Codeown Feedback <feedback@codeown.com>"
   ```

## 🧪 Testing

1. Start your backend: `npm run dev`
2. Send a test feedback from your frontend
3. Check Railway logs for "Feedback email sent successfully"
4. Check your email inbox

## 📊 Free Tier Limits

- 3,000 emails/month
- 100 emails/day
- Perfect for feedback forms!

## 🐛 Troubleshooting

If emails don't send:
1. Check Railway logs for errors
2. Verify RESEND_API_KEY is set correctly
3. Make sure you're using the correct API key (not the domain key)
4. Check Resend dashboard → Logs to see delivery status

## 📝 Notes

- Resend is MUCH more reliable than Gmail SMTP in cloud environments
- No need to worry about ports, firewalls, or IP blocking
- Emails send in ~100ms vs 20s timeout with SMTP
- You get delivery tracking and analytics in Resend dashboard
