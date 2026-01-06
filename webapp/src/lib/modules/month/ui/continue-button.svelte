<script lang="ts">
	import Button, { type ButtonProps } from '$lib/shared/ui/button/button.svelte';
	import { cn } from '$lib/shared/utils';
	import { ArrowRight } from '@lucide/svelte';

	let { class: className, ...props }: ButtonProps = $props();
</script>

<Button size="extraLg" class={cn('w-full text-lg font-bold', className)} {...props}>
	Continue
	<ArrowRight strokeWidth={3} />
</Button>
