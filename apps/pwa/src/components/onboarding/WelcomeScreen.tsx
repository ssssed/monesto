import { Button } from '@monesto/rune';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  GitBranch,
  PiggyBank,
  Sparkles,
  Wallet,
} from 'lucide-react';

import { FadeIn } from '@/components/ui/FadeIn';
import { PageTransition } from '@/components/layout/PageTransition';

const FEATURES = [
  {
    icon: Wallet,
    title: 'Цикл между зарплатами',
    desc: 'Считаем свободные деньги на период до следующей выплаты',
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    icon: GitBranch,
    title: 'Правила распределения',
    desc: 'Остаток уходит в активы по вашим процентам и фиксам',
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: PiggyBank,
    title: 'Цели и прогресс',
    desc: 'Видите, куда уходят деньги и как растут накопления',
    tone: 'bg-slate-100 text-slate-700',
  },
] as const;

export function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <PageTransition fill>
      <main className="relative mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-8">
        <div
          aria-hidden
          className="welcome-blob welcome-blob--a pointer-events-none absolute -left-24 -top-16 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="welcome-blob welcome-blob--b pointer-events-none absolute -right-20 top-40 h-56 w-56 rounded-full bg-sky-100/80 blur-3xl"
        />
        <div
          aria-hidden
          className="welcome-blob welcome-blob--c pointer-events-none absolute bottom-24 left-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl"
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <FadeIn variant="fade" durationClass="duration-700">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold tracking-[0.22em] text-blue-600">
                MONESTO
              </p>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 ring-1 ring-blue-100">
                Шаг 1 из 4
              </span>
            </div>
          </FadeIn>

          <FadeIn
            index={1}
            baseDelay={80}
            step={90}
            variant="rise"
            durationClass="duration-700"
            className="mt-8"
          >
            <div className="welcome-hero relative mx-auto w-full max-w-sm">
              <div className="welcome-hero-card rounded-2xl bg-[var(--color-navy)] p-5 text-white shadow-[0_18px_40px_rgb(15_23_42/0.22)]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  Свободные деньги
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight">81 674 ₽</p>
                <p className="mt-1 text-sm text-white/45">к следующей зарплате</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="welcome-hero-chip rounded-2xl bg-[var(--color-income-soft)] px-3.5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-income)]">
                    Доходы
                  </p>
                  <p className="mt-1 text-lg font-bold text-[var(--color-income)]">
                    99 861 ₽
                  </p>
                </div>
                <div className="welcome-hero-chip welcome-hero-chip--delay rounded-2xl bg-[var(--color-expense-soft)] px-3.5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-expense)]">
                    Расходы
                  </p>
                  <p className="mt-1 text-lg font-bold text-[var(--color-expense)]">
                    18 187 ₽
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn
            index={2}
            baseDelay={80}
            step={90}
            variant="rise"
            durationClass="duration-700"
            className="mt-9"
          >
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900">
              Деньги по плану
              <br />
              между зарплатами
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-500">
              Monesto считает, сколько можно свободно потратить и отложить в
              активы до следующей выплаты — без таблиц и догадок.
            </p>
          </FadeIn>

          <div className="relative mt-7 min-h-0 flex-1">
            <div className="h-full space-y-3 overflow-y-auto overscroll-contain pb-28">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <FadeIn
                    key={feature.title}
                    index={3 + i}
                    baseDelay={80}
                    step={90}
                    variant="up"
                    durationClass="duration-500"
                  >
                    <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-3.5 ring-1 ring-slate-100 backdrop-blur-sm">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${feature.tone}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.85} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-semibold text-slate-900">{feature.title}</p>
                        <p className="mt-0.5 text-sm leading-snug text-slate-400">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            <FadeIn
              index={6}
              baseDelay={80}
              step={90}
              variant="rise"
              durationClass="duration-700"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-[#f8fafc] from-40% via-[#f8fafc]/85 to-transparent pt-12"
            >
              <div className="pointer-events-auto">
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
                  Займёт пару минут · данные остаются на устройстве
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
