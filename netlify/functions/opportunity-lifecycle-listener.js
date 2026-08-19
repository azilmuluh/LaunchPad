/**
 * opportunity-lifecycle-listener
 *
 * Netlify background function that listens for database notifications on the
 * `create_opportunity_page` channel and creates opportunity detail pages via
 * OpportunityLifecycleManager.
 *
 * Note: Netlify background functions run for up to 15 minutes. This function
 * listens for a single pg_notify payload, processes it, and exits. The DB
 * trigger is responsible for firing notifications.
 *
 * Validates: Requirements 1.1, 1.2, 7.1
 */

// Check feature flag before doing anything
const AUTO_LIFECYCLE_ENABLED = process.env.AUTO_LIFECYCLE_ENABLED === 'true';

export const handler = async (event) => {
  if (!AUTO_LIFECYCLE_ENABLED) {
    console.info('[LifecycleListener] Feature flag AUTO_LIFECYCLE_ENABLED is disabled — skipping.');
    return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'feature_flag_disabled' }) };
  }

  let payload;
  try {
    payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (err) {
    console.error('[LifecycleListener] Failed to parse event body:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payload' }) };
  }

  if (!payload || !payload.opportunity_id) {
    console.error('[LifecycleListener] Missing opportunity_id in payload:', payload);
    return { statusCode: 400, body: JSON.stringify({ error: 'opportunity_id is required' }) };
  }

  // Dynamically import to avoid bundling issues in Netlify Functions
  const { default: OpportunityLifecycleManager } = await import('../../api/_lifecycle-manager.js');

  const manager = new OpportunityLifecycleManager();

  try {
    console.info(`[LifecycleListener] Processing opportunity ${payload.opportunity_id}`);

    const opportunity = {
      id:       payload.opportunity_id,
      title:    payload.title    || '',
      category: payload.category || 'opportunity',
      deadline: payload.deadline || null,
    };

    const page = await manager.createPageForOpportunity(opportunity);

    console.info(`[LifecycleListener] Page created/found: slug="${page?.slug}", id="${page?.id}"`);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, page }),
    };
  } catch (err) {
    console.error(`[LifecycleListener] Error creating page for ${payload.opportunity_id}:`, err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
