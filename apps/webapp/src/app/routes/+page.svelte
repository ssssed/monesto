<script lang="ts">
	import {
		Button,
		Drawer,
		DrawerClose,
		DrawerContent,
		DrawerDescription,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle,
		DrawerTrigger,
		Input
	} from '@monesto/ui-kit';

	const value = $state('');
</script>

<Input {value} />

<Drawer>
	<DrawerTrigger>Open</DrawerTrigger>
	<DrawerContent>
		<DrawerHeader>
			<DrawerTitle>Are you sure absolutely sure?</DrawerTitle>
			<DrawerDescription>This action cannot be undone.</DrawerDescription>
		</DrawerHeader>
		<DrawerFooter>
			<Button>Submit</Button>
			<DrawerClose>Cancel</DrawerClose>
		</DrawerFooter>
	</DrawerContent>
</Drawer>
