import { Button } from '@monesto/rune';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, GitBranch, Target, Wallet } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';

const STEPS = [
  {
    step: '1',
    icon: Wallet,
    title: 'Создайте активы',
    desc: 'Подушка, доллары, отпуск — куда уходят свободные деньги',
  },
  {
    step: '2',
    icon: GitBranch,
    title: 'Задайте правила',
    desc: 'Процент или фикс с остатка — суммы посчитаются сами',
  },
  {
    step: '3',
    icon: Target,
    title: 'Подтверждайте в отчёте',
    desc: 'В день выплаты свайпайте: применить или отложить',
  },
] as const;

export function AssetsIntroScreen() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <main className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold tracking-[0.22em] text-blue-600">
            MONESTO
          </p>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 ring-1 ring-blue-100">
            Шаг 2 из 4
          </span>
        </div>

        <div className="mt-10 flex-1">
          <h1 className="text-[1.85rem] font-bold leading-tight tracking-tight text-slate-900">
            Активы и правила
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
            После доходов и расходов остаётся свободная сумма. Правила решают,
            сколько уйдёт в каждый актив.
          </p>

          <div className="mt-8 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
              <span className="text-sm text-slate-500">Остаток цикла</span>
              <span className="text-sm font-bold tabular-nums text-slate-900">
                81 674 ₽
              </span>
            </div>
            <div className="my-2 flex justify-center">
              <div className="h-4 w-px bg-slate-200" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3.5 py-3">
              <span className="text-sm text-blue-600">В активы по правилам</span>
              <span className="text-sm font-bold text-blue-700">авто</span>
            </div>
          </div>

          <ol className="mt-8 space-y-4">
            {STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex items-start gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" strokeWidth={1.85} />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-navy)] text-[9px] font-bold text-white">
                      {item.step}
                    </span>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-snug text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-10 shrink-0 space-y-2">
          <Button
            variant="navy"
            size="lg"
            className="w-full"
            onClick={() => void navigate({ to: '/onboarding/income' })}
          >
            Дальше — доходы
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="w-full py-2.5 text-center text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
            onClick={() => void navigate({ to: '/onboarding' })}
          >
            Назад
          </button>
        </div>
      </main>
    </PageTransition>
  );
}
