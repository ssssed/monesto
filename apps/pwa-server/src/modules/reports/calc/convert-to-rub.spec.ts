import { convertToRub } from './convert-to-rub';

describe('convertToRub', () => {
  it('passes rub through unchanged', () => {
    expect(convertToRub(100, 'rub', 82)).toBe(100);
  });

  it('converts usd to rub with rounding', () => {
    expect(convertToRub(10, 'usd', 82.4)).toBe(824);
    expect(convertToRub(10.5, 'usd', 82)).toBe(861);
  });
});
