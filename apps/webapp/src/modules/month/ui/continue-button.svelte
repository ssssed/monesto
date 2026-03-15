<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { Button, type ButtonProps, cn } from '@monesto/ui-kit';

	let { class: className, ...props }: ButtonProps = $props();
</script>

<Button size="extraLg" class={cn('w-full text-lg font-bold', className)} {...props}>
	Continue
	<ArrowRight strokeWidth={3} />
</Button>
