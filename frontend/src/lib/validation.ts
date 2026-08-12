/**
 * Server-side input validation and sanitization utilities.
 *
 * These functions ensure user input is treated as DATA, not code.
 * All API routes should validate and sanitize inputs before
 * passing them to Supabase.
 */

// Allowed business categories (whitelist)
const ALLOWED_CATEGORIES = [
  'Food & Beverage',
  'Retail',
  'Tech',
  'Real Estate',
  'Other',
  '', // Allow empty (optional field)
] as const;

/**
 * Strip HTML tags and trim whitespace.
 * Prevents stored XSS attacks.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')   // Strip HTML tags
    .replace(/&lt;/g, '<')     // Decode common entities for re-sanitization
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, '')   // Strip again after decode
    .trim();
}

/**
 * Validate a Solana wallet/PDA address.
 * Base58 encoded, 32-44 characters.
 */
export function isValidSolanaAddress(address: unknown): boolean {
  if (typeof address !== 'string') return false;
  // Base58 character set (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate a URL string.
 * Must start with http:// or https://.
 */
export function isValidUrl(url: unknown): boolean {
  if (typeof url !== 'string' || url === '') return true; // Empty is OK (optional)
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate a business category against the allowed whitelist.
 */
export function isValidCategory(category: unknown): boolean {
  if (typeof category !== 'string') return false;
  return (ALLOWED_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Validate the full business creation payload.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateBusinessPayload(body: Record<string, unknown>): string | null {
  const { id, owner, name, description, category, website_url } = body;

  // Required fields
  if (!id || !isValidSolanaAddress(id)) {
    return 'Invalid or missing business ID (must be a valid Solana address)';
  }

  if (!owner || !isValidSolanaAddress(owner)) {
    return 'Invalid or missing owner wallet address';
  }

  if (!name || typeof name !== 'string' || sanitizeString(name).length === 0) {
    return 'Business name is required';
  }

  if (typeof name === 'string' && name.length > 200) {
    return 'Business name must be under 200 characters';
  }

  if (typeof description === 'string' && description.length > 5000) {
    return 'Description must be under 5000 characters';
  }

  if (category !== undefined && !isValidCategory(category)) {
    return `Invalid category. Allowed: ${ALLOWED_CATEGORIES.filter(c => c).join(', ')}`;
  }

  if (website_url !== undefined && !isValidUrl(website_url)) {
    return 'Invalid website URL (must start with http:// or https://)';
  }

  return null; // All good
}

/**
 * Sanitize a full business payload — cleans all string fields.
 * Call this AFTER validation.
 */
export function sanitizeBusinessPayload(body: Record<string, unknown>): Record<string, string> {
  return {
    id: sanitizeString(body.id),
    owner: sanitizeString(body.owner),
    name: sanitizeString(body.name),
    description: sanitizeString(body.description),
    category: sanitizeString(body.category),
    image_url: sanitizeString(body.image_url),
    website_url: sanitizeString(body.website_url),
  };
}
