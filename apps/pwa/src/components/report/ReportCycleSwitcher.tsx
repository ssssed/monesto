import { cn, SlidingToggleGroup } from '@monesto/rune';
import type { ReactNode } from 'react';

import type { ReportCycle } from '@/lib/report/dateWindow';
import { formatReportDate } from '@/lib/report/dateWindow';
import type { SalaryPaymentDay } from '@/lib/types';

function CycleLabel({
  cycle,
  active,
}: {
  cycle: ReportCycle;
  active: boolean;
}): ReactNode {
  const shifted =
    cycle.payoutDate.getTime() !== cycle.nominalDate.getTime();

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between gap-1">
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wide',
            active ? 'text-blue-600' : 'text-slate-400',
          )}
        >
          {cycle.paymentDay}-е
        </span>
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase',
            cycle.isPreview
              ? active
                ? 'bg-blue-50 text-blue-600'
                : 'bg-slate-200/80 text-slate-500'
              : active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-200/80 text-slate-500',
          )}
        >
          {cycle.isPreview ? 'план' : 'сейчас'}
        </span>
      </div>
      <p
        className={cn(
          'mt-1.5 text-base font-bold',
          active ? 'text-slate-900' : 'text-slate-500',
        )}
      >
        {formatReportDate(cycle.payoutDate)}
      </p>
      <p
        className={cn(
          'mt-0.5 text-[10px]',
          active ? 'text-slate-500' : 'text-slate-400',
        )}
      >
        {shifted
          ? `за ${cycle.nominalDate.getDate()}-е`
          : cycle.isPreview
            ? 'будущий цикл'
            : 'текущий цикл'}
      </p>
    </div>
  );
}

export function ReportCycleSwitcher({
  cycles,
  selectedDay,
  onSelect,
}: {
  cycles: ReportCycle[];
  selectedDay: SalaryPaymentDay;
  onSelect: (day: SalaryPaymentDay) => void;
}) {
  return (
    <SlidingToggleGroup
      size="lg"
      value={String(selectedDay)}
      onValueChange={(v) => onSelect(Number(v) as SalaryPaymentDay)}
      trackClassName="rounded-3xl bg-slate-100"
      pillClassName="rounded-2xl shadow-[0_2px_8px_rgb(15_23_42/0.08)]"
      options={cycles.map((cycle) => ({
        value: String(cycle.paymentDay),
        className: 'items-stretch justify-start px-3 py-3',
        label: (
          <CycleLabel
            cycle={cycle}
            active={cycle.paymentDay === selectedDay}
          />
        ),
      }))}
    />
  );
}
