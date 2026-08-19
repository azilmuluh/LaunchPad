/** Shared filters — one specific program per card, no aggregator/listicle noise */

export const AGGREGATOR_DOMAINS = [
  'scholarshipsforafricans.com', 'scholarshipbob.com', 'scholarshipset.com',
  'scholarshipportal.com', 'scholarships.com', 'opportunitiesforafricans.com',
  'afterschoolafrica.com', 'opportunitiesforafricans.org', 'scholarshipair.com',
  'worldscholarshipforum.com', 'scholarshipads.com', 'pickascholarship.com',
  'linkedin.com', 'facebook.com', 'instagram.com', 'youtube.com', 'youtu.be',
  'twitter.com', 'x.com', 'reddit.com', 'quora.com', 'medium.com',
  'wikipedia.org', 'pinterest.com', 'tiktok.com',
];

const VAGUE_TITLE_PATTERNS = [
  /\btop\s+\d+/i, /\bbest\s+\d+/i, /\d+\s+best\b/i, /\d+\s+websites?\b/i,
  /\blist\s+of\b/i, /\bevery\b.*\bscholarship/i, /\bhow\s+to\s+find\b/i,
  /\bguide\s+to\b/i, /\bwatch\b.*\bvideo/i, /\b#\w+/i, /\bshorts\b/i,
  /\bpage\s+\d+/i, /\bsearch\s+results\b/i, /\bopportunities\s+in\s+\d{4}\b/i,
  /\b\d+\s+(scholarships?|internships?|jobs?)\s+(you|to|for)\b/i,
  /\bwhere\s+to\s+find\b/i,
];

const SPECIFIC_TITLE_HINTS = [
  /\b20\d{2}\b/, /\bprogram(me)?\b/i, /\bfellowship\b/i, /\binternship\b/i,
  /\bscholarship\b/i, /\bcompetition\b/i, /\baward\b/i, /\bsummit\b/i,
  /\bbootcamp\b/i, /\bchallenge\b/i, /\bgrant\b/i, /\bdaad\b/i, /\bchevening\b/i,
  /\bmastercard\b/i, /\bgoogle\b/i, /\bmicrosoft\b/i, /\bunicef\b/i, /\bafdb\b/i,
];

export function hostFromLink(link) {
  try { return new URL(link).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

export function isAggregatorHost(host) {
  return AGGREGATOR_DOMAINS.some(d => host === d || host.endsWith('.' + d));
}

export function isVagueListing(title = '', snippet = '') {
  const text = `${title} ${snippet}`.trim();
  if (text.length < 12) return true;
  return VAGUE_TITLE_PATTERNS.some(p => p.test(text));
}

export function hasSpecificTitle(title = '') {
  if (!title || title.length < 18) return false;
  const words = title.split(/\s+/).length;
  if (words < 4) return false;
  return SPECIFIC_TITLE_HINTS.some(p => p.test(title));
}

export function getSpecificityScore(op) {
  let count = 0;
  if (op.id?.startsWith('static-')) count += 5;
  if (op.verified) count += 3;
  if (op.deadline) count++;
  if (op.eligibility && op.eligibility.length > 10) count++;
  if (op.benefits && op.benefits.length > 10) count++;
  if (op.location) count++;
  if (op.application_steps?.length) count += 2;
  if (hasSpecificTitle(op.title)) count += 2;
  const host = hostFromLink(op.link || '');
  if (host && !isAggregatorHost(host)) count += 2;
  // Live results with reasonable titles should pass
  if (op.title && op.title.length >= 20) count++;
  if (op.snippet && op.snippet.length >= 40) count++;
  return count;
}

export function isSpecificOpportunity(op) {
  if (!op?.title || !op?.link) return false;
  if (op.id?.startsWith('static-')) return true;
  if (op.verified === true) return true;

  const host = hostFromLink(op.link);
  if (isAggregatorHost(host)) return false;
  if (isVagueListing(op.title, op.snippet || op.description || '')) return false;

  // Accept any live result with a reasonable title length + non-aggregator host
  if (op.title.length >= 20 && !isAggregatorHost(host)) return true;

  return getSpecificityScore(op) >= 3;
}

export function filterOpportunities(opps) {
  const seen = new Set();
  return opps.filter(op => {
    if (!op?.link || !op?.title) return false;
    const key = op.link.replace(/\/$/, '').toLowerCase();
    if (seen.has(key)) return false;
    if (!isSpecificOpportunity(op)) return false;
    seen.add(key);
    return true;
  });
}

export function sortOpportunities(opps, interests = []) {
  return [...opps].sort((a, b) => {
    const score = (op) => {
      let s = op._score || 0;
      if (op.id?.startsWith('static-')) s += 200;
      if (op.verified) s += 150;
      if (op.id && !String(op.id).startsWith('live-')) s += 50;
      const text = ((op.title || '') + ' ' + (op.tag || '')).toLowerCase();
      interests.forEach(i => { if (text.includes(String(i).toLowerCase())) s += 25; });
      return s + getSpecificityScore(op) * 10;
    };
    return score(b) - score(a);
  });
}
