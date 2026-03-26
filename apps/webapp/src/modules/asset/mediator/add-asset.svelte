<script lang="ts">
	import { type AccessibleIconType } from '$shared/config/icons';
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
		Tabs,
		TabsContent,
		TabsList,
		TabsTrigger
	} from '@monesto/ui-kit';
	import type { Component, Snippet } from 'svelte';
	import type { AssetType } from '../model/model.svelte';
	import BaseAssetForm from './base-asset-form.svelte';
	import PricedAssetForm from './priced-asset-form.svelte';

	let type = $state<AssetType['type']>('base');

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

	let open = $state(false);

	function onClose() {
		open = false;
	}
</script>

<Drawer {open} onOpenChange={(o) => (open = o)}>
	<DrawerTrigger>
		{@render children?.()}
	</DrawerTrigger>
	<DrawerContent>
		<DrawerHeader>
			<DrawerTitle class="text-xl font-bold px-[7px]">Новый актив</DrawerTitle>
		</DrawerHeader>
		<div class="px-5 flex flex-col gap-4">
			<Tabs bind:value={type}>
				<TabsList class="w-full">
					<TabsTrigger value="base">В моей валюте</TabsTrigger>
					<TabsTrigger value="priced">В другой валюте</TabsTrigger>
				</TabsList>
				<TabsContent value="base">
					<BaseAssetForm />
				</TabsContent>
				<TabsContent value="priced">
					<PricedAssetForm />
				</TabsContent>
			</Tabs>
		</div>
		<DrawerFooter class="mt-[126px]">
			<Button size="extraLg" class="font-semibold text-lg" onclick={onClose}>
				<CheckIcon size={20} />
				Создать
			</Button>
			<DrawerClose class="w-full h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
		</DrawerFooter>
	</DrawerContent>
</Drawer>
