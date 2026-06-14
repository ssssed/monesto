import type { Snippet } from 'svelte';

export type SelectSize = 'sm' | 'default' | 'lg';

export type SelectItemSnippetProps<T> = {
	item: T;
	checked: boolean;
	highlighted: boolean;
};

export type SelectLabelSnippetProps<T> = {
	selected: T | undefined;
};

export type SelectProps<T> = {
	items: T[];
	/** Определяет, выбран ли элемент — не зависит от структуры данных. */
	isChecked: (item: T) => boolean;
	onSelect: (item: T) => void;
	/** Уникальный ключ для bits-ui и `{#each}`; по умолчанию — индекс. */
	getItemKey?: (item: T) => string;
	isItemDisabled?: (item: T) => boolean;
	label: Snippet<[SelectLabelSnippetProps<T>]>;
	item: Snippet<[SelectItemSnippetProps<T>]>;
	placeholder?: string;
	disabled?: boolean;
	open?: boolean;
	size?: SelectSize;
	class?: string;
	contentClass?: string;
	align?: 'start' | 'center' | 'end';
	sideOffset?: number;
};
