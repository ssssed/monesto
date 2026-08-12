import { cn } from '@monesto/rune';
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { formatRub } from '@/lib/utils/format';

const MAX_SLIDE = 88;
const LOCK_PX = 10;

type Props = {
  title: string;
  balanceLabel: string;
  incomingRub: number;
  /** Подпись рядом с суммой incoming, по умолчанию просто +сумма. */
  incomingLabel?: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  confirmed: boolean;
  rejected: boolean;
  swipeable: boolean;
  onConfirm: () => void;
  onReject: () => void;
};

/** Card: swipe right to apply, left to reject. */
export function SwipeConfirmCard({
  title,
  balanceLabel,
  incomingRub,
  incomingLabel,
  icon,
  bgColor,
  iconColor,
  confirmed,
  rejected,
  swipeable,
  onConfirm,
  onReject,
}: Props) {
  const settled = confirmed || rejected;
  const [offset, setOffset] = useState(0);
  const [flash, setFlash] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<'x' | 'y' | null>(null);
  const dragging = useRef(false);
  const capturing = useRef(false);
  const offsetRef = useRef(0);
  const activePointer = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const enabled = swipeable && !settled;

  useEffect(() => {
    if (!settled) return;
    setOffset(0);
    offsetRef.current = 0;
    setFlash(1);
    const id = window.setTimeout(() => setFlash(0), 480);
    return () => window.clearTimeout(id);
  }, [settled, confirmed, rejected]);

  const setOffsetBoth = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  const resetGesture = () => {
    locked.current = null;
    dragging.current = false;
    capturing.current = false;
    activePointer.current = null;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || event.button !== 0) return;
    startX.current = event.clientX;
    startY.current = event.clientY;
    locked.current = null;
    dragging.current = true;
    capturing.current = false;
    activePointer.current = event.pointerId;
    setOffsetBoth(0);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !enabled || activePointer.current !== event.pointerId) {
      return;
    }

    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;

    if (locked.current == null) {
      if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return;
      locked.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (locked.current === 'x') {
        cardRef.current?.setPointerCapture(event.pointerId);
        capturing.current = true;
      } else {
        resetGesture();
        return;
      }
    }

    if (locked.current !== 'x') return;
    setOffsetBoth(Math.max(-MAX_SLIDE, Math.min(MAX_SLIDE, dx)));
  };

  const finish = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || activePointer.current !== event.pointerId) return;

    if (capturing.current) {
      try {
        cardRef.current?.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }

    const value = offsetRef.current;
    const wasHorizontal = locked.current === 'x';
    resetGesture();
    setOffsetBoth(0);

    if (!wasHorizontal) return;
    if (value > MAX_SLIDE * 0.55) onConfirm();
    else if (value < -MAX_SLIDE * 0.55) onReject();
  };

  const confirmProgress = Math.max(0, offset) / MAX_SLIDE;
  const rejectProgress = Math.max(0, -offset) / MAX_SLIDE;
  const absProgress = Math.abs(offset) / MAX_SLIDE;
  const isDraggingX = dragging.current && locked.current === 'x';

  let borderColor = '#f1f5f9';
  let backgroundColor = '#ffffff';
  if (offset > 0) {
    borderColor =
      confirmProgress > 0.55 ? '#2563eb' : confirmProgress > 0.2 ? '#93c5fd' : '#f1f5f9';
    backgroundColor = `color-mix(in srgb, #eff6ff ${confirmProgress * 100}%, white)`;
  } else if (offset < 0) {
    borderColor =
      rejectProgress > 0.55 ? '#ef4444' : rejectProgress > 0.2 ? '#fca5a5' : '#f1f5f9';
    backgroundColor = `color-mix(in srgb, #fef2f2 ${rejectProgress * 100}%, white)`;
  }

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0 rounded-2xl bg-blue-100"
        style={{ opacity: confirmProgress * 0.9 }}
        aria-hidden
      />
      <div
        className="absolute inset-0 rounded-2xl bg-red-100"
        style={{ opacity: rejectProgress * 0.9 }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 top-0 rounded-l-2xl bg-blue-600"
        style={{ width: confirmProgress * 5, opacity: confirmProgress }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 right-0 top-0 rounded-r-2xl bg-red-500"
        style={{ width: rejectProgress * 5, opacity: rejectProgress }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute bottom-0 left-2.5 top-0 z-0 flex items-center"
        aria-hidden
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white"
          style={{
            opacity: Math.min(1, confirmProgress * 2),
            transform: `translateX(${-8 + confirmProgress * 8}px)`,
          }}
        >
          <ChevronRight className="h-4 w-4 text-blue-600" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-0 right-2.5 top-0 z-0 flex items-center"
        aria-hidden
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white"
          style={{
            opacity: Math.min(1, rejectProgress * 2),
            transform: `translateX(${8 - rejectProgress * 8}px)`,
          }}
        >
          <ChevronLeft className="h-4 w-4 text-red-500" />
        </div>
      </div>

      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        className={cn(
          'relative z-[1] rounded-2xl border shadow-sm select-none',
          enabled ? 'cursor-grab active:cursor-grabbing' : '',
        )}
        style={{
          borderColor,
          backgroundColor,
          touchAction: enabled ? 'pan-y' : 'auto',
          transform: `translateX(${offset}px) scale(${1 - absProgress * 0.015})`,
          transition: isDraggingX
            ? 'none'
            : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms, background-color 180ms',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            opacity: flash * 0.35,
            backgroundColor: confirmed ? '#93c5fd' : '#fca5a5',
            transition: 'opacity 180ms',
          }}
        />
        <div className="flex items-center px-3 py-3.5">
          <AssetAvatar icon={icon} bgColor={bgColor} iconColor={iconColor} />
          <div className="ml-3 min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-900">
              {title}
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {balanceLabel}
            </p>
          </div>
          <div className="ml-2 flex items-center">
            {incomingRub > 0 && !rejected ? (
              <span
                className="mr-1.5 text-right text-sm font-bold text-blue-600"
                style={{
                  transform: `scale(${1 + absProgress * 0.1})`,
                  transition: isDraggingX ? 'none' : 'transform 180ms',
                }}
              >
                +{formatRub(incomingRub)}
                {incomingLabel ? (
                  <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-blue-500/80">
                    {incomingLabel}
                  </span>
                ) : null}
              </span>
            ) : rejected ? (
              <span className="mr-1.5 text-xs text-slate-400">отклонено</span>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
            {confirmed ? (
              <CheckCircle2 className="h-[22px] w-[22px] text-emerald-600" />
            ) : null}
            {rejected ? (
              <XCircle className="h-[22px] w-[22px] text-red-600" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
