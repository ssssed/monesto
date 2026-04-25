<script module lang="ts">
	let loaderSvgSeq = 0;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	const ORBIT_R = 93;
	const DOT_R = 6;
	/** Padding around 0..200 so scaled rings (~1.035) and glow stay inside viewBox */
	const VB_PAD = 14;

	const sid = `loader-svg-${++loaderSvgSeq}`;

	let {
		title = '',
		message = '',
		center,
		overlay = false,
		class: className = ''
	}: {
		title?: string;
		message?: string;
		center?: Snippet;
		overlay?: boolean;
		class?: ClassValue;
	} = $props();
</script>

<div
	class={[
		overlay
			? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white'
			: 'flex flex-col items-center justify-center',
		className
	]}
>
	<div class="loader-root flex flex-col items-center gap-7">
		<div
			class="relative shrink-0 overflow-visible"
			style="width: {200 + 2 * VB_PAD}px; height: {200 + 2 * VB_PAD}px;"
		>
			<svg
				class="h-full w-full overflow-visible"
				viewBox={`${-VB_PAD} ${-VB_PAD} ${200 + 2 * VB_PAD} ${200 + 2 * VB_PAD}`}
				fill="none"
				aria-hidden="true"
			>
				<defs>
					<linearGradient id={`${sid}-center-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#3b82f6" />
						<stop offset="100%" stop-color="#6366f1" />
					</linearGradient>
					<filter id={`${sid}-dot-glow`} x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
						<feMerge>
							<feMergeNode in="b" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
					<filter id={`${sid}-center-shadow`} x="-40%" y="-40%" width="180%" height="180%">
						<feDropShadow
							dx="0"
							dy="4"
							stdDeviation="10"
							flood-color="#3b82f6"
							flood-opacity="0.25"
						/>
					</filter>
				</defs>

				<g class="loader-rings" transform="translate(100 100)">
					<circle
						class="loader-ring loader-ring--outer"
						r="99.25"
						fill="none"
						stroke="#bfdbfe"
						stroke-width="1.5"
					/>
					<circle
						class="loader-ring loader-ring--mid"
						r="77"
						fill="none"
						stroke="#93c5fd"
						stroke-width="2"
					/>
					<circle
						class="loader-ring loader-ring--inner"
						r="54.75"
						fill="none"
						stroke="#60a5fa"
						stroke-width="2.5"
					/>
				</g>

				<g transform="translate(100 100)">
					<g class="loader-orbit">
						<circle cy={-ORBIT_R} r={DOT_R} fill="#3b82f6" filter="url(#{sid}-dot-glow)" />
					</g>
				</g>

				<circle
					cx="100"
					cy="100"
					r="40"
					fill="url(#{sid}-center-grad)"
					filter="url(#{sid}-center-shadow)"
				/>

				{#if center}
					<foreignObject x="60" y="60" width="80" height="80" class="overflow-visible">
						<div
							class="flex h-full w-full items-center justify-center text-white [&_svg]:h-8 [&_svg]:w-8"
						>
							{@render center()}
						</div>
					</foreignObject>
				{/if}
			</svg>
		</div>

		{#if title || message}
			<div class="flex flex-col gap-1 items-center">
				{#if title}
					<h1 class="font-bold text-2xl text-[#0f172a]">{title}</h1>
				{/if}

				{#if message}
					<p
						class="text-center text-[14px] text-[#94a3b8]"
						style="font-family: Inter, system-ui, sans-serif"
					>
						{message}
					</p>
				{/if}
			</div>
		{/if}

		<div class="flex items-center gap-2" aria-hidden="true">
			<span class="loader-wave-dot h-2.5 w-2.5 rounded-full bg-[#3b82f6]"></span>
			<span class="loader-wave-dot h-2 w-2 rounded-full bg-[#93c5fd]"></span>
			<span class="loader-wave-dot h-2 w-2 rounded-full bg-[#dbeafe]"></span>
		</div>
	</div>
</div>

<style>
	.loader-root {
		--loader-orbit-duration: 1.35s;
		--loader-pulse-duration: 1.8s;
		--loader-wave-duration: 1.05s;
	}

	.loader-orbit {
		transform-origin: 0 0;
		animation: loader-orbit-spin var(--loader-orbit-duration) linear infinite;
	}

	.loader-ring {
		transform-origin: 0 0;
		animation: loader-ring-pulse var(--loader-pulse-duration) ease-in-out infinite;
	}

	.loader-ring--outer {
		animation-delay: 0ms;
	}
	.loader-ring--mid {
		animation-delay: 120ms;
	}
	.loader-ring--inner {
		animation-delay: 240ms;
	}

	@keyframes loader-orbit-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes loader-ring-pulse {
		0%,
		100% {
			opacity: 0.55;
			transform: scale(0.97);
		}
		50% {
			opacity: 1;
			transform: scale(1.035);
		}
	}

	.loader-wave-dot {
		display: block;
		animation: loader-wave-bounce var(--loader-wave-duration) ease-in-out infinite;
	}

	.loader-wave-dot:nth-child(1) {
		animation-delay: 0ms;
	}
	.loader-wave-dot:nth-child(2) {
		animation-delay: 140ms;
	}
	.loader-wave-dot:nth-child(3) {
		animation-delay: 280ms;
	}

	@keyframes loader-wave-bounce {
		0%,
		55%,
		100% {
			transform: translateY(0);
			opacity: 0.45;
		}
		28% {
			transform: translateY(-7px);
			opacity: 1;
		}
	}
</style>
