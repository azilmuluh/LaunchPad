# Design Document: Auto-Opportunity Lifecycle

## Overview

The Auto-Opportunity Lifecycle feature automates the creation and deletion of opportunity detail pages in the LaunchPad platform. Currently, opportunity detail pages are created manually when users click "View & Apply" buttons. This design introduces an **Opportunity_Lifecycle_Manager** that automatically creates pages when opportunities are deployed and removes them when deadlines expire.

### Goals

1. **Automatic Page Creation**: Generate opportunity detail pages immediately when opportunities are sourced (API results, user submissions, static library)
2. **Automatic Page Deletion**: Remove expired opportunity pages based on deadlines to keep the platform current
3. **Backward Compatibility**: Maintain existing "View & Apply" button functionality during transition
4. **Performance**: Handle high-volume opportunity processing efficiently
5. **Observability**: Provide comprehensive logging and monitoring for lifecycle operations

### Non-Goals

- Modifying the opportunity sourcing or filtering logic
- Changing the opportunity card UI or feed display
- Implementing real-time notifications for expired opportunities
- Building an admin UI for manual page management (future enhancement)

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Opportunity Sources"
        A1[Live API Results<br/>SERP/Serper]
        A2[User Submissions<br/>lp_verified_opps]
        A3[Static Library<br/>lp_tag_cache]
    end
    
    subgraph "Opportunity Lifecycle Manager"
        B1[Page Creator]
        B2[Slug Generator]
        B3[Cleanup Scheduler]
    end
    
    subgraph "Storage"
        C1[(lp_opportunity_pages<br/>Tracking Table)]
        C2[(Opportunity Sources<br/>Tables)]
    end
    
    subgraph "User Interface"
        D1[Opportunity Cards<br/>View & Apply Button]
        D2[Detail Pages<br/>/opportunities/:type/:slug/apply]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    B1 --> B2
    B2 --> C1
    B1 --> C1
    B3 --> C1
    B3 --> C2
    D1 --> D2
    C1 --> D2
```

### Component Interaction Flow

**Page Creation Flow:**
1. Opportunity is added to system (API fetch, user submission, cache update)
2. Lifecycle Manager detects new opportunity
3. Slug Generator creates URL-safe slug from title
4. System checks for slug uniqueness
5. If duplicate, append numeric suffix
6. Create page metadata record in `lp_opportunity_pages`
7. Page becomes accessible via routing

**Page Deletion Flow:**
1. Cleanup Scheduler runs daily (configurable)
2. Query `lp_opportunity_pages` for expired opportunities
3. Batch delete expired pages (groups of 100)
4. Update `deleted_at` timestamp (soft delete)
5. Log deletion metrics
6. Archive records older than 90 days

### Deployment Strategy

- **Phase 1**: Deploy Lifecycle Manager with creation-only (read-only cleanup)
- **Phase 2**: Enable automated cleanup after monitoring creation for 1 week
- **Phase 3**: Optimize performance based on real-world usage patterns

## Components and Interfaces

### 1. Opportunity Lifecycle Manager

**Responsibility**: Coordinates automatic page creation and deletion operations

**Interface**:
```typescript
interface OpportunityLifecycleManager {
  // Create page for a new opportunity
  createPageForOpportunity(
    opportunity: Opportunity,
    source: 'lp_verified_opps' | 'lp_opportunities_v2' | 'lp_tag_cache'
  ): Promise<OpportunityPageMetadata>;
  
  // Check if page exists for opportunity
  pageExists(opportunityId: string): Promise<boolean>;
  
  // Get page metadata by opportunity ID or slug
  getPageMetadata(identifier: string): Promise<OpportunityPageMetadata | null>;
  
  // Run cleanup process (scheduled)
  runCleanup(): Promise<CleanupResult>;
}
```

**Implementation Notes**:
- Runs as a serverless function triggered by database events (inserts) and scheduled tasks (cleanup)
- Uses database transactions to ensure atomicity of page creation
- Implements exponential backoff retry logic for transient failures
- Publishes metrics to monitoring system

### 2. Slug Generator

**Responsibility**: Generate unique, URL-safe slugs from opportunity titles

**Interface**:
```typescript
interface SlugGenerator {
  // Generate slug from title
  generateSlug(title: string, category: string): string;
  
  // Ensure slug is unique within category
  ensureUnique(slug: string, category: string): Promise<string>;
  
  // Validate slug format
  isValidSlug(slug: string): boolean;
}
```

**Implementation Details**:
```typescript
class SlugGeneratorImpl implements SlugGenerator {
  generateSlug(title: string, category: string): string {
    // 1. Convert to lowercase
    let slug = title.toLowerCase();
    
    // 2. Replace spaces with hyphens
    slug = slug.replace(/\s+/g, '-');
    
    // 3. Remove special characters (keep alphanumeric and hyphens)
    slug = slug.replace(/[^a-z0-9-]/g, '');
    
    // 4. Remove consecutive hyphens
    slug = slug.replace(/-+/g, '-');
    
    // 5. Trim hyphens from start/end
    slug = slug.replace(/^-+|-+$/g, '');
    
    // 6. Truncate to 100 characters
    slug = slug.substring(0, 100);
    
    // 7. Ensure minimum length
    if (slug.length < 3) {
      slug = `opp-${generateShortId()}`;
    }
    
    return slug;
  }
  
  async ensureUnique(slug: string, category: string): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;
    
    while (await this.slugExists(uniqueSlug, category)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    
    return uniqueSlug;
  }
  
  isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 100;
  }
  
  private async slugExists(slug: string, category: string): Promise<boolean> {
    const { data } = await supabase
      .from('lp_opportunity_pages')
      .select('id')
      .eq('slug', slug)
      .eq('category', category)
      .is('deleted_at', null)
      .maybeSingle();
    
    return data !== null;
  }
}
```

**Validation Rules**:
- Slug must match pattern: `^[a-z0-9-]+$`
- Length: 3-100 characters
- No consecutive hyphens
- No leading/trailing hyphens

### 3. Page Creator

**Responsibility**: Create opportunity pages and metadata records

**Interface**:
```typescript
interface PageCreator {
  createPage(opportunity: Opportunity, slug: string): Promise<OpportunityPageMetadata>;
}
```

**Implementation**:
```typescript
class PageCreatorImpl implements PageCreator {
  async createPage(
    opportunity: Opportunity, 
    slug: string
  ): Promise<OpportunityPageMetadata> {
    const expiresAt = this.calculateExpiresAt(opportunity.deadline);
    
    // Use transaction to ensure atomicity
    const { data, error } = await supabase
      .from('lp_opportunity_pages')
      .insert({
        opportunity_id: opportunity.id,
        source_table: this.detectSourceTable(opportunity),
        slug,
        category: opportunity.category || 'opportunity',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Duplicate key
        throw new DuplicateSlugError(slug);
      }
      throw new PageCreationError(error.message);
    }
    
    // Log creation event
    await this.logEvent('page_created', {
      opportunity_id: opportunity.id,
      slug,
      category: opportunity.category,
    });
    
    return data;
  }
  
  private calculateExpiresAt(deadline: string | null): string {
    if (!deadline) {
      // Default: 365 days from now
      const date = new Date();
      date.setDate(date.getDate() + 365);
      return date.toISOString();
    }
    
    try {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        // Invalid deadline, use default
        const date = new Date();
        date.setDate(date.getDate() + 365);
        return date.toISOString();
      }
      return deadlineDate.toISOString();
    } catch {
      // Parse error, use default
      const date = new Date();
      date.setDate(date.getDate() + 365);
      return date.toISOString();
    }
  }
  
  private detectSourceTable(opportunity: Opportunity): string {
    if (opportunity.id.startsWith('verified-')) return 'lp_verified_opps';
    if (opportunity.id.startsWith('live-')) return 'lp_tag_cache';
    if (opportunity.id.startsWith('static-')) return 'lp_tag_cache';
    return 'lp_opportunities_v2';
  }
}
```

### 4. Cleanup Scheduler

**Responsibility**: Identify and delete expired opportunity pages

**Interface**:
```typescript
interface CleanupScheduler {
  run(): Promise<CleanupResult>;
}

interface CleanupResult {
  startTime: string;
  endTime: string;
  pagesIdentified: number;
  pagesDeleted: number;
  errors: CleanupError[];
}
```

**Implementation**:
```typescript
class CleanupSchedulerImpl implements CleanupScheduler {
  private readonly BATCH_SIZE = 100;
  private readonly MAX_RETRIES = 3;
  
  async run(): Promise<CleanupResult> {
    const startTime = new Date().toISOString();
    const result: CleanupResult = {
      startTime,
      endTime: '',
      pagesIdentified: 0,
      pagesDeleted: 0,
      errors: [],
    };
    
    try {
      // Query expired pages
      const expiredPages = await this.fetchExpiredPages();
      result.pagesIdentified = expiredPages.length;
      
      // Process in batches
      const batches = this.createBatches(expiredPages, this.BATCH_SIZE);
      
      for (const batch of batches) {
        try {
          await this.deleteBatch(batch);
          result.pagesDeleted += batch.length;
        } catch (error) {
          result.errors.push({
            batch: batch.map(p => p.id),
            error: error.message,
          });
          
          // Retry individual items
          for (const page of batch) {
            try {
              await this.deletePageWithRetry(page);
              result.pagesDeleted++;
            } catch (retryError) {
              result.errors.push({
                pageId: page.id,
                error: retryError.message,
              });
            }
          }
        }
      }
      
      // Archive old deleted pages (> 90 days)
      await this.archiveDeletedPages();
      
    } catch (error) {
      result.errors.push({
        phase: 'cleanup_execution',
        error: error.message,
      });
    }
    
    result.endTime = new Date().toISOString();
    
    // Log metrics
    await this.logMetrics(result);
    
    // Send alerts if errors occurred
    if (result.errors.length > 0) {
      await this.sendAlert(result);
    }
    
    return result;
  }
  
  private async fetchExpiredPages(): Promise<OpportunityPageMetadata[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('lp_opportunity_pages')
      .select('*')
      .is('deleted_at', null)
      .lte('expires_at', now)
      .order('expires_at', { ascending: true });
    
    if (error) throw new Error(`Failed to fetch expired pages: ${error.message}`);
    
    return data || [];
  }
  
  private async deleteBatch(pages: OpportunityPageMetadata[]): Promise<void> {
    const ids = pages.map(p => p.id);
    
    const { error } = await supabase
      .from('lp_opportunity_pages')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);
    
    if (error) throw new Error(`Batch delete failed: ${error.message}`);
    
    // Log deletions
    for (const page of pages) {
      await this.logEvent('page_deleted', {
        opportunity_id: page.opportunity_id,
        slug: page.slug,
        expires_at: page.expires_at,
      });
    }
  }
  
  private async deletePageWithRetry(
    page: OpportunityPageMetadata
  ): Promise<void> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await supabase
          .from('lp_opportunity_pages')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', page.id);
        
        return;
      } catch (error) {
        if (attempt === this.MAX_RETRIES) throw error;
        
        // Exponential backoff: 2^attempt seconds
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  private async archiveDeletedPages(): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Move to archive table
    await supabase.rpc('archive_old_deleted_pages', {
      cutoff_date: ninetyDaysAgo.toISOString()
    });
  }
}
```

### 5. API Endpoints

**GET /api/opportunities/:id/page**
- Check if page exists for opportunity
- Return page metadata if exists

**POST /api/opportunities/:id/page**
- Create page for opportunity (backward compatibility with "View & Apply")
- Idempotent: returns existing page if already created

**GET /api/opportunities/pages/stats**
- Return metrics: total pages, active pages, deleted pages, cleanup stats

## Data Models

### New Table: lp_opportunity_pages

```sql
CREATE TABLE lp_opportunity_pages (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id TEXT        NOT NULL,
  source_table   TEXT        NOT NULL CHECK (source_table IN ('lp_verified_opps', 'lp_opportunities_v2', 'lp_tag_cache')),
  slug           TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT 'opportunity',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,
  deleted_at     TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT unique_active_slug UNIQUE (category, slug) WHERE deleted_at IS NULL,
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) >= 3 AND length(slug) <= 100)
);

CREATE INDEX idx_opp_pages_slug ON lp_opportunity_pages(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_opp_pages_expires ON lp_opportunity_pages(expires_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_opp_pages_opportunity ON lp_opportunity_pages(opportunity_id);
CREATE INDEX idx_opp_pages_deleted ON lp_opportunity_pages(deleted_at) WHERE deleted_at IS NOT NULL;
```

**Field Descriptions**:
- `id`: Primary key
- `opportunity_id`: Reference to opportunity (string since IDs come from multiple sources with different formats)
- `source_table`: Which table the opportunity originates from
- `slug`: URL-safe identifier for the opportunity
- `category`: Opportunity category (scholarship, internship, competition, event, job)
- `created_at`: When the page was created
- `expires_at`: When the page should be deleted
- `deleted_at`: Soft delete timestamp (NULL for active pages)

### Archive Table: lp_opportunity_pages_archive

```sql
CREATE TABLE lp_opportunity_pages_archive (
  LIKE lp_opportunity_pages INCLUDING ALL
);

-- Partition by month for efficient querying
CREATE TABLE lp_opportunity_pages_archive_y2025m01 
  PARTITION OF lp_opportunity_pages_archive
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Stored Procedure: archive_old_deleted_pages

```sql
CREATE OR REPLACE FUNCTION archive_old_deleted_pages(cutoff_date TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
  rows_archived INTEGER;
BEGIN
  -- Move old deleted pages to archive
  WITH moved AS (
    INSERT INTO lp_opportunity_pages_archive
    SELECT * FROM lp_opportunity_pages
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
```

### TypeScript Types

```typescript
interface Opportunity {
  id: string;
  title: string;
  category: string;
  deadline?: string | null;
  link: string;
  snippet?: string;
  description?: string;
  source?: string;
  tag?: string;
  eligibility?: string;
  benefits?: string;
  location?: string;
  verified?: boolean;
}

interface OpportunityPageMetadata {
  id: string;
  opportunity_id: string;
  source_table: 'lp_verified_opps' | 'lp_opportunities_v2' | 'lp_tag_cache';
  slug: string;
  category: string;
  created_at: string;
  expires_at: string;
  deleted_at: string | null;
}

interface CleanupError {
  batch?: string[];
  pageId?: string;
  phase?: string;
  error: string;
}
```

## Implementation Approach

### Phase 1: Database Setup

1. Create `lp_opportunity_pages` table with indexes
2. Create `lp_opportunity_pages_archive` table with partitioning
3. Deploy `archive_old_deleted_pages` stored procedure
4. Add monitoring views for observability

### Phase 2: Slug Generator Implementation

1. Implement `SlugGenerator` class
2. Add unit tests for slug generation rules
3. Add property tests for uniqueness guarantees
4. Deploy as standalone module

### Phase 3: Page Creator Implementation

1. Implement `PageCreator` class
2. Add transaction handling
3. Add error handling and retry logic
4. Deploy as serverless function

### Phase 4: Lifecycle Manager Integration

1. Implement `OpportunityLifecycleManager`
2. Add database triggers for automatic page creation
3. Add API endpoints for manual operations
4. Deploy with feature flag (disabled by default)

### Phase 5: Cleanup Scheduler Implementation

1. Implement `CleanupScheduler` class
2. Add batch processing logic
3. Add monitoring and alerting
4. Deploy as scheduled job (read-only mode)

### Phase 6: Backward Compatibility

1. Update "View & Apply" button handler
2. Add page existence check
3. Add fallback to immediate creation
4. Deploy UI changes

### Phase 7: Monitoring & Optimization

1. Enable cleanup scheduler (write mode)
2. Monitor creation and deletion metrics
3. Optimize performance based on real-world usage
4. Enable automatic lifecycle (feature flag on)

### Database Triggers

**Trigger for lp_verified_opps inserts:**
```sql
CREATE OR REPLACE FUNCTION trigger_create_page_for_verified_opp()
RETURNS TRIGGER AS $$
BEGIN
  -- Call serverless function asynchronously
  PERFORM pg_notify('create_opportunity_page', json_build_object(
    'opportunity_id', NEW.id,
    'source_table', 'lp_verified_opps',
    'title', NEW.title,
    'category', NEW.category,
    'deadline', NEW.deadline
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_verified_opp
  AFTER INSERT ON lp_verified_opps
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_page_for_verified_opp();
```

**Trigger for lp_opportunities_v2 inserts:**
```sql
CREATE OR REPLACE FUNCTION trigger_create_page_for_opp_v2()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('create_opportunity_page', json_build_object(
    'opportunity_id', NEW.id,
    'source_table', 'lp_opportunities_v2',
    'title', NEW.title,
    'category', NEW.program_type,
    'deadline', NEW.deadline
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_opp_v2
  AFTER INSERT ON lp_opportunities_v2
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_page_for_opp_v2();
```

### Scheduled Job Configuration

**Netlify scheduled function (netlify/functions/cleanup-opportunity-pages.js):**
```javascript
// Runs daily at 2 AM UTC
export const handler = async (event, context) => {
  const cleanupScheduler = new CleanupSchedulerImpl();
  
  try {
    const result = await cleanupScheduler.run();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        result,
      }),
    };
  } catch (error) {
    console.error('Cleanup failed:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
```

**netlify.toml configuration:**
```toml
[functions."cleanup-opportunity-pages"]
  schedule = "0 2 * * *"  # Daily at 2 AM UTC
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property-Based Testing Applicability

This feature has a **mixed applicability** for property-based testing:

**Suitable for PBT:**
- Slug generation logic (pure string transformations)
- Default expiration calculations (pure date logic)
- Uniqueness guarantees (deterministic with varying inputs)
- Idempotency properties (repeated operations)

**NOT suitable for PBT:**
- Database triggers and integrations (infrastructure wiring)
- Scheduled job configuration (one-time setup)
- Logging and monitoring (infrastructure behavior)
- API endpoint integration (better tested with example-based integration tests)
- Archival and cleanup batching (specific infrastructure operations)

For this feature, we will implement **property-based tests for slug generation and business logic**, and **example-based integration tests** for database operations, API endpoints, and infrastructure components.

### Property 1: Slug Character Transformation

*For any* opportunity title, the generated slug SHALL contain only lowercase alphanumeric characters and hyphens, with spaces converted to hyphens and all other special characters removed.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 2: Slug Length Boundaries

*For any* opportunity title, the generated slug SHALL be at least 3 characters and at most 100 characters in length.

**Validates: Requirements 3.4, 3.5**

### Property 3: Slug Pattern Validity

*For any* generated slug, it SHALL match the pattern `^[a-z0-9-]+$` with no consecutive hyphens and no leading or trailing hyphens.

**Validates: Requirements 3.7**

### Property 4: Fallback Slug for Invalid Titles

*For any* opportunity title that is empty, contains only special characters, or produces a slug shorter than 3 characters after transformation, the system SHALL generate a fallback slug using the opportunity ID.

**Validates: Requirements 3.6, 8.6**

### Property 5: Slug Uniqueness with Numeric Suffixes

*For any* set of opportunities with identical titles within the same category, each SHALL receive a unique slug by appending sequential numeric suffixes (slug, slug-1, slug-2, ...).

**Validates: Requirements 1.5, 1.6**

### Property 6: Default Expiration Calculation

*For any* opportunity with a missing, null, or unparseable deadline, the system SHALL calculate expires_at as exactly 365 days from the page creation timestamp.

**Validates: Requirements 2.5, 8.1**

### Property 7: Page Creation Idempotency

*For any* opportunity, multiple page creation attempts SHALL result in exactly one page record, with subsequent attempts either returning the existing page or being rejected by uniqueness constraints.

**Validates: Requirements 5.5, 8.4**

## Error Handling

### Error Categories

**1. Slug Generation Errors**
- **Invalid Title**: Title is null, empty, or contains only special characters
- **Handler**: Use fallback slug generation with opportunity ID
- **Logging**: Log warning with original title and generated fallback

**2. Database Errors**
- **Duplicate Key**: Slug already exists in category
- **Handler**: Retry with incremented numeric suffix (up to 10 attempts)
- **Rollback**: Transaction ensures no partial page creation
- **Logging**: Log conflict and resolution

**3. Transaction Failures**
- **Handler**: Automatic rollback via database transaction
- **Retry**: Use exponential backoff (3 attempts)
- **Alerting**: Send alert if all retries fail

**4. Cleanup Errors**
- **Batch Failure**: If batch delete fails, retry individual items
- **Individual Failure**: Log error and continue with remaining items
- **Alert Threshold**: Send alert if error rate exceeds 5%

**5. Deadline Parsing Errors**
- **Invalid Format**: Deadline string cannot be parsed as date
- **Handler**: Default to 365-day retention period
- **Logging**: Log warning with original deadline string

### Error Recovery

```typescript
class ErrorRecovery {
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        
        const delayMs = Math.pow(2, attempt) * 1000;
        await this.sleep(delayMs);
      }
    }
    
    throw new Error('Max retry attempts exceeded');
  }
  
  async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    breakerKey: string
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(breakerKey);
    
    if (breaker?.isOpen()) {
      throw new Error(`Circuit breaker open for ${breakerKey}`);
    }
    
    try {
      const result = await operation();
      breaker?.recordSuccess();
      return result;
    } catch (error) {
      breaker?.recordFailure();
      throw error;
    }
  }
}
```

### Graceful Degradation

- **API Unavailable**: Return cached data if available, otherwise return empty results
- **Database Slow**: Implement query timeout (5 seconds), return partial results
- **Cleanup Failure**: Continue with remaining batches, log failures for manual review
- **Trigger Disabled**: Fall back to manual page creation via "View & Apply" button

## Testing Strategy

### Dual Testing Approach

This feature requires both **property-based tests** and **example-based integration tests** for comprehensive coverage:

**Property-Based Tests** (100+ iterations each):
- Slug generation transformation rules
- Slug uniqueness guarantees
- Default expiration calculation
- Idempotency properties

**Example-Based Unit Tests**:
- Specific slug generation examples (edge cases)
- Error handling scenarios
- Fallback behavior
- Deadline parsing edge cases

**Integration Tests**:
- Database trigger functionality
- Transaction atomicity
- API endpoint behavior
- Cleanup scheduler execution
- Cache operations

**Performance Tests**:
- Cleanup process completes within time limit (10,000 opps in 5 minutes)
- Page lookup queries execute in under 50ms
- Slug uniqueness cache reduces database queries

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing)

**Configuration**:
```typescript
import fc from 'fast-check';

// Property test configuration
const propertyTestConfig = {
  numRuns: 100,  // Minimum iterations per property
  timeout: 10000, // 10 second timeout per property
  verbose: true,
};
```

**Test Tagging Convention**:
```typescript
/**
 * Feature: auto-opportunity-lifecycle, Property 1: Slug Character Transformation
 * 
 * For any opportunity title, the generated slug SHALL contain only 
 * lowercase alphanumeric characters and hyphens, with spaces converted 
 * to hyphens and all other special characters removed.
 */
test('Property 1: Slug character transformation', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 200 }),
      (title) => {
        const slug = slugGenerator.generateSlug(title, 'scholarship');
        
        // Verify only valid characters
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        
        // Verify lowercase
        expect(slug).toBe(slug.toLowerCase());
        
        // Verify no consecutive hyphens
        expect(slug).not.toMatch(/--+/);
        
        // Verify no leading/trailing hyphens
        expect(slug).not.toMatch(/^-|-$/);
      }
    ),
    propertyTestConfig
  );
});
```

### Test Coverage Requirements

- **Property Tests**: 7 properties, 100 iterations each = 700 test cases
- **Unit Tests**: 25+ examples covering edge cases and error scenarios
- **Integration Tests**: 30+ tests covering database, API, and infrastructure
- **Performance Tests**: 5 tests covering key performance requirements

**Total**: 760+ automated test cases

### Continuous Integration

- Run property tests on every commit
- Run integration tests on every pull request
- Run performance tests weekly and before releases
- Monitor test execution time (target: < 2 minutes for full suite)

### Test Data Generators

**Opportunity Title Generator**:
```typescript
const opportunityTitleArbitrary = fc.oneof(
  fc.string({ minLength: 1, maxLength: 200 }), // Random strings
  fc.constantFrom( // Realistic examples
    'Fully Funded Scholarship to Study in Germany 2025',
    'Google Summer of Code Internship',
    'MIT Innovation Challenge - $10,000 Prize',
    'African Youth Leadership Summit 2025',
  ),
  fc.string({ minLength: 0, maxLength: 5 }), // Edge case: very short
  fc.constant('!!!@@@###'), // Edge case: only special chars
  fc.constant(''), // Edge case: empty
);
```

**Deadline Generator**:
```typescript
const deadlineArbitrary = fc.oneof(
  fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  fc.constantFrom(
    'December 31, 2025',
    '12/31/2025',
    '2025-12-31',
    'invalid-date',
    '',
    null
  )
);
```

### Mock Strategy

- **Database**: Use test database with same schema as production
- **External APIs**: Mock SERP/Serper API responses
- **Time**: Mock date functions for deterministic expiration testing
- **Notifications**: Mock alert/notification services

### Acceptance Testing

Each requirement will have at least one acceptance test that validates the end-to-end behavior from a user perspective:

1. **Create Opportunity → Page Exists**: Submit opportunity, verify page accessible
2. **Deadline Expires → Page Deleted**: Create opportunity with past deadline, run cleanup, verify 404
3. **View & Apply → Navigate**: Click button, verify navigation to correct page
4. **Duplicate Title → Unique Slugs**: Create multiple opportunities with same title, verify unique URLs

## Implementation Risks and Mitigation

### Risk 1: Database Performance Degradation

**Risk**: High-volume page creation could overload database

**Mitigation**:
- Implement async page creation (non-blocking)
- Add database connection pooling
- Monitor query performance
- Add table partitioning at 50,000 records

**Monitoring**: Track page creation latency (target: P99 < 500ms)

### Risk 2: Slug Collision Rate

**Risk**: High collision rate for popular titles could cause performance issues

**Mitigation**:
- Cache slug uniqueness checks (1 hour TTL)
- Limit numeric suffix attempts to 10
- Fall back to UUID-based slugs after 10 attempts

**Monitoring**: Track collision rate (target: < 1% of creations)

### Risk 3: Cleanup Process Failure

**Risk**: Cleanup failures could accumulate expired pages

**Monitoring**: Alert if cleanup fails 2 consecutive times
**Fallback**: Manual cleanup script for emergency use

### Risk 4: Race Conditions in "View & Apply"

**Risk**: Multiple users clicking simultaneously could create duplicate pages

**Mitigation**:
- Use database uniqueness constraints
- Implement idempotent page creation API
- Handle duplicate key errors gracefully

**Testing**: Load test with concurrent requests

### Risk 5: Migration from Manual to Automatic

**Risk**: Users disrupted by workflow changes

**Mitigation**:
- Maintain backward compatibility with manual creation
- Feature flag to enable/disable automatic lifecycle
- Gradual rollout (10% → 50% → 100%)

**Rollback**: Keep manual creation code path active for 3 months

## Deployment and Rollout Plan

### Phase 1: Infrastructure Setup (Week 1)
- Create database tables and indexes
- Deploy stored procedures
- Set up monitoring dashboards

**Validation**: Run smoke tests, verify schema

### Phase 2: Slug Generator (Week 2)
- Deploy slug generation logic
- Enable property tests in CI
- Run performance benchmarks

**Validation**: 100% property tests passing, P99 < 10ms

### Phase 3: Page Creator (Week 3)
- Deploy page creation logic
- Enable database triggers (read-only mode)
- Monitor creation metrics

**Validation**: Pages created successfully, no errors

### Phase 4: Cleanup Scheduler (Week 4)
- Deploy cleanup logic
- Run cleanup in dry-run mode (logs only)
- Verify expired page identification

**Validation**: Cleanup identifies correct pages, no false positives

### Phase 5: Backward Compatibility (Week 5)
- Update "View & Apply" button handler
- Enable fallback to manual creation
- Deploy to 10% of users

**Validation**: Both manual and automatic creation work

### Phase 6: Full Rollout (Week 6)
- Enable automatic lifecycle for all users
- Enable cleanup write mode
- Monitor system behavior

**Validation**: No increase in error rate, performance targets met

### Phase 7: Optimization (Week 7-8)
- Optimize based on real-world usage
- Add caching where beneficial
- Tune cleanup schedule

**Validation**: Performance improvements, reduced database load

## Monitoring and Observability

### Key Metrics

**Page Creation**:
- `pages_created_total`: Total pages created (counter)
- `page_creation_duration_ms`: Time to create page (histogram)
- `page_creation_errors_total`: Failed creation attempts (counter)
- `slug_collisions_total`: Slug uniqueness conflicts (counter)

**Cleanup**:
- `cleanup_last_run_timestamp`: Last successful cleanup (gauge)
- `cleanup_pages_identified`: Pages identified for deletion (gauge)
- `cleanup_pages_deleted`: Pages successfully deleted (gauge)
- `cleanup_errors_total`: Cleanup failures (counter)
- `cleanup_duration_seconds`: Cleanup execution time (histogram)

**Performance**:
- `page_lookup_duration_ms`: Page metadata query time (histogram)
- `slug_cache_hit_rate`: Percentage of cache hits (gauge)
- `database_connection_pool_usage`: Active connections (gauge)

### Alerts

**Critical**:
- Cleanup fails 2 consecutive times
- Page creation error rate > 5%
- Database connection pool exhausted

**Warning**:
- Cleanup duration > 5 minutes
- Slug collision rate > 1%
- Page lookup P99 > 100ms

### Dashboards

**Lifecycle Dashboard**:
- Pages created per day (time series)
- Pages deleted per day (time series)
- Active pages (gauge)
- Error rate (time series)

**Performance Dashboard**:
- Page creation latency (P50, P95, P99)
- Page lookup latency (P50, P95, P99)
- Database query count
- Cache hit rate

### Logging

**Structured Logs** (JSON format):
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "info",
  "event": "page_created",
  "opportunity_id": "verified-123",
  "slug": "google-summer-of-code-2025",
  "category": "internship",
  "source_table": "lp_verified_opps",
  "duration_ms": 45
}
```

**Log Retention**: 30 days for info, 90 days for errors

## Future Enhancements

1. **Admin Dashboard**: Web UI for viewing and managing auto-generated pages
2. **Smart Expiration**: ML-based deadline prediction for opportunities without explicit deadlines
3. **Page Versioning**: Track changes to opportunity details over time
4. **Bulk Operations**: API for bulk page creation/deletion
5. **Analytics**: Track which opportunities get the most page views
6. **SEO Optimization**: Auto-generate meta tags and structured data for pages
7. **Internationalization**: Support for non-English titles in slug generation
8. **Custom Slugs**: Allow users to override auto-generated slugs
9. **Page Templates**: Different page layouts for different opportunity types
10. **A/B Testing**: Test different page layouts and track conversion rates

## Appendix A: Database Schema Details

### Full Table Definition

```sql
CREATE TABLE lp_opportunity_pages (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id TEXT        NOT NULL,
  source_table   TEXT        NOT NULL 
                             CHECK (source_table IN ('lp_verified_opps', 'lp_opportunities_v2', 'lp_tag_cache')),
  slug           TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT 'opportunity',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,
  deleted_at     TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_active_slug 
    UNIQUE (category, slug) 
    WHERE deleted_at IS NULL,
  
  CONSTRAINT valid_slug 
    CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) >= 3 AND length(slug) <= 100),
  
  CONSTRAINT valid_expiration
    CHECK (expires_at > created_at),
  
  CONSTRAINT soft_delete_consistency
    CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

-- Indexes
CREATE INDEX idx_opp_pages_slug 
  ON lp_opportunity_pages(slug) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_opp_pages_expires 
  ON lp_opportunity_pages(expires_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_opp_pages_opportunity 
  ON lp_opportunity_pages(opportunity_id);

CREATE INDEX idx_opp_pages_deleted 
  ON lp_opportunity_pages(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_opp_pages_source 
  ON lp_opportunity_pages(source_table, opportunity_id);

-- Partial index for cleanup queries
CREATE INDEX idx_opp_pages_expired 
  ON lp_opportunity_pages(expires_at, category) 
  WHERE deleted_at IS NULL AND expires_at < NOW();
```

### Archive Table with Partitioning

```sql
CREATE TABLE lp_opportunity_pages_archive (
  LIKE lp_opportunity_pages INCLUDING ALL
) PARTITION BY RANGE (deleted_at);

-- Create monthly partitions (example for 2025)
CREATE TABLE lp_opportunity_pages_archive_2025_01 
  PARTITION OF lp_opportunity_pages_archive
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE lp_opportunity_pages_archive_2025_02 
  PARTITION OF lp_opportunity_pages_archive
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ... continue for all months

-- Automatic partition creation function
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS TRIGGER AS $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  partition_date := DATE_TRUNC('month', NEW.deleted_at);
  partition_name := 'lp_opportunity_pages_archive_' || TO_CHAR(partition_date, 'YYYY_MM');
  start_date := TO_CHAR(partition_date, 'YYYY-MM-DD');
  end_date := TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
  
  -- Create partition if it doesn't exist
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF lp_opportunity_pages_archive FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_partition
  BEFORE INSERT ON lp_opportunity_pages_archive
  FOR EACH ROW
  EXECUTE FUNCTION create_monthly_partition();
```

## Appendix B: API Specification

### Endpoint: GET /api/opportunities/:id/page

**Description**: Check if page exists for opportunity and return metadata

**Request**:
```
GET /api/opportunities/verified-123/page
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "exists": true,
  "page": {
    "id": "a1b2c3d4-...",
    "opportunity_id": "verified-123",
    "slug": "google-summer-of-code-2025",
    "category": "internship",
    "url": "/opportunities/internship/google-summer-of-code-2025/apply",
    "created_at": "2025-01-15T10:30:00Z",
    "expires_at": "2025-06-30T23:59:59Z"
  }
}
```

**Response (404 Not Found)**:
```json
{
  "exists": false,
  "message": "Page not found for this opportunity"
}
```

### Endpoint: POST /api/opportunities/:id/page

**Description**: Create page for opportunity (idempotent)

**Request**:
```
POST /api/opportunities/verified-123/page
Authorization: Bearer <token>
Content-Type: application/json

{
  "opportunity": {
    "id": "verified-123",
    "title": "Google Summer of Code 2025",
    "category": "internship",
    "deadline": "2025-06-30"
  }
}
```

**Response (201 Created / 200 OK)**:
```json
{
  "created": true,
  "page": {
    "id": "a1b2c3d4-...",
    "opportunity_id": "verified-123",
    "slug": "google-summer-of-code-2025",
    "category": "internship",
    "url": "/opportunities/internship/google-summer-of-code-2025/apply",
    "created_at": "2025-01-15T10:30:00Z",
    "expires_at": "2025-06-30T23:59:59Z"
  }
}
```

### Endpoint: GET /api/opportunities/pages/stats

**Description**: Get lifecycle statistics

**Request**:
```
GET /api/opportunities/pages/stats
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "total_pages": 5432,
  "active_pages": 4890,
  "deleted_pages": 542,
  "last_cleanup": "2025-01-15T02:00:00Z",
  "next_cleanup": "2025-01-16T02:00:00Z",
  "cleanup_stats": {
    "pages_deleted_today": 23,
    "pages_deleted_this_week": 156,
    "average_page_lifetime_days": 45
  },
  "performance": {
    "avg_creation_time_ms": 42,
    "avg_lookup_time_ms": 8,
    "slug_collision_rate": 0.003
  }
}
```

## Appendix C: Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/launchpad
DATABASE_POOL_SIZE=20
DATABASE_QUERY_TIMEOUT_MS=5000

# Lifecycle Manager
LIFECYCLE_ENABLED=true
LIFECYCLE_ASYNC_CREATION=true
LIFECYCLE_CLEANUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM UTC
LIFECYCLE_CLEANUP_BATCH_SIZE=100
LIFECYCLE_SLUG_CACHE_TTL_HOURS=1

# Monitoring
MONITORING_ENABLED=true
MONITORING_LOG_LEVEL=info
ALERT_EMAIL=ops@launchpad.com
ALERT_SLACK_WEBHOOK=https://hooks.slack.com/...

# Feature Flags
FF_AUTO_PAGE_CREATION=true
FF_AUTO_PAGE_DELETION=true
FF_SLUG_CACHE=true
```

### Feature Flags

```typescript
const featureFlags = {
  autoPageCreation: process.env.FF_AUTO_PAGE_CREATION === 'true',
  autoPageDeletion: process.env.FF_AUTO_PAGE_DELETION === 'true',
  slugCache: process.env.FF_SLUG_CACHE === 'true',
};

// Usage
if (featureFlags.autoPageCreation) {
  await lifecycleManager.createPageForOpportunity(opportunity, source);
} else {
  // Fall back to manual creation
  logger.info('Auto page creation disabled, using manual flow');
}
```
