<script lang="ts">
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
	import { cn } from "$lib/utils";
	import { RangeCalendar } from "../range-calendar/index.js";
	import * as Popover from "../popover/index.js";
	import type { DateValue } from "@internationalized/date";
	import type { DatepickerRangeProps, DatepickerRangeValue } from "./types";
	import type { InputSize } from "../input/types";

	const DATEPICKER_RANGE_TRIGGER_SIZES: Record<
		InputSize,
		{ height: string; text: string; icon: string }
	> = {
		sm: {
			height: "h-10 px-3",
			text: "text-sm",
			icon: "size-4"
		},
		default: {
			height: "h-12 px-3.5",
			text: "text-base",
			icon: "size-4.5"
		},
		lg: {
			height: "h-14 px-4",
			text: "text-lg",
			icon: "size-5"
		}
	};

	let {
		value = $bindable({ start: undefined, end: undefined }),
		size = "default",
		placeholderText = "Выберите период",
		locale = "ru-RU",
		displayMode = "date",
		formatValue,
		class: className,
		captionLayout = "dropdown",
		weekdayFormat = "short",
		fixedWeeks = true,
		numberOfMonths = 1,
		daysOnly = false,
		disabled = false,
		readonly = false,
		onValueChange,
		...calendarProps
	}: DatepickerRangeProps = $props();

	let open = $state(false);

	const DAYS_IN_RANGE = Array.from({ length: 31 }, (_, index) => index + 1);

	const triggerSize = $derived(DATEPICKER_RANGE_TRIGGER_SIZES[size]);
	const formatter = $derived(new DateFormatter(locale, { dateStyle: "medium" }));

	function formatDate(date: DateValue) {
		return formatter.format(date.toDate(getLocalTimeZone()));
	}

	function formatFullDateRange() {
		if (!value?.start) {
			return placeholderText;
		}

		const formattedStart = formatDate(value.start);

		return value.end ? `${formattedStart} - ${formatDate(value.end)}` : `${formattedStart} - ...`;
	}

	function formatDayRange(rangeValue: DatepickerRangeValue) {
		if (!rangeValue.start) {
			return placeholderText;
		}

		return rangeValue.end
			? `${rangeValue.start.day}-${rangeValue.end.day} число`
			: `${rangeValue.start.day}-... число`;
	}

	const formatContext = $derived({
		locale,
		placeholderText,
		formatDate,
		formatDayRange
	});

	const triggerLabel = $derived.by(() => {
		if (!value?.start) {
			return placeholderText;
		}

		if (formatValue) {
			return formatValue(value, formatContext);
		}

		return daysOnly || displayMode === "day" ? formatDayRange(value) : formatFullDateRange();
	});

	/**
	 * Creates a stable DateValue for day-only ranges while keeping the visual month ignored.
	 * @param props Day number to convert into a technical calendar date.
	 */
	function createDayOnlyDate(props: { day: number }) {
		return new CalendarDate(2000, 1, props.day);
	}

	/**
	 * Reads a DateValue as a day number for day-only range comparisons.
	 * @param props Optional DateValue from the current range.
	 */
	function getDayOnlyValue(props: { date?: DateValue }) {
		return props.date?.day;
	}

	/**
	 * Checks whether a day is the start or end of the selected day-only range.
	 * @param props Day number to check against the current range.
	 */
	function isDayOnlyRangeEdge(props: { day: number }) {
		const startDay = getDayOnlyValue({ date: value?.start });
		const endDay = getDayOnlyValue({ date: value?.end });

		return props.day === startDay || props.day === endDay;
	}

	/**
	 * Checks whether a day sits between the selected range edges.
	 * @param props Day number to check against the current range.
	 */
	function isDayOnlyRangeMiddle(props: { day: number }) {
		const startDay = getDayOnlyValue({ date: value?.start });
		const endDay = getDayOnlyValue({ date: value?.end });

		return startDay !== undefined && endDay !== undefined && props.day > startDay && props.day < endDay;
	}

	/**
	 * Updates the day-only range according to the current partial selection state.
	 * @param props Clicked day from the day-only grid.
	 */
	function selectDayOnlyRange(props: { day: number }) {
		const clickedDate = createDayOnlyDate({ day: props.day });
		let nextValue: DatepickerRangeValue;

		if (!value?.start || value.end) {
			nextValue = { start: clickedDate, end: undefined };
		} else if (props.day < value.start.day) {
			nextValue = { start: clickedDate, end: value.start };
		} else {
			nextValue = { start: value.start, end: clickedDate };
		}

		value = nextValue;
		onValueChange?.(nextValue);

		if (nextValue.start && nextValue.end) {
			open = false;
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				data-slot="datepicker-range-trigger"
				class={cn(
					"inline-flex w-full items-center justify-between gap-2 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] text-left font-medium text-slate-900 outline-none transition-colors",
					"focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
					triggerSize.height,
					triggerSize.text,
					!(value?.start || value?.end) && "text-slate-400",
					className
				)}
			>
				<span class="truncate">{triggerLabel}</span>
				<CalendarIcon class={cn("shrink-0 text-slate-500", triggerSize.icon)} />
			</button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content
		data-slot="datepicker-range-content"
		align="start"
		sideOffset={8}
		class="w-auto overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white p-0 shadow-md"
	>
		{#if daysOnly}
			<div class="grid grid-cols-7 gap-1 p-3" role="grid" aria-label="Выбор дней периода">
				{#each DAYS_IN_RANGE as day (day)}
					<button
						type="button"
						role="gridcell"
						disabled={disabled || readonly}
						aria-selected={isDayOnlyRangeEdge({ day }) || isDayOnlyRangeMiddle({ day })}
						onclick={() => selectDayOnlyRange({ day })}
						class={cn(
							"inline-flex size-8 items-center justify-center rounded-md text-sm font-medium outline-none transition-colors",
							"hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/30",
							"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
							isDayOnlyRangeMiddle({ day }) && "bg-primary/10 text-primary",
							isDayOnlyRangeEdge({ day }) &&
								"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
						)}
					>
						{day}
					</button>
				{/each}
			</div>
		{:else}
			<RangeCalendar
				bind:value
				{locale}
				{captionLayout}
				{weekdayFormat}
				{fixedWeeks}
				{numberOfMonths}
				{disabled}
				{readonly}
				onValueChange={(nextValue) => {
					onValueChange?.(nextValue);
					if (nextValue?.start && nextValue?.end) {
						open = false;
					}
				}}
				class="rounded-[10px] bg-white"
				{...calendarProps}
			/>
		{/if}
	</Popover.Content>
</Popover.Root>
