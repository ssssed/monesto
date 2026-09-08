import { Button, Card } from '@monesto/rune';
import { Lightbulb, X } from 'lucide-react';

import type { SeasonalTip } from '@/lib/seasonal/tips';

export function SeasonalTipBanner({
  tip,
  onDismiss,
}: {
  tip: SeasonalTip;
  onDismiss: () => void;
}) {
  return (
    <Card className="relative border-0 bg-sky-50 p-4 shadow-none ring-1 ring-sky-100">
      <button
        type="button"
        aria-label="Скрыть подсказку"
        onClick={onDismiss}
        className="absolute right-3 top-3 rounded-lg p-1 text-sky-700/50 transition-colors hover:bg-sky-100 hover:text-sky-800"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          <Lightbulb className="h-5 w-5" strokeWidth={1.85} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{tip.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{tip.body}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-8 px-0 text-sky-700"
            onClick={onDismiss}
          >
            Понятно
          </Button>
        </div>
      </div>
    </Card>
  );
}
