<script lang="ts">
  import { TrendingDownIcon, TrendingUpIcon } from '@lucide/svelte';
  import Badge, { type BadgeSize } from './badge.svelte';

  let { percent = $bindable<number>(), size } = $props<{
    percent: number;
    size?: BadgeSize
  }>();
</script>

{#if percent >= 0}
  <Badge color="green" {size}>
    <span class="mr-1">
      <TrendingUpIcon size={14} color="#16A34A" />
    </span>
    +{percent}%
  </Badge>
{:else}
  <Badge color="red" {size}>
    <span class="mr-1">
      <TrendingDownIcon size={14} color="#DC2626" />
    </span>
    {percent}%
  </Badge>
{/if}
