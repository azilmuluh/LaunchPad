import supabase from './_supabase.js';

async function shouldSend(userId, category) {
  if (!userId || !category) return true;
  try {
    const { data } = await supabase.from('lp_user_extra').select('settings').eq('user_id', userId).maybeSingle();
    const settings = data?.settings || {};
    const map = {
      quests: 'notify_quests',
      ai: 'notify_ai',
      streak: 'notify_streak',
      opportunities: 'notify_opportunities',
      community: 'notify_community',
      digest: 'notify_digest',
      badges: 'notify_badges',
    };
    const key = map[category];
    if (!key) return true;
    const val = settings[key];
    // Default to true when unset
    return val === undefined ? true : !!val;
  } catch {
    return true;
  }
}

export async function sendOneSignalNotification({
  headings,
  contents,
  externalUserIds,
  url,
  data,
  userId,
  category,
} = {}) {
  const appId = process.env.ONESIGNAL_APP_ID || process.env.VITE_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    // Allow running without push configured
    return { skipped: true, reason: 'ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY missing' };
  }

  if (!(await shouldSend(userId, category))) {
    return { skipped: true, reason: `category_disabled:${category}` };
  }

  const payload = {
    app_id: appId,
    include_external_user_ids: Array.isArray(externalUserIds) ? externalUserIds : [externalUserIds],
    headings: { en: headings || 'LaunchPad' },
    contents: { en: contents || 'Update from LaunchPad' },
    url: url || undefined,
    data: data || undefined,
  };

  console.log('[OneSignal] Sending notification:', { 
    userId, category, target: payload.include_external_user_ids, 
    heading: payload.headings.en 
  });

  const r = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('[OneSignal] API Error:', j);
    throw new Error(j?.errors?.[0] || j?.error || 'OneSignal error');
  }
  console.log('[OneSignal] API Success:', j);
  return j;
}

