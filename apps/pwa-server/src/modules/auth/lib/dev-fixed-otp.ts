/**
 * Dev-only override: some emails always get a fixed OTP code instead of a
 * random one, configured via `DEV_FIXED_EMAIL_CODES` (format
 * "email1:code1,email2:code2"). Only touches emails present in that env var —
 * leave it unset in production and behavior is unchanged (always random).
 */
export function getFixedOtpCode(
  email: string,
  rawConfig: string | undefined,
): string | null {
  if (!rawConfig) return null;

  const normalizedEmail = email.trim().toLowerCase();
  for (const pair of rawConfig.split(',')) {
    const [pairEmail, code] = pair.split(':').map((s) => s.trim());
    if (pairEmail?.toLowerCase() === normalizedEmail && code) {
      return code;
    }
  }
  return null;
}
