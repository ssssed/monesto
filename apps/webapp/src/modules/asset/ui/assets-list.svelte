<script lang="ts">
	import type { AssetType } from '../model/model.svelte';
	import Asset from './asset.svelte';

	let { assets = $bindable([]) } = $props<{ assets: AssetType[] }>();
</script>

<div class="grid grid-cols-1 gap-3">
	{#each assets as asset (asset.id)}
		<Asset {asset} />
	{/each}
</div>
