import { Command } from 'commander';

import { allocateAssets } from './domain/allocation.js';
import { splitNetIncomeByWorkdays } from './domain/salarySplit.js';
import { calculateNetIncome } from './domain/tax.js';
import { getGoldPricePerGramRub, getUsdToRubRate } from './services/rates.js';
import { loadConfig, saveConfig, type MonestoConfig } from './services/config.js';
import { askMissingParameters } from './ui/prompts.js';
import { renderAllocationTable, renderSummary } from './ui/table.js';

interface CliOptions {
  money?: string;
  tax?: string;
  currency?: string;
  imprestDate?: string;
  gold?: string;
  usd?: string;
  rub?: string;
}

function mergeConfig(saved: Partial<MonestoConfig>, args: CliOptions): MonestoConfig {
  const config: MonestoConfig = {
    money: saved.money,
    tax: saved.tax,
    currency: saved.currency ?? 'rub',
    imprestDate: saved.imprestDate,
    gold: saved.gold,
    usd: saved.usd,
    rub: saved.rub
  };

  if (args.money != null) {
    const value = Number(args.money);
    if (Number.isFinite(value)) {
      config.money = value;
    }
  }

  if (args.tax != null) {
    config.tax = args.tax;
  }

  if (args.currency != null) {
    config.currency = args.currency;
  }

  if (args.imprestDate != null) {
    const value = Number(args.imprestDate);
    if (Number.isFinite(value)) {
      config.imprestDate = value;
    }
  }

  if (args.gold != null) {
    config.gold = args.gold;
  }
  if (args.usd != null) {
    config.usd = args.usd;
  }
  if (args.rub != null) {
    config.rub = args.rub;
  }

  return config;
}

async function handleCalculate(options: CliOptions): Promise<void> {
  const saved = await loadConfig();
  const merged = mergeConfig(saved, options);

  const completed = await askMissingParameters(merged);

  if (completed.money == null) {
    console.error('Не указан месячный доход (--money).');
    process.exit(1);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const gross = completed.money;
  const taxInput = completed.tax;

  const taxResult = calculateNetIncome(gross, taxInput);

  const split = splitNetIncomeByWorkdays({
    netIncome: taxResult.netIncome,
    year,
    month
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
  renderAllocationTable(allocation, taxResult.netIncome);

  await saveConfig({
    money: gross,
    tax: taxInput,
    currency: completed.currency ?? 'rub',
    imprestDate: completed.imprestDate ?? 25,
    gold: completed.gold,
    usd: completed.usd,
    rub: completed.rub
  });
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

