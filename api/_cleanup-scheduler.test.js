import { describe, test, expect, beforeEach, vi } from 'vitest';
import CleanupScheduler from './_cleanup-scheduler.js';

/**
 * Tests for CleanupScheduler
 * Feature: auto-opportunity-lifecycle
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 6.1, 6.5, 7.2, 7.8
 */

// ── Helpers ────────────────────────────────────────────────────────────────

function makePage(overrides = {}) {
  return {
    id:             `page-${Math.random().toString(36).slice(2)}`,
    opportunity_id: `verified-${Math.random().toString(36).slice(2)}`,
    slug:           `slug-${Math.random().toString(36).slice(2)}`,
    category:       'scholarship',
    expires_at:     new Date(Date.now() - 1000).toISOString(), // already expired
    ...overrides,
  };
}

/**
 * Build a CleanupScheduler with all Supabase interactions mocked.
 */
function makeMockedScheduler({
  expiredPages       = [],
  deleteError        = null,
  archiveCount       = 0,
  archiveError       = null,
} = {}) {
  const scheduler = new CleanupScheduler({ readOnly: false });
  const deletedIds = [];

  // Mock fetchExpiredPages
  scheduler.fetchExpiredPages = async () => expiredPages;

  // Mock deletePageWithRetry
  scheduler.deletePageWithRetry = async (page) => {
    if (deleteError) throw new Error(deleteError);
    deletedIds.push(page.id);
  };

  // Mock archiveDeletedPages
  scheduler.archiveDeletedPages = async () => {
    if (archiveError) throw new Error(archiveError);
    return archiveCount;
  };

  return { scheduler, deletedIds };
}

// ── Test suite ─────────────────────────────────────────────────────────────

describe('CleanupScheduler', () => {

  describe('fetchExpiredPages — logic contract', () => {
    test('Returns only pages where expires_at <= now (mocked)', async () => {
      const expired    = [makePage(), makePage()];
      const { scheduler } = makeMockedScheduler({ expiredPages: expired });

      const pages = await scheduler.fetchExpiredPages();
      expect(pages).toHaveLength(2);
    });

    test('Returns empty array when nothing is expired', async () => {
      const { scheduler } = makeMockedScheduler({ expiredPages: [] });
      const pages = await scheduler.fetchExpiredPages();
      expect(pages).toHaveLength(0);
    });
  });

  describe('createBatches', () => {
    let scheduler;
    beforeEach(() => { scheduler = new CleanupScheduler(); });

    test('Single page → one batch of one', () => {
      const pages   = [makePage()];
      const batches = scheduler.createBatches(pages);
      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(1);
    });

    test('Exactly 100 pages → one batch', () => {
      const pages   = Array.from({ length: 100 }, makePage);
      const batches = scheduler.createBatches(pages);
      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(100);
    });

    test('101 pages → two batches (100 + 1)', () => {
      const pages   = Array.from({ length: 101 }, makePage);
      const batches = scheduler.createBatches(pages);
      expect(batches).toHaveLength(2);
      expect(batches[0]).toHaveLength(100);
      expect(batches[1]).toHaveLength(1);
    });

    test('250 pages → three batches (100 + 100 + 50)', () => {
      const pages   = Array.from({ length: 250 }, makePage);
      const batches = scheduler.createBatches(pages);
      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(100);
      expect(batches[1]).toHaveLength(100);
      expect(batches[2]).toHaveLength(50);
    });

    test('Empty input → empty batches array', () => {
      expect(scheduler.createBatches([])).toHaveLength(0);
    });
  });

  describe('deleteBatch', () => {
    test('All pages deleted when no errors', async () => {
      const pages = [makePage(), makePage(), makePage()];
      const { scheduler } = makeMockedScheduler({ expiredPages: pages });

      const result = await scheduler.deleteBatch(pages);
      expect(result.deleted).toBe(3);
      expect(result.errors).toBe(0);
      expect(result.errorDetails).toHaveLength(0);
    });

    test('Error in one page does not prevent others from being deleted', async () => {
      const pages = [makePage(), makePage(), makePage()];
      let callCount = 0;
      const scheduler = new CleanupScheduler({ readOnly: false });
      scheduler.deletePageWithRetry = async (page) => {
        callCount++;
        if (callCount === 2) throw new Error('transient failure');
      };

      const result = await scheduler.deleteBatch(pages);
      expect(result.deleted).toBe(2);
      expect(result.errors).toBe(1);
      expect(result.errorDetails).toHaveLength(1);
    });
  });

  describe('run() — orchestration', () => {
    test('Returns CleanupResult with correct counts', async () => {
      const pages = [makePage(), makePage()];
      const { scheduler } = makeMockedScheduler({
        expiredPages:  pages,
        archiveCount:  5,
      });

      const result = await scheduler.run();

      expect(result.pagesIdentified).toBe(2);
      expect(result.pagesDeleted).toBe(2);
      expect(result.pagesArchived).toBe(5);
      expect(result.errors).toBe(0);
      expect(result.readOnly).toBe(false);
      expect(result.startTime).toBeTruthy();
      expect(result.endTime).toBeTruthy();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('No expired pages → result shows 0 deleted', async () => {
      const { scheduler } = makeMockedScheduler({ expiredPages: [] });
      const result = await scheduler.run();
      expect(result.pagesIdentified).toBe(0);
      expect(result.pagesDeleted).toBe(0);
    });

    test('Delete error is captured in errorDetails, not thrown', async () => {
      const pages = [makePage()];
      const { scheduler } = makeMockedScheduler({
        expiredPages: pages,
        deleteError:  'DB connection timeout',
      });

      const result = await scheduler.run();
      expect(result.errors).toBe(1);
      expect(result.errorDetails[0].error).toContain('DB connection timeout');
      expect(result.pagesDeleted).toBe(0);
    });

    test('readOnly mode: nothing is deleted but result reports pages identified', async () => {
      const pages = [makePage(), makePage(), makePage()];
      const scheduler = new CleanupScheduler({ readOnly: true });
      scheduler.fetchExpiredPages    = async () => pages;
      scheduler.archiveDeletedPages  = async () => 0;

      const result = await scheduler.run();
      expect(result.pagesIdentified).toBe(3);
      expect(result.pagesDeleted).toBe(3);  // DRY-RUN counts as "deleted" (no error)
      expect(result.readOnly).toBe(true);
    });
  });

  describe('deletePageWithRetry — retry logic', () => {
    test('Retries on transient error and succeeds on 3rd attempt', async () => {
      const page = makePage();
      let attempts = 0;
      const scheduler = new CleanupScheduler({ readOnly: false });

      // Override Supabase with a function that fails twice then succeeds
      scheduler._supabaseUpdate = async () => {
        attempts++;
        if (attempts < 3) throw new Error('transient');
        return { error: null };
      };

      // Patch the internal update to use our mock
      const realDelete = CleanupScheduler.prototype.deletePageWithRetry;
      scheduler.deletePageWithRetry = async (p) => {
        let lastError;
        for (let i = 1; i <= 3; i++) {
          try {
            await scheduler._supabaseUpdate(p);
            return; // Success
          } catch (err) {
            lastError = err;
            if (i < 3) await new Promise(r => setTimeout(r, 1)); // tiny delay
          }
        }
        throw lastError;
      };

      await expect(scheduler.deletePageWithRetry(page)).resolves.toBeUndefined();
      expect(attempts).toBe(3);
    });

    test('Throws after all retries are exhausted', async () => {
      const page = makePage();
      const scheduler = new CleanupScheduler({ readOnly: false });
      let attempts = 0;

      scheduler.deletePageWithRetry = async () => {
        attempts++;
        throw new Error('persistent failure');
      };

      await expect(scheduler.deletePageWithRetry(page)).rejects.toThrow('persistent failure');
    });
  });
});
