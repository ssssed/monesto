import { getFixedOtpCode } from './dev-fixed-otp';

describe('getFixedOtpCode', () => {
  const config = 'root@root.com:000000,test@test.com:111111';

  it('returns null when the config is not set', () => {
    expect(getFixedOtpCode('root@root.com', undefined)).toBeNull();
  });

  it('returns null for an email not present in the config', () => {
    expect(getFixedOtpCode('someone@else.com', config)).toBeNull();
  });

  it('returns the configured fixed code for a matching email', () => {
    expect(getFixedOtpCode('root@root.com', config)).toBe('000000');
    expect(getFixedOtpCode('test@test.com', config)).toBe('111111');
  });

  it('matches case-insensitively', () => {
    expect(getFixedOtpCode('Root@Root.com', config)).toBe('000000');
  });
});
