<script lang="ts">
	import { backgroundColors, colors } from '$shared/config/colors';
	import { accessibleIcons, type AccessibleIconType } from '$shared/config/icons';
	import Label from '$shared/ui/label.svelte';
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

<Label name="Название">
	<TextInput
		variant="secondary"
		label="Название"
		placeholder="Название"
		bind:value={assetName}
		size="sm"
		focusUnderline="none"
		textAlign="left"
	/>
</Label>
<Label name="Единица измерения" description="Например: грамм, $, штука">
	<TextInput
		variant="secondary"
		label="Единица измерения"
		placeholder="Название"
		bind:value={assetName}
		size="sm"
		focusUnderline="none"
		textAlign="left"
	/>
</Label>
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
