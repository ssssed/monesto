import { convertToRub } from '@/lib/exchange/convertToRub';

describe('convertToRub', () => {
  it('returns rub amount unchanged', () => {
    expect(convertToRub(1000, 'rub', 82)).toBe(1000);
  });

  it('converts usd to rub using rate', () => {
    expect(convertToRub(100, 'usd', 82)).toBe(8200);
  });

  it('handles zero amount', () => {
    expect(convertToRub(0, 'usd', 82)).toBe(0);
  });

  it('rounds fractional rub values', () => {
    expect(convertToRub(1.5, 'usd', 82)).toBe(123);
  });
});
