import { Button } from '@monesto/rune';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, GitBranch, PiggyBank, Wallet } from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';

const FEATURES = [
  {
    icon: Wallet,
    title: 'Цикл до зарплаты',
    desc: 'Считаем, сколько свободно до следующей выплаты',
  },
  {
    icon: GitBranch,
    title: 'Правила',
    desc: 'Остаток уходит в активы по процентам или фиксу',
  },
  {
    icon: PiggyBank,
    title: 'Цели',
    desc: 'Видите прогресс накоплений и кредитов',
  },
] as const;

export function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <main className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold tracking-[0.22em] text-blue-600">
            MONESTO
          </p>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 ring-1 ring-blue-100">
            Шаг 1 из 4
          </span>
        </div>

        <div className="mt-10 flex-1">
          <h1 className="text-[1.85rem] font-bold leading-tight tracking-tight text-slate-900">
            Деньги по плану
            <br />
            между зарплатами
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
            Считаем свободные деньги до следующей выплаты и раскладываем остаток
            по вашим правилам.
          </p>

          <div className="onboarding-float mt-8 rounded-2xl bg-[var(--color-navy)] p-5 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Свободно в цикле
            </p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight">81 674 ₽</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/90">
                  Доходы
                </p>
                <p className="mt-0.5 text-sm font-bold">99 861 ₽</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-rose-300/90">
                  Расходы
                </p>
                <p className="mt-0.5 text-sm font-bold">18 187 ₽</p>
              </div>
            </div>
          </div>

          <ul className="mt-8 space-y-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" strokeWidth={1.85} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-semibold text-slate-900">{feature.title}</p>
                    <p className="mt-0.5 text-sm leading-snug text-slate-400">
                      {feature.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-10 shrink-0">
          <Button
            variant="navy"
            size="lg"
            className="w-full"
            onClick={() => void navigate({ to: '/onboarding/plan' })}
          >
            Далее
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Пара минут · данные остаются на устройстве
          </p>
        </div>
      </main>
    </PageTransition>
  );
}
