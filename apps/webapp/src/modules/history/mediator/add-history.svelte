<script lang="ts">
	import { formatMoney } from '$shared/lib/money';
	import Label from '$shared/ui/label.svelte';
	import { ArrowDownLeft, ArrowUpRight, Check } from '@lucide/svelte';
	import {
		Button,
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

	let {
		children,
		class: className,
		onAddHistory
	}: {
		children: Snippet;
		class?: string;
		onAddHistory: (event: HistoryEventType, onClose: () => void) => Promise<void> | void;
	} = $props();

	let open = $state<boolean>(false);

	type HistoryEventType = {
		type: 'sell' | 'buy';
		count: string;
		price: string;
	};

	let formData = $state<HistoryEventType>({
		type: 'buy',
		count: '',
		price: ''
	});

	let total = $derived(parseFloat(formData.price || '0') * parseFloat(formData.count || '0'));

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
				<div class="grid grid-cols-2 gap-3">
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
			>
				<Check strokeWidth={3} />
				Добавить
			</Button>
			<DrawerClose class="h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
		</DrawerFooter>
	</DrawerContent>
</Drawer>
