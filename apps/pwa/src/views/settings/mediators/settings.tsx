import {
  Button,
  Card,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@monesto/rune';
import { Link, useNavigate } from '@tanstack/react-router';
import { ROUTES } from '@/shared/config/routes';
import {
  CalendarDays,
  ChevronRight,
  Download,
  GitBranch,
  History,
  TrendingUp,
  Upload,
  Wallet
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { PageTitle } from '@/shared/ui/page-header';
import { DangerClearButton } from '../ui/danger-clear-button';
import { AppAboutFooter } from '../ui/app-about-footer';
import { FadeIn } from '@/shared/ui/fade-in';
import * as db from '@/kernel/db';
import { computeCycleHistory } from '@/entities/report';
import { downloadBackup } from '@/shared/lib/download-backup';
import { useExchangeRateStore } from '@/entities/exchange';
import { shell } from '@/shared/lib/layout';

export function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDraft, setImportDraft] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const rate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;

  useEffect(() => {
    void Promise.all([
      db.getAllIncomes(),
      db.getAllExpenses(),
      db.getAllRules(),
      db.getAllAssets(),
      db.getAllVacations(),
    ]).then(([incomes, expenses, rules, assets, vacations]) => {
      const points = computeCycleHistory({
        incomes,
        expenses,
        rules,
        assets,
        vacations,
        today: new Date(),
        usdRubRate: rate,
        monthsBack: 6,
        trackingStartedAt: db.getTrackingStartedAtSync(),
      });
      setHasHistory(points.length > 0);
    });
  }, [rate]);

  const clear = async () => {
    await db.clearAllData();
    await navigate({ to: ROUTES.onboarding.index });
  };

  const pickImportFile = () => {
    setImportError('');
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !Array.isArray(parsed.assets) ||
        !Array.isArray(parsed.income_sources)
      ) {
        throw new Error();
      }
    } catch {
      setImportError('Это не похоже на резервную копию Monesto');
      return;
    }
    setImportError('');
    setImportDraft(text);
    setImportOpen(true);
  };

  const confirmImport = async () => {
    if (!importDraft) return;
    setImporting(true);
    try {
      await db.importBackup(importDraft);
      window.location.href = ROUTES.home;
    } catch {
      setImportError('Не удалось импортировать файл');
      setImportOpen(false);
      setImporting(false);
    }
  };

  const entries = [
    {
      to: ROUTES.settings.rules.index,
      label: 'Авто-распределение',
      desc: 'Правила покупки активов',
      icon: GitBranch,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      to: ROUTES.settings.income,
      label: 'Доходы',
      desc: 'Зарплата и поступления',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-700'
    },
    {
      to: ROUTES.settings.expenses,
      label: 'Расходы',
      desc: 'Обязательные платежи',
      icon: Wallet,
      color: 'bg-slate-100 text-slate-600'
    },
    {
      to: ROUTES.settings.vacation,
      label: 'Отпуск',
      desc: 'Периоды и влияние на выплаты',
      icon: CalendarDays,
      color: 'bg-amber-50 text-amber-700'
    },
    ...(hasHistory
      ? [
          {
            to: ROUTES.history,
            label: 'История циклов',
            desc: 'Доходы и расходы за полгода',
            icon: History,
            color: 'bg-indigo-50 text-indigo-600'
          }
        ]
      : [])
  ];

  return (
    <main className={`${shell} space-y-4`}>
      <FadeIn variant="fade">
        <PageTitle title="Настройки" subtitle="Доходы, расходы, отпуск и правила распределения" />
      </FadeIn>

      <FadeIn index={1}>
        <Card className="overflow-hidden border-slate-100 p-0 shadow-sm">
          {entries.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to}>
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <Card className="overflow-hidden border-slate-100 p-0 shadow-sm">
          <button
            type="button"
            onClick={() => void downloadBackup()}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Экспорт данных</p>
              <p className="text-sm text-slate-400">Скачать резервную копию в файл</p>
            </div>
          </button>
          <button
            type="button"
            onClick={pickImportFile}
            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3.5 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Upload className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Импорт данных</p>
              <p className="text-sm text-slate-400">Восстановить из файла резервной копии</p>
            </div>
          </button>
        </Card>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => void onFileSelected(e)}
        />
        {importError ? (
          <p className="mt-1.5 px-1 text-sm text-red-600">{importError}</p>
        ) : null}
      </FadeIn>

      <FadeIn index={3}>
        <DangerClearButton onConfirm={clear} />
      </FadeIn>

      <FadeIn index={4} variant="fade">
        <AppAboutFooter />
      </FadeIn>

      <Sheet open={importOpen} onOpenChange={(o) => { if (!importing) setImportOpen(o); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Импортировать данные?</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            <p className="text-sm leading-relaxed text-slate-500">
              Текущие доходы, расходы, активы и правила будут полностью заменены
              содержимым файла. Если хотите сохранить нынешние данные — сначала
              сделайте экспорт.
            </p>
          </SheetBody>
          <SheetFooter className="gap-2 sm:flex-col">
            <Button
              variant="destructive"
              className="w-full"
              size="lg"
              disabled={importing}
              onClick={() => void confirmImport()}
            >
              Импортировать и заменить
            </Button>
            <button
              type="button"
              className="w-full py-2 text-sm text-slate-400"
              onClick={() => setImportOpen(false)}
              disabled={importing}
            >
              Отмена
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}