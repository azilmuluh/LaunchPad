# Database Migrations

This folder contains database migration scripts for the LaunchPad platform.

## Migration Files

### 001_auto_opportunity_lifecycle.sql

**Purpose:** Adds database schema for the Auto-Opportunity Lifecycle feature.

**What it does:**
- Creates `lp_opportunity_pages` table to track automatically generated opportunity detail pages
- Creates `lp_opportunity_pages_archive` table for long-term storage of deleted pages
- Adds optimized indexes for fast lookups and efficient cleanup queries
- Implements `archive_old_deleted_pages()` stored procedure for archiving old records

**Requirements fulfilled:**
- Requirement 4.1: Create tracking table for opportunity pages
- Requirement 4.2: Include all necessary columns (id, opportunity_id, source_table, slug, category, created_at, expires_at, deleted_at)
- Requirement 4.6: Index slug column for fast lookups
- Requirement 4.7: Index expires_at column for efficient cleanup queries
- Requirement 7.8: Archive deleted page metadata older than 90 days

## How to Apply Migrations

### Using Supabase CLI

```bash
# Apply migration to local Supabase instance
supabase db push

# Or apply specific migration file
supabase db execute -f migrations/001_auto_opportunity_lifecycle.sql
```

### Using psql

```bash
# Connect to your database
psql -h <host> -U <user> -d <database>

# Run migration
\i migrations/001_auto_opportunity_lifecycle.sql
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the migration file
4. Click "Run" to execute

## Verification

After applying the migration, verify that the tables and functions were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('lp_opportunity_pages', 'lp_opportunity_pages_archive');

-- Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'archive_old_deleted_pages';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'lp_opportunity_pages';
```

## Rollback

To rollback this migration (if needed):

```sql
-- Drop function
DROP FUNCTION IF EXISTS archive_old_deleted_pages(TIMESTAMPTZ);

-- Drop tables (be careful - this will delete all data!)
DROP TABLE IF EXISTS lp_opportunity_pages_archive;
DROP TABLE IF EXISTS lp_opportunity_pages;
```

## Notes

- The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times
- The `unique_active_slug` constraint ensures slug uniqueness only for active (non-deleted) pages
- The `valid_slug` constraint enforces the slug pattern: lowercase alphanumeric with hyphens, 3-100 characters
- Partial indexes are used to improve query performance and reduce index size
- The archive table does not have foreign key constraints for performance reasons
