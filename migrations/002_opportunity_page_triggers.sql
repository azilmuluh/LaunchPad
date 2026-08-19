-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Opportunity Page Creation Triggers
-- Description: PostgreSQL triggers that fire pg_notify when new opportunities
--              are inserted, enabling automatic page creation via Node.js listener.
-- Requires: Migration 001 (lp_opportunity_pages table)
-- Date: 2025-01-XX
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Part 1: Trigger for lp_verified_opps ────────────────────────────────────
-- Validates: Requirement 1.1

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS create_page_for_verified_opp ON lp_verified_opps;
DROP FUNCTION IF EXISTS trigger_create_page_for_verified_opp();

CREATE OR REPLACE FUNCTION trigger_create_page_for_verified_opp()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Only fire for verified opportunities
  IF NEW.verified IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'opportunity_id', 'verified-' || NEW.id::TEXT,
    'source_table',   'lp_verified_opps',
    'title',          COALESCE(NEW.title, ''),
    'category',       COALESCE(NEW.category, 'opportunity'),
    'deadline',       COALESCE(NEW.deadline::TEXT, NULL)
  );

  PERFORM pg_notify('create_opportunity_page', payload::TEXT);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_page_for_verified_opp
  AFTER INSERT ON lp_verified_opps
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_page_for_verified_opp();

COMMENT ON FUNCTION trigger_create_page_for_verified_opp IS
  'Sends pg_notify when a verified opportunity is inserted, enabling automatic page creation';

-- ── Part 2: Trigger for lp_opportunities_v2 ─────────────────────────────────
-- Validates: Requirement 1.2

DROP TRIGGER IF EXISTS create_page_for_opp_v2 ON lp_opportunities_v2;
DROP FUNCTION IF EXISTS trigger_create_page_for_opp_v2();

CREATE OR REPLACE FUNCTION trigger_create_page_for_opp_v2()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  mapped_category TEXT;
BEGIN
  -- Map program_type to category (if lp_opportunities_v2 uses program_type)
  mapped_category := CASE COALESCE(NEW.program_type, '')
    WHEN 'scholarship'  THEN 'scholarship'
    WHEN 'internship'   THEN 'internship'
    WHEN 'competition'  THEN 'competition'
    WHEN 'event'        THEN 'event'
    WHEN 'job'          THEN 'job'
    ELSE COALESCE(NEW.category, 'opportunity')
  END;

  payload := jsonb_build_object(
    'opportunity_id', 'live-' || NEW.id::TEXT,
    'source_table',   'lp_opportunities_v2',
    'title',          COALESCE(NEW.title, ''),
    'category',       mapped_category,
    'deadline',       COALESCE(NEW.deadline::TEXT, NULL)
  );

  PERFORM pg_notify('create_opportunity_page', payload::TEXT);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'lp_opportunities_v2'
  ) THEN
    EXECUTE 'CREATE TRIGGER create_page_for_opp_v2
      AFTER INSERT ON lp_opportunities_v2
      FOR EACH ROW
      EXECUTE FUNCTION trigger_create_page_for_opp_v2()';

    RAISE NOTICE 'Trigger create_page_for_opp_v2 created on lp_opportunities_v2';
  ELSE
    RAISE NOTICE 'Table lp_opportunities_v2 does not exist — skipping trigger creation';
  END IF;
END;
$$;

COMMENT ON FUNCTION trigger_create_page_for_opp_v2 IS
  'Sends pg_notify when an opportunity is inserted into lp_opportunities_v2, enabling automatic page creation';

-- ── Part 3: Verification ──────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.triggers
    WHERE trigger_name = 'create_page_for_verified_opp'
  ) THEN
    RAISE NOTICE 'Trigger create_page_for_verified_opp created successfully';
  END IF;
END;
$$;
