import { Calendar } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

/** YYYY-MM-DD → дд.мм.гггг */
export function formatDateDisplay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export type DatePickerProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue'
> & {
  value?: string;
  defaultValue?: string;
};

/**
 * Поле даты в стиле Input: показывает дд.мм.гггг + иконку,
 * по тапу открывает нативный `input type="date"`.
 */
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      className,
      value,
      defaultValue,
      placeholder = 'дд.мм.гггг',
      disabled,
      onChange,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const controlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = React.useState(
      () => defaultValue ?? '',
    );
    const iso = controlled ? (value ?? '') : uncontrolled;
    const hasValue = Boolean(iso);

    const openPicker = () => {
      const el = innerRef.current;
      if (!el || disabled) return;
      try {
        el.showPicker();
      } catch {
        el.click();
      }
    };

    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        className={cn(
          'relative flex h-12 w-full min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-[var(--color-input)] px-3.5 py-2 text-base transition-colors',
          'focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--color-ring)]',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left',
            hasValue
              ? 'font-medium text-[var(--color-foreground)]'
              : 'text-[var(--color-muted-foreground)]',
          )}
        >
          {hasValue ? formatDateDisplay(iso) : placeholder}
        </span>
        <Calendar
          className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]"
          aria-hidden
        />
        <input
          {...props}
          ref={innerRef}
          type="date"
          disabled={disabled}
          value={controlled ? iso : undefined}
          defaultValue={controlled ? undefined : defaultValue}
          onChange={(event) => {
            if (!controlled) setUncontrolled(event.target.value);
            onChange?.(event);
          }}
          onClick={(event) => event.stopPropagation()}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          aria-label={props['aria-label'] ?? placeholder}
        />
      </div>
    );
  },
);
DatePicker.displayName = 'DatePicker';
