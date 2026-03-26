<script lang="ts">
	import { accessibleIcons, type AccessibleIconType } from '$shared/config/icons';
	import { CheckIcon } from '@lucide/svelte';
	import {
		Button,
		Drawer,
		DrawerClose,
		DrawerContent,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle,
		DrawerTrigger,
		TextInput
	} from '@monesto/ui-kit';
	import type { Component, Snippet } from 'svelte';
	import ColorPicker from '../ui/color-picker.svelte';
	import IconSection from '../ui/icon-section.svelte';

	let {
		children,
		onSubmit
	}: {
		children: Snippet;
		onSubmit: (
			{
				icon,
				backgroundColor,
				color
			}: {
				icon: [AccessibleIconType, Component];
				backgroundColor: string;
				color: string;
			},
			onClose: () => void
		) => void;
	} = $props();

	const backgroundColors = [
		'#DBEAFE',
		'#DCFCE7',
		'#FEF3C7',
		'#FEE2E2',
		'#EDE9FE',
		'#F1F5F9',
		'#FCE7F3'
	];

	const colors = ['#3B82F6', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#64748B', '#EC4899'];

	let open = $state(false);
	let selectedIcon = $state<[AccessibleIconType, Component]>(
		Object.entries(accessibleIcons)[0]! as [AccessibleIconType, Component]
	);
	let selectedBackgroundColor = $state<string>(backgroundColors[0]);
	let selectedColor = $state<string>(colors[0]);
	let assetName = $state<string>('');

	function onClose() {
		open = false;
	}

	function handleSubmit() {
		onSubmit(
			{
				icon: selectedIcon,
				backgroundColor: selectedBackgroundColor,
				color: selectedColor
			},
			onClose
		);
	}
</script>

<Drawer {open} onOpenChange={(o) => (open = o)}>
	<DrawerTrigger>
		{@render children?.()}
	</DrawerTrigger>
	<DrawerContent>
		<DrawerHeader>
			<DrawerTitle class="text-xl font-bold">Новый актив</DrawerTitle>
		</DrawerHeader>
		<div class="px-5 flex flex-col gap-4">
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
		</div>
		<DrawerFooter class="mt-[126px]">
			<Button size="extraLg" class="font-semibold text-lg" onclick={() => handleSubmit()}>
				<CheckIcon size={20} />
				Создать
			</Button>
			<DrawerClose class="w-full h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
		</DrawerFooter>
	</DrawerContent>
</Drawer>
