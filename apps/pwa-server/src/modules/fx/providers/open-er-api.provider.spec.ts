import { ServiceUnavailableException } from '@nestjs/common';
import { OpenErApiProvider } from './open-er-api.provider';

describe('OpenErApiProvider', () => {
  let provider: OpenErApiProvider;
  const originalFetch = global.fetch;

  beforeEach(() => {
    provider = new OpenErApiProvider();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('maps a successful response to quote/rate pairs', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          result: 'success',
          base_code: 'USD',
          rates: { RUB: 82.5, EUR: 0.92 },
        }),
    }) as unknown as typeof fetch;

    const rates = await provider.fetchRates('USD');

    expect(rates).toEqual([
      { quote: 'RUB', rate: 82.5 },
      { quote: 'EUR', rate: 0.92 },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://open.er-api.com/v6/latest/USD',
    );
  });

  it('throws ServiceUnavailableException on a non-ok HTTP status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    await expect(provider.fetchRates('USD')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('throws ServiceUnavailableException when result is not "success"', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: 'error', rates: {} }),
    }) as unknown as typeof fetch;

    await expect(provider.fetchRates('USD')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
