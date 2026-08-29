import * as crypto from 'crypto';

/** Генерирует 6-значный числовой код, например "042817". */
export function generateEmailCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashEmailCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}
