/**
 * cleanup-opportunity-pages
 *
 * Netlify scheduled function that runs the cleanup pipeline daily at 2 AM UTC.
 * Instantiates CleanupScheduler and returns a CleanupResult as JSON.
 *
 * Validates: Requirements 2.1, 2.7, 6.1
 */

const AUTO_LIFECYCLE_ENABLED = process.env.AUTO_LIFECYCLE_ENABLED === 'true';
const CLEANUP_READ_ONLY      = process.env.CLEANUP_READ_ONLY === 'true';

export const handler = async (event) => {
  if (!AUTO_LIFECYCLE_ENABLED) {
    console.info('[CleanupFn] AUTO_LIFECYCLE_ENABLED is false — skipping cleanup.');
    return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'feature_flag_disabled' }) };
  }

  const { default: CleanupScheduler } = await import('../../api/_cleanup-scheduler.js');

  const scheduler = new CleanupScheduler({ readOnly: CLEANUP_READ_ONLY });

  try {
    console.info(`[CleanupFn] Running cleanup (readOnly=${CLEANUP_READ_ONLY})`);
    const result = await scheduler.run();

    console.info('[CleanupFn] Cleanup complete:', JSON.stringify({
      pagesDeleted:  result.pagesDeleted,
      pagesArchived: result.pagesArchived,
      errors:        result.errors,
      durationMs:    result.durationMs,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('[CleanupFn] Cleanup failed:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
