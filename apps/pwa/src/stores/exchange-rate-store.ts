import { create } from 'zustand';

import {
  fetchUsdRubQuote,
  type RateSource,
} from '../lib/exchange/fetchExchangeRates';

interface ExchangeRateState {
  usdRubRate: number | null;
  rateSource: RateSource | null;
  rateFetchedAt: string | null;
  isLoading: boolean;
  fetchRates: () => Promise<void>;
}

export const useExchangeRateStore = create<ExchangeRateState>((set) => ({
  usdRubRate: null,
  rateSource: null,
  rateFetchedAt: null,
  isLoading: false,
  fetchRates: async () => {
    set({ isLoading: true });
    try {
      const quote = await fetchUsdRubQuote();
      set({
        usdRubRate: quote.rate,
        rateSource: quote.source,
        rateFetchedAt: quote.fetchedAt,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
