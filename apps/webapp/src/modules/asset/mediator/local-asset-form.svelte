<script lang="ts">
	import { userStore } from '$modules/user';
	import { backgroundColors, colors } from '$shared/config/colors';
	import Label from '$shared/ui/label.svelte';
	import { TextInput } from '@monesto/ui-kit';
	import { DEFAULT_ASSET_ICON, type CreateAssetType } from '../model/model.svelte';
	import ColorPicker from '../ui/color-picker.svelte';
	import IconSection from '../ui/icon-section.svelte';

	let {
		data = $bindable({
			name: '',
			icon: DEFAULT_ASSET_ICON,
			currency: userStore.userSettings?.currency ?? 'usd'
		})
	}: {
		data: CreateAssetType;
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
	class="mb-[118px]"
/>
