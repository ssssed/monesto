<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { children, onDelete } = $props<{
		children: Snippet;
		onDelete?: () => void;
	}>();

	const ACTION_WIDTH = 72;

	let offset = $state(0);
	let isDragging = $state(false);
	let startX = 0;
	let startY = 0;
	let startOffset = 0;
	let dragAxis: 'x' | 'y' | null = null;

	function clampOffset(value: number) {
		return Math.max(-ACTION_WIDTH, Math.min(0, value));
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.button !== 0) return;

		isDragging = true;
		dragAxis = null;
		startX = event.clientX;
		startY = event.clientY;
		startOffset = offset;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) return;

		const deltaX = event.clientX - startX;
		const deltaY = event.clientY - startY;

		if (dragAxis === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
			dragAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';

			if (dragAxis === 'y') {
				isDragging = false;
				return;
			}
		}

		if (dragAxis !== 'x') return;

		offset = clampOffset(startOffset + deltaX);
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDragging) return;

		isDragging = false;
		dragAxis = null;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		offset = offset < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0;
	}

	function handleDelete() {
		onDelete?.();
		offset = 0;
	}
</script>

<div class="relative overflow-hidden rounded-[12px]">
	<button
		type="button"
		class="absolute inset-y-0 right-0 flex w-[72px] flex-col items-center justify-center gap-1 text-white"
		onclick={handleDelete}
	>
		<Trash2 size={24} color="#dc2626" />
	</button>

	<div
		role="group"
		class="relative w-full touch-pan-y select-none"
		style:transform="translateX({offset}px)"
		style:transition={isDragging ? 'none' : 'transform 0.2s ease'}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
	>
		{@render children()}
	</div>
</div>
