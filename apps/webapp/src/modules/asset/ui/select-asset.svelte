<script lang="ts">
	import { accessibleIcons, type AccessibleIconType } from '$shared/config/icons';
	import { Select } from '@monesto/ui-kit';
	import type { Component } from 'svelte';
	import type { AssetType } from '../model/model.svelte';

	let {
		assets,
		value = $bindable<string | undefined>(),
		placeholder = 'Выберите актив',
		class: className
	} = $props<{
		assets: AssetType[];
		value?: string;
		placeholder?: string;
		class?: string;
	}>();

	function getIcon(name: AccessibleIconType) {
		return accessibleIcons[name] as Component;
	}
</script>

<Select
	items={assets}
	getItemKey={(asset) => asset.slug}
	isChecked={(asset) => asset.slug === value}
	onSelect={(asset) => (value = asset.slug)}
	{placeholder}
	class={className}
>
	{#snippet label({ selected })}
		{#if selected}
			{@const Icon = getIcon(selected.icon.name)}
			<div class="flex items-center gap-2">
				<div
					class="rounded-[8px] p-[7px]"
					style={`background-color: ${selected.icon.backgroundColor}`}
				>
					<Icon size={14} color={selected.icon.color} />
				</div>
				<span class="font-semibold">{selected.name}</span>
			</div>
		{/if}
	{/snippet}

	{#snippet item({ item: asset, checked })}
		{@const Icon = getIcon(asset.icon.name)}
		<div class="flex w-full items-center gap-2">
			<div class="rounded-[8px] p-[7px]" style={`background-color: ${asset.icon.backgroundColor}`}>
				<Icon size={14} color={asset.icon.color} />
			</div>
			<span class={checked ? 'font-semibold' : 'font-medium'}>{asset.name}</span>
		</div>
	{/snippet}
</Select>
