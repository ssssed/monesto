<script lang="ts">
	import { page } from '$app/state';
	import { isNavBarVisible, ROUTER } from '$shared/config/router';
	import { LayoutDashboard, Settings } from '@lucide/svelte';
	import { cn, NavMenu, Page } from '@monesto/ui-kit';
	import '../app.css';

	let { children } = $props();
</script>

<Page
	class={cn({
		['mb-[82px]']: isNavBarVisible(page.url.pathname)
	})}
>
	{@render children()}
	{#if isNavBarVisible(page.url.pathname)}
		<NavMenu
			items={[
				{
					icon: LayoutDashboard,
					label: 'Главная',
					href: ROUTER.home
				},
				{
					icon: Settings,
					label: 'Настройки',
					href: ROUTER.settings
				}
			]}
			url={page.url.pathname}
		/>
	{/if}
</Page>
