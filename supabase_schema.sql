-- ═══════════════════════════════════════════════════════════════════════════
-- LaunchPad Database Schema — Clean, Authoritative, Deduplicated
-- All tables defined once. All functions use DROP + CREATE pattern.
-- Compatible with Supabase / PostgreSQL 14+
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: CORE USER SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_users (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT        UNIQUE NOT NULL,
  password_hash       TEXT        NOT NULL,
  full_name           TEXT        NOT NULL,
  phone               TEXT,
  interests           TEXT        DEFAULT '[]',
  education_level     TEXT,
  age                 INT,
  date_of_birth       DATE,
  location            TEXT,
  nationality         TEXT,
  region              TEXT,
  degree_level        TEXT,
  academic_discipline TEXT,
  gpa                 DECIMAL(3,2),
  gender              TEXT,
  languages           TEXT[]      DEFAULT '{}',
  skills              TEXT[]      DEFAULT '{}',
  career_goals        TEXT,
  is_verified         BOOLEAN     DEFAULT FALSE,
  is_email_verified   BOOLEAN     DEFAULT FALSE,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_users_email ON lp_users(email);

-- Extended profile metadata (avatar, CV, settings)
CREATE TABLE IF NOT EXISTS lp_user_extra (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        UNIQUE NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  avatar_url     TEXT,
  cv_text        TEXT,
  email_verified BOOLEAN     DEFAULT FALSE,
  settings       JSONB       DEFAULT '{}',
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation / person account type
CREATE TABLE IF NOT EXISTS lp_user_profile (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        UNIQUE NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  account_type TEXT        DEFAULT 'person',
  org_type     TEXT,
  org_website  TEXT,
  org_bio      TEXT,
  verified_org BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: AUTHENTICATION & SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_email_verifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified   BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_email_verif_email ON lp_email_verifications(email);

CREATE TABLE IF NOT EXISTS lp_password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES lp_users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON lp_password_reset_tokens(token) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user  ON lp_password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS lp_user_mfa (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        UNIQUE REFERENCES lp_users(id) ON DELETE CASCADE,
  is_enabled  BOOLEAN     DEFAULT FALSE,
  method      TEXT        CHECK (method IN ('totp', 'sms', 'email')),
  secret      TEXT,
  backup_codes TEXT[],
  phone_number TEXT,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lp_user_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES lp_users(id) ON DELETE CASCADE,
  token             TEXT        NOT NULL UNIQUE,
  device_name       TEXT,
  device_type       TEXT,
  browser           TEXT,
  os                TEXT,
  ip_address        TEXT,
  location_city     TEXT,
  location_country  TEXT,
  is_active         BOOLEAN     DEFAULT TRUE,
  last_activity_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user  ON lp_user_sessions(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sessions_token ON lp_user_sessions(token)   WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS lp_user_preferences (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        UNIQUE REFERENCES lp_users(id) ON DELETE CASCADE,
  email_notifications     JSONB       DEFAULT '{"new_opportunities": true, "deadline_reminders": true, "weekly_digest": true, "application_updates": true, "community_activity": false, "marketing": false}',
  push_notifications      JSONB       DEFAULT '{"new_opportunities": true, "deadline_reminders": true, "messages": true, "achievements": true}',
  sms_notifications       JSONB       DEFAULT '{"deadline_reminders": false, "important_updates": false}',
  profile_visibility      TEXT        DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_activity           BOOLEAN     DEFAULT TRUE,
  show_achievements       BOOLEAN     DEFAULT TRUE,
  allow_messages_from     TEXT        DEFAULT 'everyone' CHECK (allow_messages_from IN ('everyone', 'connections', 'none')),
  content_language        TEXT        DEFAULT 'en',
  timezone                TEXT        DEFAULT 'UTC',
  date_format             TEXT        DEFAULT 'MM/DD/YYYY',
  theme                   TEXT        DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  compact_mode            BOOLEAN     DEFAULT FALSE,
  show_images             BOOLEAN     DEFAULT TRUE,
  reduce_animations       BOOLEAN     DEFAULT FALSE,
  auto_match_opportunities BOOLEAN    DEFAULT TRUE,
  match_aggressiveness    TEXT        DEFAULT 'balanced' CHECK (match_aggressiveness IN ('strict', 'balanced', 'exploratory')),
  show_expired_opps       BOOLEAN     DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON lp_user_preferences(user_id);

CREATE TABLE IF NOT EXISTS lp_user_push_subscriptions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES lp_users(id) ON DELETE CASCADE,
  subscription_data JSONB       NOT NULL,
  active            BOOLEAN     DEFAULT TRUE,
  device_name       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user   ON lp_user_push_subscriptions(user_id) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_push_subs_active ON lp_user_push_subscriptions(active)  WHERE active = TRUE;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: OPPORTUNITIES SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

-- Primary opportunities table (V2 — strict single-entity model)
CREATE TABLE IF NOT EXISTS lp_opportunities_v2 (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT        NOT NULL,
  program_name          TEXT        NOT NULL,
  provider_organization TEXT        NOT NULL,
  program_type          TEXT        NOT NULL CHECK (program_type IN ('scholarship', 'internship', 'competition', 'event', 'job', 'grant', 'fellowship')),
  description           TEXT        NOT NULL,
  hero_image_url        TEXT,
  hero_image_alt        TEXT,
  background_gradient   TEXT,
  application_url       TEXT        NOT NULL,
  deadline              TIMESTAMPTZ,
  deadline_text         TEXT,
  -- eligibility: { age_min, age_max, nationalities[], regions[], degrees[], fields[], languages[], gpa_min, gender, specific_requirements[] }
  eligibility           JSONB       NOT NULL DEFAULT '{}',
  requirements          JSONB       DEFAULT '[]',
  benefits              JSONB       DEFAULT '[]',
  funding_amount        TEXT,
  duration              TEXT,
  location              TEXT,
  is_remote             BOOLEAN     DEFAULT FALSE,
  is_fully_funded       BOOLEAN     DEFAULT FALSE,
  primary_field         TEXT,
  tags                  TEXT[]      DEFAULT '{}',
  keywords              TEXT[]      DEFAULT '{}',
  specificity_score     INTEGER     DEFAULT 0 CHECK (specificity_score BETWEEN 0 AND 10),
  is_verified           BOOLEAN     DEFAULT FALSE,
  verification_source   TEXT,
  is_featured           BOOLEAN     DEFAULT FALSE,
  views_count           INTEGER     DEFAULT 0,
  applications_count    INTEGER     DEFAULT 0,
  bookmarks_count       INTEGER     DEFAULT 0,
  source_url            TEXT,
  scraped_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES lp_users(id),
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_specificity    CHECK (specificity_score >= 7),
  CONSTRAINT has_application_url  CHECK (application_url IS NOT NULL AND application_url != ''),
  CONSTRAINT has_eligibility      CHECK (jsonb_typeof(eligibility) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_opps_v2_type       ON lp_opportunities_v2(program_type);
CREATE INDEX IF NOT EXISTS idx_opps_v2_field      ON lp_opportunities_v2(primary_field);
CREATE INDEX IF NOT EXISTS idx_opps_v2_deadline   ON lp_opportunities_v2(deadline)    WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opps_v2_verified   ON lp_opportunities_v2(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_opps_v2_eligibility ON lp_opportunities_v2 USING GIN (eligibility);
CREATE INDEX IF NOT EXISTS idx_opps_v2_tags       ON lp_opportunities_v2 USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_opps_v2_keywords   ON lp_opportunities_v2 USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_opps_v2_created    ON lp_opportunities_v2(created_at DESC);

-- Legacy user-submitted opportunities (kept for backward compatibility)
CREATE TABLE IF NOT EXISTS lp_verified_opps (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name         TEXT,
  title             TEXT        NOT NULL,
  category          TEXT        NOT NULL,
  description       TEXT        NOT NULL,
  eligibility       TEXT,
  benefits          TEXT,
  deadline          TEXT,
  link              TEXT,
  apply_link        TEXT,
  source            TEXT,
  location          TEXT,
  tag               TEXT,
  amount            TEXT,
  degree_level      TEXT,
  country_focus     TEXT,
  application_steps TEXT[],
  verified          BOOLEAN     DEFAULT FALSE,
  upvotes           INT         DEFAULT 0,
  ai_confidence     INT         DEFAULT 0,
  mod_status        TEXT        DEFAULT 'pending',
  views             INT         DEFAULT 0,
  image_url         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_verified_opps_category ON lp_verified_opps(category);
CREATE INDEX IF NOT EXISTS idx_lp_verified_opps_user     ON lp_verified_opps(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_verified_opps_created  ON lp_verified_opps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lp_verified_opps_fts      ON lp_verified_opps
  USING GIN(to_tsvector('english', title || ' ' || description));

-- Per-opportunity apply-click stats
CREATE TABLE IF NOT EXISTS lp_opportunity_stats (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         TEXT        NOT NULL UNIQUE,
  apply_count     INTEGER     DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_stats_item ON lp_opportunity_stats(item_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: BOOKMARKS & APPLICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_bookmarks_v2 (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  title       TEXT,
  link        TEXT        NOT NULL,
  snippet     TEXT,
  description TEXT,
  source      TEXT,
  category    TEXT,
  tag         TEXT,
  deadline    TEXT,
  location    TEXT,
  eligibility TEXT,
  benefits    TEXT,
  folder      TEXT        DEFAULT 'general',
  notes       TEXT,
  applied     BOOLEAN     DEFAULT FALSE,
  applied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_bookmarks_v2_user ON lp_bookmarks_v2(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lp_bookmarks_v2_unique ON lp_bookmarks_v2(user_id, link);

-- Per-user application workspace
CREATE TABLE IF NOT EXISTS lp_applications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES lp_users(id) ON DELETE CASCADE,
  item_id     TEXT        NOT NULL,
  status      TEXT        DEFAULT 'draft',
  opportunity JSONB,
  checklist   JSONB       DEFAULT '[]',
  ai_plan     TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON lp_applications(user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: BLIPS (SHORT-FORM VIDEO CONTENT)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_blips (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT        NOT NULL DEFAULT 'opportunity',  -- 'opportunity' | 'info'
  video_source     TEXT        NOT NULL,                        -- 'youtube' | 'instagram' | 'tiktok' | 'user_upload'
  video_url        TEXT        NOT NULL,
  embed_id         TEXT,
  thumbnail        TEXT,
  title            TEXT        NOT NULL,
  summary          TEXT,
  tags             JSONB       DEFAULT '[]',
  apply_link       TEXT,
  deadline         TEXT,
  eligibility      TEXT,
  verified         BOOLEAN     DEFAULT TRUE,
  likes_count      INT         DEFAULT 0,
  comments_count   INT         DEFAULT 0,
  views            INT         DEFAULT 0,
  creator_id       UUID        REFERENCES lp_users(id),
  is_user_generated BOOLEAN    DEFAULT FALSE,
  status           TEXT        DEFAULT 'published',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blips_created ON lp_blips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blips_creator ON lp_blips(creator_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: ENGAGEMENT (Likes & Comments for Opportunities and Blips)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_engagement_likes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES lp_users(id) ON DELETE CASCADE,
  item_id    TEXT        NOT NULL,
  item_type  TEXT        NOT NULL,  -- 'opportunity' | 'blip'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_engagement_likes_item ON lp_engagement_likes(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_engagement_likes_user ON lp_engagement_likes(user_id);

CREATE TABLE IF NOT EXISTS lp_engagement_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name  TEXT,
  item_id    TEXT        NOT NULL,
  item_type  TEXT        NOT NULL DEFAULT 'opportunity',
  content    TEXT        NOT NULL,
  parent_id  UUID        REFERENCES lp_engagement_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_comments_item ON lp_engagement_comments(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_engagement_comments_user ON lp_engagement_comments(user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: SOCIAL / COMMUNITY POSTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_posts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name         TEXT,
  content           TEXT        NOT NULL,
  category          TEXT,
  opportunity_link  TEXT,
  opportunity_title TEXT,
  likes_count       INT         DEFAULT 0,
  comments_count    INT         DEFAULT 0,
  image_url         TEXT,
  visibility        TEXT        DEFAULT 'public',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_posts_user    ON lp_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_posts_created ON lp_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS lp_post_likes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES lp_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS lp_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES lp_posts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  user_name   TEXT,
  content     TEXT        NOT NULL,
  parent_id   UUID        REFERENCES lp_comments(id) ON DELETE CASCADE,
  likes_count INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_comments_post ON lp_comments(post_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 8: CONNECTIONS & DIRECT MESSAGES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_connections (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  addressee_id UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  status       TEXT        DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_connections_requester ON lp_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_lp_connections_addressee ON lp_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_lp_connections_status    ON lp_connections(status);

CREATE TABLE IF NOT EXISTS lp_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  receiver_id UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  read        BOOLEAN     DEFAULT FALSE,
  msg_type    TEXT        DEFAULT 'text',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_messages_sender   ON lp_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_lp_messages_receiver ON lp_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_lp_messages_created  ON lp_messages(created_at ASC);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 9: CIRCLES (Study Groups / Communities)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_circles_v2 (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  description  TEXT,
  goal         TEXT,
  category     TEXT,
  creator_id   UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  creator_name TEXT,
  is_private   BOOLEAN     DEFAULT FALSE,
  rules        TEXT,
  avatar_url   TEXT,
  max_members  INT         DEFAULT 50,
  status       TEXT        DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_circles_v2_creator ON lp_circles_v2(creator_id);
CREATE INDEX IF NOT EXISTS idx_lp_circles_v2_created ON lp_circles_v2(created_at DESC);

CREATE TABLE IF NOT EXISTS lp_circle_members_v2 (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id      UUID        NOT NULL REFERENCES lp_circles_v2(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES lp_users(id)      ON DELETE CASCADE,
  user_name      TEXT,
  role           TEXT        DEFAULT 'member',
  rules_accepted BOOLEAN     DEFAULT FALSE,
  joined_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_circle_members_v2_circle ON lp_circle_members_v2(circle_id);
CREATE INDEX IF NOT EXISTS idx_lp_circle_members_v2_user   ON lp_circle_members_v2(user_id);

CREATE TABLE IF NOT EXISTS lp_circle_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id  UUID        NOT NULL REFERENCES lp_circles_v2(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES lp_users(id)      ON DELETE CASCADE,
  user_name  TEXT,
  content    TEXT        NOT NULL,
  reply_to   UUID        REFERENCES lp_circle_messages(id) ON DELETE SET NULL,
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_circle_messages_circle  ON lp_circle_messages(circle_id);
CREATE INDEX IF NOT EXISTS idx_lp_circle_messages_created ON lp_circle_messages(created_at ASC);

CREATE TABLE IF NOT EXISTS lp_circle_tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id   UUID        NOT NULL REFERENCES lp_circles_v2(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  due_date    DATE,
  xp_reward   INT         DEFAULT 20,
  created_by  UUID        REFERENCES lp_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lp_circle_task_completions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID        NOT NULL REFERENCES lp_circle_tasks(id)  ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES lp_users(id)         ON DELETE CASCADE,
  circle_id    UUID        NOT NULL REFERENCES lp_circles_v2(id)    ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

CREATE TABLE IF NOT EXISTS lp_circle_resources (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id        UUID        NOT NULL REFERENCES lp_circles_v2(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  url              TEXT        NOT NULL,
  description      TEXT,
  type             TEXT        DEFAULT 'link',
  uploaded_by      UUID        REFERENCES lp_users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 10: GAMIFICATION (XP, Streaks, Badges, Goals)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_streaks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        UNIQUE NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  total_xp         INT         DEFAULT 0,
  level            INT         DEFAULT 1,
  current_streak   INT         DEFAULT 0,
  longest_streak   INT         DEFAULT 0,
  last_seen        TIMESTAMPTZ,
  opps_posted      INT         DEFAULT 0,
  opps_bookmarked  INT         DEFAULT 0,
  comments_made    INT         DEFAULT 0,
  posts_made       INT         DEFAULT 0,
  goals_set        INT         DEFAULT 0,
  circles_created  INT         DEFAULT 0,
  circles_joined   INT         DEFAULT 0,
  resources_shared INT         DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_streaks_xp ON lp_streaks(total_xp DESC);

CREATE TABLE IF NOT EXISTS lp_xp_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  action     TEXT        NOT NULL,
  xp         INT         NOT NULL,
  ref_id     UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_xp_log_user    ON lp_xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_xp_log_created ON lp_xp_log(created_at DESC);

CREATE TABLE IF NOT EXISTS lp_badges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  badge_key   TEXT        NOT NULL,
  badge_label TEXT,
  badge_icon  TEXT,
  xp_awarded  INT         DEFAULT 0,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_lp_badges_user ON lp_badges(user_id);

CREATE TABLE IF NOT EXISTS lp_goals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES lp_users(id)         ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  category      TEXT        DEFAULT 'general',
  target_date   DATE,
  milestones    JSONB       DEFAULT '[]',
  steps         JSONB       DEFAULT '[]',
  progress      INT         DEFAULT 0,
  status        TEXT        DEFAULT 'active',
  linked_opp_id UUID        REFERENCES lp_verified_opps(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_goals_user ON lp_goals(user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 11: NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES lp_users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT,
  ref_id     UUID,
  read       BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_notifs_user   ON lp_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_notifs_unread ON lp_notifications(user_id, read) WHERE read = FALSE;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 12: MODERATION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_opp_reports (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id     UUID        NOT NULL REFERENCES lp_verified_opps(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES lp_users(id)         ON DELETE CASCADE,
  reason     TEXT        NOT NULL,
  details    TEXT,
  resolved   BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opp_id, user_id)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 13: TRIGGERS
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
    'lp_users',
    'lp_user_extra',
    'lp_user_preferences',
    'lp_user_push_subscriptions',
    'lp_verified_opps',
    'lp_opportunities_v2',
    'lp_posts',
    'lp_circles_v2',
    'lp_goals',
    'lp_connections'
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


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 14: FUNCTIONS
-- All functions use DROP before CREATE to avoid Supabase parameter
-- name conflict errors (ERROR: 42P13).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Blip counter helpers ──────────────────────────────────────────────────

DROP FUNCTION IF EXISTS increment_blip_likes(UUID);
CREATE OR REPLACE FUNCTION increment_blip_likes(p_blip_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE lp_blips SET likes_count = likes_count + 1 WHERE id = p_blip_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS decrement_blip_likes(UUID);
CREATE OR REPLACE FUNCTION decrement_blip_likes(p_blip_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE lp_blips SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_blip_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS increment_blip_comments(UUID);
CREATE OR REPLACE FUNCTION increment_blip_comments(p_blip_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE lp_blips SET comments_count = comments_count + 1 WHERE id = p_blip_id;
END;
$$ LANGUAGE plpgsql;

-- ── Eligibility check ─────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS check_user_eligibility(p_user_data JSONB, p_opportunity_eligibility JSONB);
CREATE OR REPLACE FUNCTION check_user_eligibility(
  p_user_data            JSONB,
  p_opportunity_eligibility JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_age    INTEGER;
  v_age_min     INTEGER;
  v_age_max     INTEGER;
  v_nationality TEXT;
  v_degree      TEXT;
  v_field       TEXT;
  v_gpa         DECIMAL;
BEGIN
  -- Age
  IF p_opportunity_eligibility ? 'age_min' OR p_opportunity_eligibility ? 'age_max' THEN
    v_user_age := (p_user_data->>'age')::INTEGER;
    IF v_user_age IS NULL THEN RETURN FALSE; END IF;
    v_age_min := (p_opportunity_eligibility->>'age_min')::INTEGER;
    v_age_max := (p_opportunity_eligibility->>'age_max')::INTEGER;
    IF v_age_min IS NOT NULL AND v_user_age < v_age_min THEN RETURN FALSE; END IF;
    IF v_age_max IS NOT NULL AND v_user_age > v_age_max THEN RETURN FALSE; END IF;
  END IF;

  -- Nationality
  v_nationality := p_user_data->>'nationality';
  IF p_opportunity_eligibility ? 'nationalities' AND v_nationality IS NOT NULL THEN
    IF NOT (p_opportunity_eligibility->'nationalities' @> to_jsonb(v_nationality)) THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Degree level
  v_degree := p_user_data->>'degree_level';
  IF p_opportunity_eligibility ? 'degrees' AND v_degree IS NOT NULL THEN
    IF NOT (p_opportunity_eligibility->'degrees' @> to_jsonb(v_degree)) THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Academic field
  v_field := p_user_data->>'academic_discipline';
  IF p_opportunity_eligibility ? 'fields' AND v_field IS NOT NULL THEN
    IF NOT (p_opportunity_eligibility->'fields' @> to_jsonb(v_field)) THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- GPA
  v_gpa := (p_user_data->>'gpa')::DECIMAL;
  IF p_opportunity_eligibility ? 'gpa_min' AND v_gpa IS NOT NULL THEN
    IF v_gpa < (p_opportunity_eligibility->>'gpa_min')::DECIMAL THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── Match score ───────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS calculate_match_score(p_user_data JSONB, p_opportunity_data JSONB);
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_user_data        JSONB,
  p_opportunity_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_score           INTEGER := 0;
  v_user_interests  TEXT[];
  v_opp_keywords    TEXT[];
  v_overlap         INTEGER;
  v_user_field      TEXT;
  v_opp_field       TEXT;
  v_user_location   TEXT;
BEGIN
  -- Interest overlap (max 40 pts, 10 per matching keyword)
  v_user_interests := ARRAY(SELECT jsonb_array_elements_text(p_user_data->'interests'));
  v_opp_keywords   := ARRAY(SELECT jsonb_array_elements_text(p_opportunity_data->'keywords'));
  v_overlap := cardinality(v_user_interests & v_opp_keywords);
  v_score   := v_score + LEAST(v_overlap * 10, 40);

  -- Field match (30 pts)
  v_user_field := p_user_data->>'academic_discipline';
  v_opp_field  := p_opportunity_data->>'primary_field';
  IF v_user_field IS NOT NULL AND v_user_field = v_opp_field THEN
    v_score := v_score + 30;
  END IF;

  -- Location / remote match (15 pts)
  IF (p_opportunity_data->>'is_remote')::BOOLEAN IS TRUE THEN
    v_score := v_score + 10;
  ELSE
    v_user_location := p_user_data->>'location';
    IF v_user_location IS NOT NULL
       AND (p_opportunity_data->>'location') ILIKE '%' || v_user_location || '%' THEN
      v_score := v_score + 15;
    END IF;
  END IF;

  -- Fully funded bonus (15 pts)
  IF (p_opportunity_data->>'is_fully_funded')::BOOLEAN IS TRUE THEN
    v_score := v_score + 15;
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── PostgREST schema cache reload ─────────────────────────────────────────

DROP FUNCTION IF EXISTS reload_schema_cache();
CREATE OR REPLACE FUNCTION reload_schema_cache()
RETURNS VOID SECURITY DEFINER AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 15: VERIFICATION QUERY
-- Run to confirm all objects were created successfully
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  table_name,
  'table' AS object_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'lp_%'
UNION ALL
SELECT
  routine_name AS table_name,
  'function'   AS object_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'set_updated_at',
    'increment_blip_likes',
    'decrement_blip_likes',
    'increment_blip_comments',
    'check_user_eligibility',
    'calculate_match_score',
    'reload_schema_cache'
  )
ORDER BY object_type, table_name;