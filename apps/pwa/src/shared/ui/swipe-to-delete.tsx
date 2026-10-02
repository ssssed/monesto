import { Trash2 } from 'lucide-react';
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';

import { cn } from '@monesto/rune';

const SWIPE_MAX = 88;
const SWIPE_TRIGGER = SWIPE_MAX * 0.55;
const LOCK_PX = 10;

type Props = {
  children: ReactNode;
  onDelete: () => void;
  enabled?: boolean;
  className?: string;
  borderRadius?: number;
};

/**
 * Swipe left → delete. Works over links/buttons; suppresses click after a real swipe.
 */
export function SwipeToDelete({
  children,
  onDelete,
  enabled = true,
  className,
  borderRadius = 16,
}: Props) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<'x' | 'y' | null>(null);
  const dragging = useRef(false);
  const capturing = useRef(false);
  const offsetRef = useRef(0);
  const swiped = useRef(false);
  const activePointer = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const setOffsetBoth = useCallback((value: number) => {
    offsetRef.current = value;
    setOffset(value);
  }, []);

  const resetGesture = () => {
    locked.current = null;
    dragging.current = false;
    capturing.current = false;
    activePointer.current = null;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [data-no-swipe]')) return;

    startX.current = event.clientX;
    startY.current = event.clientY;
    locked.current = null;
    dragging.current = true;
    capturing.current = false;
    swiped.current = false;
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
        // vertical scroll — abandon gesture
        resetGesture();
        return;
      }
    }

    if (locked.current !== 'x') return;
    if (Math.abs(dx) > LOCK_PX * 2) swiped.current = true;
    setOffsetBoth(Math.max(-SWIPE_MAX, Math.min(0, dx)));
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

    const shouldDelete =
      locked.current === 'x' && offsetRef.current < -SWIPE_TRIGGER;

    if (shouldDelete) {
      setOffsetBoth(-SWIPE_MAX);
      window.setTimeout(() => {
        onDelete();
        setOffsetBoth(0);
        resetGesture();
      }, 140);
      return;
    }

    setOffsetBoth(0);
    resetGesture();
  };

  const onClickCapture = (event: ReactMouseEvent) => {
    if (!swiped.current) return;
    event.preventDefault();
    event.stopPropagation();
    swiped.current = false;
  };

  const progress = Math.min(1, Math.abs(offset) / SWIPE_MAX);
  const radiusStyle = { borderRadius } satisfies CSSProperties;
  const isDraggingX = locked.current === 'x' && dragging.current;

  if (!enabled) {
    return (
      <div className={cn(className)} style={radiusStyle}>
        <div
          className="relative overflow-hidden bg-white"
          style={{ ...radiusStyle, border: '1px solid #f1f5f9' }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={radiusStyle}
    >
      <div
        className="absolute inset-0 flex items-center justify-end bg-red-500 pr-5"
        style={{
          ...radiusStyle,
          opacity: progress > 0.05 ? 0.45 + progress * 0.55 : 0,
        }}
        aria-hidden
      >
        <Trash2
          className="h-5 w-5 text-white"
          style={{
            opacity: progress,
            transform: `scale(${0.85 + progress * 0.15})`,
          }}
        />
      </div>

      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onClickCapture={onClickCapture}
        className="relative bg-white"
        style={{
          ...radiusStyle,
          border: '1px solid #f1f5f9',
          touchAction: 'pan-y',
          transform: `translateX(${offset}px)`,
          transition: isDraggingX
            ? 'none'
            : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
