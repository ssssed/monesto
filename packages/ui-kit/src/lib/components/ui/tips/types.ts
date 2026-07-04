export type TipSide = 'top' | 'right' | 'bottom' | 'left' | 'over';

export type TipAlign = 'start' | 'center' | 'end';

export type TipStep = {
	/** CSS-селектор целевого элемента, например `[data-tour="rules"]`. */
	selector: string;
	title: string;
	description?: string;
	side?: TipSide;
	align?: TipAlign;
};

export type TipsProps = {
	steps: TipStep[];
	opened?: boolean;
	/** Запустить тур после монтирования, если `storageKey` ещё не в localStorage. */
	autoStart?: boolean;
	/** Ключ localStorage: при завершении тура записывается `'true'`, при старте проверяется. */
	storageKey?: string;
	onClose?: () => void;
	class?: string;
};
