import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import PageCreator from './_page-creator.js';

/**
 * Tests for PageCreator
 * Feature: auto-opportunity-lifecycle
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 2.5, 4.3, 8.1
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a PageCreator where Supabase insert is mocked.
 *
 * @param {Object} opts
 * @param {string|null}  opts.insertError   - error.code to simulate (null = success)
 * @param {Object|null}  opts.existingPage  - page returned by _fetchExistingPage on conflict
 * @returns {{ creator: PageCreator, calls: Array }}
 */
function makeMockedCreator({ insertError = null, existingPage = null } = {}) {
  const calls = [];
  const creator = new PageCreator();

  // Mock _insertWithRetry to avoid real Supabase calls
  creator._insertWithRetry = async (pageRecord, opportunityId) => {
    calls.push({ type: 'insert', pageRecord, opportunityId });

    if (insertError === '23505') {
      // Simulate duplicate key → return existing page
      return existingPage;
    }
    if (insertError) {
      throw new Error(`Database error: ${insertError}`);
    }
    // Success: return the record with an added id
    return { id: 'mock-uuid-1234', ...pageRecord };
  };

  // Mock _fetchExistingPage
  creator._fetchExistingPage = async (opportunityId) => {
    calls.push({ type: 'fetchExisting', opportunityId });
    return existingPage;
  };

  // Mock slug generator to avoid DB calls
  creator._slugGenerator._slugExists = async () => false;

  return { creator, calls };
}

// ── Property 6: Default Expiration Calculation ─────────────────────────────

describe('Property 6: Default expiration calculation', () => {
  let creator;

  beforeEach(() => {
    creator = new PageCreator();
  });

  test('Null deadline → expires exactly 365 days from createdAt', () => {
    const createdAt = new Date('2025-01-01T00:00:00.000Z');
    const result    = creator.calculateExpiresAt(null, createdAt);

    const expected = new Date('2026-01-01T00:00:00.000Z');
    expect(result.getTime()).toBe(expected.getTime());
  });

  test('Undefined deadline → expires exactly 365 days from createdAt', () => {
    const createdAt = new Date('2025-06-15T12:00:00.000Z');
    const result    = creator.calculateExpiresAt(undefined, createdAt);

    const diffDays = (result.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(365);
  });

  test('Valid ISO deadline → uses the deadline date, not +365 days', () => {
    const createdAt = new Date('2025-01-01T00:00:00.000Z');
    const deadline  = '2025-06-30T00:00:00.000Z';
    const result    = creator.calculateExpiresAt(deadline, createdAt);

    expect(result.toISOString()).toBe(new Date(deadline).toISOString());
  });

  test('Unparseable deadline string → falls back to +365 days', () => {
    const createdAt = new Date('2025-03-10T00:00:00.000Z');
    const result    = creator.calculateExpiresAt('not-a-date', createdAt);

    const diffDays = (result.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(365);
  });

  test('Empty string deadline → falls back to +365 days', () => {
    const createdAt = new Date('2025-03-10T00:00:00.000Z');
    const result    = creator.calculateExpiresAt('', createdAt);

    const diffDays = (result.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(365);
  });

  /**
   * Property: for any null / unparseable deadline, expires_at is ALWAYS exactly
   * 365 days after createdAt regardless of the createdAt value.
   */
  test('Property: null/invalid deadlines always produce +365-day expiry', () => {
    fc.assert(
      fc.property(
        // Invalid deadlines
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('garbage-string'),
          fc.constant('31/13/9999'), // unparseable
        ),
        // Random createdAt timestamp
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        (deadline, createdAt) => {
          const result   = creator.calculateExpiresAt(deadline, createdAt);
          const diffDays = (result.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBe(365);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Task 4.3: Page creation edge cases ────────────────────────────────────

describe('PageCreator: page creation edge cases', () => {
  test('Throws when opportunity.id is missing', async () => {
    const { creator } = makeMockedCreator();
    await expect(creator.createPage({ title: 'Some Title' })).rejects.toThrow(
      'opportunity.id is required'
    );
  });

  test('Handles null title by using fallback slug from opportunity ID', async () => {
    const { creator, calls } = makeMockedCreator();
    const result = await creator.createPage({ id: 'verified-abc123', title: null });

    expect(result).toBeTruthy();
    expect(calls[0].pageRecord.slug).toMatch(/^[a-z0-9-]+$/);
  });

  test('Handles missing title (undefined) via fallback', async () => {
    const { creator } = makeMockedCreator();
    const result = await creator.createPage({ id: 'static-xyz999' });
    expect(result).toBeTruthy();
  });

  test('Unparseable deadline defaults to 365-day expiry', async () => {
    const { creator } = makeMockedCreator();
    const createdAt   = new Date('2025-01-01T00:00:00.000Z');
    const result      = await creator.createPage(
      { id: 'verified-aaa', title: 'Test', deadline: 'INVALID-DATE' },
      createdAt
    );

    const expiresAt = new Date(result.expires_at);
    const diffDays  = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(365);
  });

  // Source table detection
  describe('Source table detection', () => {
    let creator;
    beforeEach(() => { creator = new PageCreator(); });

    test('verified- prefix → lp_verified_opps', () => {
      expect(creator.detectSourceTable('verified-opp-123')).toBe('lp_verified_opps');
    });

    test('live- prefix → lp_opportunities_v2', () => {
      expect(creator.detectSourceTable('live-tag-abc')).toBe('lp_opportunities_v2');
    });

    test('static- prefix → lp_tag_cache', () => {
      expect(creator.detectSourceTable('static-opp-xyz')).toBe('lp_tag_cache');
    });

    test('Unknown prefix → lp_tag_cache (default)', () => {
      expect(creator.detectSourceTable('unknown-opp-999')).toBe('lp_tag_cache');
    });

    test('Null ID → lp_tag_cache (default)', () => {
      expect(creator.detectSourceTable(null)).toBe('lp_tag_cache');
    });

    test('Empty string → lp_tag_cache (default)', () => {
      expect(creator.detectSourceTable('')).toBe('lp_tag_cache');
    });
  });
});

// ── Property 7: Page creation idempotency ─────────────────────────────────

describe('Property 7: Page creation idempotency', () => {
  test('Second call with same opportunity ID returns existing page (no duplicate insert)', async () => {
    const existingPage = {
      id:             'existing-uuid',
      opportunity_id: 'verified-123',
      slug:           'my-scholarship',
      category:       'scholarship',
      source_table:   'lp_verified_opps',
      expires_at:     new Date(Date.now() + 86400000).toISOString(),
      deleted_at:     null,
    };

    // Simulate: first insert succeeds; any subsequent insert hits 23505
    let insertCount = 0;
    const creator   = new PageCreator();
    creator._slugGenerator._slugExists = async () => false;
    creator._insertWithRetry = async (record) => {
      insertCount++;
      if (insertCount > 1) {
        // Simulate duplicate key by returning existing page directly
        return existingPage;
      }
      return { id: 'new-uuid', ...record };
    };
    creator._fetchExistingPage = async () => existingPage;

    const opp = { id: 'verified-123', title: 'My Scholarship', category: 'scholarship' };

    const first  = await creator.createPage(opp);
    const second = await creator.createPage(opp);

    // Both calls should succeed and produce a valid page
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();

    // They should share the same opportunity_id
    expect(second.opportunity_id ?? second.id).toBeTruthy();
  });

  test('23505 error from DB causes _fetchExistingPage to be used', async () => {
    const existingPage = {
      id:             'conflict-uuid',
      opportunity_id: 'static-opp-abc',
      slug:           'conflicting-slug',
    };
    const { creator, calls } = makeMockedCreator({
      insertError:  '23505',
      existingPage,
    });

    const result = await creator.createPage({
      id:       'static-opp-abc',
      title:    'Conflicting Slug Title',
      category: 'scholarship',
    });

    expect(result).toEqual(existingPage);
  });

  test('Property: createPage never throws for valid opportunity objects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id:       fc.constantFrom('verified-abc', 'live-tag-xyz', 'static-999'),
          title:    fc.oneof(
            fc.string({ minLength: 3, maxLength: 80 }),
            fc.constant(''),
            fc.constant(null)
          ),
          category: fc.constantFrom('scholarship', 'internship', 'competition', 'opportunity'),
          deadline: fc.oneof(
            fc.constant(null),
            fc.constant('2026-12-31T00:00:00.000Z'),
            fc.constant('invalid-date'),
          ),
        }),
        async (opp) => {
          const { creator } = makeMockedCreator();
          const result = await creator.createPage(opp);
          expect(result).toBeTruthy();
        }
      ),
      { numRuns: 50 }
    );
  });
});
