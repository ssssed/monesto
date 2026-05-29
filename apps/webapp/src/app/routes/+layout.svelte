<script lang="ts">
	import { page } from '$app/state';
	import { isNavBarVisible, ROUTER } from '$shared/config/router';
	import { LayoutDashboard, Settings } from '@lucide/svelte';
	import { cn, NavMenu, Page } from '@monesto/ui-kit';
	import '../app.css';

	let { children } = $props();

	const onboardingPage =
		page.url.pathname === ROUTER.onboarding
			? 'h-full min-h-0 !overflow-hidden !overflow-y-hidden'
			: '';
</script>

<Page
	class={cn(
		{
			['mb-[82px]']: isNavBarVisible(page.url.pathname)
		},
		onboardingPage
	)}
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
