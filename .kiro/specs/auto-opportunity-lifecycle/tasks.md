# Implementation Plan: Auto-Opportunity Lifecycle

## Overview

This implementation plan breaks down the Auto-Opportunity Lifecycle feature into discrete coding steps. The feature automates the creation and deletion of opportunity detail pages in the LaunchPad platform using a lifecycle manager that responds to database events and runs scheduled cleanup operations.

The implementation uses **JavaScript/Node.js** with Supabase for database operations and Netlify Functions for serverless execution.

## Tasks

- [x] 1. Set up database schema and stored procedures
  - Create `lp_opportunity_pages` table with all columns, indexes, and constraints
  - Create `lp_opportunity_pages_archive` table for archival storage
  - Implement `archive_old_deleted_pages` stored procedure
  - Add database migration script in SQL format
  - _Requirements: 4.1, 4.2, 4.6, 4.7, 7.8_

- [ ] 2. Implement Slug Generator module
  - [x] 2.1 Create SlugGenerator class with slug transformation logic
    - Implement `generateSlug()` method with lowercase conversion, space-to-hyphen replacement, special character removal, consecutive hyphen cleanup, and length constraints (3-100 chars)
    - Implement `isValidSlug()` method to validate slug pattern `^[a-z0-9-]+$`
    - Implement fallback logic for invalid titles (use opportunity ID)
    - Create `api/_slug-generator.js` module
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 8.6_
  
  - [x] 2.2 Write property test for slug character transformation
    - **Property 1: Slug Character Transformation**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Use fast-check to generate random strings (1-200 chars) and verify output contains only `[a-z0-9-]`
    - Verify spaces converted to hyphens, no consecutive hyphens, no leading/trailing hyphens
  
  - [ ] 2.3 Write property test for slug length boundaries
    - **Property 2: Slug Length Boundaries**
    - **Validates: Requirements 3.4, 3.5**
    - Use fast-check to generate strings of varying lengths and verify output is 3-100 chars
  
  - [x] 2.4 Write property test for slug pattern validity
    - **Property 3: Slug Pattern Validity**
    - **Validates: Requirements 3.7**
    - Use fast-check arbitrary to generate slugs and verify pattern match `^[a-z0-9-]+$`
  
  - [x] 2.5 Write property test for fallback slug generation
    - **Property 4: Fallback Slug for Invalid Titles**
    - **Validates: Requirements 3.6, 8.6**
    - Test empty strings, only special chars, very short titles
    - Verify fallback uses opportunity ID format
  
  - [x] 2.6 Implement slug uniqueness check with database lookup
    - Implement `ensureUnique()` method that queries `lp_opportunity_pages` table
    - Add numeric suffix logic (slug, slug-1, slug-2, ...) for duplicates
    - Implement `slugExists()` private method with Supabase query
    - _Requirements: 1.5, 1.6_
  
  - [~] 2.7 Write property test for slug uniqueness with numeric suffixes
    - **Property 5: Slug Uniqueness with Numeric Suffixes**
    - **Validates: Requirements 1.5, 1.6**
    - Generate multiple opportunities with identical titles
    - Verify sequential numeric suffixes applied correctly

- [~] 3. Checkpoint - Verify slug generator works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Page Creator module
  - [~] 4.1 Create PageCreator class with page creation logic
    - Implement `createPage()` method with Supabase insert transaction
    - Implement `calculateExpiresAt()` method for deadline parsing and default 365-day retention
    - Implement `detectSourceTable()` method to identify opportunity source by ID prefix
    - Add error handling for duplicate keys (23505) and other database errors
    - Create `api/_page-creator.js` module
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 2.5, 4.3, 8.1_
  
  - [~] 4.2 Write property test for default expiration calculation
    - **Property 6: Default Expiration Calculation**
    - **Validates: Requirements 2.5, 8.1**
    - Use fast-check to generate null, invalid, and unparseable deadlines
    - Verify expires_at is exactly 365 days from creation timestamp
  
  - [~] 4.3 Write unit tests for page creation edge cases
    - Test null/missing opportunity titles
    - Test invalid deadlines (unparseable dates)
    - Test source table detection for all ID formats (verified-, live-, static-, default)
    - _Requirements: 8.1, 8.6_
  
  - [~] 4.4 Implement page creation with transaction and retry logic
    - Add exponential backoff retry (3 attempts max)
    - Add logging for page creation events
    - Integrate SlugGenerator and PageCreator
    - _Requirements: 4.3, 6.5, 8.3_
  
  - [~] 4.5 Write property test for page creation idempotency
    - **Property 7: Page Creation Idempotency**
    - **Validates: Requirements 5.5, 8.4**
    - Test multiple creation attempts for same opportunity
    - Verify only one page record exists after multiple calls

- [~] 5. Checkpoint - Verify page creator works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Opportunity Lifecycle Manager module
  - [~] 6.1 Create OpportunityLifecycleManager class with orchestration logic
    - Implement `createPageForOpportunity()` method that coordinates SlugGenerator and PageCreator
    - Implement `pageExists()` method to check for existing pages by opportunity_id
    - Implement `getPageMetadata()` method to retrieve page data by ID or slug
    - Add error handling and logging
    - Create `api/_lifecycle-manager.js` module
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.5_
  
  - [~] 6.2 Write integration tests for lifecycle manager
    - Test full page creation flow from opportunity object to database record
    - Test pageExists() returns correct boolean
    - Test getPageMetadata() retrieves by both ID and slug
    - Test error propagation from sub-components
    - _Requirements: 1.1, 4.5, 8.3_

- [ ] 7. Implement database triggers for automatic page creation
  - [~] 7.1 Create trigger function for lp_verified_opps inserts
    - Write `trigger_create_page_for_verified_opp()` PostgreSQL function
    - Use `pg_notify` to send event to Node.js listener
    - Include opportunity_id, source_table, title, category, deadline in payload
    - Add migration script for trigger creation
    - _Requirements: 1.1_
  
  - [~] 7.2 Create trigger function for lp_opportunities_v2 inserts
    - Write `trigger_create_page_for_opp_v2()` PostgreSQL function
    - Use `pg_notify` with same event channel
    - Map program_type to category field
    - Add migration script for trigger creation
    - _Requirements: 1.2_
  
  - [~] 7.3 Implement Node.js listener for database notifications
    - Create Netlify background function that listens to `create_opportunity_page` channel
    - Parse notification payload and call OpportunityLifecycleManager
    - Add error handling and retry logic
    - Create `netlify/functions/opportunity-lifecycle-listener.js`
    - _Requirements: 1.1, 1.2, 7.1_

- [~] 8. Checkpoint - Verify trigger-based page creation works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Cleanup Scheduler module
  - [~] 9.1 Create CleanupScheduler class with batch deletion logic
    - Implement `run()` method with full cleanup orchestration
    - Implement `fetchExpiredPages()` method to query pages where expires_at <= now and deleted_at is null
    - Implement `createBatches()` utility to split pages into groups of 100
    - Implement `deleteBatch()` method with soft delete (update deleted_at timestamp)
    - Implement `deletePageWithRetry()` with exponential backoff (3 attempts)
    - Implement `archiveDeletedPages()` method to call stored procedure for 90-day-old records
    - Create `api/_cleanup-scheduler.js` module
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 6.5, 7.2, 7.8_
  
  - [~] 9.2 Write integration tests for cleanup scheduler
    - Test fetchExpiredPages() returns only expired opportunities
    - Test batch deletion updates deleted_at correctly
    - Test retry logic handles transient failures
    - Test archival moves old records to archive table
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.8_
  
  - [~] 9.3 Add logging and metrics collection
    - Log cleanup execution start/end times
    - Log counts of pages identified and deleted
    - Log all errors with page IDs and error messages
    - Implement `logMetrics()` method to persist metrics to monitoring system
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_
  
  - [~] 9.4 Add alerting for cleanup failures
    - Implement `sendAlert()` method to notify when errors occur
    - Send alerts for any failure regardless of retry success
    - Include CleanupResult details in alert payload
    - _Requirements: 6.6_

- [ ] 10. Create scheduled Netlify function for cleanup
  - [~] 10.1 Create cleanup-opportunity-pages.js Netlify function
    - Implement handler that instantiates CleanupScheduler and calls run()
    - Return CleanupResult as JSON response
    - Add error handling and logging
    - Create `netlify/functions/cleanup-opportunity-pages.js`
    - _Requirements: 2.1, 2.7, 6.1_
  
  - [~] 10.2 Configure scheduled execution in netlify.toml
    - Add function configuration with daily schedule (2 AM UTC)
    - Use cron expression `0 2 * * *`
    - Update `netlify.toml` file
    - _Requirements: 2.1_

- [~] 11. Checkpoint - Verify cleanup scheduler works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement API endpoints for page operations
  - [~] 12.1 Create GET /api/opportunities/:id/page endpoint
    - Check if page exists for opportunity using OpportunityLifecycleManager
    - Return page metadata if exists, 404 if not
    - Add route handler in `api/opportunities.js` or new file
    - _Requirements: 4.5_
  
  - [~] 12.2 Create POST /api/opportunities/:id/page endpoint
    - Create page for opportunity (backward compatibility with "View & Apply")
    - Make idempotent: return existing page if already created
    - Use OpportunityLifecycleManager.createPageForOpportunity()
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [~] 12.3 Create GET /api/opportunities/pages/stats endpoint
    - Query metrics: total pages, active pages, deleted pages
    - Query cleanup stats from logs
    - Return JSON response with all metrics
    - _Requirements: 6.7_
  
  - [~] 12.4 Write integration tests for API endpoints
    - Test GET /api/opportunities/:id/page for existing and non-existing pages
    - Test POST /api/opportunities/:id/page creates and returns page
    - Test POST idempotency (multiple calls return same page)
    - Test GET /api/opportunities/pages/stats returns valid metrics
    - _Requirements: 4.5, 5.1, 5.5_

- [ ] 13. Update frontend "View & Apply" button handler
  - [~] 13.1 Add page existence check before navigation
    - Call GET /api/opportunities/:id/page to check if page exists
    - If page exists, navigate to existing page URL
    - If page doesn't exist, call POST /api/opportunities/:id/page to create
    - Update button click handler in relevant React component
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [~] 13.2 Handle race conditions with optimistic locking
    - Add loading state during page creation
    - Handle concurrent "View & Apply" clicks gracefully
    - Show error message if page creation fails
    - _Requirements: 5.5, 5.6_
  
  - [~] 13.3 Write integration tests for button handler
    - Test navigation to existing page
    - Test page creation and navigation for new page
    - Test race condition handling with multiple simultaneous clicks
    - _Requirements: 5.1, 5.2, 5.5, 5.6_

- [ ] 14. Add 404 handler for expired opportunity pages
  - [~] 14.1 Update routing to check deleted_at before rendering page
    - Query lp_opportunity_pages by slug and check deleted_at is null
    - If deleted_at is not null, return 404 with helpful message
    - Update frontend routing in React Router configuration
    - _Requirements: 2.7_
  
  - [~] 14.2 Create user-friendly 404 page for expired opportunities
    - Display message: "This opportunity has expired or is no longer available"
    - Show link to browse all opportunities
    - Add component to frontend
    - _Requirements: 2.7_

- [ ] 15. Implement performance optimizations
  - [~] 15.1 Add database connection pooling
    - Configure Supabase client with connection pooling
    - Set appropriate pool size based on expected load
    - _Requirements: 7.1_
  
  - [~] 15.2 Implement slug uniqueness cache
    - Add in-memory cache for slug existence checks (1 hour TTL)
    - Reduce database queries for slug generation
    - Use simple JavaScript Map or Redis if available
    - _Requirements: 7.4, 7.5_
  
  - [~] 15.3 Add query timeouts
    - Set 5-second timeout for all database queries
    - Return partial results or error on timeout
    - _Requirements: 7.5_
  
  - [~] 15.4 Write performance tests
    - Test cleanup process completes 10,000 opps in under 5 minutes
    - Test page lookup queries execute in under 50ms
    - Test slug cache reduces database query count
    - _Requirements: 7.3, 7.5_

- [ ] 16. Implement observability and monitoring
  - [~] 16.1 Add structured logging throughout all modules
    - Use consistent log format with timestamps, module names, operation types
    - Log all page creation and deletion events with opportunity_id and slug
    - Log all errors with full context
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [~] 16.2 Add metrics collection
    - Track page creation rate (pages/hour)
    - Track cleanup execution duration
    - Track error rates for creation and deletion
    - Expose metrics via stats endpoint
    - _Requirements: 6.7_
  
  - [~] 16.3 Set up alerting for critical failures
    - Alert on cleanup failures (error rate > 5%)
    - Alert on page creation failures (error rate > 10%)
    - Alert on database connection failures
    - Integrate with existing notification system
    - _Requirements: 6.6_

- [ ] 17. Add feature flag for gradual rollout
  - [~] 17.1 Implement feature flag system
    - Add `AUTO_LIFECYCLE_ENABLED` environment variable
    - Check flag before enabling triggers and cleanup scheduler
    - Default to `false` for safe deployment
    - _Requirements: 7.1_
  
  - [~] 17.2 Add read-only mode for cleanup scheduler
    - Add `CLEANUP_READ_ONLY` environment variable
    - In read-only mode, log what would be deleted without deleting
    - Allow monitoring cleanup behavior before enabling writes
    - _Requirements: 6.1_

- [ ] 18. Final checkpoint - End-to-end testing and validation
  - [~] 18.1 Test complete page creation flow
    - Insert opportunity into lp_verified_opps and verify page created automatically
    - Insert opportunity into lp_opportunities_v2 and verify page created
    - Verify slug generation works correctly for various title formats
    - Verify unique slugs generated for duplicate titles
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_
  
  - [~] 18.2 Test complete cleanup flow
    - Create opportunities with past deadlines
    - Run cleanup scheduler and verify pages soft-deleted
    - Verify 404 returned for deleted pages
    - Verify archival process moves old records
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 7.8_
  
  - [~] 18.3 Test backward compatibility
    - Click "View & Apply" on opportunity with existing page
    - Click "View & Apply" on opportunity without page
    - Verify seamless navigation in both cases
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [~] 18.4 Verify all tests pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check (100+ iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate database operations, API endpoints, and full workflows
- The implementation uses JavaScript/Node.js with Supabase and Netlify Functions
- Database triggers use PostgreSQL functions with pg_notify for async event handling
- Cleanup scheduler uses batch processing (100 pages per batch) for performance
- Feature flags enable gradual rollout and safe deployment

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["2.7", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 5, "tasks": ["4.5", "6.1"] },
    { "id": 6, "tasks": ["6.2", "7.1", "7.2"] },
    { "id": 7, "tasks": ["7.3", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 9, "tasks": ["10.1"] },
    { "id": 10, "tasks": ["10.2", "12.1", "12.2", "12.3"] },
    { "id": 11, "tasks": ["12.4", "13.1"] },
    { "id": 12, "tasks": ["13.2", "13.3", "14.1"] },
    { "id": 13, "tasks": ["14.2", "15.1", "15.2", "15.3"] },
    { "id": 14, "tasks": ["15.4", "16.1", "16.2", "16.3"] },
    { "id": 15, "tasks": ["17.1", "17.2"] },
    { "id": 16, "tasks": ["18.1", "18.2", "18.3", "18.4"] }
  ]
}
```
