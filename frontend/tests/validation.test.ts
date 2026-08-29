import {
  sanitizeString,
  isValidSolanaAddress,
  isValidUrl,
  isValidCategory,
  validateBusinessPayload,
  sanitizeBusinessPayload
} from '../src/lib/validation';

describe('validation.ts', () => {
  describe('sanitizeString', () => {
    it('strips HTML tags', () => {
      expect(sanitizeString('<script>alert(1)</script>hello')).toBe('alert(1)hello');
      expect(sanitizeString('hello <b>world</b>')).toBe('hello world');
    });

    it('decodes entities and strips again', () => {
      expect(sanitizeString('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('alert(1)');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('handles non-strings gracefully', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString({})).toBe('');
    });
  });

  describe('isValidSolanaAddress', () => {
    it('validates correct base58 addresses', () => {
      expect(isValidSolanaAddress('5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z')).toBe(true);
    });

    it('rejects invalid addresses', () => {
      expect(isValidSolanaAddress('not-an-address')).toBe(false);
      expect(isValidSolanaAddress('5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z!')).toBe(false); // special char
      expect(isValidSolanaAddress(null)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('validates proper URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('allows empty string (optional field)', () => {
      expect(isValidUrl('')).toBe(true);
    });
  });

  describe('isValidCategory', () => {
    it('validates allowed categories', () => {
      expect(isValidCategory('Tech')).toBe(true);
      expect(isValidCategory('Real Estate')).toBe(true);
      expect(isValidCategory('')).toBe(true);
    });

    it('rejects unallowed categories', () => {
      expect(isValidCategory('Weapons')).toBe(false);
      expect(isValidCategory('Food')).toBe(false); // 'Food & Beverage' is allowed
    });
  });

  describe('validateBusinessPayload', () => {
    const validPayload = {
      id: '5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z',
      owner: '5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z',
      name: 'My Business',
      description: 'A great business',
      category: 'Tech',
      website_url: 'https://example.com'
    };

    it('passes valid payload', () => {
      expect(validateBusinessPayload(validPayload)).toBeNull();
    });

    it('fails on missing/invalid id', () => {
      expect(validateBusinessPayload({ ...validPayload, id: 'bad' })).toMatch(/Invalid or missing business ID/);
    });

    it('fails on missing name', () => {
      expect(validateBusinessPayload({ ...validPayload, name: '' })).toMatch(/Business name is required/);
    });

    it('fails on invalid category', () => {
      expect(validateBusinessPayload({ ...validPayload, category: 'Bad' })).toMatch(/Invalid category/);
    });
  });

  describe('sanitizeBusinessPayload', () => {
    it('sanitizes all fields', () => {
      const payload = {
        id: '  5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z  ',
        owner: '5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z',
        name: '<b>My Business</b>',
        description: 'Desc',
      };
      
      const result = sanitizeBusinessPayload(payload);
      expect(result.name).toBe('My Business');
      expect(result.id).toBe('5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z');
    });
  });
});
