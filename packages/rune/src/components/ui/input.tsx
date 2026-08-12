import * as React from 'react';

import { cn } from '../../lib/utils';

/** Короткий неразрывный пробел для группировки тысяч. */
const THIN_SPACE = '\u202F';

export type InputProps = React.ComponentProps<'input'> & {
  /** Группирует тысячи короткими пробелами при вводе. */
  format?: 'money';
  /** Суффикс (₽, $…). Сам по себе не меняет раскладку. */
  suffix?: React.ReactNode;
  /**
   * Суффикс сразу после значения, а не у правого края.
   * Без этого флага поведение как у обычного input (suffix игнорируется —
   * его рисуют снаружи, как раньше).
   */
  withRelativeSuffix?: boolean;
  /** Скрывать suffix, пока value пустое. */
  hideSuffixWhenEmpty?: boolean;
};

/** Убирает пробелы группировки; запятую → точку. */
export function parseMoneyInput(value: string): string {
  const cleaned = value
    .replace(new RegExp(`[${THIN_SPACE}\\s\\u00A0\\u2009]`, 'g'), '')
    .replace(',', '.');
  if (!cleaned || cleaned === '.' || cleaned === '-') {
    return cleaned === '-' ? '-' : '';
  }
  const neg = cleaned.startsWith('-');
  const body = neg ? cleaned.slice(1) : cleaned;
  const digits = body.replace(/[^\d.]/g, '');
  const dot = digits.indexOf('.');
  const intPart = (dot === -1 ? digits : digits.slice(0, dot)).replace(/\D/g, '');
  const hasDot = dot !== -1;
  const dec = (hasDot ? digits.slice(dot + 1) : '').replace(/\D/g, '');
  const raw = hasDot ? `${intPart}.${dec}` : intPart;
  if (!raw && !hasDot) return neg ? '-' : '';
  return neg ? `-${raw}` : raw;
}

/** Форматирует число с короткими пробелами между тысячами. */
export function formatMoneyInput(raw: string): string {
  if (raw === '-' || raw === '.' || raw === ',') return raw === ',' ? ',' : raw;
  const parsed = parseMoneyInput(raw);
  if (!parsed || parsed === '-') return parsed === '-' ? '-' : '';
  const neg = parsed.startsWith('-');
  const body = neg ? parsed.slice(1) : parsed;
  const [intPart = '', decPart] = body.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
  const sign = neg ? '-' : '';
  if (parsed.includes('.')) {
    return `${sign}${grouped || '0'},${decPart ?? ''}`;
  }
  return `${sign}${grouped}`;
}

function countDigitsBefore(value: string, caret: number): number {
  let n = 0;
  for (let i = 0; i < caret && i < value.length; i += 1) {
    if (/\d/.test(value[i]!)) n += 1;
  }
  return n;
}

function caretFromDigitCount(value: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (/\d/.test(value[i]!)) {
      seen += 1;
      if (seen >= digitCount) return i + 1;
    }
  }
  return value.length;
}

function caretInFormatted(
  display: string,
  digitCount: number,
  afterSeparator: boolean,
): number {
  if (afterSeparator) {
    const comma = display.indexOf(',');
    if (comma !== -1) return comma + 1;
  }
  return caretFromDigitCount(display, digitCount);
}

const baseInputClass =
  'flex h-12 w-full rounded-xl border border-transparent bg-[var(--color-input)] px-3.5 py-2 text-base text-[var(--color-foreground)] transition-colors placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      format,
      suffix,
      withRelativeSuffix = false,
      hideSuffixWhenEmpty = false,
      value,
      defaultValue,
      onChange,
      inputMode,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    const caretRef = React.useRef<{
      digits: number;
      afterSeparator: boolean;
    } | null>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const isMoney = format === 'money';
    const relativeSuffix =
      Boolean(withRelativeSuffix) && suffix != null && suffix !== '';
    const rawValue =
      value == null ? '' : typeof value === 'number' ? String(value) : String(value);
    /** type=number ломает пробелы/запятые — для money всегда text + decimal. */
    const displayValue = isMoney ? formatMoneyInput(rawValue) : rawValue;
    const isEmpty = rawValue.trim() === '';
    const showSuffix = !(hideSuffixWhenEmpty && isEmpty);
    const sizerText = displayValue || String(placeholder ?? '0');
    const resolvedType = isMoney ? 'text' : type;

    React.useLayoutEffect(() => {
      if (!isMoney || caretRef.current == null || !innerRef.current) {
        return;
      }
      const { digits, afterSeparator } = caretRef.current;
      const pos = caretInFormatted(displayValue, digits, afterSeparator);
      innerRef.current.setSelectionRange(pos, pos);
      caretRef.current = null;
    }, [displayValue, isMoney]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isMoney) {
        onChange?.(event);
        return;
      }
      const typed = event.target.value;
      const caret = event.target.selectionStart ?? typed.length;
      const charBefore = typed[caret - 1] ?? '';
      caretRef.current = {
        digits: countDigitsBefore(typed, caret),
        afterSeparator: charBefore === '.' || charBefore === ',',
      };
      const nextRaw = parseMoneyInput(typed);
      const synthetic = {
        ...event,
        target: { ...event.target, value: nextRaw },
        currentTarget: { ...event.currentTarget, value: nextRaw },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(synthetic);
    };

    const controlled = value != null || isMoney;

    if (!relativeSuffix) {
      return (
        <input
          {...props}
          ref={innerRef}
          type={resolvedType}
          inputMode={isMoney ? 'decimal' : inputMode}
          placeholder={placeholder}
          className={cn(
            baseInputClass,
            isMoney && 'tabular-nums font-bold',
            type === 'date' &&
              'min-w-0 max-w-full box-border [color-scheme:light]',
            className,
          )}
          value={controlled ? displayValue : undefined}
          defaultValue={
            controlled
              ? undefined
              : defaultValue != null
                ? String(defaultValue)
                : undefined
          }
          onChange={handleChange}
        />
      );
    }

    return (
      <div
        className={cn(
          'flex h-12 w-full items-center rounded-xl border border-transparent bg-[var(--color-input)] px-3.5 py-2 transition-colors focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--color-ring)]',
          isMoney && 'font-bold',
          className,
        )}
        onClick={() => innerRef.current?.focus()}
      >
        <div className="relative inline-block max-w-[calc(100%-1.5rem)] shrink-0">
          <span
            aria-hidden
            className={cn(
              'invisible block whitespace-pre tabular-nums',
              isMoney && 'font-bold',
            )}
          >
            {sizerText}
          </span>
          <input
            {...props}
            ref={innerRef}
            type={resolvedType}
            inputMode={isMoney ? 'decimal' : inputMode}
            placeholder={placeholder}
            className={cn(
              'absolute inset-0 border-0 bg-transparent p-0 outline-none placeholder:text-[var(--color-muted-foreground)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              isMoney && 'tabular-nums font-bold',
            )}
            value={controlled ? displayValue : undefined}
            defaultValue={
              controlled
                ? undefined
                : defaultValue != null
                  ? String(defaultValue)
                  : undefined
            }
            onChange={handleChange}
          />
        </div>
        {showSuffix ? (
          <span className="ml-0.5 shrink-0 font-semibold text-[var(--color-muted-foreground)]">
            {suffix}
          </span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
