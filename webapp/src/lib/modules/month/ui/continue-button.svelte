<script lang="ts">
	import Button, { type ButtonProps } from '$lib/shared/ui/button/button.svelte';
	import { ArrowRight } from '@lucide/svelte';

	let props: ButtonProps = $props();
</script>

<Button size="extraLg" class="w-full text-lg font-bold" {...props}>
	Continue
	<ArrowRight strokeWidth={3} />
</Button>
