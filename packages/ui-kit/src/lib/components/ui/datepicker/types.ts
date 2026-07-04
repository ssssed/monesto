import type { DateRange } from "bits-ui";
import type { DateValue } from "@internationalized/date";
import type { ButtonVariant } from "../button/button.svelte";
import type { InputSize } from "../input/types";

export type DatepickerSize = InputSize;

export type DatepickerValue = DateValue | undefined;

export type DatepickerRangeValue = DateRange;

export type DatepickerDisplayMode = "date" | "day";

export type DatepickerRangeDisplayMode = DatepickerDisplayMode;

export type DatepickerRangeFormatContext = {
	locale: string;
	placeholderText: string;
	formatDate: (date: DateValue) => string;
	formatDayRange: (value: DatepickerRangeValue) => string;
};

type DatepickerCalendarProps = {
	locale?: string;
	captionLayout?: "dropdown" | "dropdown-months" | "dropdown-years" | "label";
	weekdayFormat?: "narrow" | "short" | "long";
	fixedWeeks?: boolean;
	disabled?: boolean;
	readonly?: boolean;
	minValue?: DateValue;
	maxValue?: DateValue;
	buttonVariant?: ButtonVariant;
	numberOfMonths?: number;
};

export type DatepickerProps = DatepickerCalendarProps & {
	value?: DatepickerValue;
	size?: DatepickerSize;
	placeholderText?: string;
	displayMode?: DatepickerDisplayMode;
	daysOnly?: boolean;
	class?: string;
	onValueChange?: (value: DatepickerValue) => void;
};

export type DatepickerRangeProps = DatepickerCalendarProps & {
	value?: DatepickerRangeValue;
	size?: DatepickerSize;
	placeholderText?: string;
	displayMode?: DatepickerRangeDisplayMode;
	daysOnly?: boolean;
	formatValue?: (value: DatepickerRangeValue, context: DatepickerRangeFormatContext) => string;
	class?: string;
	onValueChange?: (value: DatepickerRangeValue) => void;
};
