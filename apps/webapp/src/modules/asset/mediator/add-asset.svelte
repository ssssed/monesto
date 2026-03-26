<script lang="ts">
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
	import type { Snippet } from 'svelte';
	import {
		defaultBaseAsset,
		defaultPricedAsset,
		type AssetType,
		type CreateBaseAssetType,
		type CreatePricedAssetType
	} from '../model/model.svelte';
	import BaseAssetForm from './base-asset-form.svelte';
	import PricedAssetForm from './priced-asset-form.svelte';

	let {
		children,
		onSubmit
	}: {
		children: Snippet;
		onSubmit: (
			data: CreateBaseAssetType | CreatePricedAssetType,
			onClose: () => void
		) => Promise<void> | void;
	} = $props();

	let type = $state<AssetType['type']>('base');
	let open = $state(false);
	let baseData: CreateBaseAssetType = $state(defaultBaseAsset);
	let pricedData: CreatePricedAssetType = $state(defaultPricedAsset);

	function onTabChange(tab: string) {
		switch (tab) {
			case 'base':
				return (pricedData = defaultPricedAsset);
			case 'priced':
				return (baseData = defaultBaseAsset);
			default:
				throw new Error(`${tab} не обработан`);
		}
	}

	function onClose() {
		open = false;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		switch (type) {
			case 'base':
				return onSubmit(baseData, onClose);
			case 'priced':
				return onSubmit(pricedData, onClose);
			default:
				throw new Error(`${type} не обработан`);
		}
	}
</script>

<Drawer {open} onOpenChange={(o) => (open = o)}>
	<DrawerTrigger>
		{@render children?.()}
	</DrawerTrigger>
	<form onsubmit={handleSubmit}>
		<DrawerContent class="max-h-[85vh]!">
			<DrawerHeader>
				<DrawerTitle class="text-xl font-bold px-[7px]">Новый актив</DrawerTitle>
			</DrawerHeader>
			<Tabs bind:value={type} onValueChange={onTabChange} class="px-5">
				<TabsList class="w-full">
					<TabsTrigger value="base">В моей валюте</TabsTrigger>
					<TabsTrigger value="priced">В другой валюте</TabsTrigger>
				</TabsList>
				<TabsContent value="base" class="flex flex-col gap-4">
					<BaseAssetForm bind:data={baseData} />
				</TabsContent>
				<TabsContent value="priced" class="flex flex-col gap-4">
					<PricedAssetForm bind:data={pricedData} />
				</TabsContent>
			</Tabs>
			<DrawerFooter class="mt-[126px]">
				<Button type="submit" size="extraLg" class="font-semibold text-lg" onclick={onClose}>
					<CheckIcon size={20} />
					Создать
				</Button>
				<DrawerClose class="w-full h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
			</DrawerFooter>
		</DrawerContent>
	</form>
</Drawer>
