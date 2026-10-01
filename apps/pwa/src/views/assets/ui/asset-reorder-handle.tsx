import { GripVertical } from 'lucide-react';
import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { cn } from '@monesto/rune';

type Props = {
  assetId: number;
  /** Цель по clientY без учёта CSS transform (layout). */
  findTargetId: (clientY: number, fromId: number) => number | null;
  onReorder: (fromId: number, toId: number) => void;
  onReorderEnd: () => void;
  children: ReactNode;
  className?: string;
};

type ScrollLock = {
  el: HTMLElement;
  top: number;
  overflow: string;
};

/**
 * Drag карточки для PWA: блокирует .app-scroll и touchmove (passive: false),
 * иначе iOS/Android скроллят страницу вместо reorder.
 */
export function AssetReorderHandle({
  assetId,
  findTargetId,
  onReorder,
  onReorderEnd,
  children,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const draggingIdRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const scrollLockRef = useRef<ScrollLock | null>(null);
  const findTargetIdRef = useRef(findTargetId);
  const onReorderRef = useRef(onReorder);
  const onReorderEndRef = useRef(onReorderEnd);
  findTargetIdRef.current = findTargetId;
  onReorderRef.current = onReorder;
  onReorderEndRef.current = onReorderEnd;

  const unlockScroll = () => {
    const lock = scrollLockRef.current;
    if (!lock) return;
    lock.el.style.overflow = lock.overflow;
    lock.el.scrollTop = lock.top;
    scrollLockRef.current = null;
  };

  const lockScroll = () => {
    const el = document.querySelector('.app-scroll');
    if (!(el instanceof HTMLElement)) return;
    scrollLockRef.current = {
      el,
      top: el.scrollTop,
      overflow: el.style.overflow,
    };
    el.style.overflow = 'hidden';
    el.scrollTop = scrollLockRef.current.top;
  };

  const endDrag = () => {
    const root = rootRef.current;
    const pointerId = pointerIdRef.current;
    if (root && pointerId != null && root.hasPointerCapture(pointerId)) {
      root.releasePointerCapture(pointerId);
    }
    draggingIdRef.current = null;
    pointerIdRef.current = null;
    unlockScroll();
    onReorderEndRef.current();
  };

  useEffect(() => {
    const onTouchMove = (event: TouchEvent) => {
      if (draggingIdRef.current == null) return;
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      const fromId = draggingIdRef.current;
      if (fromId == null || event.pointerId !== pointerIdRef.current) return;
      const toId = findTargetIdRef.current(event.clientY, fromId);
      if (toId == null || toId === fromId) return;
      onReorderRef.current(fromId, toId);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerIdRef.current) return;
      endDrag();
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      unlockScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listeners once; refs hold latest callbacks
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    // Без preventDefault iOS отдаёт жест скроллу .app-scroll
    event.preventDefault();
    event.stopPropagation();
    draggingIdRef.current = assetId;
    pointerIdRef.current = event.pointerId;
    lockScroll();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-label="Перетащить"
      className={cn(
        'flex touch-none select-none items-center gap-0 outline-none',
        className,
      )}
      style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      onPointerDown={onPointerDown}
    >
      <div
        className="flex h-14 w-11 shrink-0 items-center justify-center text-slate-400"
        aria-hidden
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
