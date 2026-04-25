<script lang="ts">
	import { page } from '$app/state';
	import { isNavBarVisible, ROUTER } from '$shared/config/router';
	import { LayoutDashboard, Settings } from '@lucide/svelte';
	import { cn, NavMenu, Page } from '@monesto/ui-kit';
	import '../app.css';

	let { children } = $props();

	// $effect(() => {
	// 	userStore.startSession(
	// 		// window.Telegram.WebApp.initData ??
	// 		'query_id=AAFEUKUmAAAAAERQpSZJCtXd&user=%7B%22id%22%3A648368196%2C%22first_name%22%3A%22%D0%98%D0%B3%D0%BE%D1%80%D1%8C%22%2C%22last_name%22%3A%22%D0%9A%D0%BE%D0%BD%D0%B5%D1%88%D0%BE%D0%B2%22%2C%22username%22%3A%22koneshov%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FO0lyvatkj-KAd_jNc2OCmEq5UxeKRb3vYBX8pi73aFw.svg%22%7D&auth_date=1776544284&signature=B1TIet1IyiQsL0dRFkvT31JAotKguMouAfDpJKbgkkGcFD_OI6eGkgsl_52djYEHIUElIqZ0fNHXIf7S7Vr9Cg&hash=673cd7de8d58eb8d13963518e95859f943dd3ca615f4af4ef7ab9450501d3f54'
	// 	);
	// });
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
