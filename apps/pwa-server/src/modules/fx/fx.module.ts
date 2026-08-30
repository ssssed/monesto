import { Module } from '@nestjs/common';
import { FxRateController } from './fx-rate.controller';
import { FxRateSchedulerService } from './fx-rate-scheduler.service';
import { FxRateService } from './fx-rate.service';
import { FX_PROVIDERS } from './providers/fx-provider.interface';
import { FxProviderRegistry } from './providers/fx-provider.registry';
import { OpenErApiProvider } from './providers/open-er-api.provider';

@Module({
  controllers: [FxRateController],
  providers: [
    OpenErApiProvider,
    {
      provide: FX_PROVIDERS,
      useFactory: (openErApi: OpenErApiProvider) => [openErApi],
      inject: [OpenErApiProvider],
    },
    FxProviderRegistry,
    FxRateService,
    FxRateSchedulerService,
  ],
  exports: [FxRateService],
})
export class FxModule {}
