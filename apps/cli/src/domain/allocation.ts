import { parsePercentOrAmount } from './tax.js';

export interface AllocationRates {
  usdToRub: number;
  goldPerGramRub: number;
}

export interface AssetAllocation {
  asset: 'gold' | 'usd' | 'rub';
  amountRub: number;
  details: {
    gramsOfGold?: number;
    usdAmount?: number;
    percentOfNet?: number;
  };
}

export interface AllocationResult {
  allocations: AssetAllocation[];
  totalAllocated: number;
  remaining: number;
  isValid: boolean;
  errorMessage?: string;
}

function computeFromInput(
  label: 'gold' | 'usd' | 'rub',
  netIncomeRub: number,
  rawInput: string | number | undefined,
  rates: AllocationRates
): AssetAllocation | null {
  const parsed = parsePercentOrAmount(rawInput as string | number | undefined);
  if (!parsed) return null;

  if (label === 'gold') {
    let amountRub: number;
    let percentOfNet: number | undefined;
    if (parsed.kind === 'percent') {
      amountRub = (netIncomeRub * parsed.value) / 100;
      percentOfNet = parsed.value;
    } else {
      amountRub = parsed.value;
    }
    const gramsOfGold = amountRub / rates.goldPerGramRub;
    return {
      asset: 'gold',
      amountRub,
      details: {
        gramsOfGold,
        percentOfNet
      }
    };
  }

  if (label === 'usd') {
    let amountRub: number;
    let usdAmount: number;
    let percentOfNet: number | undefined;
    if (parsed.kind === 'percent') {
      amountRub = (netIncomeRub * parsed.value) / 100;
      usdAmount = amountRub / rates.usdToRub;
      percentOfNet = parsed.value;
    } else {
      usdAmount = parsed.value;
      amountRub = usdAmount * rates.usdToRub;
    }
    return {
      asset: 'usd',
      amountRub,
      details: {
        usdAmount,
        percentOfNet
      }
    };
  }

  // rub
  let amountRub: number;
  let percentOfNet: number | undefined;
  if (parsed.kind === 'percent') {
    amountRub = (netIncomeRub * parsed.value) / 100;
    percentOfNet = parsed.value;
  } else {
    amountRub = parsed.value;
  }

  return {
    asset: 'rub',
    amountRub,
    details: {
      percentOfNet
    }
  };
}

export function allocateAssets(params: {
  netIncomeRub: number;
  goldInput?: string | number;
  usdInput?: string | number;
  rubInput?: string | number;
  rates: AllocationRates;
}): AllocationResult {
  const { netIncomeRub, goldInput, usdInput, rubInput, rates } = params;

  if (!Number.isFinite(netIncomeRub) || netIncomeRub < 0) {
    throw new Error('netIncomeRub must be a non-negative number');
  }

  const allocations: AssetAllocation[] = [];

  const gold = computeFromInput('gold', netIncomeRub, goldInput, rates);
  if (gold) allocations.push(gold);

  const usd = computeFromInput('usd', netIncomeRub, usdInput, rates);
  if (usd) allocations.push(usd);

  const rub = computeFromInput('rub', netIncomeRub, rubInput, rates);
  if (rub) allocations.push(rub);

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amountRub, 0);
  const remaining = netIncomeRub - totalAllocated;

  if (totalAllocated > netIncomeRub + 1e-6) {
    return {
      allocations,
      totalAllocated,
      remaining,
      isValid: false,
      errorMessage:
        'Суммарное распределение по активам превышает доступный чистый доход. Скорректируйте проценты или суммы.'
    };
  }

  return {
    allocations,
    totalAllocated,
    remaining,
    isValid: true
  };
}

