-- Add missing columns to users table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMP WITH TIME ZONE;

-- Optional: Add index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Add images column to posts table (stored as JSONB array of image URLs)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS images JSONB;