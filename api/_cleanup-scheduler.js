import supabase from './_supabase.js';

/**
 * CleanupScheduler
 *
 * Batch-deletes expired opportunity pages and archives old deleted records.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 6.1–6.7, 7.2, 7.8
 */

const BATCH_SIZE          = 100;
const MAX_RETRY_ATTEMPTS  = 3;
const RETRY_BASE_DELAY_MS = 300;
const ARCHIVE_CUTOFF_DAYS = 90;

/**
 * @typedef {Object} CleanupResult
 * @property {number}   pagesIdentified   - Total expired pages found
 * @property {number}   pagesDeleted      - Pages successfully soft-deleted
 * @property {number}   pagesArchived     - Old records moved to archive table
 * @property {number}   errors            - Count of pages that failed deletion
 * @property {Array}    errorDetails      - [{pageId, error}] for each failure
 * @property {string}   startTime         - ISO timestamp
 * @property {string}   endTime           - ISO timestamp
 * @property {number}   durationMs        - Wall-clock duration in ms
 * @property {boolean}  readOnly          - Whether this was a dry-run
 */

class CleanupScheduler {
  /**
   * @param {Object} [opts]
   * @param {boolean} [opts.readOnly=false] - When true, logs without deleting (dry-run)
   */
  constructor({ readOnly = false } = {}) {
    this.readOnly = readOnly;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Execute the full cleanup pipeline:
   *   1. Fetch expired pages
   *   2. Soft-delete in batches
   *   3. Archive old deleted records
   *
   * @returns {Promise<CleanupResult>}
   */
  async run() {
    const startTime = new Date();
    console.info(`[CleanupScheduler] Starting cleanup run at ${startTime.toISOString()} (readOnly=${this.readOnly})`);

    const result = {
      pagesIdentified: 0,
      pagesDeleted:    0,
      pagesArchived:   0,
      errors:          0,
      errorDetails:    [],
      startTime:       startTime.toISOString(),
      endTime:         null,
      durationMs:      0,
      readOnly:        this.readOnly,
    };

    try {
      // Step 1: Find expired pages
      const expiredPages = await this.fetchExpiredPages();
      result.pagesIdentified = expiredPages.length;
      console.info(`[CleanupScheduler] Found ${expiredPages.length} expired pages.`);

      if (expiredPages.length === 0) {
        return this._finalise(result, startTime);
      }

      // Step 2: Soft-delete in batches
      const batches = this.createBatches(expiredPages);
      console.info(`[CleanupScheduler] Processing ${batches.length} batch(es) of up to ${BATCH_SIZE} pages each.`);

      for (const batch of batches) {
        const batchResult = await this.deleteBatch(batch);
        result.pagesDeleted  += batchResult.deleted;
        result.errors        += batchResult.errors;
        result.errorDetails.push(...batchResult.errorDetails);
      }

      // Step 3: Archive old records (90+ days since deletion)
      const archived = await this.archiveDeletedPages();
      result.pagesArchived = archived;

      this._logMetrics(result);
    } catch (err) {
      console.error('[CleanupScheduler] Unexpected error during cleanup run:', err.message);
      result.errors++;
      result.errorDetails.push({ pageId: 'CLEANUP_RUN', error: err.message });
      await this.sendAlert(result, err);
    }

    return this._finalise(result, startTime);
  }

  /**
   * Fetch pages whose expires_at has passed and are not yet soft-deleted.
   *
   * @returns {Promise<Array<Object>>}
   */
  async fetchExpiredPages() {
    const { data, error } = await supabase
      .from('lp_opportunity_pages')
      .select('id, opportunity_id, slug, category, expires_at')
      .lte('expires_at', new Date().toISOString())
      .is('deleted_at', null);

    if (error) {
      throw new Error(`CleanupScheduler.fetchExpiredPages: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Split an array into chunks of BATCH_SIZE.
   *
   * @param {Array} pages
   * @returns {Array<Array>}
   */
  createBatches(pages) {
    const batches = [];
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      batches.push(pages.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }

  /**
   * Soft-delete a batch of pages. Each page is deleted individually with retry.
   *
   * @param {Array<Object>} batch
   * @returns {Promise<{deleted: number, errors: number, errorDetails: Array}>}
   */
  async deleteBatch(batch) {
    const batchResult = { deleted: 0, errors: 0, errorDetails: [] };

    await Promise.all(
      batch.map(async (page) => {
        try {
          await this.deletePageWithRetry(page);
          batchResult.deleted++;
        } catch (err) {
          batchResult.errors++;
          batchResult.errorDetails.push({ pageId: page.id, error: err.message });
          console.error(`[CleanupScheduler] Failed to delete page ${page.id}:`, err.message);
        }
      })
    );

    return batchResult;
  }

  /**
   * Soft-delete a single page with exponential-backoff retry.
   *
   * @param {Object} page - Page record with at least { id }
   * @returns {Promise<void>}
   */
  async deletePageWithRetry(page) {
    if (this.readOnly) {
      console.info(`[CleanupScheduler][DRY-RUN] Would delete page ${page.id} (slug: ${page.slug})`);
      return;
    }

    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const { error } = await supabase
          .from('lp_opportunity_pages')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', page.id)
          .is('deleted_at', null); // Idempotency guard

        if (error) {
          throw new Error(error.message);
        }

        console.info(`[CleanupScheduler] Soft-deleted page ${page.id} (slug: ${page.slug})`);
        return; // Success
      } catch (err) {
        lastError = err;
        console.warn(
          `[CleanupScheduler] Delete attempt ${attempt}/${MAX_RETRY_ATTEMPTS} for page ${page.id} failed:`,
          err.message
        );
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await _sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError;
  }

  /**
   * Call the Supabase stored procedure to move old deleted pages to archive.
   *
   * @returns {Promise<number>} Number of records archived
   */
  async archiveDeletedPages() {
    if (this.readOnly) {
      console.info('[CleanupScheduler][DRY-RUN] Would archive old deleted pages.');
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_CUTOFF_DAYS);

    const { data, error } = await supabase.rpc('archive_old_deleted_pages', {
      cutoff_date: cutoffDate.toISOString(),
    });

    if (error) {
      console.error('[CleanupScheduler] archiveDeletedPages RPC failed:', error.message);
      throw new Error(`archive_old_deleted_pages failed: ${error.message}`);
    }

    const archived = typeof data === 'number' ? data : 0;
    console.info(`[CleanupScheduler] Archived ${archived} old deleted page(s).`);
    return archived;
  }

  /**
   * Log metrics at the end of a cleanup run.
   *
   * @param {CleanupResult} result
   */
  _logMetrics(result) {
    console.info('[CleanupScheduler] Metrics:', {
      pagesIdentified: result.pagesIdentified,
      pagesDeleted:    result.pagesDeleted,
      pagesArchived:   result.pagesArchived,
      errors:          result.errors,
      readOnly:        result.readOnly,
    });

    if (result.errors > 0) {
      console.warn('[CleanupScheduler] Error details:', result.errorDetails);
    }
  }

  /**
   * Send an alert notification when the cleanup run encounters failures.
   *
   * Override in tests or integrate with your monitoring/notification service.
   *
   * @param {CleanupResult} result
   * @param {Error}         [originalError]
   */
  async sendAlert(result, originalError) {
    const payload = {
      event:           'cleanup_failure',
      pagesIdentified: result.pagesIdentified,
      pagesDeleted:    result.pagesDeleted,
      errors:          result.errors,
      errorDetails:    result.errorDetails.slice(0, 10), // cap for brevity
      readOnly:        result.readOnly,
      originalError:   originalError?.message,
    };
    console.error('[CleanupScheduler] ALERT:', JSON.stringify(payload));
    // TODO: integrate with external notification service (e.g., Slack, PagerDuty)
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  _finalise(result, startTime) {
    const endTime      = new Date();
    result.endTime     = endTime.toISOString();
    result.durationMs  = endTime.getTime() - startTime.getTime();
    console.info(`[CleanupScheduler] Cleanup finished in ${result.durationMs}ms.`);
    return result;
  }
}

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default CleanupScheduler;
