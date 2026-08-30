import * as crypto from 'crypto';

/**
 * Payload из Telegram Login Widget (https://core.telegram.org/widgets/login).
 * Не путать с initData Telegram Mini App — там другая схема подписи
 * (HMAC-SHA256 с ключом "WebAppData"), здесь ключ — просто SHA-256(bot token).
 */
export interface TelegramLoginPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const MAX_AUTH_DATE_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Проверяет подпись Telegram Login Widget и свежесть auth_date.
 * Возвращает true только если хэш совпадает И auth_date не старше суток.
 */
export function verifyTelegramLoginPayload(
  payload: TelegramLoginPayload,
  botToken: string,
): boolean {
  const { hash, ...fields } = payload;
  if (!hash) return false;

  const dataCheckString = Object.keys(fields)
    .sort()
    .filter((key) => fields[key as keyof typeof fields] !== undefined)
    .map((key) => `${key}=${String(fields[key as keyof typeof fields])}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  let hashesMatch: boolean;
  try {
    hashesMatch = crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(hash, 'hex'),
    );
  } catch {
    return false;
  }
  if (!hashesMatch) return false;

  const authDateMs = payload.auth_date * 1000;
  const age = Date.now() - authDateMs;
  if (age < 0 || age > MAX_AUTH_DATE_AGE_MS) return false;

  return true;
}
