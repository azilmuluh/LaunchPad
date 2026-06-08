-- ═══════════════════════════════════════════════════════════════════════════
-- LaunchPad Database Schema (Clean Version)
-- Removed all redundant table definitions and duplicate sections
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- CORE USER SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  full_name        TEXT NOT NULL,
  phone            TEXT,
  interests        TEXT DEFAULT '[]',
  education_level  TEXT,
  age              INT,
  date_of_birth    DATE,
  location         TEXT,
  nationality      TEXT,
  region           TEXT,
  degree_level     TEXT,
  academic_discipline TEXT,
  gpa              FLOAT,
  gender           TEXT,
  languages        TEXT[] DEFAULT '{}',
  skills           TEXT[] DEFAULT '{}',
  career_goals     TEXT,
  is_verified      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_users_email ON lp_users(email);

CREATE TABLE IF NOT EXISTS lp_user_extra (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  avatar_url      TEXT,
  cv_text         TEXT,
  email_verified  BOOLEAN DEFAULT FALSE,
  settings        JSONB DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lp_user_profile (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  account_type TEXT DEFAULT 'person',
  org_type     TEXT,
  org_website  TEXT,
  org_bio      TEXT,
  verified_org BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- AUTHENTICATION & SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_email_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_email_verif_email ON lp_email_verifications(email);

CREATE TABLE IF NOT EXISTS lp_password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON lp_password_reset_tokens(token) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON lp_password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS lp_user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location_city TEXT,
  location_country TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON lp_user_sessions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_token ON lp_user_sessions(token) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS lp_user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE UNIQUE,
  email_notifications JSONB DEFAULT '{"new_opportunities": true, "deadline_reminders": true, "weekly_digest": true, "application_updates": true, "community_activity": false, "marketing": false}',
  push_notifications JSONB DEFAULT '{"new_opportunities": true, "deadline_reminders": true, "messages": true, "achievements": true}',
  sms_notifications JSONB DEFAULT '{}',
  profile_visibility TEXT DEFAULT 'public',
  show_activity BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,
  allow_messages_from TEXT DEFAULT 'everyone',
  content_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  theme TEXT DEFAULT 'light',
  compact_mode BOOLEAN DEFAULT false,
  show_images BOOLEAN DEFAULT true,
  reduce_animations BOOLEAN DEFAULT false,
  auto_match_opportunities BOOLEAN DEFAULT true,
  match_aggressiveness TEXT DEFAULT 'balanced',
  show_expired_opps BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON lp_user_preferences(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- OPPORTUNITIES SYSTEM (V2 - Enhanced Single-Entity Model)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_opportunities_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  program_name TEXT NOT NULL,
  provider_organization TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('scholarship', 'internship', 'competition', 'event', 'job', 'grant', 'fellowship')),
  description TEXT NOT NULL,
  hero_image_url TEXT,
  hero_image_alt TEXT,
  background_gradient TEXT,
  application_url TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  deadline_text TEXT,
  eligibility JSONB NOT NULL DEFAULT '{}',
  requirements JSONB DEFAULT '[]',
  benefits JSONB DEFAULT '[]',
  funding_amount TEXT,
  duration TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  is_fully_funded BOOLEAN DEFAULT false,
  primary_field TEXT,
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  specificity_score INTEGER DEFAULT 0 CHECK (specificity_score >= 0 AND specificity_score <= 10),
  is_verified BOOLEAN DEFAULT false,
  verification_source TEXT,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  source_url TEXT,
  scraped_at TIMESTAMPTZ,
  created_by UUID REFERENCES lp_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT valid_specificity CHECK (specificity_score >= 7),
  CONSTRAINT has_application_url CHECK (application_url IS NOT NULL AND application_url != ''),
  CONSTRAINT has_eligibility CHECK (jsonb_typeof(eligibility) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_opps_v2_type ON lp_opportunities_v2(program_type);
CREATE INDEX IF NOT EXISTS idx_opps_v2_field ON lp_opportunities_v2(primary_field);
CREATE INDEX IF NOT EXISTS idx_opps_v2_deadline ON lp_opportunities_v2(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opps_v2_verified ON lp_opportunities_v2(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_opps_v2_eligibility ON lp_opportunities_v2 USING GIN (eligibility);
CREATE INDEX IF NOT EXISTS idx_opps_v2_tags ON lp_opportunities_v2 USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_opps_v2_keywords ON lp_opportunities_v2 USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_opps_v2_created ON lp_opportunities_v2(created_at DESC);

-- Legacy verified opportunities table (for backward compatibility)
CREATE TABLE IF NOT EXISTS lp_verified_opps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name     TEXT,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  eligibility   TEXT,
  benefits      TEXT,
  deadline      TEXT,
  link          TEXT,
  apply_link    TEXT,
  source        TEXT,
  location      TEXT,
  tag           TEXT,
  amount        TEXT,
  degree_level  TEXT,
  country_focus TEXT,
  application_steps TEXT[],
  verified      BOOLEAN DEFAULT FALSE,
  upvotes       INT DEFAULT 0,
  ai_confidence INT DEFAULT 0,
  mod_status    TEXT DEFAULT 'pending',
  views         INT DEFAULT 0,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_verified_opps_category ON lp_verified_opps(category);
CREATE INDEX IF NOT EXISTS idx_lp_verified_opps_user     ON lp_verified_opps(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_verified_opps_created  ON lp_verified_opps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lp_verified_opps_fts      ON lp_verified_opps USING GIN(to_tsvector('english', title || ' ' || description));

CREATE TABLE IF NOT EXISTS lp_opportunity_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL UNIQUE,
  apply_count INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_stats_item ON lp_opportunity_stats(item_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- BOOKMARKS & APPLICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_bookmarks_v2 (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  title       TEXT,
  link        TEXT NOT NULL,
  snippet     TEXT,
  description TEXT,
  source      TEXT,
  category    TEXT,
  tag         TEXT,
  deadline    TEXT,
  location    TEXT,
  eligibility TEXT,
  benefits    TEXT,
  folder      TEXT DEFAULT 'general',
  notes       TEXT,
  applied     BOOLEAN DEFAULT FALSE,
  applied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_bookmarks_v2_user   ON lp_bookmarks_v2(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lp_bookmarks_v2_unique ON lp_bookmarks_v2(user_id, link);

CREATE TABLE IF NOT EXISTS lp_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  opportunity JSONB,
  checklist JSONB DEFAULT '[]',
  ai_plan TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON lp_applications(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- BLIPS (SHORT-FORM VIDEO CONTENT)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_blips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'opportunity',
  video_source TEXT NOT NULL,
  video_url TEXT NOT NULL,
  embed_id TEXT,
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
  creator_id UUID REFERENCES lp_users(id),
  is_user_generated BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blips_created ON lp_blips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blips_creator ON lp_blips(creator_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ENGAGEMENT SYSTEM (Likes & Comments)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_engagement_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_engagement_likes_item ON lp_engagement_likes(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_engagement_likes_user ON lp_engagement_likes(user_id);

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

CREATE INDEX IF NOT EXISTS idx_engagement_comments_item ON lp_engagement_comments(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_engagement_comments_user ON lp_engagement_comments(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SOCIAL & COMMUNITY FEATURES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name         TEXT,
  content           TEXT NOT NULL,
  category          TEXT,
  opportunity_link  TEXT,
  opportunity_title TEXT,
  likes_count       INT DEFAULT 0,
  comments_count    INT DEFAULT 0,
  image_url         TEXT,
  visibility        TEXT DEFAULT 'public',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_posts_user    ON lp_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_posts_created ON lp_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS lp_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES lp_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name   TEXT,
  content     TEXT NOT NULL,
  parent_id   UUID REFERENCES lp_comments(id) ON DELETE CASCADE,
  likes_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_comments_post ON lp_comments(post_id);

CREATE TABLE IF NOT EXISTS lp_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_connections_requester ON lp_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_lp_connections_addressee ON lp_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_lp_connections_status    ON lp_connections(status);

CREATE TABLE IF NOT EXISTS lp_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  msg_type    TEXT DEFAULT 'text',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_messages_sender   ON lp_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_lp_messages_receiver ON lp_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_lp_messages_created  ON lp_messages(created_at ASC);

-- ═══════════════════════════════════════════════════════════════════════════
-- CIRCLES (Study Groups / Communities)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_circles_v2 (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  goal         TEXT,
  category     TEXT,
  creator_id   UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  creator_name TEXT,
  is_private   BOOLEAN DEFAULT FALSE,
  rules        TEXT,
  avatar_url   TEXT,
  max_members  INT DEFAULT 50,
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_circles_v2_creator ON lp_circles_v2(creator_id);
CREATE INDEX IF NOT EXISTS idx_lp_circles_v2_created ON lp_circles_v2(created_at DESC);

CREATE TABLE IF NOT EXISTS lp_circle_members_v2 (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id      UUID NOT NULL REFERENCES lp_circles_v2(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name      TEXT,
  role           TEXT DEFAULT 'member',
  rules_accepted BOOLEAN DEFAULT FALSE,
  joined_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_circle_members_v2_circle ON lp_circle_members_v2(circle_id);
CREATE INDEX IF NOT EXISTS idx_lp_circle_members_v2_user   ON lp_circle_members_v2(user_id);

CREATE TABLE IF NOT EXISTS lp_circle_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id  UUID NOT NULL REFERENCES lp_circles_v2(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name  TEXT,
  content    TEXT NOT NULL,
  reply_to   UUID REFERENCES lp_circle_messages(id) ON DELETE SET NULL,
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_circle_messages_circle  ON lp_circle_messages(circle_id);
CREATE INDEX IF NOT EXISTS idx_lp_circle_messages_created ON lp_circle_messages(created_at ASC);

-- ═══════════════════════════════════════════════════════════════════════════
-- GAMIFICATION & PROGRESS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_streaks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID UNIQUE NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  total_xp         INT DEFAULT 0,
  level            INT DEFAULT 1,
  current_streak   INT DEFAULT 0,
  longest_streak   INT DEFAULT 0,
  last_seen        TIMESTAMPTZ,
  opps_posted      INT DEFAULT 0,
  opps_bookmarked  INT DEFAULT 0,
  comments_made    INT DEFAULT 0,
  posts_made       INT DEFAULT 0,
  goals_set        INT DEFAULT 0,
  circles_created  INT DEFAULT 0,
  circles_joined   INT DEFAULT 0,
  resources_shared INT DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_streaks_xp ON lp_streaks(total_xp DESC);

CREATE TABLE IF NOT EXISTS lp_xp_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  xp         INT NOT NULL,
  ref_id     UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_xp_log_user    ON lp_xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_xp_log_created ON lp_xp_log(created_at DESC);

CREATE TABLE IF NOT EXISTS lp_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  badge_key   TEXT NOT NULL,
  badge_label TEXT,
  badge_icon  TEXT,
  xp_awarded  INT DEFAULT 0,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_lp_badges_user ON lp_badges(user_id);

CREATE TABLE IF NOT EXISTS lp_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT DEFAULT 'general',
  target_date   DATE,
  milestones    JSONB DEFAULT '[]',
  steps         JSONB DEFAULT '[]',
  progress      INT DEFAULT 0,
  status        TEXT DEFAULT 'active',
  linked_opp_id UUID REFERENCES lp_verified_opps(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_goals_user ON lp_goals(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  ref_id     UUID,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_notifs_user   ON lp_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_notifs_unread ON lp_notifications(user_id, read) WHERE read = FALSE;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS & FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'lp_users', 'lp_verified_opps', 'lp_posts',
    'lp_circles_v2', 'lp_goals', 'lp_connections', 
    'lp_opportunities_v2', 'lp_user_preferences'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
      CREATE TRIGGER trg_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;

-- Blip engagement functions
CREATE OR REPLACE FUNCTION increment_blip_likes(blip_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE lp_blips SET likes_count = likes_count + 1 WHERE id = blip_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_blip_likes(blip_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE lp_blips SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = blip_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_blip_comments(blip_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE lp_blips SET comments_count = comments_count + 1 WHERE id = blip_id;
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions if they exist (to avoid parameter name conflicts)
DROP FUNCTION IF EXISTS check_user_eligibility(JSONB, JSONB);
DROP FUNCTION IF EXISTS calculate_match_score(JSONB, JSONB);

-- Eligibility check function
CREATE OR REPLACE FUNCTION check_user_eligibility(
  p_user_data JSONB,
  p_opportunity_eligibility JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  user_age INTEGER;
  age_min INTEGER;
  age_max INTEGER;
BEGIN
  -- Age check
  IF p_opportunity_eligibility ? 'age_min' OR p_opportunity_eligibility ? 'age_max' THEN
    user_age := (p_user_data->>'age')::INTEGER;
    IF user_age IS NULL THEN RETURN FALSE; END IF;
    
    age_min := (p_opportunity_eligibility->>'age_min')::INTEGER;
    age_max := (p_opportunity_eligibility->>'age_max')::INTEGER;
    
    IF age_min IS NOT NULL AND user_age < age_min THEN RETURN FALSE; END IF;
    IF age_max IS NOT NULL AND user_age > age_max THEN RETURN FALSE; END IF;
  END IF;
  
  -- Add more eligibility checks as needed
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Match score calculation function
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_user_data JSONB,
  p_opportunity_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base eligibility = 20 points
  score := 20;
  
  -- Interest alignment (max 30)
  -- Field match (25)
  -- Location match (15)
  -- Fully funded bonus (10)
  
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reload_schema_cache()
RETURNS void SECURITY DEFINER AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════════
-- PUSH NOTIFICATIONS SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_user_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE,
  subscription_data JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON lp_user_push_subscriptions(user_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_push_subs_active ON lp_user_push_subscriptions(active) WHERE active = true;
