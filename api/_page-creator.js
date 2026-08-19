import supabase from './_supabase.js';
import SlugGenerator from './_slug-generator.js';

/**
 * PageCreator - Create opportunity detail pages in lp_opportunity_pages
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 2.5, 4.3, 8.1
 */

const DEFAULT_RETENTION_DAYS = 365;
const MAX_RETRY_ATTEMPTS     = 3;
const RETRY_BASE_DELAY_MS    = 200;

/** Source-table detection: map ID prefix → table name */
const SOURCE_TABLE_MAP = {
  'verified-': 'lp_verified_opps',
  'live-':     'lp_opportunities_v2',
  'static-':   'lp_tag_cache',
};

class PageCreator {
  constructor() {
    this._slugGenerator = new SlugGenerator();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Create a new opportunity page record.
   *
   * @param {Object} opportunity - Opportunity data
   * @param {string} opportunity.id           - Unique opportunity ID
   * @param {string} opportunity.title        - Opportunity title
   * @param {string} [opportunity.category]   - Category (scholarship, internship, …)
   * @param {string} [opportunity.deadline]   - ISO deadline string (optional)
   * @param {Date}   [createdAt]              - Override creation timestamp (for testing)
   * @returns {Promise<Object>} The created page record
   */
  async createPage(opportunity, createdAt = new Date()) {
    const { id: opportunityId, title, category = 'opportunity', deadline } = opportunity;

    if (!opportunityId) {
      throw new Error('PageCreator.createPage: opportunity.id is required');
    }

    // 1. Generate slug
    const rawSlug   = this._slugGenerator.generateSlug(title, opportunityId);
    const slug      = await this._slugGenerator.ensureUnique(rawSlug, category);

    // 2. Determine source table
    const sourceTable = this.detectSourceTable(opportunityId);

    // 3. Calculate expiration
    const expiresAt = this.calculateExpiresAt(deadline, createdAt);

    const pageRecord = {
      opportunity_id: opportunityId,
      source_table:   sourceTable,
      slug,
      category,
      created_at:     createdAt.toISOString(),
      expires_at:     expiresAt.toISOString(),
    };

    // 4. Insert with retry
    return this._insertWithRetry(pageRecord, opportunityId);
  }

  /**
   * Calculate expires_at from an optional deadline string.
   * Falls back to 365 days from createdAt when deadline is absent or unparseable.
   *
   * @param {string|null} deadline   - Raw deadline string from opportunity
   * @param {Date}        createdAt  - Page creation timestamp
   * @returns {Date}
   */
  calculateExpiresAt(deadline, createdAt = new Date()) {
    if (deadline) {
      const parsed = new Date(deadline);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Default: 365 days from creation
    const expires = new Date(createdAt.getTime());
    expires.setDate(expires.getDate() + DEFAULT_RETENTION_DAYS);
    return expires;
  }

  /**
   * Detect the source table from an opportunity ID prefix.
   *
   * @param {string} opportunityId
   * @returns {string} table name
   */
  detectSourceTable(opportunityId) {
    if (typeof opportunityId === 'string') {
      for (const [prefix, table] of Object.entries(SOURCE_TABLE_MAP)) {
        if (opportunityId.startsWith(prefix)) {
          return table;
        }
      }
    }
    // Default fallback
    return 'lp_tag_cache';
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Insert a page record with exponential-backoff retry logic.
   * Handles duplicate-key errors (23505) idempotently by returning the
   * existing record instead of throwing.
   *
   * @private
   * @param {Object} pageRecord       - The page row to insert
   * @param {string} opportunityId    - Used for idempotency lookup on conflict
   * @returns {Promise<Object>}
   */
  async _insertWithRetry(pageRecord, opportunityId) {
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const { data, error } = await supabase
          .from('lp_opportunity_pages')
          .insert(pageRecord)
          .select()
          .single();

        if (error) {
          // Duplicate key → page already exists (idempotency)
          if (error.code === '23505') {
            console.info(
              `[PageCreator] Page already exists for opportunity ${opportunityId} — returning existing record.`
            );
            return this._fetchExistingPage(opportunityId);
          }

          // Other DB error — may be transient, retry
          console.warn(
            `[PageCreator] Insert attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed:`,
            error.message
          );
          lastError = new Error(`Database error: ${error.message}`);
        } else {
          console.info(
            `[PageCreator] Created page for opportunity ${opportunityId}: slug="${data.slug}"`
          );
          return data;
        }
      } catch (networkErr) {
        console.warn(
          `[PageCreator] Network error on attempt ${attempt}/${MAX_RETRY_ATTEMPTS}:`,
          networkErr.message
        );
        lastError = networkErr;
      }

      // Exponential back-off before next attempt
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await _sleep(delay);
      }
    }

    throw lastError || new Error('PageCreator: failed to insert page after maximum retries');
  }

  /**
   * Fetch the existing page for an opportunity (used after a 23505 conflict).
   *
   * @private
   * @param {string} opportunityId
   * @returns {Promise<Object|null>}
   */
  async _fetchExistingPage(opportunityId) {
    const { data, error } = await supabase
      .from('lp_opportunity_pages')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(`PageCreator: failed to fetch existing page: ${error.message}`);
    }
    return data;
  }
}

/** Sleep helper for retry delays */
function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default PageCreator;
