import { GripVertical } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type Props = {
  assetId: number;
  /** Цель по clientY без учёта CSS transform (layout). */
  findTargetId: (clientY: number, fromId: number) => number | null;
  onReorder: (fromId: number, toId: number) => void;
  onReorderEnd: () => void;
};

/**
 * Ручка для перетаскивания актива (touch + mouse) без сторонних DnD-библиотек.
 */
export function AssetReorderHandle({
  assetId,
  findTargetId,
  onReorder,
  onReorderEnd,
}: Props) {
  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const toId = findTargetId(event.clientY, assetId);
    if (toId == null || toId === assetId) return;
    onReorder(assetId, toId);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onReorderEnd();
  };

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Перетащить"
      className="flex h-9 w-7 shrink-0 touch-none items-center justify-center text-slate-400 outline-none focus:outline-none focus-visible:outline-none"
      onMouseDown={(event) => event.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );
}
