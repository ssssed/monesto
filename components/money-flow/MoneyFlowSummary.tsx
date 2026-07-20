import { Text, View } from 'react-native';

import { calculateSalaryPaymentAmount } from '@/lib/report/calculateSalaryPayment';
import type { MoneyFlowEntry } from '@/lib/types';
import { formatRub } from '@/lib/utils/format';

interface Props {
  mode: 'income' | 'expense';
  entries: MoneyFlowEntry[];
}

export function MoneyFlowSummary({ mode, entries }: Props) {
  const details = entries
    .filter((entry) => entry.name && (entry.amount || entry.monthlyAmount))
    .map((entry) => {
      if (entry.isBimonthlySalary) {
        const monthly = Number(entry.monthlyAmount ?? entry.amount);
        const now = new Date();
        const july25 = calculateSalaryPaymentAmount(
          monthly,
          25,
          new Date(now.getFullYear(), now.getMonth(), 25),
        );
        const day10 = new Date(now.getFullYear(), now.getMonth(), 10);
        const pay10 = calculateSalaryPaymentAmount(monthly, 10, day10);
        return {
          name: entry.name,
          text: `${formatRub(monthly)}/мес · 10: ${formatRub(pay10.amount)} · 25: ${formatRub(july25.amount)}`,
        };
      }

      const amount = Number(entry.amount);
      const suffix = entry.isOneTime
        ? (entry.specificDate ?? 'единоразово')
        : `${entry.paymentDay || entry.dueDay || '?'}-е`;
      return { name: entry.name, text: `${formatRub(amount)} · ${suffix}` };
    });

  const monthlyTotal =
    mode === 'income'
      ? entries.reduce((sum, entry) => {
          if (entry.isOneTime) return sum;
          if (entry.isBimonthlySalary) return sum + Number(entry.monthlyAmount ?? (entry.amount || 0));
          return sum + Number(entry.amount || 0);
        }, 0)
      : entries.reduce((sum, entry) => {
          if (entry.isOneTime) return sum;
          return sum + Number(entry.amount || 0);
        }, 0);

  return (
    <View className="mb-5 overflow-hidden rounded-3xl bg-slate-900">
      <View className="px-5 pb-4 pt-5">
        <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {mode === 'income' ? 'Доход за месяц' : 'Расходы за месяц'}
        </Text>
        <Text className="mt-1 text-4xl font-bold text-white" testID="money-flow-total">
          {formatRub(monthlyTotal)}
        </Text>
      </View>

      {details.length > 0 ? (
        <View className="border-t border-slate-800 px-5 py-3">
          {details.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              className={`flex-row items-start justify-between ${index > 0 ? 'mt-2.5' : ''}`}>
              <Text className="mr-3 flex-1 text-sm font-medium text-slate-200" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="max-w-[58%] text-right text-xs text-slate-400">{item.text}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
