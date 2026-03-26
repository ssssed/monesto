<script lang="ts">
	import { backgroundColors, colors } from '$shared/config/colors';
	import { accessibleIcons, type AccessibleIconType } from '$shared/config/icons';
	import { TextInput } from '@monesto/ui-kit';
	import type { Component } from 'svelte';
	import ColorPicker from '../ui/color-picker.svelte';
	import IconSection from '../ui/icon-section.svelte';

	let selectedIcon = $state<[AccessibleIconType, Component]>(
		Object.entries(accessibleIcons)[0]! as [AccessibleIconType, Component]
	);
	let selectedBackgroundColor = $state<string>(backgroundColors[0]);
	let selectedColor = $state<string>(colors[0]);
	let assetName = $state<string>('');
</script>

<div class="flex flex-col gap-1.5">
	<p class="text-[#64748B] text-[13px] font-medium">Название</p>
	<TextInput
		variant="secondary"
		label="Название"
		placeholder="Название"
		bind:value={assetName}
		size="sm"
		focusUnderline="none"
		textAlign="left"
	/>
</div>
<IconSection {selectedIcon} backgroundColor={selectedBackgroundColor} color={selectedColor} />
<ColorPicker
	bind:currentColor={selectedBackgroundColor}
	colors={backgroundColors}
	title="Цвет фона"
	selectedItemBorderColor="#3B82F6"
/>
<ColorPicker
	bind:currentColor={selectedColor}
	{colors}
	title="Цвет иконки"
	selectedItemBorderColor="#0F172A"
/>
