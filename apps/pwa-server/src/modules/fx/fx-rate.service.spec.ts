import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FxProviderCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FxRateService } from './fx-rate.service';
import { FxProviderRegistry } from './providers/fx-provider.registry';

describe('FxRateService', () => {
  let prisma: any;
  let registry: { get: jest.Mock };
  let provider: { code: FxProviderCode; fetchRates: jest.Mock };

  function makeService(configValues: Record<string, string> = {}) {
    const config = {
      get: (key: string) => configValues[key],
    } as unknown as ConfigService;
    return new FxRateService(
      prisma as unknown as PrismaService,
      config,
      registry as unknown as FxProviderRegistry,
    );
  }

  beforeEach(() => {
    prisma = {
      fxRate: {
        createMany: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
    provider = {
      code: FxProviderCode.open_er_api,
      fetchRates: jest.fn().mockResolvedValue([
        { quote: 'RUB', rate: 82.5 },
        { quote: 'EUR', rate: 0.92 },
      ]),
    };
    registry = { get: jest.fn().mockReturnValue(provider) };
  });

  describe('refresh', () => {
    it('stores every quote the provider returns when no filter is configured', async () => {
      const service = makeService();

      const result = await service.refresh('usd');

      expect(provider.fetchRates).toHaveBeenCalledWith('usd');
      expect(prisma.fxRate.createMany).toHaveBeenCalledWith({
        data: [
          {
            base: 'USD',
            quote: 'RUB',
            rate: 82.5,
            provider: FxProviderCode.open_er_api,
            fetchedAt: expect.any(Date),
          },
          {
            base: 'USD',
            quote: 'EUR',
            rate: 0.92,
            provider: FxProviderCode.open_er_api,
            fetchedAt: expect.any(Date),
          },
        ],
      });
      expect(result).toHaveLength(2);
    });

    it('filters quotes down to FX_QUOTE_CURRENCIES when configured', async () => {
      const service = makeService({ FX_QUOTE_CURRENCIES: 'RUB' });

      const result = await service.refresh('USD');

      expect(prisma.fxRate.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ quote: 'RUB' })],
      });
      expect(result).toEqual([{ quote: 'RUB', rate: 82.5 }]);
    });

    it('skips the write entirely when nothing matches the filter', async () => {
      const service = makeService({ FX_QUOTE_CURRENCIES: 'GBP' });

      const result = await service.refresh('USD');

      expect(prisma.fxRate.createMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getLatest', () => {
    it('throws NotFoundException when no rate exists for the pair', async () => {
      prisma.fxRate.findFirst.mockResolvedValue(null);
      const service = makeService();

      await expect(service.getLatest('USD', 'RUB')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the most recent rate for the pair', async () => {
      prisma.fxRate.findFirst.mockResolvedValue({
        base: 'USD',
        quote: 'RUB',
        rate: 82.5,
      });
      const service = makeService();

      await expect(service.getLatest('usd', 'rub')).resolves.toEqual({
        base: 'USD',
        quote: 'RUB',
        rate: 82.5,
      });
      expect(prisma.fxRate.findFirst).toHaveBeenCalledWith({
        where: { base: 'USD', quote: 'RUB' },
        orderBy: { fetchedAt: 'desc' },
      });
    });
  });

  describe('listLatest', () => {
    it('queries distinct-by-quote ordered by freshest first', async () => {
      prisma.fxRate.findMany.mockResolvedValue([]);
      const service = makeService();

      await service.listLatest('usd');

      expect(prisma.fxRate.findMany).toHaveBeenCalledWith({
        where: { base: 'USD' },
        orderBy: [{ quote: 'asc' }, { fetchedAt: 'desc' }],
        distinct: ['quote'],
      });
    });
  });
});
