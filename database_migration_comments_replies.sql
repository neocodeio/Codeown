-- Migration: Comment replies (parent_id) for nested threads
-- Run this in Supabase SQL Editor

ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments(post_id, parent_id);

-- Note: Comment likes use the existing 'likes' table with comment_id (post_id NULL).
-- Notification type 'reply' can be used as-is; the notifications table has no enum on type.
