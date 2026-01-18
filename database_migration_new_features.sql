-- Database Migration for New Features
-- Run this SQL in your Supabase SQL Editor

-- 1. Likes table
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- 2. Follows table
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 3. Saved posts table
CREATE TABLE IF NOT EXISTS saved_posts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id);

-- 4. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'mention'
  actor_id TEXT NOT NULL, -- User who performed the action
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 5. Add tags column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS tags TEXT[];

CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

-- 6. Add like_count to posts (for performance)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- 7. Add comment_count to posts (for performance)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 8. Add follower_count and following_count to users (for performance)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 9. Add total_likes to users (for profile display)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;

-- Function to update post like_count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes
DROP TRIGGER IF EXISTS trigger_update_post_like_count ON likes;
CREATE TRIGGER trigger_update_post_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  WHEN (NEW.post_id IS NOT NULL OR OLD.post_id IS NOT NULL)
  EXECUTE FUNCTION update_post_like_count();

-- Function to update comment_count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follows
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON follows;
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- Initialize counts for existing data
UPDATE posts SET like_count = (
  SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id
) WHERE like_count = 0;

UPDATE posts SET comment_count = (
  SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id
) WHERE comment_count = 0;

UPDATE users SET follower_count = (
  SELECT COUNT(*) FROM follows WHERE follows.following_id = users.id
) WHERE follower_count = 0;

UPDATE users SET following_count = (
  SELECT COUNT(*) FROM follows WHERE follows.follower_id = users.id
) WHERE following_count = 0;
