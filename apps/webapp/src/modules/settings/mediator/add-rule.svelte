<script lang="ts">
	import { AssetsStore, SelectAsset } from '$modules/asset';
	import { userStore } from '$modules/user';
	import { formatMoney } from '$shared/lib/money';
	import { formatDateToServer } from '$shared/lib/time';
	import Label from '$shared/ui/label.svelte';
	import { CheckIcon } from '@lucide/svelte';
	import {
		Button,
		Datepicker,
		Drawer,
		DrawerClose,
		DrawerContent,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle,
		DrawerTrigger,
		NumberInput,
		Tabs,
		TabsList,
		TabsTrigger,
		type DatepickerValue
	} from '@monesto/ui-kit';
	import { type Snippet } from 'svelte';
	import { AllocateRulesStore, type TopUpType } from '../model/model.svelte';

	let { children } = $props<{ children: Snippet }>();

	let open = $state(false);

	const assetsStore = AssetsStore.getContext();
	const rulesStore = AllocateRulesStore.getContext();

	let formData = $state<{
		assetId?: string;
		topUpType: TopUpType;
		value: string;
		executionDate?: DatepickerValue;
	}>({
		topUpType: 'percent',
		value: ''
	});

	const getNumberInputLabel = $derived(() => {
		switch (formData.topUpType) {
			case 'percent':
				return 'Значение, %';
			case 'fixed_amount':
				return `Сумма, ${userStore.userSettings?.symbol}`;
			case 'quantity': {
				const asset = assetsStore.assets.find((a) => a.id === formData.assetId);

				return asset ? `Количество, ${asset.symbol}` : 'Количество';
			}
			default:
				return '';
		}
	});

	const getNumberInputDescription = $derived(() => {
		switch (formData.topUpType) {
			case 'percent':
				return `${formData.value}% от (ЗП − обязательные расходы)`;
			case 'fixed_amount':
				return `Фиксированная сумма в рублях каждый месяц`;
			case 'quantity': {
				const asset = assetsStore.assets.find((a) => a.id === formData.assetId);

				return asset && formData.value
					? `${formatMoney(parseFloat(formData.value), asset.symbol)} каждый месяц`
					: 'Количество которое вы будите откладывать каждый месяц';
			}
			default:
				return '';
		}
	});

	async function handleSubmit() {
		await rulesStore.createRule({
			assetSlug: formData.assetId!,
			topUpType: formData.topUpType,
			value: parseFloat(formData.value),
			// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
			executionDate: formatDateToServer(formData.executionDate?.toString()!)
		});
		open = false;
	}
</script>

<Drawer {open} onOpenChange={(o) => (open = o)}>
	<DrawerTrigger class="contents">
		{@render children?.()}
	</DrawerTrigger>
	<form>
		<DrawerContent class="!max-h-[90vh]">
			<DrawerHeader>
				<DrawerTitle class="text-xl font-bold px-[7px]">Новое правило</DrawerTitle>
			</DrawerHeader>
			<div class="px-5 flex flex-col gap-4">
				<Label name="Актив">
					<SelectAsset assets={assetsStore.assets} bind:value={formData.assetId} />
				</Label>
				<Label name="Тип суммы">
					<Tabs bind:value={formData.topUpType}>
						<TabsList class="w-full">
							<TabsTrigger value="percent">% от ЗП</TabsTrigger>
							<TabsTrigger value="fixed_amount">Фиксированно</TabsTrigger>
							<TabsTrigger value="quantity">Единицы</TabsTrigger>
						</TabsList>
					</Tabs>
				</Label>
				<Label name={getNumberInputLabel()} description={getNumberInputDescription()}>
					<NumberInput
						size="sm"
						variant="secondary"
						textAlign="left"
						focusUnderline="none"
						bind:value={formData.value}
					/>
				</Label>
				<Label name="Дата выполнения">
					<Datepicker bind:value={formData.executionDate} />
				</Label>
			</div>
			<DrawerFooter class="mt-[126px]">
				<Button onclick={handleSubmit} type="submit" size="extraLg" class="font-semibold text-lg">
					<CheckIcon size={20} />
					Сохранить
				</Button>
				<DrawerClose class="w-full h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
			</DrawerFooter>
		</DrawerContent>
	</form>
</Drawer>
