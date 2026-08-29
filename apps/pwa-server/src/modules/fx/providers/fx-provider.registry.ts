import { Inject, Injectable } from '@nestjs/common';
import { FxProviderCode } from '@prisma/client';
import { FX_PROVIDERS, FxProvider } from './fx-provider.interface';

@Injectable()
export class FxProviderRegistry {
  constructor(@Inject(FX_PROVIDERS) private readonly providers: FxProvider[]) {}

  get(code: FxProviderCode): FxProvider {
    const provider = this.providers.find((p) => p.code === code);
    if (!provider) {
      throw new Error(`No FX provider registered for code "${code}"`);
    }
    return provider;
  }
}
