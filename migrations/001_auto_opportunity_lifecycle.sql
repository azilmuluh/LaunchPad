-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Auto-Opportunity Lifecycle
-- Description: Adds tables and procedures for automatic opportunity page
--              creation and deletion lifecycle management
-- Date: 2025-01-XX
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: OPPORTUNITY PAGES TRACKING TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Table to track auto-generated opportunity detail pages
CREATE TABLE IF NOT EXISTS lp_opportunity_pages (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id TEXT        NOT NULL,
  source_table   TEXT        NOT NULL CHECK (source_table IN ('lp_verified_opps', 'lp_opportunities_v2', 'lp_tag_cache')),
  slug           TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT 'opportunity',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,
  deleted_at     TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) >= 3 AND length(slug) <= 100),
  CONSTRAINT unique_active_slug UNIQUE (category, slug)
);

-- Add comment explaining the table purpose
COMMENT ON TABLE lp_opportunity_pages IS 'Tracks automatically generated opportunity detail pages with lifecycle metadata';
COMMENT ON COLUMN lp_opportunity_pages.opportunity_id IS 'Reference to opportunity (string to support multiple source table ID formats)';
COMMENT ON COLUMN lp_opportunity_pages.source_table IS 'Which table the opportunity originates from';
COMMENT ON COLUMN lp_opportunity_pages.slug IS 'URL-safe identifier for the opportunity';
COMMENT ON COLUMN lp_opportunity_pages.category IS 'Opportunity category (scholarship, internship, competition, event, job)';
COMMENT ON COLUMN lp_opportunity_pages.expires_at IS 'When the page should be deleted (based on deadline or default 365 days)';
COMMENT ON COLUMN lp_opportunity_pages.deleted_at IS 'Soft delete timestamp (NULL for active pages)';

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- Index for fast slug lookups (only active pages)
CREATE INDEX IF NOT EXISTS idx_opp_pages_slug 
  ON lp_opportunity_pages(slug) 
  WHERE deleted_at IS NULL;

-- Index for efficient cleanup queries (find expired pages)
CREATE INDEX IF NOT EXISTS idx_opp_pages_expires 
  ON lp_opportunity_pages(expires_at) 
  WHERE deleted_at IS NULL;

-- Index for opportunity ID lookups
CREATE INDEX IF NOT EXISTS idx_opp_pages_opportunity 
  ON lp_opportunity_pages(opportunity_id);

-- Index for querying deleted pages (for archival)
CREATE INDEX IF NOT EXISTS idx_opp_pages_deleted 
  ON lp_opportunity_pages(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Composite index for category + slug lookups
CREATE INDEX IF NOT EXISTS idx_opp_pages_category_slug 
  ON lp_opportunity_pages(category, slug) 
  WHERE deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: ARCHIVE TABLE FOR DELETED PAGES
-- ═══════════════════════════════════════════════════════════════════════════

-- Archive table to store deleted page metadata older than 90 days
CREATE TABLE IF NOT EXISTS lp_opportunity_pages_archive (
  id             UUID        PRIMARY KEY,
  opportunity_id TEXT        NOT NULL,
  source_table   TEXT        NOT NULL,
  slug           TEXT        NOT NULL,
  category       TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  deleted_at     TIMESTAMPTZ NOT NULL,
  archived_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lp_opportunity_pages_archive IS 'Archive storage for opportunity pages deleted more than 90 days ago';

-- Index for querying archived pages by deletion date
CREATE INDEX IF NOT EXISTS idx_opp_pages_archive_deleted 
  ON lp_opportunity_pages_archive(deleted_at DESC);

-- Index for querying archived pages by archival date
CREATE INDEX IF NOT EXISTS idx_opp_pages_archive_archived 
  ON lp_opportunity_pages_archive(archived_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: STORED PROCEDURE FOR ARCHIVAL
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS archive_old_deleted_pages(TIMESTAMPTZ);

-- Stored procedure to move old deleted pages to archive table
CREATE OR REPLACE FUNCTION archive_old_deleted_pages(cutoff_date TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
  rows_archived INTEGER;
BEGIN
  -- Move old deleted pages to archive
  WITH moved AS (
    INSERT INTO lp_opportunity_pages_archive (
      id,
      opportunity_id,
      source_table,
      slug,
      category,
      created_at,
      expires_at,
      deleted_at,
      archived_at
    )
    SELECT 
      id,
      opportunity_id,
      source_table,
      slug,
      category,
      created_at,
      expires_at,
      deleted_at,
      NOW() as archived_at
    FROM lp_opportunity_pages
    WHERE deleted_at IS NOT NULL
      AND deleted_at < cutoff_date
    RETURNING id
  ),
  deleted AS (
    DELETE FROM lp_opportunity_pages
    WHERE id IN (SELECT id FROM moved)
    RETURNING id
  )
  SELECT COUNT(*) INTO rows_archived FROM deleted;
  
  RETURN rows_archived;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_deleted_pages IS 'Archives opportunity pages deleted before the cutoff_date (typically 90 days ago)';

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5: VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'lp_opportunity_pages'
  ) THEN
    RAISE NOTICE 'Table lp_opportunity_pages created successfully';
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'lp_opportunity_pages_archive'
  ) THEN
    RAISE NOTICE 'Table lp_opportunity_pages_archive created successfully';
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_name = 'archive_old_deleted_pages'
  ) THEN
    RAISE NOTICE 'Function archive_old_deleted_pages created successfully';
  END IF;
END;
$$;
