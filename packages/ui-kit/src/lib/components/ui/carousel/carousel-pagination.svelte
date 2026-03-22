<script lang="ts">
  import { getEmblaContext } from './context';

  let { length } = $props<{ length: number }>();

  const context = getEmblaContext();
</script>

<div class="flex flex-row items-center justify-center gap-3 py-6">
  {#each Array(length) as _, index}
    <div
      class="
				transition-all duration-300 rounded-full
				{index === context.selectedIndex
        ? 'h-2.5 w-2.5 bg-primary shadow-[0_0_8px_rgba(19,236,91,0.5)] scale-110'
        : 'h-2 w-2 bg-[#dbe6df] dark:bg-white/20'}
			"
    ></div>
  {/each}
</div>
