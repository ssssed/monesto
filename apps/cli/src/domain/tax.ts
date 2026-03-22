export interface TaxResult {
  taxAmount: number;
  netIncome: number;
}

export function parsePercentOrAmount(input?: string | number): { kind: 'percent'; value: number } | { kind: 'amount'; value: number } | null {
  if (input == null) return null;

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) return null;
    return { kind: 'amount', value: input };
  }

  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.endsWith('%')) {
    const num = Number(trimmed.slice(0, -1));
    if (!Number.isFinite(num) || num < 0) return null;
    return { kind: 'percent', value: num };
  }

  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return { kind: 'amount', value: num };
}

export function calculateNetIncome(gross: number, taxInput?: string): TaxResult {
  if (!Number.isFinite(gross) || gross < 0) {
    throw new Error('Gross income must be a non-negative number');
  }

  const parsed = parsePercentOrAmount(taxInput);

  if (!parsed) {
    return {
      taxAmount: 0,
      netIncome: gross
    };
  }

  let taxAmount: number;

  if (parsed.kind === 'percent') {
    taxAmount = (gross * parsed.value) / 100;
  } else {
    taxAmount = parsed.value;
  }

  if (taxAmount > gross) {
    taxAmount = gross;
  }

  const netIncome = gross - taxAmount;

  return {
    taxAmount,
    netIncome
  };
}

