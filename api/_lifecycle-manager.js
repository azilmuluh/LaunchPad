import supabase from './_supabase.js';
import SlugGenerator from './_slug-generator.js';
import PageCreator from './_page-creator.js';

/**
 * OpportunityLifecycleManager
 *
 * Orchestrates the full lifecycle of opportunity detail pages:
 *   - Creating pages for opportunities (coordinating SlugGenerator + PageCreator)
 *   - Checking page existence
 *   - Retrieving page metadata
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.5
 */
class OpportunityLifecycleManager {
  constructor() {
    this._slugGenerator = new SlugGenerator();
    this._pageCreator   = new PageCreator();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Create an opportunity detail page. Idempotent: if a page already exists for
   * the opportunity_id it is returned without a duplicate insert.
   *
   * @param {Object} opportunity
   * @param {string} opportunity.id        - Unique opportunity ID
   * @param {string} opportunity.title     - Title used for slug generation
   * @param {string} [opportunity.category]
   * @param {string} [opportunity.deadline]
   * @returns {Promise<Object>} The page record (new or existing)
   */
  async createPageForOpportunity(opportunity) {
    const { id: opportunityId } = opportunity;

    if (!opportunityId) {
      throw new Error('OpportunityLifecycleManager.createPageForOpportunity: opportunity.id is required');
    }

    // Guard: don't duplicate
    const existing = await this.getPageMetadata({ opportunityId });
    if (existing) {
      console.info(
        `[LifecycleManager] Page already exists for opportunity ${opportunityId} — skipping creation.`
      );
      return existing;
    }

    try {
      const page = await this._pageCreator.createPage(opportunity);
      console.info(
        `[LifecycleManager] Page created for opportunity ${opportunityId}: slug="${page.slug}"`
      );
      return page;
    } catch (err) {
      console.error(`[LifecycleManager] Failed to create page for opportunity ${opportunityId}:`, err.message);
      throw err;
    }
  }

  /**
   * Check whether an active (non-deleted) page exists for the given opportunity.
   *
   * @param {string} opportunityId
   * @returns {Promise<boolean>}
   */
  async pageExists(opportunityId) {
    if (!opportunityId) return false;

    const { data, error } = await supabase
      .from('lp_opportunity_pages')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error(`[LifecycleManager] pageExists query failed:`, error.message);
      return false;
    }
    return data !== null;
  }

  /**
   * Retrieve page metadata by opportunity ID or slug.
   *
   * @param {Object} opts
   * @param {string} [opts.opportunityId] - Look up by opportunity_id
   * @param {string} [opts.slug]          - Look up by slug
   * @param {boolean} [opts.includeDeleted] - Include soft-deleted pages
   * @returns {Promise<Object|null>}
   */
  async getPageMetadata({ opportunityId, slug, includeDeleted = false } = {}) {
    if (!opportunityId && !slug) {
      throw new Error('getPageMetadata requires at least one of: opportunityId, slug');
    }

    let query = supabase
      .from('lp_opportunity_pages')
      .select('*');

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    if (opportunityId) {
      query = query.eq('opportunity_id', opportunityId);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[LifecycleManager] getPageMetadata query failed:', error.message);
      throw new Error(`Failed to retrieve page metadata: ${error.message}`);
    }

    return data;
  }
}

export default OpportunityLifecycleManager;
