<script lang="ts">
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
	import { cn } from "$lib/utils";
	import { Calendar } from "../calendar/index.js";
	import * as Popover from "../popover/index.js";
	import type { DatepickerProps } from "./types";
	import type { InputSize } from "../input/types";

	const DATEPICKER_TRIGGER_SIZES: Record<InputSize, { height: string; text: string; icon: string }> = {
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
		value = $bindable(undefined),
		size = "default",
		placeholderText = "Выберите дату",
		locale = "ru-RU",
		displayMode = "date",
		daysOnly = false,
		disabled = false,
		readonly = false,
		class: className,
		captionLayout = "dropdown",
		weekdayFormat = "short",
		fixedWeeks = true,
		onValueChange,
		...calendarProps
	}: DatepickerProps = $props();

	let open = $state(false);

	const DAYS_IN_MONTH = Array.from({ length: 31 }, (_, index) => index + 1);

	const triggerSize = $derived(DATEPICKER_TRIGGER_SIZES[size]);
	const formatter = $derived(new DateFormatter(locale, { dateStyle: "medium" }));
	const hasValue = $derived(!!value);

	const triggerLabel = $derived.by(() => {
		if (!value) {
			return placeholderText;
		}

		return daysOnly || displayMode === "day"
			? `${value.day} число`
			: formatter.format(value.toDate(getLocalTimeZone()));
	});

	/**
	 * Creates a stable DateValue for single day-only selection.
	 * @param props Day number to convert into a technical calendar date.
	 */
	function createDayOnlyDate(props: { day: number }) {
		return new CalendarDate(2000, 1, props.day);
	}

	/**
	 * Checks whether a day matches the current day-only value.
	 * @param props Day number to compare with the current value.
	 */
	function isDayOnlySelected(props: { day: number }) {
		return value?.day === props.day;
	}

	/**
	 * Updates the selected value from the day-only grid and closes the popover.
	 * @param props Clicked day from the day-only grid.
	 */
	function selectDayOnlyDate(props: { day: number }) {
		const nextValue = createDayOnlyDate({ day: props.day });

		value = nextValue;
		onValueChange?.(nextValue);
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				data-slot="datepicker-trigger"
				class={cn(
					"inline-flex w-full items-center justify-between gap-2 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] text-left font-medium text-slate-900 outline-none transition-colors",
					"focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
					triggerSize.height,
					triggerSize.text,
					!hasValue && "text-slate-400",
					className
				)}
			>
				<span class="truncate">{triggerLabel}</span>
				<CalendarIcon class={cn("shrink-0 text-slate-500", triggerSize.icon)} />
			</button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content
		data-slot="datepicker-content"
		align="start"
		sideOffset={8}
		class="w-auto overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white p-0 shadow-md"
	>
		{#if daysOnly}
			<div class="grid grid-cols-7 gap-1 p-3" role="grid" aria-label="Выбор дня">
				{#each DAYS_IN_MONTH as day (day)}
					<button
						type="button"
						role="gridcell"
						disabled={disabled || readonly}
						aria-selected={isDayOnlySelected({ day })}
						onclick={() => selectDayOnlyDate({ day })}
						class={cn(
							"inline-flex size-8 items-center justify-center rounded-md text-sm font-medium outline-none transition-colors",
							"hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/30",
							"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
							isDayOnlySelected({ day }) &&
								"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
						)}
					>
						{day}
					</button>
				{/each}
			</div>
		{:else}
			<Calendar
				type="single"
				bind:value
				{locale}
				{captionLayout}
				{weekdayFormat}
				{fixedWeeks}
				{disabled}
				{readonly}
				onValueChange={(nextValue) => {
					onValueChange?.(nextValue);
					open = false;
				}}
				class="rounded-[10px] bg-white"
				{...calendarProps}
			/>
		{/if}
	</Popover.Content>
</Popover.Root>
