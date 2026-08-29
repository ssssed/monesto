import { FxProviderCode } from '@prisma/client';
import { FxProviderRegistry } from './fx-provider.registry';
import { FxProvider } from './fx-provider.interface';

describe('FxProviderRegistry', () => {
  it('resolves a registered provider by code', () => {
    const provider: FxProvider = {
      code: FxProviderCode.open_er_api,
      fetchRates: jest.fn(),
    };
    const registry = new FxProviderRegistry([provider]);

    expect(registry.get(FxProviderCode.open_er_api)).toBe(provider);
  });

  it('throws for an unregistered provider code', () => {
    const registry = new FxProviderRegistry([]);
    expect(() => registry.get(FxProviderCode.open_er_api)).toThrow();
  });
});
