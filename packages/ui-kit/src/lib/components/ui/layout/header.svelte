<script lang="ts">
  import type { Snippet } from "svelte";

  let { left, children, right } = $props<{
    left?: Snippet;
    children: Snippet;
    right?: Snippet;
  }>();
</script>

<header
  class="bg-background-light/80 dark:bg-background-dark/80 fixed top-0 right-0 left-0 z-10 grid w-full grid-cols-3 items-center p-4 backdrop-blur-md"
>
  {#if left}
    {@render left?.()}
  {:else}
    <div></div>
  {/if}

  {#if children}
    {@render children?.()}
  {:else}
    <div></div>
  {/if}

  {#if right}
    {@render right?.()}
  {:else}
    <div></div>
  {/if}
</header>
