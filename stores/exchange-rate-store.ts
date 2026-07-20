import { create } from 'zustand';

import { fetchUsdRubRate } from '@/lib/exchange/fetchExchangeRates';

interface ExchangeRateState {
  usdRubRate: number | null;
  isLoading: boolean;
  fetchRates: () => Promise<void>;
}

export const useExchangeRateStore = create<ExchangeRateState>((set) => ({
  usdRubRate: null,
  isLoading: false,
  fetchRates: async () => {
    set({ isLoading: true });
    try {
      const rate = await fetchUsdRubRate();
      set({ usdRubRate: rate, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
