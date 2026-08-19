import OpportunityLifecycleManager from './_lifecycle-manager.js';
import supabase from './_supabase.js';

/**
 * opportunity-pages API handler
 *
 * Routes:
 *   GET  /api/opportunities/:id/page        - Get page metadata for opportunity
 *   POST /api/opportunities/:id/page        - Create page for opportunity (idempotent)
 *   GET  /api/opportunities/pages/stats     - Aggregate stats / metrics
 *
 * Validates: Requirements 4.5, 5.1–5.5, 6.7
 */

const manager = new OpportunityLifecycleManager();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Feature flag guard
  const AUTO_LIFECYCLE_ENABLED = process.env.AUTO_LIFECYCLE_ENABLED === 'true';

  try {
    const url = req.url || '';

    // GET /api/opportunities/pages/stats
    if (req.method === 'GET' && url.includes('/pages/stats')) {
      return handleStats(req, res);
    }

    // GET /api/opportunities/page/by-slug
    if (req.method === 'GET' && url.includes('/page/by-slug')) {
      return handleGetPageBySlug(req, res);
    }

    // Extract opportunity ID from URL: /api/opportunities/:id/page
    const match = url.match(/\/opportunities\/([^/]+)\/page/);
    if (!match) {
      return res.status(404).json({ error: 'Not found' });
    }

    const opportunityId = decodeURIComponent(match[1]);

    if (req.method === 'GET') {
      return handleGetPage(req, res, opportunityId);
    }

    if (req.method === 'POST') {
      if (!AUTO_LIFECYCLE_ENABLED) {
        return res.status(503).json({ error: 'Auto-lifecycle feature is disabled', code: 'FEATURE_DISABLED' });
      }
      return handleCreatePage(req, res, opportunityId);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[OpportunityPages] Unhandled error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Route handlers ────────────────────────────────────────────────────────

/**
 * GET /api/opportunities/:id/page
 * Returns page metadata or 404 if not found / deleted.
 */
async function handleGetPage(req, res, opportunityId) {
  try {
    const page = await manager.getPageMetadata({ opportunityId });

    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code:  'PAGE_NOT_FOUND',
        opportunityId,
      });
    }

    return res.status(200).json({
      id:             page.id,
      opportunityId:  page.opportunity_id,
      slug:           page.slug,
      category:       page.category,
      sourceTable:    page.source_table,
      createdAt:      page.created_at,
      expiresAt:      page.expires_at,
      url:            `/opportunities/${page.category}/${page.slug}`,
    });
  } catch (err) {
    console.error(`[OpportunityPages] GET page failed for ${opportunityId}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/opportunities/:id/page
 * Creates a page for the opportunity (idempotent — returns existing if already created).
 */
async function handleCreatePage(req, res, opportunityId) {
  // Parse request body for opportunity metadata
  let body = {};
  if (req.body) {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }

  const opportunity = {
    id:       opportunityId,
    title:    body.title    || '',
    category: body.category || 'opportunity',
    deadline: body.deadline || null,
  };

  try {
    const page = await manager.createPageForOpportunity(opportunity);

    if (!page) {
      return res.status(500).json({ error: 'Page creation returned null' });
    }

    return res.status(200).json({
      id:             page.id,
      opportunityId:  page.opportunity_id,
      slug:           page.slug,
      category:       page.category,
      sourceTable:    page.source_table,
      createdAt:      page.created_at,
      expiresAt:      page.expires_at,
      url:            `/opportunities/${page.category}/${page.slug}`,
    });
  } catch (err) {
    console.error(`[OpportunityPages] POST page failed for ${opportunityId}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/opportunities/pages/stats
 * Returns aggregate metrics for opportunity pages.
 */
async function handleStats(req, res) {
  try {
    // Total pages
    const { count: total, error: totalErr } = await supabase
      .from('lp_opportunity_pages')
      .select('id', { count: 'exact', head: true });

    if (totalErr) throw new Error(totalErr.message);

    // Active pages (not deleted)
    const { count: active, error: activeErr } = await supabase
      .from('lp_opportunity_pages')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (activeErr) throw new Error(activeErr.message);

    // Deleted pages
    const { count: deleted, error: deletedErr } = await supabase
      .from('lp_opportunity_pages')
      .select('id', { count: 'exact', head: true })
      .not('deleted_at', 'is', null);

    if (deletedErr) throw new Error(deletedErr.message);

    // Archived pages
    const { count: archived, error: archiveErr } = await supabase
      .from('lp_opportunity_pages_archive')
      .select('id', { count: 'exact', head: true });

    if (archiveErr) throw new Error(archiveErr.message);

    return res.status(200).json({
      totalPages:    total    || 0,
      activePages:   active   || 0,
      deletedPages:  deleted  || 0,
      archivedPages: archived || 0,
      generatedAt:   new Date().toISOString(),
    });
  } catch (err) {
    console.error('[OpportunityPages] Stats query failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/opportunities/page/by-slug
 * Returns page metadata by slug, including checking if it has been soft-deleted.
 */
async function handleGetPageBySlug(req, res) {
  try {
    const slug = req.query.slug;
    if (!slug) {
      return res.status(400).json({ error: 'Slug query parameter is required' });
    }

    const page = await manager.getPageMetadata({ slug, includeDeleted: true });

    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code:  'PAGE_NOT_FOUND',
      });
    }

    if (page.deleted_at) {
      return res.status(410).json({
        error: 'This opportunity has expired or is no longer available',
        code:  'PAGE_EXPIRED',
        expired: true,
        deletedAt: page.deleted_at,
      });
    }

    return res.status(200).json({
      id:             page.id,
      opportunityId:  page.opportunity_id,
      slug:           page.slug,
      category:       page.category,
      sourceTable:    page.source_table,
      createdAt:      page.created_at,
      expiresAt:      page.expires_at,
      url:            `/opportunities/${page.category}/${page.slug}`,
    });
  } catch (err) {
    console.error(`[OpportunityPages] GET page by slug failed:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}

