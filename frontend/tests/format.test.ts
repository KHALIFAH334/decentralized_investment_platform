import { truncateAddress } from '../src/lib/format';

describe('format.ts', () => {
  describe('truncateAddress', () => {
    it('truncates a standard solana address', () => {
      expect(truncateAddress('5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z')).toBe('5gEZHM...RSkN4Z');
    });

    it('handles empty string gracefully', () => {
      expect(truncateAddress('')).toBe('');
    });
    
    it('handles short strings gracefully', () => {
      expect(truncateAddress('short')).toBe('short...short');
    });
  });
});
