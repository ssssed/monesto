import { describe, expect, it } from 'vitest';

import { formatMoneyInput, parseMoneyInput } from '@monesto/rune';

const NBSP_THIN = '\u202F';

describe('money input format', () => {
  it('группирует тысячи коротким пробелом', () => {
    expect(formatMoneyInput('208800')).toBe(`208${NBSP_THIN}800`);
    expect(formatMoneyInput('1000')).toBe(`1${NBSP_THIN}000`);
    expect(formatMoneyInput('1500')).toBe(`1${NBSP_THIN}500`);
    expect(formatMoneyInput('1500000')).toBe(
      `1${NBSP_THIN}500${NBSP_THIN}000`,
    );
  });

  it('не ставит пробел для чисел короче 4 цифр', () => {
    expect(formatMoneyInput('5')).toBe('5');
    expect(formatMoneyInput('50')).toBe('50');
    expect(formatMoneyInput('500')).toBe('500');
    expect(formatMoneyInput('12')).toBe('12');
  });

  it('парсит форматированное значение обратно', () => {
    expect(parseMoneyInput(`208${NBSP_THIN}800`)).toBe('208800');
    expect(parseMoneyInput('1 000')).toBe('1000');
    expect(parseMoneyInput('12,5')).toBe('12.5');
  });

  it('сохраняет дробную часть в отображении', () => {
    expect(formatMoneyInput('12.5')).toBe('12,5');
    expect(formatMoneyInput('12.')).toBe('12,');
    expect(formatMoneyInput('19.9')).toBe('19,9');
    expect(formatMoneyInput('1000.25')).toBe(`1${NBSP_THIN}000,25`);
  });
});
