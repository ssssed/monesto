<script lang="ts">
	import Label from '$shared/ui/label.svelte';
	import { CheckIcon } from '@lucide/svelte';
	import {
		Button,
		Datepicker,
		DatepickerRange,
		Drawer,
		DrawerClose,
		DrawerContent,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle,
		DrawerTrigger,
		NumberInput,
		Tabs,
		TabsContent,
		TabsList,
		TabsTrigger,
		TextInput
	} from '@monesto/ui-kit';
	import type { Snippet } from 'svelte';
	import { isIncomeDetailsFormValid, type IncomeDetailsFormData } from '../model/model.svelte';

	let { children } = $props<{ children: Snippet }>();

	let open = $state(false);

	let formData = $state<IncomeDetailsFormData>({
		name: '',
		income: '',
		paymentType: 'monthly',
		payoutData: {
			monthly: {
				payoutDate: undefined
			},
			semimonthly: {
				payoutDates: [undefined, undefined],
				periods: [
					{ start: undefined, end: undefined },
					{ start: undefined, end: undefined }
				]
			},
			daily: {}
		}
	});

	$inspect(formData);
</script>

<Drawer {open} onOpenChange={(o) => (open = o)}>
	<DrawerTrigger class="contents">
		{@render children?.()}
	</DrawerTrigger>
	<form>
		<DrawerContent class="!max-h-[90vh]">
			<DrawerHeader>
				<DrawerTitle class="text-xl font-bold">Добавить доход</DrawerTitle>
			</DrawerHeader>
			<div class="flex flex-col gap-4.5 px-4">
				<Label name="Название">
					<TextInput
						bind:value={formData.name}
						variant="secondary"
						size="sm"
						textAlign="left"
						focusUnderline="none"
						placeholder="Название"
					/>
				</Label>
				<Label name="Сумма">
					<NumberInput
						bind:value={formData.income}
						variant="secondary"
						size="sm"
						textAlign="left"
						focusUnderline="none"
					/>
				</Label>
				<Tabs bind:value={formData.paymentType}>
					<Label name="Частота">
						<TabsList class="w-full mb-2">
							<TabsTrigger class="w-1/3" value="monthly">1 раз</TabsTrigger>
							<TabsTrigger class="w-1/3" value="semimonthly">2 раза</TabsTrigger>
							<TabsTrigger class="w-1/3" value="daily">Каждый день</TabsTrigger>
						</TabsList>
					</Label>
					<TabsContent value="monthly">
						<Label name="Дата получения">
							<Datepicker
								bind:value={formData.payoutData.monthly.payoutDate}
								displayMode="day"
								daysOnly
							/>
						</Label>
					</TabsContent>
					<TabsContent value="semimonthly">
						<div class="grid grid-cols-2 gap-2.5 mb-4">
							<Label name="Дата получения 1">
								<Datepicker bind:value={formData.payoutData.semimonthly.payoutDates[0]} />
							</Label>
							<Label name="Дата получения 2">
								<Datepicker bind:value={formData.payoutData.semimonthly.payoutDates[1]} />
							</Label>
						</div>
						<Label
							name="Периоды выплат"
							description="Периоды, за которые начисляется ЗП в каждую дату"
						>
							<div class="grid grid-cols-2 gap-2.5">
								<DatepickerRange
									bind:value={formData.payoutData.semimonthly.periods[0]}
									displayMode="day"
									daysOnly
								/>
								<DatepickerRange
									bind:value={formData.payoutData.semimonthly.periods[1]}
									displayMode="day"
									daysOnly
								/>
							</div>
						</Label>
					</TabsContent>
				</Tabs>
			</div>
			<DrawerFooter class="mt-[126px]">
				<Button
					type="submit"
					disabled={!isIncomeDetailsFormValid(formData)}
					size="extraLg"
					class="font-semibold text-lg"
				>
					<CheckIcon size={20} />
					Сохранить
				</Button>
				<DrawerClose class="w-full h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
			</DrawerFooter>
		</DrawerContent>
	</form>
</Drawer>
