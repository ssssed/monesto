<script lang="ts" generics="T">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { SelectProps, SelectSize } from './types';

	const SELECT_TRIGGER_SIZES: Record<
		SelectSize,
		{ height: string; text: string; icon: string; padding: string }
	> = {
		sm: {
			height: 'h-10',
			text: 'text-sm',
			icon: 'size-4',
			padding: 'px-3'
		},
		default: {
			height: 'h-12',
			text: 'text-[15px]',
			icon: 'size-4',
			padding: 'px-4'
		},
		lg: {
			height: 'h-14',
			text: 'text-base',
			icon: 'size-5',
			padding: 'px-4'
		}
	};

	let {
		items,
		isChecked,
		onSelect,
		getItemKey,
		isItemDisabled,
		label,
		item,
		placeholder,
		disabled = false,
		open = $bindable(false),
		size = 'default',
		class: className,
		contentClass,
		align = 'start',
		sideOffset = 8
	}: SelectProps<T> = $props();

	const triggerSize = $derived(SELECT_TRIGGER_SIZES[size]);
	const selectedItem = $derived(items.find(isChecked));
	const selectedValue = $derived(
		selectedItem ? resolveItemKey({ item: selectedItem, index: items.indexOf(selectedItem) }) : undefined
	);

	function resolveItemKey(props: { item: T; index: number }) {
		return getItemKey?.(props.item) ?? String(props.index);
	}

	function handleValueChange(value: string) {
		const nextItem = items.find(
			(entry, index) => resolveItemKey({ item: entry, index }) === value
		);

		if (nextItem) {
			onSelect(nextItem);
		}
	}
</script>

<SelectPrimitive.Root
	type="single"
	value={selectedValue}
	onValueChange={handleValueChange}
	bind:open
	{disabled}
>
	<SelectPrimitive.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				data-slot="select-trigger"
				class={cn(
					'inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-[12px] border border-[#E2E8F0] bg-white text-left font-medium text-[#0F172A] outline-none transition-colors',
					'focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50',
					triggerSize.height,
					triggerSize.text,
					triggerSize.padding,
					className
				)}
			>
				<span class="flex min-w-0 flex-1 items-center">
					{#if selectedItem}
						{@render label({ selected: selectedItem })}
					{:else if placeholder}
						<span class="truncate text-slate-400">{placeholder}</span>
					{:else}
						{@render label({ selected: undefined })}
					{/if}
				</span>
				<ChevronDownIcon
					class={cn('shrink-0 text-slate-400 transition-transform', triggerSize.icon, open && 'rotate-180')}
				/>
			</button>
		{/snippet}
	</SelectPrimitive.Trigger>

	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			data-slot="select-content"
			{align}
			{sideOffset}
			class={cn(
				'z-50 max-h-60 w-[var(--bits-select-anchor-width)] overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white p-1 shadow-md',
				'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95',
				contentClass
			)}
		>
			{#each items as entry, index (resolveItemKey({ item: entry, index }))}
				{@const itemKey = resolveItemKey({ item: entry, index })}
				{@const itemDisabled = isItemDisabled?.(entry) ?? false}

				<SelectPrimitive.Item value={itemKey} disabled={itemDisabled}>
					{#snippet child({ props, selected, highlighted })}
						<div
							{...props}
							class={cn(
								'relative flex w-full cursor-default select-none items-center rounded-[8px] px-3 py-2.5 outline-none transition-colors',
								highlighted && 'bg-[#F8FAFC]',
								selected && 'bg-primary/10',
								itemDisabled && 'pointer-events-none opacity-50'
							)}
						>
							{@render item({ item: entry, checked: selected, highlighted })}
						</div>
					{/snippet}
				</SelectPrimitive.Item>
			{/each}
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
</SelectPrimitive.Root>
