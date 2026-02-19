/**
 * Words that should always be UPPERCASE (whiskey industry terms, abbreviations).
 */
const ALWAYS_UPPER = new Set([
  'ABV', 'XO', 'VSOP', 'VS', 'IPA', 'CS', 'SiB', 'BiB',
  'BIB', 'SIB', 'USA', 'UK', 'NYC', 'BBQ', 'XR', 'OF',
]);

/**
 * Words that should be lowercase in Title Case (unless first word).
 */
const MINOR_WORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'in', 'on', 'at', 'to', 'for',
  'by', 'or', 'nor', 'but', 'with', 'from', 'as', 'is',
  'de', 'du', 'des', 'le', 'la', 'les',
]);

/**
 * Roman numeral pattern (strict — only valid numerals up to ~39).
 */
const ROMAN_RE = /^(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XX{0,3}|XXX)$/i;

/**
 * Ordinal suffix pattern (1st, 2nd, 3rd, 12th, etc.)
 */
const ORDINAL_RE = /^\d+(st|nd|rd|th)$/i;

/**
 * Format a whiskey name for display as Title Case.
 *
 * - Preserves abbreviations (ABV, XO, VSOP, etc.) as uppercase
 * - Keeps Roman numerals (I, II, III, IV, ...) uppercase
 * - Lowercases minor words (and, the, of) unless they're the first word
 * - Handles hyphenated words (e.g., "double-oaked" → "Double-Oaked")
 * - Preserves ordinals (12th, 1st, 23rd)
 *
 * This is display-only — the original value stays in the database.
 */
export function formatWhiskeyName(name: string | null | undefined): string {
  if (!name) return '';

  const words = name.split(/\s+/);

  return words
    .map((word, i) => {
      // Check if the entire word (ignoring case) is in ALWAYS_UPPER
      if (ALWAYS_UPPER.has(word.toUpperCase())) {
        return word.toUpperCase();
      }

      // Roman numerals → uppercase
      if (ROMAN_RE.test(word)) {
        return word.toUpperCase();
      }

      // Ordinals → preserve number, lowercase suffix
      if (ORDINAL_RE.test(word)) {
        return word.toLowerCase();
      }

      // Minor words → lowercase, except when first word
      if (i > 0 && MINOR_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }

      // Handle hyphenated words (e.g., "DOUBLE-OAKED" → "Double-Oaked")
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => capitalize(part))
          .join('-');
      }

      // Handle words with apostrophes (e.g., "MAKER'S" → "Maker's")
      if (word.includes("'")) {
        const parts = word.split("'");
        return parts.map((part) => capitalize(part)).join("'");
      }

      return capitalize(word);
    })
    .join(' ');
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
