import type { MonthStatus } from './api';

export type StepProps = {
	onNext: () => void;
	onPrev: () => void;
	hasNext: boolean;
	hasPrev: boolean;
	monthStatus: MonthStatus;
};
