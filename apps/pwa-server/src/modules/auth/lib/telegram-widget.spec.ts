import * as crypto from 'crypto';
import {
  TelegramLoginPayload,
  verifyTelegramLoginPayload,
} from './telegram-widget';

const BOT_TOKEN = '123456:TEST-BOT-TOKEN-abcdef';

function signPayload(
  fields: Omit<TelegramLoginPayload, 'hash'>,
  botToken: string,
): TelegramLoginPayload {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${String(fields[key as keyof typeof fields])}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return { ...fields, hash };
}

describe('verifyTelegramLoginPayload', () => {
  it('accepts a correctly signed, fresh payload', () => {
    const payload = signPayload(
      {
        id: 42,
        first_name: 'Ada',
        username: 'ada_lovelace',
        auth_date: Math.floor(Date.now() / 1000),
      },
      BOT_TOKEN,
    );

    expect(verifyTelegramLoginPayload(payload, BOT_TOKEN)).toBe(true);
  });

  it('rejects a payload signed with a different bot token', () => {
    const payload = signPayload(
      { id: 42, first_name: 'Ada', auth_date: Math.floor(Date.now() / 1000) },
      'other-bot-token',
    );

    expect(verifyTelegramLoginPayload(payload, BOT_TOKEN)).toBe(false);
  });

  it('rejects a tampered field (id swapped after signing)', () => {
    const payload = signPayload(
      { id: 42, first_name: 'Ada', auth_date: Math.floor(Date.now() / 1000) },
      BOT_TOKEN,
    );

    const tampered: TelegramLoginPayload = { ...payload, id: 999 };
    expect(verifyTelegramLoginPayload(tampered, BOT_TOKEN)).toBe(false);
  });

  it('rejects a stale auth_date (older than 24h) even with a valid hash', () => {
    const staleAuthDate = Math.floor(Date.now() / 1000) - 25 * 60 * 60;
    const payload = signPayload(
      { id: 42, first_name: 'Ada', auth_date: staleAuthDate },
      BOT_TOKEN,
    );

    expect(verifyTelegramLoginPayload(payload, BOT_TOKEN)).toBe(false);
  });

  it('rejects an auth_date in the future', () => {
    const futureAuthDate = Math.floor(Date.now() / 1000) + 60 * 60;
    const payload = signPayload(
      { id: 42, first_name: 'Ada', auth_date: futureAuthDate },
      BOT_TOKEN,
    );

    expect(verifyTelegramLoginPayload(payload, BOT_TOKEN)).toBe(false);
  });

  it('rejects a missing/empty hash', () => {
    const payload: TelegramLoginPayload = {
      id: 42,
      first_name: 'Ada',
      auth_date: Math.floor(Date.now() / 1000),
      hash: '',
    };

    expect(verifyTelegramLoginPayload(payload, BOT_TOKEN)).toBe(false);
  });

  it('rejects a malformed (non-hex) hash without throwing', () => {
    const payload = signPayload(
      { id: 42, first_name: 'Ada', auth_date: Math.floor(Date.now() / 1000) },
      BOT_TOKEN,
    );

    const malformed: TelegramLoginPayload = { ...payload, hash: 'not-hex!!' };
    expect(() =>
      verifyTelegramLoginPayload(malformed, BOT_TOKEN),
    ).not.toThrow();
    expect(verifyTelegramLoginPayload(malformed, BOT_TOKEN)).toBe(false);
  });
});
