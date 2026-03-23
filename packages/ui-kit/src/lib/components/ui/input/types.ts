/**
 * Визуальный размер полей `NumberInput` и `TextInput`.
 * — `sm` — компактный
 * — `default` — стандартный (значение по умолчанию)
 * — `lg` — крупный (прежний «герой»-размер)
 */
export type InputSize = 'sm' | 'default' | 'lg';

/** Полоска фокуса под полем: узкая по центру с раскрытием или сразу на всю ширину. */
export type InputFocusUnderline = 'center' | 'full';

/** Горизонтальное выравнивание содержимого `NumberInput`. */
export type NumberInputTextAlign = 'left' | 'center';
