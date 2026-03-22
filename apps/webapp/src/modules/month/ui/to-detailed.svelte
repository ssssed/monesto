<script lang="ts">
	import { Pencil, Plus, Trash2 } from '@lucide/svelte';
	import {
		Button,
		Drawer,
		DrawerClose,
		DrawerContent,
		DrawerDescription,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle,
		DrawerTrigger,
		NumberInput
	} from '@monesto/ui-kit';
	import type { Snippet } from 'svelte';
	import { stepStore } from '../model/model.svelte';
	import {
		createMandatoryBreakdownStrategy,
		parseAmount,
		persistMandatoryDrawerSubmit
	} from '../model/strategies/mandatory';

	let { children } = $props<{
		children: Snippet;
	}>();

	/**
	 * Форматирует число для отображения итога (русская локаль).
	 * @param props — число `n` для вывода
	 */
	function formatTotalDisplay(props: { n: number }): string {
		const { n } = props;
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(n);
	}

	/**
	 * Добавляет пользовательскую строку разбивки.
	 * @param props — без полей
	 */
	function addBreakdownLine(props: object) {
		void props;
		stepStore.mandatory.breakdown = [
			...stepStore.mandatory.breakdown,
			{ id: crypto.randomUUID(), kind: 'custom', label: '', amount: '' }
		];
	}

	/**
	 * Удаляет пользовательскую строку разбивки по индексу.
	 * @param props — индекс строки `index`
	 */
	function removeBreakdownLine(props: { index: number }) {
		const { index } = props;
		const line = stepStore.mandatory.breakdown[index];
		if (!line || line.kind !== 'custom') return;
		stepStore.mandatory.breakdown = stepStore.mandatory.breakdown.filter((_, i) => i !== index);
	}

	/**
	 * Фиксирует breakdown и итог в stepStore при Submit (до закрытия дроера).
	 */
	function handleSubmit() {
		persistMandatoryDrawerSubmit(stepStore.mandatory);
	}

	$effect(() => {
		void stepStore.mandatory.value;
		const lines = stepStore.mandatory.breakdown;
		for (const line of lines) {
			void line.amount;
			void line.label;
			void line.kind;
		}
		const s = createMandatoryBreakdownStrategy(stepStore.mandatory.value);
		s.sync(stepStore.mandatory);
	});

	const totalNumber = $derived.by(() => {
		const s = createMandatoryBreakdownStrategy(stepStore.mandatory.value);
		return s.getTotal(stepStore.mandatory);
	});
</script>

<Drawer>
	<DrawerTrigger>
		<Button variant="ghost" class="mt-2 underline underline-offset-5 text-base text-emerald-700">
			<Pencil />
			{@render children?.()}
		</Button>
	</DrawerTrigger>
	<DrawerContent class="flex max-h-[85vh] h-full flex-col">
		<DrawerHeader>
			<DrawerTitle>Detailed your expenses</DrawerTitle>
			<DrawerDescription>Here you can detailed your expenses.</DrawerDescription>
		</DrawerHeader>

		<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2">
			<div
				class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
			>
				<p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
					Total
				</p>
				<p class="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
					₽{formatTotalDisplay({ n: totalNumber })}
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-slate-700 dark:text-slate-200">Breakdown</p>
				{#each stepStore.mandatory.breakdown as line, index (line.id)}
					<div
						class="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 dark:border-white/10 sm:flex-row sm:items-end"
					>
						{#if line.kind === 'unallocated'}
							<div class="flex min-w-0 flex-1 flex-col gap-1">
								<span class="text-xs text-slate-500 dark:text-slate-400">What</span>
								<p
									class="rounded-lg border border-dashed border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
								>
									{line.label}
								</p>
							</div>
							<div class="flex shrink-0 items-end gap-2 sm:w-40">
								<div class="min-w-0 flex-1">
									<span class="mb-1 block text-xs text-slate-500 dark:text-slate-400">Amount</span>
									<p
										class="rounded-lg border border-dashed border-slate-200 bg-slate-100/80 px-3 py-2 text-right text-sm tabular-nums text-slate-900 dark:border-white/15 dark:bg-white/10 dark:text-white"
									>
										{#if line.amount === ''}
											—
										{:else}
											₽{formatTotalDisplay({ n: parseAmount(line.amount) })}
										{/if}
									</p>
								</div>
							</div>
						{:else}
							<label class="flex min-w-0 flex-1 flex-col gap-1">
								<span class="text-xs text-slate-500 dark:text-slate-400">What</span>
								<input
									type="text"
									bind:value={line.label}
									placeholder="e.g. Rent"
									class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
								/>
							</label>
							<div class="flex shrink-0 items-end gap-2 sm:w-40">
								<div class="min-w-0 flex-1">
									<span class="mb-1 block text-xs text-slate-500 dark:text-slate-400">Amount</span>
									<NumberInput bind:value={line.amount} prefix="₽">
										<Button size="extraLg" class="w-full text-lg font-bold">OK</Button>
									</NumberInput>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="shrink-0 text-slate-500 hover:text-red-600"
									onclick={() => removeBreakdownLine({ index })}
									aria-label="Remove line"
								>
									<Trash2 class="size-5" />
								</Button>
							</div>
						{/if}
					</div>
				{/each}

				<Button
					type="button"
					variant="outline"
					class="w-full border-dashed"
					onclick={() => addBreakdownLine({})}
				>
					<Plus class="mr-2 size-4" />
					Add line
				</Button>
			</div>
		</div>

		<DrawerFooter>
			<DrawerClose asChild>
				<Button size="extraLg" class="w-full text-lg font-bold" onclick={() => handleSubmit()}>
					Submit
				</Button>
			</DrawerClose>
			<DrawerClose asChild>
				<Button size="extraLg" variant="ghost" class="w-full text-lg font-bold">Cancel</Button>
			</DrawerClose>
		</DrawerFooter>
	</DrawerContent>
</Drawer>
