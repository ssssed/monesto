import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { FxProviderCode } from '@prisma/client';
import { FxProvider, FxRateQuote } from './fx-provider.interface';

interface OpenErApiResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

/** https://www.exchangerate-api.com/docs/free — тот же эндпоинт, который apps/pwa сегодня вызывает на клиенте. */
@Injectable()
export class OpenErApiProvider implements FxProvider {
  readonly code = FxProviderCode.open_er_api;

  async fetchRates(base: string): Promise<FxRateQuote[]> {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `open-er-api request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as OpenErApiResponse;
    if (data.result !== 'success' || !data.rates) {
      throw new ServiceUnavailableException(
        'open-er-api returned an unsuccessful response',
      );
    }

    return Object.entries(data.rates).map(([quote, rate]) => ({
      quote,
      rate: Number(rate),
    }));
  }
}
