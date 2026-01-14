# User Sync Issue - Debugging Steps

If you're seeing "Unknown User" and wrong avatars, follow these steps:

## 1. Check Backend Logs

When you create a post or view the feed, check your backend console for:
- "User object from Clerk:" - This shows what data Clerk provides
- "User info extracted:" - This shows what we extracted
- "User synced to Supabase:" - Confirms user was saved
- "Fetched X users from Supabase" - Shows how many users exist
- "No user data found for user_id" - Means user doesn't exist

## 2. Verify Users in Database

Run this SQL in Supabase:
```sql
SELECT id, name, email, avatar_url, created_at FROM users ORDER BY created_at DESC LIMIT 10;
```

## 3. Manual User Sync

If users aren't being created automatically, they should be created when:
- User creates their first post
- User is fetched from Clerk API (automatic fallback)
- Webhook receives user.created event

## 4. Check Clerk Configuration

Make sure:
- `CLERK_SECRET_KEY` is set in backend `.env`
- Webhook is configured in Clerk Dashboard
- Webhook endpoint is: `https://your-domain.com/webhooks/clerk`

## 5. Quick Fix - Force Sync

Create a post - this should automatically sync the user. Check backend logs to see if it works.



