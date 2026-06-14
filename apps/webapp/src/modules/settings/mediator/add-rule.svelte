<script lang="ts">
	import { CheckIcon } from '@lucide/svelte';
	import {
		Button,
		Drawer,
		DrawerClose,
		DrawerContent,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle,
		DrawerTrigger
	} from '@monesto/ui-kit';
	import type { Snippet } from 'svelte';

	let { children } = $props<{ children: Snippet }>();

	let open = $state(false);
</script>

<Drawer {open} onOpenChange={(o) => (open = o)}>
	<DrawerTrigger class="contents">
		{@render children?.()}
	</DrawerTrigger>
	<form>
		<DrawerContent class="!max-h-[90vh]">
			<DrawerHeader>
				<DrawerTitle class="text-xl font-bold px-[7px]">Новое правило</DrawerTitle>
			</DrawerHeader>
			<DrawerFooter class="mt-[126px]">
				<Button type="submit" size="extraLg" class="font-semibold text-lg">
					<CheckIcon size={20} />
					Сохранить
				</Button>
				<DrawerClose class="w-full h-12 text-[#64748B] text-base font-semibold">Отмена</DrawerClose>
			</DrawerFooter>
		</DrawerContent>
	</form>
</Drawer>
