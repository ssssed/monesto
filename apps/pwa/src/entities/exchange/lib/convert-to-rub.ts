export function convertToRub(
  amount: number,
  currency: 'rub' | 'usd',
  usdRubRate: number,
): number {
  if (currency === 'rub') return amount;
  return Math.round(amount * usdRubRate);
}
