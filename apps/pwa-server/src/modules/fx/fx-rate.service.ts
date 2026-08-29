import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FxProviderCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_FX_PROVIDER } from './fx.constants';
import { FxProviderRegistry } from './providers/fx-provider.registry';

@Injectable()
export class FxRateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly providerRegistry: FxProviderRegistry,
  ) {}

  /** Тянет курсы у провайдера и сохраняет их (append-only) как самую свежую точку. */
  async refresh(
    base: string,
    providerCode: FxProviderCode = DEFAULT_FX_PROVIDER,
  ) {
    const provider = this.providerRegistry.get(providerCode);
    const quotes = await provider.fetchRates(base);
    const wanted = this.getConfiguredQuoteCurrencies();
    const filtered = wanted
      ? quotes.filter((q) => wanted.includes(q.quote.toUpperCase()))
      : quotes;

    const fetchedAt = new Date();
    if (filtered.length > 0) {
      await this.prisma.fxRate.createMany({
        data: filtered.map((q) => ({
          base: base.toUpperCase(),
          quote: q.quote.toUpperCase(),
          rate: q.rate,
          provider: providerCode,
          fetchedAt,
        })),
      });
    }

    return filtered;
  }

  async getLatest(base: string, quote: string) {
    const rate = await this.prisma.fxRate.findFirst({
      where: { base: base.toUpperCase(), quote: quote.toUpperCase() },
      orderBy: { fetchedAt: 'desc' },
    });
    if (!rate) {
      throw new NotFoundException(`Нет курса для пары ${base}/${quote}`);
    }
    return rate;
  }

  /** Последняя точка по каждой quote-валюте для заданной базы. */
  async listLatest(base: string) {
    return this.prisma.fxRate.findMany({
      where: { base: base.toUpperCase() },
      orderBy: [{ quote: 'asc' }, { fetchedAt: 'desc' }],
      distinct: ['quote'],
    });
  }

  private getConfiguredQuoteCurrencies(): string[] | null {
    const raw = this.config.get<string>('FX_QUOTE_CURRENCIES');
    if (!raw) return null;
    return raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }
}
