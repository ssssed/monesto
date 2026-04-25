<script lang="ts">
	import { userStore } from '$modules/user';
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
	import { isDisabledSubmit } from '../model/domain';
	import {
		DEFAULT_ASSET_ICON,
		type AssetInAnotherCurrency,
		type AssetInUserCurrency,
		type CreateAssetType
	} from '../model/model.svelte';
	import AnotherAssetForm from './another-asset-form.svelte';
	import LocalAssetForm from './local-asset-form.svelte';

	let {
		children,
		onSubmit
	}: {
		children: Snippet;
		onSubmit: (data: CreateAssetType, onClose: () => void) => Promise<void> | void;
	} = $props();

	const defaultFormData = {
		name: '',
		icon: DEFAULT_ASSET_ICON,
		currency: userStore.userSettings?.currency ?? 'usd'
	};

	let type = $state<AssetInUserCurrency | AssetInAnotherCurrency>('local');
	let open = $state(false);

	let formData = $state<CreateAssetType>(defaultFormData);

	function onClose() {
		open = false;
	}

	function onTabChange() {
		formData = defaultFormData;
	}

	async function handleSubmitForm() {
		onSubmit(formData, onClose);
	}

	function onFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		handleSubmitForm();
	}
</script>

<Drawer {open} onOpenChange={(o) => (open = o)}>
	<DrawerTrigger>
		{@render children?.()}
	</DrawerTrigger>
	<form onsubmit={onFormSubmit}>
		<DrawerContent class="!max-h-[90vh]">
			<DrawerHeader>
				<DrawerTitle class="text-xl font-bold px-[7px]">Новый актив</DrawerTitle>
			</DrawerHeader>
			<Tabs bind:value={type} onValueChange={onTabChange} class="px-5">
				<TabsList class="w-full">
					<TabsTrigger value="local">В моей валюте</TabsTrigger>
					<TabsTrigger value="another">В другой валюте</TabsTrigger>
				</TabsList>
				<TabsContent value="local" class="flex flex-col gap-4">
					<LocalAssetForm bind:data={formData} />
				</TabsContent>
				<TabsContent value="another" class="flex flex-col gap-4">
					<AnotherAssetForm bind:data={formData} />
				</TabsContent>
			</Tabs>
			<DrawerFooter class="mt-[126px]">
				<Button
					type="submit"
					size="extraLg"
					class="font-semibold text-lg"
					onclick={handleSubmitForm}
					disabled={isDisabledSubmit(formData)}
				>
					<CheckIcon size={20} />
					Создать
				</Button>
				<DrawerClose class="w-full h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
			</DrawerFooter>
		</DrawerContent>
	</form>
</Drawer>
