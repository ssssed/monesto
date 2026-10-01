import { create } from 'zustand';

interface CycleSelectionState {
  cycleKey: string | null;
  setCycleKey: (key: string | null) => void;
}

/** Переживает переходы между страницами — выбор цикла на дашборде не сбрасывается. */
export const useCycleSelectionStore = create<CycleSelectionState>((set) => ({
  cycleKey: null,
  setCycleKey: (cycleKey) => set({ cycleKey }),
}));
