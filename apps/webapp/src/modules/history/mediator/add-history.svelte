<script lang="ts">
	import { formatMoney } from '$shared/lib/money';
	import Label from '$shared/ui/label.svelte';
	import { ArrowDownLeft, ArrowUpRight, Check } from '@lucide/svelte';
	import {
		Button,
		cn,
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
		TabsTrigger
	} from '@monesto/ui-kit';
	import type { Snippet } from 'svelte';
	import { calculateTotal, isCreateHistoryEventDisabled } from '../model/domain';
	import type { HistoryEventDataType } from '../model/model.svelte';

	let {
		children,
		class: className,
		onAddHistory,
		isLocalCurrency
	}: {
		children: Snippet;
		class?: string;
		onAddHistory: (event: HistoryEventDataType, onClose: () => void) => Promise<void> | void;
		isLocalCurrency: boolean;
	} = $props();

	let open = $state<boolean>(false);
	let formData = $state<HistoryEventDataType>({
		type: 'buy',
		price: isLocalCurrency ? '1' : '',
		count: ''
	});

	let total = $derived(calculateTotal(formData));
	let disabled = $derived(isCreateHistoryEventDisabled(formData));

	function onClose() {
		open = false;
	}
</script>

<Drawer bind:open>
	<DrawerTrigger class={className}>
		{@render children?.()}
	</DrawerTrigger>
	<DrawerContent>
		<DrawerHeader>
			<DrawerTitle class="px-[7px] text-xl font-bold">Добавить событие</DrawerTitle>
		</DrawerHeader>
		<Tabs bind:value={formData.type} class="px-4">
			<TabsList class="w-full">
				<TabsTrigger value="buy">
					<ArrowDownLeft size={16} class="mr-1.5" />
					Покупка
				</TabsTrigger>
				<TabsTrigger value="sell">
					<ArrowUpRight size={16} class="mr-1.5" />
					Продажа
				</TabsTrigger>
			</TabsList>
			<div class="pt-4 flex flex-col gap-4">
				<div
					class={cn('grid gap-3', {
						['grid-cols-2']: !isLocalCurrency,
						['grid-cols-1']: isLocalCurrency
					})}
				>
					{#if !isLocalCurrency}
						<Label name="Цена за ед. ₽">
							<NumberInput
								size="sm"
								variant="secondary"
								textAlign="left"
								focusUnderline="none"
								bind:value={formData.price}
							>
								{#snippet children({ onClose })}
									<Button onclick={onClose} size="extraLg">ОК</Button>
								{/snippet}
							</NumberInput>
						</Label>
					{/if}
					<Label name="Количество">
						<NumberInput
							size="sm"
							variant="secondary"
							textAlign="left"
							focusUnderline="none"
							bind:value={formData.count}
						>
							{#snippet children({ onClose })}
								<Button onclick={onClose} size="extraLg">ОК</Button>
							{/snippet}
						</NumberInput>
					</Label>
				</div>
				<div class="mb-22.5 flex justify-between items-center">
					<span class="text-[#64748B] text-[15px] font-medium">Итого:</span>
					<span class="text-[#0F172A] font-bold text-lg">{formatMoney(total)}</span>
				</div>
			</div>
		</Tabs>
		<DrawerFooter>
			<Button
				size="extraLg"
				class="font-semibold text-lg"
				onclick={() => onAddHistory(formData, onClose)}
				{disabled}
			>
				<Check strokeWidth={3} />
				Добавить
			</Button>
			<DrawerClose class="h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
		</DrawerFooter>
	</DrawerContent>
</Drawer>
