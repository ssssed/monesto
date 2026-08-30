import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DEFAULT_FX_BASE_CURRENCIES } from './fx.constants';
import { FxRateService } from './fx-rate.service';

@Injectable()
export class FxRateSchedulerService {
  private readonly logger = new Logger(FxRateSchedulerService.name);

  constructor(
    private readonly fxRateService: FxRateService,
    private readonly config: ConfigService,
  ) {}

  @Cron(process.env.FX_REFRESH_CRON || CronExpression.EVERY_HOUR)
  async refreshAll(): Promise<void> {
    for (const base of this.getConfiguredBaseCurrencies()) {
      try {
        await this.fxRateService.refresh(base);
      } catch (error) {
        this.logger.error(`FX refresh failed for base ${base}`, error as Error);
      }
    }
  }

  private getConfiguredBaseCurrencies(): string[] {
    const raw =
      this.config.get<string>('FX_BASE_CURRENCIES') ??
      DEFAULT_FX_BASE_CURRENCIES;
    return raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }
}
