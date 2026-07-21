import { Text, View } from 'react-native';

import { calculateSalaryPaymentAmount } from '@/lib/report/calculateSalaryPayment';
import type { MoneyFlowEntry } from '@/lib/types';
import { formatRub } from '@/lib/utils/format';

interface Props {
  mode: 'income' | 'expense';
  entries: MoneyFlowEntry[];
}

export function MoneyFlowSummary({ mode, entries }: Props) {
  const filled = entries.filter((entry) => entry.name.trim());

  const monthlyTotal =
    mode === 'income'
      ? entries.reduce((sum, entry) => {
          if (entry.isOneTime) return sum;
          if (entry.isBimonthlySalary) {
            return sum + Number(entry.monthlyAmount ?? (entry.amount || 0));
          }
          return sum + Number(entry.amount || 0);
        }, 0)
      : entries.reduce((sum, entry) => {
          if (entry.isOneTime) return sum;
          return sum + Number(entry.amount || 0);
        }, 0);

  const oneTimeTotal = entries.reduce((sum, entry) => {
    if (!entry.isOneTime) return sum;
    return sum + Number(entry.amount || 0);
  }, 0);

  let hint: string | null = null;
  const bimonthly = entries.find((entry) => entry.isBimonthlySalary && entry.name.trim());
  if (bimonthly) {
    const monthly = Number(bimonthly.monthlyAmount ?? bimonthly.amount);
    if (monthly) {
      const now = new Date();
      const pay25 = calculateSalaryPaymentAmount(
        monthly,
        25,
        new Date(now.getFullYear(), now.getMonth(), 25),
      );
      const pay10 = calculateSalaryPaymentAmount(
        monthly,
        10,
        new Date(now.getFullYear(), now.getMonth(), 10),
      );
      hint = `Зарплата: 10-е ≈ ${formatRub(pay10.amount)}, 25-е ≈ ${formatRub(pay25.amount)}`;
    }
  }

  return (
    <View className="mb-5 overflow-hidden rounded-3xl bg-slate-900 px-5 py-5">
      <View className="flex-row items-end justify-between">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {mode === 'income' ? 'За месяц' : 'Расходы за месяц'}
          </Text>
          <Text className="mt-1 text-3xl font-bold text-white" testID="money-flow-total">
            {formatRub(monthlyTotal)}
          </Text>
        </View>
        <View className="items-end rounded-2xl bg-slate-800 px-3 py-2">
          <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Записей
          </Text>
          <Text className="text-lg font-bold text-white">{filled.length}</Text>
        </View>
      </View>

      {oneTimeTotal > 0 ? (
        <Text className="mt-3 text-xs text-slate-400">
          + разовые: {formatRub(oneTimeTotal)}
        </Text>
      ) : null}

      {hint ? <Text className="mt-2 text-xs leading-4 text-slate-400">{hint}</Text> : null}
    </View>
  );
}
