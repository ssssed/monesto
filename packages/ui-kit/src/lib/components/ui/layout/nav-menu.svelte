<script lang="ts">
    import type { Component } from 'svelte';
    import NavItem from './nav-item.svelte';

	let { items, url } = $props<{
		items: {
			icon: Component;
			label: string;
			href: string;
		}[];
		url: string
	}>();

</script>

<nav
  class="bg-white fixed bottom-6 rounded-[36px] border border-solid border-[#e2e8f0]"
>
  <div class="p-1 grid grid-cols-2 items-center justify-between">
    {#each items as item}
      <NavItem
        icon={item.icon}
        label={item.label}
        href={item.href}
        isActive={url === item.href}
      />
    {/each}
  </div>
</nav>

<style scoped>
	nav {
		width: calc(100% - 48px);
	}
</style>
