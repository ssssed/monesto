import { describe, expect, it } from 'vitest';

import { formatMoneyInput, parseMoneyInput } from '@monesto/rune';

describe('money input format', () => {
  it('группирует тысячи коротким пробелом', () => {
    expect(formatMoneyInput('208800')).toBe('208\u202F800');
    expect(formatMoneyInput('1000')).toBe('1\u202F000');
    expect(formatMoneyInput('12')).toBe('12');
  });

  it('парсит форматированное значение обратно', () => {
    expect(parseMoneyInput('208\u202F800')).toBe('208800');
    expect(parseMoneyInput('1 000')).toBe('1000');
    expect(parseMoneyInput('12,5')).toBe('12.5');
  });

  it('сохраняет дробную часть в отображении', () => {
    expect(formatMoneyInput('12.5')).toBe('12,5');
    expect(formatMoneyInput('1000.25')).toBe('1\u202F000,25');
  });
});
