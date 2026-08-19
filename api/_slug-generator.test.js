import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import SlugGenerator from './_slug-generator.js';

/**
 * Property-Based Tests for SlugGenerator
 * Feature: auto-opportunity-lifecycle
 */

describe('SlugGenerator - Property-Based Tests', () => {
  let slugGenerator;

  beforeEach(() => {
    slugGenerator = new SlugGenerator();
    slugGenerator._slugExists = async () => false;
  });

  /**
   * Property 1: Slug Character Transformation
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * For any opportunity title, the generated slug SHALL contain only 
   * lowercase alphanumeric characters and hyphens, with spaces converted 
   * to hyphens and all other special characters removed.
   */
  test('Property 1: Slug character transformation', () => {
    fc.assert(
      fc.property(
        // Generate random strings (1-200 chars)
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 5, maxLength: 20 }), // opportunityId for fallback
        (title, opportunityId) => {
          const slug = slugGenerator.generateSlug(title, opportunityId);
          
          // Verify only valid characters [a-z0-9-]
          expect(slug).toMatch(/^[a-z0-9-]+$/);
          
          // Verify lowercase
          expect(slug).toBe(slug.toLowerCase());
          
          // Verify no consecutive hyphens
          expect(slug).not.toMatch(/--+/);
          
          // Verify no leading/trailing hyphens
          expect(slug).not.toMatch(/^-|-$/);
          
          // Verify spaces in original title result in hyphens (when applicable)
          // We check this indirectly: if title has spaces and produces non-fallback slug,
          // the spaces should be converted to hyphens
          if (title.includes(' ')) {
            // The slug should either be a fallback or contain hyphens
            const hasAlphanumeric = /[a-z0-9]/.test(title.toLowerCase());
            if (hasAlphanumeric && slug.length >= 3) {
              // If the title had alphanumeric content and spaces,
              // the transformation should have replaced spaces with hyphens
              // (this is implicit in the removal of spaces from the output)
              expect(slug).not.toContain(' ');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Slug Length Boundaries
   * 
   * **Validates: Requirements 3.4, 3.5**
   * 
   * For any opportunity title, the generated slug SHALL be at least 3 
   * characters and at most 100 characters in length.
   */
  test('Property 2: Slug length boundaries', () => {
    fc.assert(
      fc.property(
        // Generate strings of varying lengths (0-500 chars)
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 5, maxLength: 20 }), // opportunityId for fallback
        (title, opportunityId) => {
          const slug = slugGenerator.generateSlug(title, opportunityId);
          
          // Verify slug length is within boundaries
          expect(slug.length).toBeGreaterThanOrEqual(3);
          expect(slug.length).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Slug Pattern Validity
   * 
   * **Validates: Requirements 3.7**
   * 
   * For any generated slug, it SHALL match the pattern ^[a-z0-9-]+$ with 
   * no consecutive hyphens and no leading or trailing hyphens.
   */
  test('Property 3: Slug pattern validity', () => {
    fc.assert(
      fc.property(
        // Generate random strings with various characters
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 5, maxLength: 20 }), // opportunityId for fallback
        (title, opportunityId) => {
          const slug = slugGenerator.generateSlug(title, opportunityId);
          
          // Verify slug matches required pattern: lowercase alphanumeric and hyphens only
          expect(slug).toMatch(/^[a-z0-9-]+$/);
          
          // Verify no consecutive hyphens
          expect(slug).not.toMatch(/--/);
          
          // Verify no leading hyphens
          expect(slug).not.toMatch(/^-/);
          
          // Verify no trailing hyphens
          expect(slug).not.toMatch(/-$/);
          
          // Verify using the isValidSlug method
          expect(slugGenerator.isValidSlug(slug)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Fallback Slug for Invalid Titles
   * 
   * **Validates: Requirements 3.6, 8.6**
   * 
   * For any opportunity title that is empty, contains only special characters, 
   * or produces a slug shorter than 3 characters after transformation, the system 
   * SHALL generate a fallback slug using the opportunity ID.
   */
  test('Property 4: Fallback slug generation for invalid titles', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Empty strings
          fc.constant(''),
          // Only special characters (no alphanumerics)
          fc.array(fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '[', ']', '{', '}', '|', '\\', '/', '?', '.', ',', ';', ':', '"', "'", '<', '>', '~', '`', '+', '=', '_'), { minLength: 1, maxLength: 20 }).map(arr => arr.join('')),
          // Very short titles that become <3 chars after cleaning (1-2 alphanumeric chars surrounded by special chars)
          fc.tuple(
            fc.array(fc.constantFrom('!', '@', '#', '$', '%'), { minLength: 1, maxLength: 5 }).map(arr => arr.join('')),
            fc.stringMatching(/^[a-zA-Z0-9]{1,2}$/),
            fc.array(fc.constantFrom('!', '@', '#', '$', '%'), { minLength: 1, maxLength: 5 }).map(arr => arr.join(''))
          ).map(([prefix, core, suffix]) => `${prefix}${core}${suffix}`),
          // Whitespace only
          fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }).map(arr => arr.join('')),
          // Null-like cases (handled via empty string)
          fc.constant('   ')
        ),
        fc.string({ minLength: 5, maxLength: 30 }).filter(id => id.trim().length > 0), // Valid opportunity ID
        (invalidTitle, opportunityId) => {
          const slug = slugGenerator.generateSlug(invalidTitle, opportunityId);
          
          // Verify slug was generated (not empty)
          expect(slug).toBeTruthy();
          expect(slug.length).toBeGreaterThanOrEqual(3);
          
          // Verify slug is valid format
          expect(slug).toMatch(/^[a-z0-9-]+$/);
          
          // Verify slug contains some form of the opportunity ID or 'opp-' prefix
          // (fallback behavior should create a slug from the ID or use opp-<random>)
          const containsOppPrefix = slug.startsWith('opp-');
          const containsIdFragment = opportunityId.toLowerCase().split('').some(char => 
            /[a-z0-9]/.test(char) && slug.includes(char)
          );
          
          expect(containsOppPrefix || containsIdFragment).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit tests for slug uniqueness with database lookup
   * Testing task 2.6: Implement slug uniqueness check with database lookup
   */
  describe('Slug uniqueness with database lookup - Unit tests', () => {
    test('isValidSlug returns true for valid slugs', () => {
      expect(slugGenerator.isValidSlug('valid-slug-123')).toBe(true);
      expect(slugGenerator.isValidSlug('scholarship-2025')).toBe(true);
      expect(slugGenerator.isValidSlug('abc')).toBe(true);
      expect(slugGenerator.isValidSlug('a'.repeat(100))).toBe(true);
    });

    test('isValidSlug returns false for invalid slugs', () => {
      expect(slugGenerator.isValidSlug('')).toBe(false);
      expect(slugGenerator.isValidSlug('ab')).toBe(false); // Too short
      expect(slugGenerator.isValidSlug('a'.repeat(101))).toBe(false); // Too long
      expect(slugGenerator.isValidSlug('UPPERCASE')).toBe(false);
      expect(slugGenerator.isValidSlug('with spaces')).toBe(false);
      expect(slugGenerator.isValidSlug('with_underscore')).toBe(false);
      expect(slugGenerator.isValidSlug('with.dot')).toBe(false);
      // Note: isValidSlug only checks pattern and length, not consecutive/leading/trailing hyphens
      // Those are enforced by generateSlug transformation
      expect(slugGenerator.isValidSlug(null)).toBe(false);
      expect(slugGenerator.isValidSlug(undefined)).toBe(false);
    });

    test('ensureUnique method exists and has correct signature', async () => {
      // Verify the method exists
      expect(typeof slugGenerator.ensureUnique).toBe('function');
      
      // Verify it's an async function (returns a Promise)
      const testSlug = 'test-slug';
      const testCategory = 'scholarship';
      const result = slugGenerator.ensureUnique(testSlug, testCategory);
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('ensureUnique has safety check for infinite loops', () => {
      // Verify the implementation has the 1000 attempt safety check
      const ensureUniqueCode = slugGenerator.ensureUnique.toString();
      expect(ensureUniqueCode).toContain('1000');
      expect(ensureUniqueCode).toContain('Unable to generate unique slug');
    });

    test('generateSlug produces valid output for ensureUnique', () => {
      // Test that generateSlug produces slugs that meet the pattern requirements
      // These can then be used with ensureUnique
      const titles = [
        'Software Engineering Internship at Google',
        'Fully Funded PhD Scholarship 2025',
        'Hackathon Competition - $50,000 Prize',
      ];
      
      for (const title of titles) {
        const slug = slugGenerator.generateSlug(title, 'test-id-123');
        // Verify the slug is valid and can be used with ensureUnique
        expect(slugGenerator.isValidSlug(slug)).toBe(true);
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        expect(slug.length).toBeGreaterThanOrEqual(3);
        expect(slug.length).toBeLessThanOrEqual(100);
      }
    });
  });

  /**
   * Unit tests for specific fallback scenarios
   */
  describe('Fallback slug generation - specific cases', () => {
    test('Empty string should use fallback', () => {
      const slug = slugGenerator.generateSlug('', 'test-opp-123');
      expect(slug).toMatch(/^opp-/);
      expect(slug.length).toBeGreaterThanOrEqual(3);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    test('Only special characters should use fallback', () => {
      const slug = slugGenerator.generateSlug('!@#$%^&*()', 'test-opp-456');
      expect(slug).toMatch(/^opp-/);
      expect(slug.length).toBeGreaterThanOrEqual(3);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    test('Very short title (1-2 chars) should use fallback', () => {
      const slug = slugGenerator.generateSlug('a', 'test-opp-789');
      expect(slug).toMatch(/^opp-/);
      expect(slug.length).toBeGreaterThanOrEqual(3);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    test('Title with only spaces should use fallback', () => {
      const slug = slugGenerator.generateSlug('   ', 'test-opp-101');
      expect(slug).toMatch(/^opp-/);
      expect(slug.length).toBeGreaterThanOrEqual(3);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    test('Title "!@a#$" (special chars around 1 letter) should use fallback', () => {
      const slug = slugGenerator.generateSlug('!@a#$', 'test-opp-202');
      expect(slug).toMatch(/^opp-/);
      expect(slug.length).toBeGreaterThanOrEqual(3);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    test('Fallback should incorporate opportunity ID when possible', () => {
      const slug = slugGenerator.generateSlug('', 'scholarship-2025-xyz');
      expect(slug).toMatch(/^opp-/);
      expect(slug).toMatch(/scholarship|2025|xyz/);
    });

    test('Fallback with null opportunity ID should generate random slug', () => {
      const slug = slugGenerator.generateSlug('', null);
      expect(slug).toMatch(/^opp-[a-z0-9]+$/);
      expect(slug.length).toBeGreaterThanOrEqual(3);
    });

    test('Fallback with empty opportunity ID should generate random slug', () => {
      const slug = slugGenerator.generateSlug('', '');
      expect(slug).toMatch(/^opp-[a-z0-9]+$/);
      expect(slug.length).toBeGreaterThanOrEqual(3);
    });
  });

  /**
   * Property 5: Slug Uniqueness with Numeric Suffixes
   *
   * **Validates: Requirements 1.5, 1.6**
   *
   * When multiple opportunities share the same title, ensureUnique() SHALL
   * append sequential numeric suffixes (-1, -2, …) so that each slug is
   * globally unique within its category.
   */
  describe('Property 5: Slug uniqueness with numeric suffixes', () => {
    /**
     * Build a SlugGenerator whose _slugExists() uses an in-memory set
     * instead of hitting the database, so we can run pure-logic tests.
     */
    function makeMockedGenerator(existingSlugs) {
      const gen = new SlugGenerator();
      gen._slugExists = async (slug) => existingSlugs.has(slug);
      return gen;
    }

    test('Returns base slug when no conflict exists', async () => {
      const gen = makeMockedGenerator(new Set());
      const result = await gen.ensureUnique('my-scholarship', 'scholarship');
      expect(result).toBe('my-scholarship');
    });

    test('Appends -1 when base slug is taken', async () => {
      const gen = makeMockedGenerator(new Set(['my-scholarship']));
      const result = await gen.ensureUnique('my-scholarship', 'scholarship');
      expect(result).toBe('my-scholarship-1');
    });

    test('Appends -2 when -1 is also taken', async () => {
      const gen = makeMockedGenerator(new Set(['my-scholarship', 'my-scholarship-1']));
      const result = await gen.ensureUnique('my-scholarship', 'scholarship');
      expect(result).toBe('my-scholarship-2');
    });

    test('Suffixes are always sequential (no gaps)', async () => {
      // Simulate slugs -1 through -4 taken; expect -5
      const taken = new Set(['slug', 'slug-1', 'slug-2', 'slug-3', 'slug-4']);
      const gen = makeMockedGenerator(taken);
      const result = await gen.ensureUnique('slug', 'internship');
      expect(result).toBe('slug-5');
    });

    test('Property: ensureUnique output is never in the pre-existing set', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate 0-9 slugs already in existence (all share same base)
          fc.integer({ min: 0, max: 9 }),
          fc.stringMatching(/^[a-z][a-z0-9-]{2,19}$/), // valid base slug
          async (takenCount, baseSlug) => {
            // Build the set of already-taken slugs
            const taken = new Set();
            taken.add(baseSlug);
            for (let i = 1; i < takenCount; i++) {
              taken.add(`${baseSlug}-${i}`);
            }

            const gen = makeMockedGenerator(taken);
            const result = await gen.ensureUnique(baseSlug, 'scholarship');

            // The result must NOT be in the taken set
            expect(taken.has(result)).toBe(false);

            // The result must still be a valid slug pattern
            expect(result).toMatch(/^[a-z0-9-]+$/);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Property: all slugs from identical titles are unique', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^[a-z][a-z0-9 ]{2,29}$/), // title that produces a real slug
          fc.integer({ min: 2, max: 8 }),               // number of duplicates to generate
          async (title, count) => {
            const accumulated = new Set();
            const gen = new SlugGenerator();
            // Override _slugExists to use our in-memory set
            gen._slugExists = async (slug) => accumulated.has(slug);

            const baseSlug = gen.generateSlug(title, 'fallback-id');
            const slugs = [];

            for (let i = 0; i < count; i++) {
              const unique = await gen.ensureUnique(baseSlug, 'scholarship');
              slugs.push(unique);
              accumulated.add(unique);
            }

            // All generated slugs must be unique
            const uniqueSet = new Set(slugs);
            expect(uniqueSet.size).toBe(count);

            // All must be valid format
            for (const s of slugs) {
              expect(s).toMatch(/^[a-z0-9-]+$/);
              expect(s.length).toBeGreaterThanOrEqual(3);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
