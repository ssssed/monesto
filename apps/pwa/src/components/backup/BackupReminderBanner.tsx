import { Button } from '@monesto/rune';
import { Download, X } from 'lucide-react';
import { useState } from 'react';

import { downloadBackup } from '@/lib/utils/downloadBackup';

export function BackupReminderBanner({
  onExported,
  onDismiss,
}: {
  onExported: () => void;
  onDismiss: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadBackup();
      onExported();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#eef2ff_0%,#faf5ff_100%)] p-4 shadow-sm ring-1 ring-indigo-200/70">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Скрыть"
        className="absolute right-3 top-3 text-slate-400 transition-colors hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-indigo-600 shadow-sm ring-1 ring-indigo-100">
          <Download className="h-5 w-5" strokeWidth={1.85} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-slate-900">
            Данные только в этом браузере
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Очистка кэша или переустановка сотрут историю. Сделайте резервную
            копию — это займёт секунду.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            disabled={busy}
            onClick={() => void handleExport()}
          >
            <Download className="h-3.5 w-3.5" />
            Экспортировать
          </Button>
        </div>
      </div>
    </div>
  );
}
