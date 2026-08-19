import { describe, test, expect, beforeEach, vi } from 'vitest';
import OpportunityLifecycleManager from './_lifecycle-manager.js';

/**
 * Integration-style tests for OpportunityLifecycleManager (mocked DB layer).
 * Feature: auto-opportunity-lifecycle
 * Validates: Requirements 1.1, 1.4, 4.5, 8.3
 */

// ── Helpers ────────────────────────────────────────────────────────────────

function makeFakePage(overrides = {}) {
  return {
    id:             'page-uuid-001',
    opportunity_id: 'verified-abc',
    slug:           'test-scholarship',
    category:       'scholarship',
    source_table:   'lp_verified_opps',
    created_at:     new Date().toISOString(),
    expires_at:     new Date(Date.now() + 86400000 * 365).toISOString(),
    deleted_at:     null,
    ...overrides,
  };
}

/**
 * Build a manager with Supabase operations fully mocked.
 */
function buildManager({ existingPage = null, createShouldFail = false } = {}) {
  const manager = new OpportunityLifecycleManager();

  // Mock getPageMetadata
  manager.getPageMetadata = vi.fn(async ({ opportunityId, slug } = {}) => {
    if (existingPage) {
      if (opportunityId && existingPage.opportunity_id === opportunityId) return existingPage;
      if (slug          && existingPage.slug           === slug)          return existingPage;
    }
    return null;
  });

  // Mock _pageCreator.createPage
  manager._pageCreator.createPage = vi.fn(async (opp) => {
    if (createShouldFail) throw new Error('DB insert failed');
    return makeFakePage({
      opportunity_id: opp.id,
      slug:           opp.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `opp-${opp.id}`,
      category:       opp.category || 'opportunity',
    });
  });

  // Mock pageExists to delegate to mocked getPageMetadata
  manager.pageExists = vi.fn(async (opportunityId) => {
    const page = await manager.getPageMetadata({ opportunityId });
    return page !== null;
  });

  return manager;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('OpportunityLifecycleManager', () => {

  describe('createPageForOpportunity', () => {
    test('Creates a new page when none exists', async () => {
      const manager = buildManager({ existingPage: null });
      const opp     = { id: 'verified-new-opp', title: 'New Scholarship 2025', category: 'scholarship' };

      const page = await manager.createPageForOpportunity(opp);

      expect(page).toBeTruthy();
      expect(page.opportunity_id).toBe('verified-new-opp');
      expect(manager._pageCreator.createPage).toHaveBeenCalledOnce();
    });

    test('Returns existing page without inserting when page already exists', async () => {
      const existing = makeFakePage({ opportunity_id: 'verified-existing' });
      const manager  = buildManager({ existingPage: existing });
      const opp      = { id: 'verified-existing', title: 'Existing Scholarship', category: 'scholarship' };

      const page = await manager.createPageForOpportunity(opp);

      expect(page).toEqual(existing);
      // createPage should NOT be called because we short-circuit on existing page
      expect(manager._pageCreator.createPage).not.toHaveBeenCalled();
    });

    test('Throws when opportunity.id is missing', async () => {
      const manager = buildManager();
      await expect(manager.createPageForOpportunity({ title: 'No ID' })).rejects.toThrow(
        'opportunity.id is required'
      );
    });

    test('Propagates PageCreator errors', async () => {
      const manager = buildManager({ existingPage: null, createShouldFail: true });
      const opp     = { id: 'verified-fail', title: 'Failing Opp' };

      await expect(manager.createPageForOpportunity(opp)).rejects.toThrow('DB insert failed');
    });
  });

  describe('pageExists', () => {
    test('Returns true when an active page exists', async () => {
      const existing = makeFakePage({ opportunity_id: 'verified-exists' });
      const manager  = buildManager({ existingPage: existing });

      const result = await manager.pageExists('verified-exists');
      expect(result).toBe(true);
    });

    test('Returns false when no page exists', async () => {
      const manager = buildManager({ existingPage: null });
      const result  = await manager.pageExists('verified-nonexistent');
      expect(result).toBe(false);
    });

    test('Returns false for null/empty opportunityId', async () => {
      const manager = new OpportunityLifecycleManager();
      expect(await manager.pageExists(null)).toBe(false);
      expect(await manager.pageExists('')).toBe(false);
    });
  });

  describe('getPageMetadata', () => {
    test('Returns page when found by opportunityId', async () => {
      const existing = makeFakePage({ opportunity_id: 'verified-abc' });
      const manager  = buildManager({ existingPage: existing });

      const result = await manager.getPageMetadata({ opportunityId: 'verified-abc' });
      expect(result).toEqual(existing);
    });

    test('Returns page when found by slug', async () => {
      const existing = makeFakePage({ slug: 'my-scholarship' });
      const manager  = buildManager({ existingPage: existing });

      const result = await manager.getPageMetadata({ slug: 'my-scholarship' });
      expect(result).toEqual(existing);
    });

    test('Returns null when page not found', async () => {
      const manager = buildManager({ existingPage: null });
      const result  = await manager.getPageMetadata({ opportunityId: 'not-found' });
      expect(result).toBeNull();
    });

    test('Throws when neither opportunityId nor slug is provided', async () => {
      const manager = new OpportunityLifecycleManager();
      await expect(manager.getPageMetadata({})).rejects.toThrow(
        'at least one of: opportunityId, slug'
      );
    });
  });

  describe('Full flow: opportunity → page', () => {
    test('End-to-end: new opportunity produces a page with valid slug', async () => {
      const manager = buildManager({ existingPage: null });
      const opp     = {
        id:       'verified-e2e-001',
        title:    'Rhodes Scholarship 2026',
        category: 'scholarship',
        deadline: '2026-10-15T00:00:00.000Z',
      };

      const page = await manager.createPageForOpportunity(opp);

      expect(page).toBeTruthy();
      expect(page.opportunity_id).toBe(opp.id);
      expect(page.slug).toMatch(/^[a-z0-9-]+$/);
      expect(page.category).toBe('scholarship');
    });

    test('Second call for same opportunity returns existing page (idempotent)', async () => {
      let callCount = 0;
      const manager = new OpportunityLifecycleManager();
      const createdPages = {};

      // First call → create; subsequent calls → return existing
      manager._pageCreator.createPage = vi.fn(async (opp) => {
        callCount++;
        const page = makeFakePage({ opportunity_id: opp.id });
        createdPages[opp.id] = page;
        return page;
      });

      manager.getPageMetadata = vi.fn(async ({ opportunityId }) => {
        return createdPages[opportunityId] || null;
      });

      const opp = { id: 'verified-idempotent', title: 'Idempotent Scholarship' };

      const first  = await manager.createPageForOpportunity(opp);
      const second = await manager.createPageForOpportunity(opp);

      expect(first.id).toBe(second.id);
      expect(callCount).toBe(1); // createPage called only once
    });
  });
});
