export function parseFinanceAmount(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
