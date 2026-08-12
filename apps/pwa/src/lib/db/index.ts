/**
 * Local persistence for Monesto PWA — mirrors SQLite schema v3 as one JSON blob.
 */

import type {
  Asset,
  AssetProvider,
  AssetTransaction,
  DistributionRule,
  Expense,
  IncomeSource,
  MoneyFlowEntry,
  VacationPeriod,
} from '../types';
import {
  applyEarlyRepayment,
  creditRemainingMonthsFromSchedule,
  creditScheduleContext,
  resolveRemainingMonthsForRecalc,
  roundMoney,
} from '../credit/plan';
import { assetSlug } from '../utils/slug';

const STORAGE_KEY = 'monesto-pwa-v3';

interface Confirmation {
  id: number;
  rule_id: number;
  cycle_key: string;
  confirmed_at: string;
  amount_rub: number;
}

interface Rejection {
  id: number;
  rule_id: number;
  cycle_key: string;
  rejected_at: string;
}

export interface AppDatabase {
  meta: Record<string, string>;
  income_sources: IncomeSource[];
  expenses: Expense[];
  assets: Asset[];
  asset_transactions: AssetTransaction[];
  distribution_rules: DistributionRule[];
  vacation_periods: VacationPeriod[];
  allocation_confirmations: Confirmation[];
  allocation_rejections: Rejection[];
  nextIds: {
    income: number;
    expense: number;
    asset: number;
    transaction: number;
    rule: number;
    vacation: number;
    confirmation: number;
    rejection: number;
  };
}

function emptyDb(): AppDatabase {
  return {
    meta: {
      schema_version: '3',
      onboarding_completed: 'false',
    },
    income_sources: [],
    expenses: [],
    assets: [],
    asset_transactions: [],
    distribution_rules: [],
    vacation_periods: [],
    allocation_confirmations: [],
    allocation_rejections: [],
    nextIds: {
      income: 1,
      expense: 1,
      asset: 1,
      transaction: 1,
      rule: 1,
      vacation: 1,
      confirmation: 1,
      rejection: 1,
    },
  };
}

function load(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const db = emptyDb();
      save(db);
      return db;
    }
    const parsed = JSON.parse(raw) as AppDatabase;
    parsed.income_sources = (parsed.income_sources ?? []).map((income) => ({
      ...income,
      salary_tranches: income.salary_tranches ?? null,
    }));
    parsed.vacation_periods = parsed.vacation_periods ?? [];
    parsed.expenses = (parsed.expenses ?? []).map((expense) => ({
      ...expense,
      linked_asset_id: expense.linked_asset_id ?? null,
    }));
    parsed.assets = (parsed.assets ?? []).map((asset) => ({
      ...asset,
      linked_expense_id: asset.linked_expense_id ?? null,
      credit_annual_rate: asset.credit_annual_rate ?? null,
      credit_term_months: asset.credit_term_months ?? null,
      credit_start_date: asset.credit_start_date ?? null,
      credit_remaining_months: asset.credit_remaining_months ?? null,
      credit_early_repay_mode: asset.credit_early_repay_mode ?? null,
    }));
    parsed.distribution_rules = (parsed.distribution_rules ?? []).map((rule) => ({
      ...rule,
      credit_early_repay_mode: rule.credit_early_repay_mode ?? null,
    }));
    parsed.nextIds = {
      ...emptyDb().nextIds,
      ...parsed.nextIds,
    };
    return parsed;
  } catch {
    const db = emptyDb();
    save(db);
    return db;
  }
}

function save(db: AppDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function withDb<T>(mutator: (db: AppDatabase) => T): T {
  const db = load();
  const result = mutator(db);
  save(db);
  return result;
}

export async function getMeta(key: string): Promise<string | null> {
  return load().meta[key] ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  withDb((db) => {
    db.meta[key] = value;
  });
}

export async function isOnboardingCompleted(): Promise<boolean> {
  return (await getMeta('onboarding_completed')) === 'true';
}

export async function completeOnboarding(): Promise<void> {
  await setMeta('onboarding_completed', 'true');
}

export async function clearAllData(): Promise<void> {
  withDb((db) => {
    db.income_sources = [];
    db.expenses = [];
    db.assets = [];
    db.asset_transactions = [];
    db.distribution_rules = [];
    db.vacation_periods = [];
    db.allocation_confirmations = [];
    db.allocation_rejections = [];
    db.meta.onboarding_completed = 'false';
  });
}

export async function getAllVacations(): Promise<VacationPeriod[]> {
  return [...load().vacation_periods].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  );
}

export async function replaceAllVacations(
  periods: Omit<VacationPeriod, 'id'>[],
): Promise<void> {
  withDb((db) => {
    db.vacation_periods = periods.map((period) => ({
      id: db.nextIds.vacation++,
      start_date: period.start_date,
      end_date: period.end_date,
    }));
  });
}

export async function getAllIncomes(): Promise<IncomeSource[]> {
  return load().income_sources;
}

export async function replaceAllIncomes(entries: MoneyFlowEntry[]): Promise<void> {
  withDb((db) => {
    db.income_sources = entries.map((entry) => {
      const isBimonthly = Boolean(entry.isBimonthlySalary);
      const id = db.nextIds.income++;
      return {
        id,
        name: entry.name,
        income_kind: isBimonthly ? 'bimonthly_salary' : 'fixed',
        amount: isBimonthly ? null : Number(entry.amount),
        monthly_amount: isBimonthly
          ? Number(entry.monthlyAmount ?? entry.amount)
          : null,
        is_one_time: Boolean(entry.isOneTime),
        recurrence: entry.isOneTime ? 'one_time' : 'monthly',
        payment_day: entry.paymentDay ? Number(entry.paymentDay) : null,
        is_primary: Boolean(entry.isPrimary),
        primary_payment_day: entry.isPrimary
          ? entry.primaryPaymentDay ??
            (isBimonthly
              ? entry.salaryTranches?.[entry.salaryTranches.length - 1]
                  ?.paymentDay ?? 25
              : entry.paymentDay
                ? Number(entry.paymentDay)
                : null)
          : null,
        specific_date: entry.specificDate ?? null,
        salary_tranches: isBimonthly
          ? entry.salaryTranches?.length
            ? entry.salaryTranches
            : [
                {
                  paymentDay: 10,
                  periodFromDay: 16,
                  periodToDay: 31,
                  periodMonthOffset: -1 as const,
                },
                {
                  paymentDay: 25,
                  periodFromDay: 1,
                  periodToDay: 15,
                  periodMonthOffset: 0 as const,
                },
              ]
          : null,
      };
    });
  });
}

export async function getAllExpenses(): Promise<Expense[]> {
  return load().expenses;
}

export async function replaceAllExpenses(entries: MoneyFlowEntry[]): Promise<void> {
  withDb((db) => {
    db.expenses = entries.map((entry) => {
      const existingId =
        entry.id && /^\d+$/.test(entry.id) ? Number(entry.id) : null;
      let id: number;
      if (existingId != null && existingId > 0) {
        id = existingId;
        db.nextIds.expense = Math.max(db.nextIds.expense, existingId + 1);
      } else {
        id = db.nextIds.expense++;
      }
      return {
        id,
        name: entry.name,
        amount: Number(entry.amount),
        recurrence: entry.isOneTime ? 'one_time' : 'monthly',
        due_day: entry.dueDay ? Number(entry.dueDay) : null,
        specific_date: entry.specificDate ?? null,
        linked_asset_id: entry.linkedAssetId
          ? Number(entry.linkedAssetId)
          : null,
      };
    });

    // Sync asset.linked_expense_id from expenses
    for (const asset of db.assets) {
      if (asset.provider !== 'credit') continue;
      const linked = db.expenses.find((e) => e.linked_asset_id === asset.id);
      asset.linked_expense_id = linked?.id ?? null;
    }
  });
}

export async function getAllAssets(): Promise<Asset[]> {
  return load().assets;
}

export async function getAssetById(id: number): Promise<Asset | null> {
  return load().assets.find((a) => a.id === id) ?? null;
}

export async function getAssetBySlug(slug: string): Promise<Asset | null> {
  const assets = load().assets;
  const direct = assets.find((a) => assetSlug(a) === slug);
  if (direct) return direct;
  const idTail = slug.match(/-(\d+)$/);
  if (idTail) {
    return assets.find((a) => a.id === Number(idTail[1])) ?? null;
  }
  return null;
}

export async function createAsset(input: {
  name: string;
  provider: AssetProvider;
  purpose?: string;
  goal_amount?: number;
  current_amount: number;
  icon?: string;
  bg_color?: string;
  icon_color?: string;
  cost_basis_rub?: number;
  /** Создать связанный ежемесячный расход (для credit). */
  credit_payment?: { amount: number; due_day: number };
  credit_annual_rate?: number | null;
  credit_term_months?: number | null;
  credit_start_date?: string | null;
  credit_remaining_months?: number | null;
  credit_early_repay_mode?: 'reduce_term' | 'reduce_payment' | null;
}): Promise<number> {
  return withDb((db) => {
    const id = db.nextIds.asset++;
    const isCredit = input.provider === 'credit';
    const costBasis = isCredit
      ? 0
      : (input.cost_basis_rub ??
        (input.provider === 'rub' ? input.current_amount : 0));

    let linkedExpenseId: number | null = null;
    if (isCredit && input.credit_payment && input.credit_payment.amount > 0) {
      linkedExpenseId = db.nextIds.expense++;
      db.expenses.push({
        id: linkedExpenseId,
        name: `Платёж · ${input.name}`,
        amount: input.credit_payment.amount,
        recurrence: 'monthly',
        due_day: input.credit_payment.due_day,
        specific_date: null,
        linked_asset_id: id,
      });
    }

    const termMonths = isCredit ? (input.credit_term_months ?? null) : null;
    const startDate = isCredit ? (input.credit_start_date ?? null) : null;
    const remainingMonths = isCredit
      ? (input.credit_remaining_months ?? termMonths)
      : null;

    db.assets.push({
      id,
      name: input.name,
      provider: input.provider,
      purpose: input.purpose ?? null,
      goal_amount: input.goal_amount ?? null,
      current_amount: input.current_amount,
      steam_inventory_url: null,
      icon: input.icon ?? (isCredit ? 'card' : 'wallet'),
      bg_color: input.bg_color ?? (isCredit ? '#FEF2F2' : '#DBEAFE'),
      icon_color: input.icon_color ?? (isCredit ? '#991B1B' : '#2563EB'),
      cost_basis_rub: costBasis,
      linked_expense_id: linkedExpenseId,
      credit_annual_rate: isCredit ? (input.credit_annual_rate ?? null) : null,
      credit_term_months: termMonths,
      credit_start_date: startDate,
      credit_remaining_months: remainingMonths,
      credit_early_repay_mode: isCredit
        ? (input.credit_early_repay_mode ??
          (input.credit_annual_rate ? 'reduce_term' : null))
        : null,
    });

    if (input.current_amount !== 0) {
      db.asset_transactions.push({
        id: db.nextIds.transaction++,
        asset_id: id,
        amount_delta: input.current_amount,
        note: isCredit ? 'Начальный долг' : 'Начальный баланс',
        created_at: new Date().toISOString(),
        cost_rub: costBasis || null,
      });
    }

    return id;
  });
}

export async function updateAsset(
  id: number,
  input: {
    name?: string;
    purpose?: string | null;
    goal_amount?: number | null;
    icon?: string;
    bg_color?: string;
    icon_color?: string;
    linked_expense_id?: number | null;
    current_amount?: number;
    credit_annual_rate?: number | null;
    credit_term_months?: number | null;
    credit_start_date?: string | null;
    credit_remaining_months?: number | null;
    credit_early_repay_mode?: 'reduce_term' | 'reduce_payment' | null;
  },
): Promise<void> {
  withDb((db) => {
    const asset = db.assets.find((a) => a.id === id);
    if (!asset) return;
    if (input.name !== undefined) asset.name = input.name;
    if (input.purpose !== undefined) asset.purpose = input.purpose;
    if (input.goal_amount !== undefined) asset.goal_amount = input.goal_amount;
    if (input.icon !== undefined) asset.icon = input.icon;
    if (input.bg_color !== undefined) asset.bg_color = input.bg_color;
    if (input.icon_color !== undefined) asset.icon_color = input.icon_color;
    if (input.linked_expense_id !== undefined) {
      asset.linked_expense_id = input.linked_expense_id;
    }
    if (input.current_amount !== undefined) {
      asset.current_amount = Math.max(0, input.current_amount);
    }
    if (input.credit_annual_rate !== undefined) {
      asset.credit_annual_rate = input.credit_annual_rate;
    }
    if (input.credit_term_months !== undefined) {
      asset.credit_term_months = input.credit_term_months;
    }
    if (input.credit_start_date !== undefined) {
      asset.credit_start_date = input.credit_start_date;
    }
    if (input.credit_remaining_months !== undefined) {
      asset.credit_remaining_months = input.credit_remaining_months;
    }
    if (input.credit_early_repay_mode !== undefined) {
      asset.credit_early_repay_mode = input.credit_early_repay_mode;
    }
  });
}

export async function addTransaction(
  assetId: number,
  amountDelta: number,
  note?: string,
  costRubDelta?: number,
  options?: {
    earlyRepayMode?: 'reduce_term' | 'reduce_payment' | null;
  },
): Promise<void> {
  withDb((db) => {
    const asset = db.assets.find((a) => a.id === assetId);
    if (!asset) return;

    if (asset.provider === 'credit') {
      // Положительный delta = погашение → долг уменьшается.
      if (amountDelta >= 0) {
        const pay = Math.abs(amountDelta);
        const debtBefore = asset.current_amount;
        const rate = asset.credit_annual_rate;
        const mode =
          options?.earlyRepayMode ??
          asset.credit_early_repay_mode ??
          'reduce_term';
        const expense =
          asset.linked_expense_id != null
            ? (db.expenses.find((e) => e.id === asset.linked_expense_id) ?? null)
            : (db.expenses.find((e) => e.linked_asset_id === assetId) ?? null);

        let toPrincipal = pay;
        if (rate != null && rate > 0 && expense != null) {
          const schedule = creditScheduleContext(
            asset,
            expense.due_day,
          );
          const monthsBefore = resolveRemainingMonthsForRecalc(
            debtBefore,
            expense.amount,
            rate,
            asset.credit_remaining_months,
            schedule,
          );
          if (
            monthsBefore != null &&
            monthsBefore > 0 &&
            expense.amount > 0 &&
            debtBefore > 0
          ) {
            const result = applyEarlyRepayment({
              remainingDebt: debtBefore,
              extraPayment: pay,
              monthlyPayment: expense.amount,
              annualPercent: rate,
              mode,
              remainingMonths: monthsBefore,
              dueDay: expense.due_day,
            });
            toPrincipal = result.toPrincipal;
            asset.current_amount = result.newDebt;
            if (mode === 'reduce_payment' && result.newPayment >= 0) {
              expense.amount = result.newPayment;
              asset.credit_remaining_months = schedule
                ? creditRemainingMonthsFromSchedule({
                    startDate: schedule.startDate,
                    termMonths: schedule.termMonths,
                    paymentDay: schedule.paymentDay,
                  })
                : result.newMonthsLeft;
            } else if (mode === 'reduce_term') {
              asset.credit_remaining_months = result.newMonthsLeft;
            }
          } else {
            asset.current_amount = Math.max(
              0,
              roundMoney(asset.current_amount - pay),
            );
          }
        } else {
          asset.current_amount = Math.max(
            0,
            roundMoney(asset.current_amount - pay),
          );
        }

        db.asset_transactions.push({
          id: db.nextIds.transaction++,
          asset_id: assetId,
          amount_delta: -toPrincipal,
          note: note ?? 'Погашение',
          created_at: new Date().toISOString(),
          cost_rub: pay,
        });
      } else {
        const add = Math.abs(amountDelta);
        db.asset_transactions.push({
          id: db.nextIds.transaction++,
          asset_id: assetId,
          amount_delta: add,
          note: note ?? 'Увеличение долга',
          created_at: new Date().toISOString(),
          cost_rub: null,
        });
        asset.current_amount = roundMoney(asset.current_amount + add);
      }
      return;
    }

    let costDelta = costRubDelta ?? 0;
    if (costRubDelta == null) {
      if (asset.provider === 'rub') {
        costDelta = amountDelta;
      } else if (
        asset.provider === 'usd' &&
        amountDelta < 0 &&
        asset.current_amount > 0
      ) {
        const avg = asset.cost_basis_rub / asset.current_amount;
        costDelta = avg * amountDelta;
      }
    }

    db.asset_transactions.push({
      id: db.nextIds.transaction++,
      asset_id: assetId,
      amount_delta: amountDelta,
      note: note ?? null,
      created_at: new Date().toISOString(),
      cost_rub: costDelta || null,
    });

    asset.current_amount += amountDelta;
    asset.cost_basis_rub = Math.max(0, asset.cost_basis_rub + costDelta);
  });
}

export async function depositFromAllocation(
  assetId: number,
  amountRub: number,
  usdRubRate: number,
  note: string,
  options?: {
    earlyRepayMode?: 'reduce_term' | 'reduce_payment' | null;
  },
): Promise<void> {
  const asset = await getAssetById(assetId);
  if (!asset) return;

  if (asset.provider === 'usd') {
    const usdAmount = amountRub / usdRubRate;
    await addTransaction(assetId, usdAmount, note, amountRub);
  } else if (asset.provider === 'credit') {
    await addTransaction(
      assetId,
      amountRub,
      note || 'Погашение из отчёта',
      amountRub,
      { earlyRepayMode: options?.earlyRepayMode },
    );
  } else {
    await addTransaction(assetId, amountRub, note, amountRub);
  }
}

export async function getTransactions(
  assetId: number,
): Promise<AssetTransaction[]> {
  return load()
    .asset_transactions.filter((tx) => tx.asset_id === assetId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getAssetTrend(
  assetId: number,
): Promise<'up' | 'down' | 'flat'> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const total = load()
    .asset_transactions.filter(
      (tx) =>
        tx.asset_id === assetId &&
        new Date(tx.created_at).getTime() >= cutoff.getTime(),
    )
    .reduce((sum, tx) => sum + tx.amount_delta, 0);
  if (total > 0) return 'up';
  if (total < 0) return 'down';
  return 'flat';
}

export async function deleteAsset(assetId: number): Promise<void> {
  withDb((db) => {
    const rules = db.distribution_rules.filter(
      (r) => r.target_asset_id === assetId,
    );
    const ruleIds = new Set(rules.map((r) => r.id));
    db.allocation_confirmations = db.allocation_confirmations.filter(
      (c) => !ruleIds.has(c.rule_id),
    );
    db.allocation_rejections = db.allocation_rejections.filter(
      (r) => !ruleIds.has(r.rule_id),
    );
    db.distribution_rules = db.distribution_rules.filter(
      (r) => r.target_asset_id !== assetId,
    );
    db.asset_transactions = db.asset_transactions.filter(
      (tx) => tx.asset_id !== assetId,
    );
    for (const expense of db.expenses) {
      if (expense.linked_asset_id === assetId) {
        expense.linked_asset_id = null;
      }
    }
    db.assets = db.assets.filter((a) => a.id !== assetId);
  });
}

export async function getAllRules(): Promise<DistributionRule[]> {
  return [...load().distribution_rules].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
  );
}

export async function getRuleById(id: number): Promise<DistributionRule | null> {
  return load().distribution_rules.find((r) => r.id === id) ?? null;
}

export async function createRule(
  input: Omit<DistributionRule, 'id'>,
): Promise<number> {
  return withDb((db) => {
    const id = db.nextIds.rule++;
    db.distribution_rules.push({ id, ...input });
    return id;
  });
}

export async function updateRule(
  id: number,
  input: Omit<DistributionRule, 'id'>,
): Promise<void> {
  withDb((db) => {
    const idx = db.distribution_rules.findIndex((r) => r.id === id);
    if (idx === -1) return;
    db.distribution_rules[idx] = { id, ...input };
  });
}

export async function deleteRule(id: number): Promise<void> {
  withDb((db) => {
    db.distribution_rules = db.distribution_rules.filter((r) => r.id !== id);
    db.allocation_confirmations = db.allocation_confirmations.filter(
      (c) => c.rule_id !== id,
    );
    db.allocation_rejections = db.allocation_rejections.filter(
      (r) => r.rule_id !== id,
    );
  });
}

export async function isAllocationConfirmed(
  ruleId: number,
  cycleKey: string,
): Promise<boolean> {
  return load().allocation_confirmations.some(
    (c) => c.rule_id === ruleId && c.cycle_key === cycleKey,
  );
}

export async function isAllocationRejected(
  ruleId: number,
  cycleKey: string,
): Promise<boolean> {
  return load().allocation_rejections.some(
    (r) => r.rule_id === ruleId && r.cycle_key === cycleKey,
  );
}

export async function getConfirmedRuleIds(cycleKey: string): Promise<number[]> {
  return load()
    .allocation_confirmations.filter((c) => c.cycle_key === cycleKey)
    .map((c) => c.rule_id);
}

export async function getRejectedRuleIds(cycleKey: string): Promise<number[]> {
  return load()
    .allocation_rejections.filter((r) => r.cycle_key === cycleKey)
    .map((r) => r.rule_id);
}

export async function confirmAllocation(input: {
  ruleId: number;
  cycleKey: string;
  amountRub: number;
}): Promise<'ok' | 'already_confirmed' | 'already_rejected'> {
  if (await isAllocationRejected(input.ruleId, input.cycleKey)) {
    return 'already_rejected';
  }
  if (await isAllocationConfirmed(input.ruleId, input.cycleKey)) {
    return 'already_confirmed';
  }
  withDb((db) => {
    db.allocation_confirmations.push({
      id: db.nextIds.confirmation++,
      rule_id: input.ruleId,
      cycle_key: input.cycleKey,
      confirmed_at: new Date().toISOString(),
      amount_rub: input.amountRub,
    });
  });
  return 'ok';
}

export async function rejectAllocation(input: {
  ruleId: number;
  cycleKey: string;
}): Promise<'ok' | 'already_confirmed' | 'already_rejected'> {
  if (await isAllocationConfirmed(input.ruleId, input.cycleKey)) {
    return 'already_confirmed';
  }
  if (await isAllocationRejected(input.ruleId, input.cycleKey)) {
    return 'already_rejected';
  }
  withDb((db) => {
    db.allocation_rejections.push({
      id: db.nextIds.rejection++,
      rule_id: input.ruleId,
      cycle_key: input.cycleKey,
      rejected_at: new Date().toISOString(),
    });
  });
  return 'ok';
}
