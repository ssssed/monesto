import * as React from 'react';

import { cn } from '../../lib/utils';

export type SlidingToggleOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  className?: string;
};

type SlidingToggleGroupProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: SlidingToggleOption<T>[];
  className?: string;
  trackClassName?: string;
  pillClassName?: string;
  /** Compact mode for form segments (Тип / График). */
  size?: 'sm' | 'md' | 'lg';
};

/**
 * Segmented control with an animated sliding pill (iOS-style).
 * Used for cycle switcher, form type/schedule toggles, etc.
 */
export function SlidingToggleGroup<T extends string>({
  value,
  onValueChange,
  options,
  className,
  trackClassName,
  pillClassName,
  size = 'md',
}: SlidingToggleGroupProps<T>) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [pill, setPill] = React.useState({ width: 0, left: 0 });
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const measure = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const buttons = track.querySelectorAll<HTMLButtonElement>('[data-sliding-option]');
    const active = buttons[selectedIndex];
    if (!active) return;
    const trackRect = track.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setPill({
      width: activeRect.width,
      left: activeRect.left - trackRect.left,
    });
  }, [selectedIndex]);

  React.useLayoutEffect(() => {
    measure();
  }, [measure, options.length, value]);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  const padding =
    size === 'sm' ? 'p-1' : size === 'lg' ? 'p-1.5' : 'p-1';
  const optionPad =
    size === 'sm'
      ? 'px-2 py-2 text-xs'
      : size === 'lg'
        ? 'px-3 py-3'
        : 'px-3 py-2.5 text-sm';

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-slate-100',
        padding,
        trackClassName,
        className,
      )}
    >
      {pill.width > 0 ? (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1 bottom-1 rounded-xl bg-white shadow-sm transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            size === 'lg' && 'top-1.5 bottom-1.5 rounded-2xl',
            pillClassName,
          )}
          style={{
            left: 0,
            width: pill.width,
            transform: `translateX(${pill.left}px)`,
          }}
        />
      ) : null}

      <div className="relative z-[1] flex">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              data-sliding-option=""
              data-state={active ? 'active' : 'inactive'}
              onClick={() => onValueChange(option.value)}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center rounded-xl font-semibold transition-colors duration-200',
                optionPad,
                active ? 'text-slate-900' : 'text-slate-500',
                option.className,
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
