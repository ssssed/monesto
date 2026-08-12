import { GripVertical } from 'lucide-react';
import {
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

/**
 * Вся карточка — зона drag (удобно на телефоне). Grip слева как подсказка.
 */
export function AssetReorderHandle({
  assetId,
  findTargetId,
  onReorder,
  onReorderEnd,
  children,
  className,
}: Props) {
  const activePointer = useRef<number | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const toId = findTargetId(event.clientY, assetId);
    if (toId == null || toId === assetId) return;
    onReorder(assetId, toId);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onReorderEnd();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Перетащить"
      className={cn(
        'flex touch-none select-none items-center gap-0 outline-none',
        className,
      )}
      style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
