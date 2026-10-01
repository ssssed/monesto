export function formatRub(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
}

export function formatUsd(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-$${abs}` : `$${abs}`;
}

export function formatMoney(amount: number, provider: 'rub' | 'usd'): string {
  return provider === 'usd' ? formatUsd(amount) : formatRub(amount);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
