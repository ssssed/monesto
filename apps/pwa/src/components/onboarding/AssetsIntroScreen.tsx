import { Button } from '@monesto/rune';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  GitBranch,
  Layers3,
  Target,
  Wallet,
} from 'lucide-react';

import { PageTransition } from '@/components/layout/PageTransition';
import { FadeIn } from '@/components/ui/FadeIn';

const STEPS = [
  {
    icon: Wallet,
    title: 'Создайте активы',
    desc: 'Подушка, доллары, цель на отпуск — всё, куда должны уходить свободные деньги',
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    icon: GitBranch,
    title: 'Задайте правила',
    desc: 'Процент или фикс с остатка после расходов — Monesto посчитает суммы сам',
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: Target,
    title: 'Подтверждайте в цикле',
    desc: 'В день выплаты свайпайте активы: применить или отложить распределение',
    tone: 'bg-slate-100 text-slate-700',
  },
] as const;

export function AssetsIntroScreen() {
  const navigate = useNavigate();

  return (
    <PageTransition fill>
      <main className="relative mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-8">
        <div
          aria-hidden
          className="welcome-blob welcome-blob--a pointer-events-none absolute -right-24 -top-10 h-56 w-56 rounded-full bg-blue-200/35 blur-3xl"
        />
        <div
          aria-hidden
          className="welcome-blob welcome-blob--b pointer-events-none absolute -left-16 bottom-32 h-52 w-52 rounded-full bg-sky-100/70 blur-3xl"
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <FadeIn variant="fade" durationClass="duration-700">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold tracking-[0.22em] text-blue-600">
                MONESTO
              </p>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 ring-1 ring-blue-100">
                Шаг 2 из 4
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
            <div className="welcome-hero-card mx-auto flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center ring-1 ring-slate-100 shadow-[0_14px_36px_rgb(15_23_42/0.08)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Layers3 className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                После доходов и расходов
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                Активы ← правила ← остаток
              </p>
              <div className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left">
                <span className="text-xs text-slate-400">Остаток</span>
                <span className="text-sm font-bold tabular-nums text-slate-900">
                  81 674 ₽
                </span>
              </div>
              <div className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-left">
                <span className="text-xs text-blue-500">В активы</span>
                <span className="text-sm font-bold tabular-nums text-blue-700">
                  по правилам
                </span>
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
              Зачем нужны
              <br />
              активы и правила
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-500">
              Отчёт покажет свободные деньги. Чтобы они не зависали «в воздухе»,
              направьте остаток в активы через простые правила.
            </p>
          </FadeIn>

          <div className="relative mt-7 min-h-0 flex-1">
            <div className="h-full space-y-3 overflow-y-auto overscroll-contain pb-32">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <FadeIn
                    key={step.title}
                    index={3 + i}
                    baseDelay={80}
                    step={90}
                    variant="up"
                    durationClass="duration-500"
                  >
                    <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-3.5 ring-1 ring-slate-100 backdrop-blur-sm">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.tone}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.85} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-semibold text-slate-900">{step.title}</p>
                        <p className="mt-0.5 text-sm leading-snug text-slate-400">
                          {step.desc}
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
                  onClick={() => void navigate({ to: '/onboarding/income' })}
                >
                  Дальше — доходы
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  className="mt-3 w-full py-2 text-center text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
                  onClick={() => void navigate({ to: '/onboarding' })}
                >
                  Назад
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
