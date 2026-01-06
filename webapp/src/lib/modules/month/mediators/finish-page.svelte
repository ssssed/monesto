<script lang="ts">
	import Button from '$lib/shared/ui/button/button.svelte';
	import { CircleCheck } from '@lucide/svelte';
	import type { StepProps } from '../types';
	import { monthStore } from '../model.svelte';

	let _: StepProps = $props();

	const income = Number(monthStore.incoming.value);
	const mandatory = Number(monthStore.mandatory.value);

	const percent = 20;
	const available = Math.max(income - mandatory, 0);
	const monthlyAmount = Math.round((available * percent) / 100);
</script>

<h2
	class="mt-8 text-[#111813] dark:text-white tracking-tight text-[28px] font-bold leading-tight text-center pb-6"
>
	Your Recommendation
</h2>

<main class="flex flex-1 flex-col items-center">
	<!-- Card -->
	<div
		class="mb-6 w-full max-w-md overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm dark:border-white/10 dark:bg-[#1a2e22]"
	>
		<!-- Image -->
		<div class="image-with-overlay relative h-32 overflow-hidden">
			<img
				src="https://lh3.googleusercontent.com/aida-public/AB6AXuCibUHiGnAi1NHGuVtVQ5bWR0WXdEdyKmMNpRiE2NniibP42K7WD-Q3pfXNpqR3yMHnJ-lf06KN3sK1HEqbKkJmKyL5k8AtfyJvdwpXGscfz3u4E2yeQqgmZk-eJN1fEL77aoIf-u1DFHFI4V71ifIclrcbM9F7zU2EjhVf7skUgD-mRfmE2nDnddxX9hUr0_lI92j8JT0jhvWbUmQCemc9cgTFGlBuvmp5xztGmtrjf_iqplcqgSIAJXfowwZz_GqgW4ErKRfiMdM"
				alt=""
				class="h-full w-full object-cover"
			/>
		</div>

		<!-- Content -->
		<div class="-mt-8 flex flex-col items-center gap-4 p-6">
			<div class="text-center">
				<h1 class="text-6xl leading-none font-extrabold tracking-tighter text-primary">
					{percent}%
				</h1>
				<p class="mt-2 text-xl font-medium text-[#61896f] dark:text-[#a3c9b0]">
					${monthlyAmount} / month
				</p>
			</div>

			<div class="bg-background h-1 w-16 rounded-full dark:bg-white/10" />

			<div class="flex items-center gap-2 rounded-full bg-[#f0f4f2] px-4 py-1 dark:bg-white/10">
				<CircleCheck size={20} color="#111813" />
				<span class="text-sm font-medium text-[#111813] dark:text-white">
					Safe &amp; Sustainable
				</span>
			</div>
		</div>
	</div>

	<!-- Explanation -->
	<p
		class="mb-6 max-w-md px-2 text-center text-base leading-relaxed text-[#111813] dark:text-gray-300"
	>
		Based on your income and expenses, this amount allows you to save without strict limits. It
		leaves enough room for daily coffee and unexpected costs.
	</p>

	<Button class="mt-auto w-full text-lg font-bold" size="extraLg">Create my plan</Button>
</main>

<style>
	.image-with-overlay::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(to bottom, transparent, white);
	}

	.dark .image-with-overlay::after {
		background: linear-gradient(to bottom, transparent, #1a2e22e6);
	}
</style>
