import Table from 'cli-table3';

import type { AllocationResult } from '../domain/allocation.js';
import type { SalarySplitResult } from '../domain/salarySplit.js';
import type { TaxResult } from '../domain/tax.js';

function formatCurrency(value: number): string {
  return value.toFixed(2);
}

export function renderSummary(
  gross: number,
  tax: TaxResult,
  split: SalarySplitResult
): void {
  console.log('--- Доход и выплаты ---');
  console.log(`Гросс-доход: ${formatCurrency(gross)} RUB`);
  console.log(`Налог:       ${formatCurrency(tax.taxAmount)} RUB`);
  console.log(`Чистый доход: ${formatCurrency(tax.netIncome)} RUB`);
  console.log('');

  const { start: advStart, end: advEnd } = split.advancePeriod;
  const salaryTailStart = advEnd + 1;

  console.log('--- Аванс и зарплата (по рабочим дням) ---');
  console.log(
    `Зарплата (${split.salaryDate.toLocaleDateString()}): ${formatCurrency(split.salaryAmount)} RUB — за ${salaryTailStart}–конец прошлого месяца`
  );
  console.log(
    `Аванс (${split.imprestDate.toLocaleDateString()}):   ${formatCurrency(split.imprestAmount)} RUB — за ${advStart}–${advEnd} число текущего месяца`
  );
  console.log(
    `Рабочие дни: всего=${split.workdays.total}, зарплата (${salaryTailStart}–конец прошл.)=${split.workdays.salary}, аванс (${advStart}–${advEnd} тек. мес.)=${split.workdays.imprest}`
  );
  console.log('');
}

export function renderAllocationTable(allocation: AllocationResult): void {
  console.log('--- Распределение по активам ---');

  const table = new Table({
    head: ['Актив', 'Описание', 'Сумма, RUB', 'Доп. данные']
  });

  for (const item of allocation.allocations) {
    const { asset, amountRub, details } = item;
    const percent =
      details.percentOfNet != null ? `${details.percentOfNet.toFixed(2)}% от чистого дохода` : '';

    if (asset === 'gold') {
      table.push([
        'Золото',
        'Инвестиции в золото',
        formatCurrency(amountRub),
        `~${(details.gramsOfGold ?? 0).toFixed(3)} г${percent ? `, ${percent}` : ''}`
      ]);
    } else if (asset === 'usd') {
      table.push([
        'USD',
        'Инвестиции в доллары США',
        formatCurrency(amountRub),
        `${(details.usdAmount ?? 0).toFixed(2)} USD${percent ? `, ${percent}` : ''}`
      ]);
    } else {
      table.push([
        'RUB',
        'Оставляем в рублях',
        formatCurrency(amountRub),
        percent
      ]);
    }
  }

  console.log(table.toString());

  console.log('');
  console.log(`Итого распределено: ${formatCurrency(allocation.totalAllocated)} RUB`);
  console.log(`Остаток:            ${formatCurrency(allocation.remaining)} RUB`);

  if (!allocation.isValid && allocation.errorMessage) {
    console.log('');
    console.log('ВНИМАНИЕ: ' + allocation.errorMessage);
  }
}

