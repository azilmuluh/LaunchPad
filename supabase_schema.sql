-- CREATE ENGAGEMENT LIKES TABLE (Upvotes)
-- This table handles upvotes for Opportunities and Blips
CREATE TABLE IF NOT EXISTS lp_engagement_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- Can be Opportunity ID or Blip ID
    item_type TEXT NOT NULL, -- 'opportunity' or 'blip'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, item_id, item_type)
);

-- CREATE ENGAGEMENT COMMENTS TABLE
-- This table handles threaded discussions for Opportunities and Blips
-- Renamed to avoid collision with the existing lp_comments used for social posts
CREATE TABLE IF NOT EXISTS lp_engagement_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE,
    user_name TEXT,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'opportunity',
    content TEXT NOT NULL,
    parent_id UUID REFERENCES lp_engagement_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CREATE BLIPS TABLE
CREATE TABLE IF NOT EXISTS lp_blips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'opportunity', -- 'opportunity' | 'info'
    video_source TEXT NOT NULL, -- 'youtube' | 'instagram' | 'tiktok' | 'user_upload'
    video_url TEXT NOT NULL,
    embed_id TEXT, -- YouTube ID, TikTok ID, etc.
    thumbnail TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    tags JSONB DEFAULT '[]',
    apply_link TEXT,
    deadline TEXT,
    eligibility TEXT,
    verified BOOLEAN DEFAULT true,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engagement_likes_item ON lp_engagement_likes(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_engagement_comments_item ON lp_engagement_comments(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_blips_created ON lp_blips(created_at DESC);

-- RPC FUNCTIONS FOR COUNTERS
CREATE OR REPLACE FUNCTION increment_blip_likes(blip_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE lp_blips SET likes_count = likes_count + 1 WHERE id = blip_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_blip_likes(blip_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE lp_blips SET likes_count = likes_count - 1 WHERE id = blip_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_blip_comments(blip_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE lp_blips SET comments_count = comments_count + 1 WHERE id = blip_id;
END;
$$ LANGUAGE plpgsql;
