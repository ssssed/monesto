<script lang="ts">
	import { backgroundColors, colors } from '$shared/config/colors';
	import Label from '$shared/ui/label.svelte';
	import { TextInput } from '@monesto/ui-kit';
	import { defaultPricedAsset, type CreatePricedAssetType } from '../model/model.svelte';
	import ColorPicker from '../ui/color-picker.svelte';
	import IconSection from '../ui/icon-section.svelte';

	let {
		data = $bindable(defaultPricedAsset)
	}: {
		data: CreatePricedAssetType;
	} = $props();
</script>

<Label name="Название">
	<TextInput
		variant="secondary"
		label="Название"
		placeholder="Название"
		bind:value={data.name}
		size="sm"
		focusUnderline="none"
		textAlign="left"
	/>
</Label>
<Label name="Единица измерения" description="Например: грамм, $, штука">
	<TextInput
		variant="secondary"
		label="Единица измерения"
		placeholder="Единица измерения"
		bind:value={data.unit}
		size="sm"
		focusUnderline="none"
		textAlign="left"
	/>
</Label>
<IconSection
	bind:selectedIcon={data.icon.name}
	backgroundColor={data.icon.backgroundColor}
	color={data.icon.color}
/>
<ColorPicker
	bind:currentColor={data.icon.backgroundColor}
	colors={backgroundColors}
	title="Цвет фона"
	selectedItemBorderColor="#3B82F6"
/>
<ColorPicker
	bind:currentColor={data.icon.color}
	{colors}
	title="Цвет иконки"
	selectedItemBorderColor="#0F172A"
/>
