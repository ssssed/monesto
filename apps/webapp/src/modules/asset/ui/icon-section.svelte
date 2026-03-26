<script lang="ts">
	import { accessibleIcons, type AccessibleIconType } from '$shared/config/icons';
	import type { Component } from 'svelte';

	let {
		selectedIcon = $bindable<[AccessibleIconType, Component]>(),
		backgroundColor = $bindable('#DBEAFE'),
		color = $bindable('#3B82F6')
	} = $props<{
		selectedIcon: [AccessibleIconType, Component];
		backgroundColor: string;
		color: string;
	}>();

	let [selectedName, SelectedIcon] = $derived(selectedIcon);
</script>

<div class="flex flex-col gap-2.5">
	<p class="text-[#64748B] text-[13px] font-medium">Иконка</p>
	<div class="flex items-center gap-2">
		<div class="p-3 rounded-[14px] mr-1" style={`background-color: ${backgroundColor}`}>
			<SelectedIcon size={24} {color} />
		</div>
		{#each Object.entries(accessibleIcons) as [name, Icon] (name)}
			<button
				type="button"
				class="p-[9px] rounded-[10px] outline-2 bg-[#F1F5F9]"
				style={`outline-color: ${selectedName === name ? '#3B82F6' : 'transparent'}`}
				onclick={() => {
					selectedName = name as AccessibleIconType;
					SelectedIcon = Icon;
				}}
			>
				<Icon size={18} color={selectedName === name ? '#3B82F6' : '#64748B'} />
			</button>
		{/each}
	</div>
</div>
