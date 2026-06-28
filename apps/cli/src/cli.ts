import { Command } from 'commander';

import { allocateAssets } from './domain/allocation.js';
import { splitNetIncomeByWorkdays } from './domain/salarySplit.js';
import { calculateNetIncome } from './domain/tax.js';
import { getGoldPricePerGramRub, getUsdToRubRate } from './services/rates.js';
import { askMissingParameters } from './ui/prompts.js';
import { renderAllocationTable, renderSummary } from './ui/table.js';

interface CliOptions {
  money?: string;
  tax?: string;
  currency?: string;
  imprestDate?: string;
  advanceStart?: string;
  advanceEnd?: string;
  month?: string;
  year?: string;
  gold?: string;
  usd?: string;
  rub?: string;
}

function resolveYearMonth(options: CliOptions): { year: number; month: number } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (options.year != null) {
    const y = Number(options.year);
    if (!Number.isInteger(y) || y < 1970 || y > 2100) {
      console.error('Некорректный год (--year): укажите целое число, например 2026.');
      process.exit(1);
    }
    year = y;
  }

  if (options.month != null) {
    const m = Number(options.month);
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      console.error('Некорректный месяц (--month): укажите число от 1 до 12.');
      process.exit(1);
    }
    month = m;
  }

  return { year, month };
}

function optionsToParams(options: CliOptions): Partial<{
  money: number;
  tax: string;
  currency: string;
  imprestDate: number;
  advanceStart: number;
  advanceEnd: number;
  gold: string;
  usd: string;
  rub: string;
}> {
  const params: Record<string, unknown> = {};
  if (options.money != null) {
    const n = Number(options.money);
    if (Number.isFinite(n)) params.money = n;
  }
  if (options.tax != null) params.tax = options.tax;
  if (options.currency != null) params.currency = options.currency;
  if (options.imprestDate != null) {
    const n = Number(options.imprestDate);
    if (Number.isFinite(n)) params.imprestDate = n;
  }
  if (options.advanceStart != null) {
    const n = Number(options.advanceStart);
    if (Number.isFinite(n)) params.advanceStart = n;
  }
  if (options.advanceEnd != null) {
    const n = Number(options.advanceEnd);
    if (Number.isFinite(n)) params.advanceEnd = n;
  }
  if (options.gold != null) params.gold = options.gold;
  if (options.usd != null) params.usd = options.usd;
  if (options.rub != null) params.rub = options.rub;
  return params as Partial<{
    money: number;
    tax: string;
    currency: string;
    imprestDate: number;
    advanceStart: number;
    advanceEnd: number;
    gold: string;
    usd: string;
    rub: string;
  }>;
}

async function handleCalculate(options: CliOptions): Promise<void> {
  const completed = await askMissingParameters(optionsToParams(options));

  if (completed.money == null) {
    console.error('Не указан месячный доход (--money).');
    process.exit(1);
  }

  const { year, month } = resolveYearMonth(options);

  const gross = completed.money;
  const taxInput = completed.tax;

  const taxResult = calculateNetIncome(gross, taxInput);

  const advanceStart = completed.advanceStart ?? 1;
  const advanceEnd = completed.advanceEnd ?? 15;

  const split = splitNetIncomeByWorkdays({
    netIncome: taxResult.netIncome,
    year,
    month,
    advanceStartDay: advanceStart,
    advanceEndDay: advanceEnd
  });

  const [usdToRub, goldPerGramRub] = await Promise.all([
    getUsdToRubRate(),
    getGoldPricePerGramRub()
  ]);

  const allocation = allocateAssets({
    netIncomeRub: taxResult.netIncome,
    goldInput: completed.gold,
    usdInput: completed.usd,
    rubInput: completed.rub,
    rates: {
      usdToRub,
      goldPerGramRub
    }
  });

  if (!allocation.isValid) {
    if (allocation.errorMessage) {
      console.error(allocation.errorMessage);
    }
    process.exit(1);
  }

  renderSummary(gross, taxResult, split);
  renderAllocationTable(allocation);
}

export async function main(argv: string[]): Promise<void> {
  const program = new Command();

  program.name('@monesto/cli').description('CLI для расчёта дохода и распределения по активам.');

  program
    .command('calculate')
    .description('Рассчитать чистый доход, аванс/зарплату и распределение по активам.')
    .option('--money <number>', 'Месячный доход до налога (RUB).')
    .option('--tax <tax>', 'Налог: 13% или фиксированная сумма, например 31200.')
    .option('--currency <code>', 'Базовая валюта дохода (v1: только rub).', 'rub')
    .option('--imprest-date <day>', 'День месяца аванса (1-31).')
    .option('--advance-start <day>', 'Первый день периода аванса в текущем месяце (по умолчанию 1).', '1')
    .option('--advance-end <day>', 'Последний день периода аванса в текущем месяце (по умолчанию 15). Зарплата 10-го — за (advance-end+1)–конец прошлого месяца.', '15')
    .option('--month <number>', 'Месяц расчёта (1–12). По умолчанию — текущий месяц.')
    .option('--year <number>', 'Год расчёта. По умолчанию — текущий год.')
    .option('--gold <value>', 'Инвестиции в золото: процент (10%) или сумма в RUB (50000).')
    .option('--usd <value>', 'Инвестиции в USD: процент (10%) или сумма в USD (250).')
    .option('--rub <value>', 'Инвестиции в RUB: процент (10%) или сумма в RUB (50000).')
    .action(async (opts: CliOptions) => {
      try {
        await handleCalculate(opts);
      } catch (error) {
        console.error('Ошибка при выполнении расчёта:', error);
        process.exit(1);
      }
    });

  if (argv.length <= 2) {
    argv = [...argv, 'calculate'];
  }

  await program.parseAsync(argv);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Direct execution of compiled CLI (dist/cli.js)
  main(process.argv).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

