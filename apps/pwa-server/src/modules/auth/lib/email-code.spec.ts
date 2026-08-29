import { generateEmailCode, hashEmailCode } from './email-code';

describe('email-code', () => {
  describe('generateEmailCode', () => {
    it('always returns a 6-digit numeric string', () => {
      for (let i = 0; i < 200; i++) {
        const code = generateEmailCode();
        expect(code).toMatch(/^\d{6}$/);
      }
    });
  });

  describe('hashEmailCode', () => {
    it('is deterministic for the same input', () => {
      expect(hashEmailCode('123456')).toBe(hashEmailCode('123456'));
    });

    it('differs for different codes', () => {
      expect(hashEmailCode('123456')).not.toBe(hashEmailCode('654321'));
    });

    it('never returns the plaintext code', () => {
      expect(hashEmailCode('123456')).not.toBe('123456');
    });
  });
});
