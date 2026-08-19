import supabase from './_supabase.js';

// Simple in-memory cache for slug existence checks (1 hour TTL) - Requirement 15.2
const SLUG_CACHE = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * SlugGenerator - Generate unique, URL-safe slugs from opportunity titles
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 8.6
 */
class SlugGenerator {
  /**
   * Generate a URL-safe slug from an opportunity title
   * 
   * @param {string} title - The opportunity title
   * @param {string} opportunityId - The opportunity ID (fallback for invalid titles)
   * @returns {string} - URL-safe slug matching pattern ^[a-z0-9-]+$
   */
  generateSlug(title, opportunityId) {
    // Handle null, undefined, or non-string titles
    if (!title || typeof title !== 'string') {
      return this._generateFallbackSlug(opportunityId);
    }

    // 1. Convert to lowercase
    let slug = title.toLowerCase();

    // 2. Replace spaces with hyphens
    slug = slug.replace(/\s+/g, '-');

    // 3. Remove special characters (keep alphanumeric and hyphens)
    slug = slug.replace(/[^a-z0-9-]/g, '');

    // 4. Remove consecutive hyphens
    slug = slug.replace(/-+/g, '-');

    // 5. Trim hyphens from start/end
    slug = slug.replace(/^-+|-+$/g, '');

    // 6. Truncate to 100 characters
    slug = slug.substring(0, 100);

    // 7. Ensure minimum length (3 characters)
    if (slug.length < 3) {
      return this._generateFallbackSlug(opportunityId);
    }

    return slug;
  }

  /**
   * Validate that a slug matches the required pattern
   * 
   * @param {string} slug - The slug to validate
   * @returns {boolean} - True if slug is valid
   */
  isValidSlug(slug) {
    if (!slug || typeof slug !== 'string') {
      return false;
    }

    // Must match pattern ^[a-z0-9-]+$
    // Length must be 3-100 characters
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 100;
  }

  /**
   * Ensure slug uniqueness within a category by checking database
   * and appending numeric suffixes if needed
   * 
   * @param {string} slug - The base slug
   * @param {string} category - The opportunity category
   * @returns {Promise<string>} - Unique slug
   */
  async ensureUnique(slug, category) {
    let uniqueSlug = slug;
    let counter = 1;

    while (await this._slugExists(uniqueSlug, category)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;

      // Safety check to prevent infinite loops
      if (counter > 1000) {
        throw new Error('Unable to generate unique slug after 1000 attempts');
      }
    }

    return uniqueSlug;
  }

  /**
   * Check if a slug already exists in the database for a given category
   * 
   * @private
   * @param {string} slug - The slug to check
   * @param {string} category - The opportunity category
   * @returns {Promise<boolean>} - True if slug exists
   */
  async _slugExists(slug, category) {
    const cacheKey = `${category}:${slug}`;
    const cached = SLUG_CACHE.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return cached.exists;
    }

    const { data, error } = await supabase
      .from('lp_opportunity_pages')
      .select('id')
      .eq('slug', slug)
      .eq('category', category)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error checking slug existence:', error);
      throw new Error(`Failed to check slug uniqueness: ${error.message}`);
    }

    const exists = data !== null;
    SLUG_CACHE.set(cacheKey, { exists, timestamp: now });
    return exists;
  }

  /**
   * Generate fallback slug using opportunity ID
   * 
   * @private
   * @param {string} opportunityId - The opportunity ID
   * @returns {string} - Fallback slug
   */
  _generateFallbackSlug(opportunityId) {
    if (!opportunityId || typeof opportunityId !== 'string') {
      // If no opportunity ID, generate a random short ID
      const randomId = Math.random().toString(36).substring(2, 10);
      return `opp-${randomId}`;
    }

    // Clean the opportunity ID to make it URL-safe
    let slug = opportunityId.toLowerCase();
    slug = slug.replace(/[^a-z0-9-]/g, '-');
    slug = slug.replace(/-+/g, '-');
    slug = slug.replace(/^-+|-+$/g, '');

    // Ensure it has the opp- prefix if not already present
    if (!slug.startsWith('opp-')) {
      slug = `opp-${slug}`;
    }

    // Ensure minimum length
    if (slug.length < 3) {
      const randomId = Math.random().toString(36).substring(2, 8);
      slug = `opp-${randomId}`;
    }

    return slug;
  }
}

export default SlugGenerator;
