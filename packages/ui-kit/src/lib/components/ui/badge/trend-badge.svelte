<script lang="ts">
    import { TrendingDownIcon, TrendingUpIcon } from '@lucide/svelte';
    import Badge from './badge.svelte';


let { percent = $bindable<number>() } = $props<{
	percent: number;
}>();
</script>

{#if percent >= 0}
  <Badge color="green">
    <span class="mr-1">
      <TrendingUpIcon size={14} color="#16A34A" />
    </span>
    +{percent}%
  </Badge>
{:else}
  <Badge color="red">
    <span class="mr-1">
      <TrendingDownIcon size={14} color="#DC2626" />
    </span>
    {percent}%
  </Badge>
{/if}
