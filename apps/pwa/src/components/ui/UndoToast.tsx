import { cn } from '@monesto/rune';
import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  visible: boolean;
  message: string;
  durationMs: number;
  onUndo: () => void;
  onDismiss: () => void;
};

/** Compact undo toast with countdown progress bar. */
export function UndoToast({
  visible,
  message,
  durationMs,
  onUndo,
  onDismiss,
}: Props) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (!visible) {
      setProgress(1);
      return;
    }
    setProgress(1);
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - started;
      const next = Math.max(0, 1 - elapsed / durationMs);
      setProgress(next);
      if (next > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, durationMs, message]);

  if (!visible || typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-3 z-[100] w-full max-w-[430px] -translate-x-1/2 px-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <div className="pointer-events-auto overflow-hidden rounded-2xl bg-slate-900 shadow-lg">
        <div className="flex items-center px-3.5 py-3">
          <div className="mr-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="mr-2 min-w-0 flex-1 truncate text-sm font-medium text-white">
            {message}
          </p>
          <button
            type="button"
            onClick={onUndo}
            className="mr-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-500"
          >
            Отменить
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className={cn('p-1 text-slate-400 transition-opacity hover:opacity-70')}
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-0.5 bg-slate-800">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
