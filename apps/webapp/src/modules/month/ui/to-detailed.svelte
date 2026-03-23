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
		NumberInput,
		TextInput
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

				<div
					class="overflow-hidden rounded-2xl border border-slate-100 bg-surface-light shadow-sm dark:border-white/10 dark:bg-white/3"
				>
					<div
						class="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
					>
						<span
							class="min-w-0 flex-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
						>
							Item
						</span>
						<span
							class="w-27 shrink-0 text-right text-[11px] font-semibold tracking-wide text-slate-500 uppercase sm:w-32 dark:text-slate-400"
						>
							Amount
						</span>
						<span class="size-10 shrink-0" aria-hidden="true"></span>
					</div>

					{#each stepStore.mandatory.breakdown as line, index (line.id)}
						<div
							class="flex min-w-0 items-center gap-2 border-b border-slate-100 px-2 py-2 last:border-b-0 dark:border-white/10"
						>
							{#if line.kind === 'unallocated'}
								<div class="min-w-0 flex-1">
									<p
										class="flex min-h-14 items-center rounded-xl border border-dashed border-slate-200/90 bg-white/90 px-3 text-sm text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
									>
										<span class="truncate">{line.label}</span>
									</p>
								</div>
								<div class="w-27 shrink-0 sm:w-32">
									<p
										class="flex min-h-14 items-center justify-end rounded-xl border border-dashed border-slate-200/90 bg-white/90 px-2 text-sm tabular-nums text-slate-900 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white"
									>
										{#if line.amount === ''}
											—
										{:else}
											₽{formatTotalDisplay({ n: parseAmount(line.amount) })}
										{/if}
									</p>
								</div>
								<div class="size-10 shrink-0" aria-hidden="true"></div>
							{:else}
								<div class="min-w-0 flex-1">
									<TextInput
										bind:value={line.label}
										label="Item"
										placeholder="e.g. Rent"
										size="sm"
									/>
								</div>
								<div class="w-27 shrink-0 sm:w-32">
									<NumberInput class="text-xl" bind:value={line.amount} label="Amount" prefix="₽" size="sm">
										{#snippet children({ onClose })}
											<Button size="extraLg" class="w-full text-lg font-bold" onclick={onClose}>
												OK
											</Button>
										{/snippet}
									</NumberInput>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="size-10 shrink-0 text-slate-400 hover:bg-slate-200/80 hover:text-red-600 dark:hover:bg-white/10"
									onclick={() => removeBreakdownLine({ index })}
									aria-label="Remove line"
								>
									<Trash2 class="size-4.5" />
								</Button>
							{/if}
						</div>
					{/each}
				</div>

				<Button
					type="button"
					variant="outline"
					class="w-full border-dashed border-slate-200 dark:border-white/15"
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
