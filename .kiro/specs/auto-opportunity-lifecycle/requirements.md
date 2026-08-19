# Requirements Document

## Introduction

The Auto-Opportunity Lifecycle feature automates the creation and deletion of opportunity detail pages in the LaunchPad platform. Currently, opportunities are sourced and displayed but require manual interaction ("View & Apply" button) to create detail pages. This feature will automatically create pages when opportunities are deployed to the system and automatically remove pages for expired opportunities based on their deadlines.

## Glossary

- **Opportunity**: A scholarship, internship, competition, event, job, or other program displayed in the LaunchPad system
- **Opportunity_Page**: A dedicated detail page accessible via `/opportunities/:type/:slug/apply` that displays full information about an opportunity
- **System**: The LaunchPad backend opportunity management service
- **Opportunity_Lifecycle_Manager**: The component responsible for automatically creating and deleting opportunity pages
- **Deadline**: The application deadline timestamp associated with an opportunity
- **Deployed**: When an opportunity is added to the system (sourced from APIs or user submissions)
- **Expired**: An opportunity whose deadline has passed the current date/time
- **Slug**: A URL-friendly identifier generated from the opportunity title

## Requirements

### Requirement 1: Automatic Page Creation on Deployment

**User Story:** As a system administrator, I want opportunity pages to be created automatically when opportunities are deployed, so that users can access detailed information immediately without manual intervention.

#### Acceptance Criteria

1. WHEN an opportunity is added to lp_verified_opps, THE Opportunity_Lifecycle_Manager SHALL create a corresponding opportunity page
2. WHEN an opportunity is added to lp_opportunities_v2, THE Opportunity_Lifecycle_Manager SHALL create a corresponding opportunity page
3. WHEN an opportunity is cached in lp_tag_cache from live API results, THE Opportunity_Lifecycle_Manager SHALL create a corresponding opportunity page
4. THE Opportunity_Lifecycle_Manager SHALL generate a unique slug from the opportunity title
5. THE Opportunity_Lifecycle_Manager SHALL ensure the slug is URL-safe and unique within its category
6. WHEN a duplicate slug is detected during the creation process, THE Opportunity_Lifecycle_Manager SHALL append a numeric suffix to ensure uniqueness
7. THE Opportunity_Lifecycle_Manager SHALL store page metadata (slug, creation timestamp, opportunity ID, source table) in a tracking table

### Requirement 2: Automatic Page Deletion on Deadline Expiration

**User Story:** As a system administrator, I want expired opportunity pages to be automatically deleted, so that users only see current opportunities and storage is optimized.

#### Acceptance Criteria

1. THE System SHALL run a scheduled cleanup process at least once per day
2. WHEN the cleanup process executes, THE System SHALL identify all opportunities whose deadline has passed
3. FOR ALL expired opportunities, THE System SHALL delete the corresponding opportunity page
4. THE System SHALL remove the page metadata from the tracking table
5. IF an opportunity has no deadline specified, THEN THE System SHALL retain the page for 365 days from creation date
6. THE System SHALL log all page deletions with opportunity ID, slug, and deletion timestamp
7. WHEN a user attempts to access a deleted opportunity page, THE System SHALL return a 404 error with a helpful message indicating the opportunity has expired

### Requirement 3: Slug Generation and URL Routing

**User Story:** As a developer, I want a consistent slug generation system, so that opportunity pages have predictable and SEO-friendly URLs.

#### Acceptance Criteria

1. THE Slug_Generator SHALL convert opportunity titles to lowercase
2. THE Slug_Generator SHALL replace spaces with hyphens
3. THE Slug_Generator SHALL remove special characters except hyphens and alphanumeric characters
4. THE Slug_Generator SHALL truncate slugs to a maximum of 100 characters
5. THE Slug_Generator SHALL ensure the slug contains at least 3 characters
6. WHEN a title is too short or contains only special characters, THE Slug_Generator SHALL replace it entirely with the opportunity ID
7. THE System SHALL validate that generated slugs match the pattern `^[a-z0-9-]+$`

### Requirement 4: Page Metadata Tracking

**User Story:** As a system administrator, I want to track all auto-generated opportunity pages, so that I can monitor system behavior and debug issues.

#### Acceptance Criteria

1. THE System SHALL create a new table lp_opportunity_pages to store page metadata
2. THE lp_opportunity_pages table SHALL include columns: id, opportunity_id, source_table, slug, category, created_at, expires_at, deleted_at
3. WHEN a page is created, THE System SHALL insert a record into lp_opportunity_pages within the same transaction, and SHALL roll back the page creation if metadata insertion fails
4. WHEN a page is deleted, THE System SHALL update the deleted_at timestamp rather than removing the record
5. THE System SHALL provide an API endpoint to query page metadata by opportunity_id or slug
6. THE System SHALL index the slug column for fast lookups
7. THE System SHALL index the expires_at column for efficient cleanup queries

### Requirement 5: Backward Compatibility with Manual Navigation

**User Story:** As a user, I want the existing "View & Apply" button to continue working, so that I experience no disruption during the transition to auto-generated pages.

#### Acceptance Criteria

1. WHEN a user clicks "View & Apply" on an opportunity card, THE System SHALL check if a page already exists
2. IF a page exists, THEN THE System SHALL navigate to the existing page
3. IF a page does not exist, THEN THE System SHALL create the page immediately and then navigate to it
4. THE System SHALL ensure the navigation experience is seamless with no noticeable delay
5. THE System SHALL handle race conditions where multiple users click "View & Apply" simultaneously
6. THE System SHALL use database transactions to successfully prevent duplicate page creation

### Requirement 6: Cleanup Process Monitoring

**User Story:** As a system administrator, I want monitoring and logging for the cleanup process, so that I can ensure it runs correctly and troubleshoot failures.

#### Acceptance Criteria

1. THE Cleanup_Process SHALL log the start and end time of each execution
2. THE Cleanup_Process SHALL log the count of pages identified for deletion
3. THE Cleanup_Process SHALL log the count of pages successfully deleted
4. THE Cleanup_Process SHALL log any errors encountered during deletion
5. IF the cleanup process fails, THEN THE System SHALL retry up to 3 times with exponential backoff
6. THE Cleanup_Process SHALL send an alert notification for any failure regardless of whether errors were logged
7. THE System SHALL expose metrics for monitoring: last_cleanup_time, pages_deleted_count, cleanup_error_count

### Requirement 7: Performance and Scalability

**User Story:** As a system administrator, I want the auto-lifecycle system to handle high volumes efficiently, so that system performance remains optimal as the platform grows.

#### Acceptance Criteria

1. THE Opportunity_Lifecycle_Manager SHALL process page creation asynchronously to avoid blocking opportunity deployment
2. THE Cleanup_Process SHALL batch delete operations in groups of 100 to prevent database overload
3. THE System SHALL complete a full cleanup cycle within 5 minutes for up to 10,000 opportunities
4. THE Slug_Generator SHALL cache slug uniqueness checks for 1 hour to reduce database queries
5. THE System SHALL use database indexes to ensure page lookup queries execute in under 50ms
6. WHEN opportunity volume exceeds 50,000, THE System SHALL partition the lp_opportunity_pages table by created_at month
7. IF table partitioning fails or is delayed, THEN THE System SHALL implement fallback mechanisms to maintain performance
8. THE System SHALL archive deleted page metadata older than 90 days to a separate archive table

### Requirement 8: Edge Cases and Error Handling

**User Story:** As a developer, I want robust error handling for edge cases, so that the system remains stable and predictable.

#### Acceptance Criteria

1. WHEN an opportunity has an invalid or unparseable deadline, THE System SHALL default to a 365-day retention period
2. WHEN slug generation fails, THE System SHALL fall back to using the opportunity UUID
3. IF page creation fails, THEN THE System SHALL log the error and continue processing other opportunities
4. WHEN an opportunity is updated after page creation, THE System SHALL not create a duplicate page
5. IF an opportunity is deleted from its source table, THEN THE System SHALL delete the corresponding page immediately regardless of active user sessions
6. THE System SHALL handle missing or null opportunity titles gracefully
7. WHILE a page has active user sessions due to deadline expiration, THE System SHALL prevent deletion and delay until sessions end
