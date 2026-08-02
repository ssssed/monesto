import { cn } from '@monesto/rune';
import type { CSSProperties, ReactNode } from 'react';

type FadeInProps = {
  children: ReactNode;
  className?: string;
  /** Stagger index (0-based). */
  index?: number;
  /** Base delay before first item, ms. */
  baseDelay?: number;
  /** Extra delay per index, ms. */
  step?: number;
  /** Animation duration class (tailwind duration-*). */
  durationClass?: string;
  /** Animation variant. */
  variant?: 'up' | 'fade' | 'scale' | 'rise';
};

const VARIANT_CLASS: Record<NonNullable<FadeInProps['variant']>, string> = {
  up: 'animate-in fade-in-0 slide-in-from-bottom-3',
  fade: 'animate-in fade-in-0',
  scale: 'animate-in fade-in-0 zoom-in-95',
  rise: 'animate-in fade-in-0 slide-in-from-bottom-6 zoom-in-95',
};

/** Staggered entrance for list/section items. */
export function FadeIn({
  children,
  className,
  index = 0,
  baseDelay = 40,
  step = 55,
  durationClass = 'duration-500',
  variant = 'up',
}: FadeInProps) {
  const style = {
    animationDelay: `${baseDelay + index * step}ms`,
    animationFillMode: 'both',
  } satisfies CSSProperties;

  return (
    <div
      className={cn(
        VARIANT_CLASS[variant],
        durationClass,
        'ease-out',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
