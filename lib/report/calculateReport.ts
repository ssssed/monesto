import { convertToRub } from '@/lib/exchange/convertToRub';
import { applyRules } from '@/lib/report/applyRules';
import {
  expandExpensesToLines,
  expandIncomeToLines,
  findPrimaryIncome,
  resolveReportWindow,
} from '@/lib/report/dateWindow';
import type {
  Asset,
  DistributionRule,
  Expense,
  IncomeSource,
  ReportError,
  ReportResult,
} from '@/lib/types';

function toCycleKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateReport(input: {
  incomes: IncomeSource[];
  expenses: Expense[];
  rules: DistributionRule[];
  assets: Asset[];
  today: Date;
  usdRubRate?: number;
}): ReportResult | ReportError {
  const primary = findPrimaryIncome(input.incomes);
  if (!primary) {
    return {
      code: 'NO_PRIMARY_SALARY',
      message: 'Не указана основная зарплата',
    };
  }

  const primaryPaymentDay = primary.primary_payment_day ?? 25;
  const { incomeDate, expenseEndExclusive, incomeStart } = resolveReportWindow(
    input.today,
    primaryPaymentDay,
  );

  const needsUsd =
    input.rules.some(
      (rule) =>
        rule.rule_type === 'fixed' &&
        rule.currency === 'asset' &&
        rule.target_asset_id != null &&
        input.assets.find((a) => a.id === rule.target_asset_id)?.provider === 'usd',
    ) || input.assets.some((asset) => asset.provider === 'usd');

  if (needsUsd && input.usdRubRate == null) {
    return {
      code: 'MISSING_USD_RATE',
      message: 'Курс USD/RUB ещё не загружен',
    };
  }

  const usdRubRate = input.usdRubRate ?? 82;

  const incomeLines = expandIncomeToLines(
    input.incomes,
    input.today,
    incomeDate,
    incomeStart,
  );
  const expenseLines = expandExpensesToLines(
    input.expenses,
    input.today,
    expenseEndExclusive,
  );

  const totalIncome = incomeLines.reduce((sum, line) => sum + line.amount, 0);
  const totalExpenses = expenseLines.reduce((sum, line) => sum + line.amount, 0);
  const remainder = totalIncome - totalExpenses;

  const allocations = applyRules(remainder, input.rules, input.assets, usdRubRate);
  const totalAllocations = allocations.reduce((sum, item) => sum + item.amountRub, 0);
  const freeMoney = remainder - totalAllocations;

  const incomingByAsset = new Map<number, number>();
  for (const allocation of allocations) {
    if (allocation.targetAssetId == null) continue;
    incomingByAsset.set(
      allocation.targetAssetId,
      (incomingByAsset.get(allocation.targetAssetId) ?? 0) + allocation.amountRub,
    );
  }

  const assetSummary = input.assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    nativeAmount: asset.current_amount,
    rubEquivalent:
      asset.provider === 'usd'
        ? convertToRub(asset.current_amount, 'usd', usdRubRate)
        : asset.current_amount,
    provider: asset.provider,
    icon: asset.icon,
    bg_color: asset.bg_color,
    icon_color: asset.icon_color,
    incomingRub: incomingByAsset.get(asset.id) ?? 0,
  }));

  return {
    targetDate: incomeDate,
    cycleKey: toCycleKey(incomeDate),
    incomeLines,
    totalIncome,
    expenseLines,
    totalExpenses,
    remainder,
    allocations,
    totalAllocations,
    freeMoney,
    assetSummary,
  };
}

export function isReportError(result: ReportResult | ReportError): result is ReportError {
  return 'code' in result;
}
