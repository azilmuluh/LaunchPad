import supabase from './_supabase.js';

// This endpoint resets weekly/temporary badges for all users every Sunday at midnight.
// It removes weekly badges from lp_badges so users can re-earn them.

const WEEKLY_BADGE_KEYS = ['streak_3', 'streak_7', 'weekly_quest']; // Add more if needed

export default async function handler(req, res) {
  // Only allow POST (cron)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Remove weekly badges for all users
    const { error } = await supabase
      .from('lp_badges')
      .delete()
      .in('badge_key', WEEKLY_BADGE_KEYS);
    if (error) throw error;
    res.status(200).json({ ok: true, reset: WEEKLY_BADGE_KEYS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
