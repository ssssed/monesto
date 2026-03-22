import type { MandatoryBreakdownLine, MandatoryStore } from '../model.svelte';

/**
 * Парсит строку суммы в число (пустая или невалидная строка → 0).
 * @param amount — строка из поля суммы
 */
export function parseAmount(amount: string): number {
	const n = parseFloat(amount.replace(',', '.'));
	return Number.isFinite(n) ? n : 0;
}

/**
 * Суммирует суммы всех строк разбивки.
 * @param lines — строки breakdown
 */
export function sumBreakdownLines(lines: MandatoryBreakdownLine[]): number {
	return lines.reduce((acc, line) => acc + parseAmount(line.amount), 0);
}

/**
 * Сумма только по строкам `custom` (без «не распределено»).
 * @param lines — строки breakdown
 */
export function sumCustomLines(lines: MandatoryBreakdownLine[]): number {
	return sumBreakdownLines(lines.filter((l) => l.kind === 'custom'));
}

/**
 * Строка суммы для поля `amount` (остаток «не распределено»).
 * @param n — числовое значение
 */
function formatAmountForInput(n: number): string {
	if (!Number.isFinite(n) || n === 0) return '';
	return String(n);
}

/**
 * Общий контракт стратегии: синхронизация стора и получение итога для Total.
 */
export interface MandatoryBreakdownStrategy {
	/** Режим: пустой итог на главном экране — только custom-строки; иначе — итог + «не распределено». */
	readonly mode: 'empty' | 'filled';

	/**
	 * Привести `breakdown` и при необходимости `value` в согласованное состояние.
	 * @param mandatory — срез mandatory из stepStore
	 */
	sync(mandatory: MandatoryStore): void;

	/**
	 * Число для блока Total в UI.
	 * @param mandatory — срез mandatory из stepStore
	 */
	getTotal(mandatory: MandatoryStore): number;
}

/**
 * Стратегия «сначала разбивка»: `value` пустой — строки «не распределено» нет, итог для UI = сумма custom-строк (`getTotal`).
 * В `value` сумму из breakdown **не** записываем: иначе при наборе суммы в строке (5 → 50 → 500) в `value` попадает промежуточное число,
 * включается TotalFirst и остаток «не распределено» уходит в минус.
 */
class BreakdownFirstStrategy implements MandatoryBreakdownStrategy {
	readonly mode = 'empty' as const;

	sync(mandatory: MandatoryStore): void {
		const withoutUnallocated = mandatory.breakdown.filter((l) => l.kind !== 'unallocated');
		/** Нельзя каждый раз присваивать новый массив из `.filter()` — даже `[] !== []` по ссылке, $effect уходит в бесконечный цикл. */
		if (withoutUnallocated.length !== mandatory.breakdown.length) {
			mandatory.breakdown = withoutUnallocated;
		}
	}

	getTotal(mandatory: MandatoryStore): number {
		return Math.round(sumBreakdownLines(mandatory.breakdown) * 100) / 100;
	}
}

/**
 * Стратегия «сначала итог»: `value` задан — Total = это значение, в breakdown добавляется «не распределено» = value − сумма(custom).
 */
class TotalFirstStrategy implements MandatoryBreakdownStrategy {
	readonly mode = 'filled' as const;

	sync(mandatory: MandatoryStore): void {
		let lines = mandatory.breakdown;

		if (!lines.some((l) => l.kind === 'unallocated')) {
			mandatory.breakdown = [
				{
					id: 'mandatory-unallocated',
					kind: 'unallocated',
					label: 'не распределено',
					amount: ''
				},
				...lines.filter((l) => l.kind === 'custom')
			];
			lines = mandatory.breakdown;
		}

		const valueNum = parseAmount(mandatory.value);
		const customSum = sumCustomLines(lines);
		const unallocated = mandatory.breakdown.find((l) => l.kind === 'unallocated');
		if (!unallocated) return;

		const remainder = Math.round((valueNum - customSum) * 100) / 100;
		const nextAmount = formatAmountForInput(remainder);
		if (unallocated.amount !== nextAmount) {
			unallocated.amount = nextAmount;
		}
	}

	getTotal(mandatory: MandatoryStore): number {
		return parseAmount(mandatory.value);
	}
}

/**
 * Фабрика стратегии расчёта mandatory по текущему `value`: пустая строка → разбивка без «не распределено», иначе → итог + остаток.
 * @param value — строка из поля суммы на экране
 */
export function createMandatoryBreakdownStrategy(value: string): MandatoryBreakdownStrategy {
	if (value === '') {
		return new BreakdownFirstStrategy();
	}
	return new TotalFirstStrategy();
}

/**
 * Сохраняет состояние mandatory при Submit в дроере: при пустом `value` записывает в него сумму breakdown,
 * затем синхронизирует разбивку (в т.ч. строку «не распределено» в режиме total-first).
 * @param mandatory — срез mandatory из stepStore
 */
export function persistMandatoryDrawerSubmit(mandatory: MandatoryStore): void {
	if (mandatory.value === '') {
		const sumAll = Math.round(sumBreakdownLines(mandatory.breakdown) * 100) / 100;
		if (sumAll > 0) {
			mandatory.value = String(sumAll);
		}
	}
	createMandatoryBreakdownStrategy(mandatory.value).sync(mandatory);
}
