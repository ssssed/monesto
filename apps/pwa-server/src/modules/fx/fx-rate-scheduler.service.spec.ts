import { ConfigService } from '@nestjs/config';
import { FxRateSchedulerService } from './fx-rate-scheduler.service';
import { FxRateService } from './fx-rate.service';

describe('FxRateSchedulerService', () => {
  it('refreshes every configured base currency', async () => {
    const fxRateService = { refresh: jest.fn().mockResolvedValue([]) };
    const config = {
      get: () => 'USD,EUR',
    } as unknown as ConfigService;

    const scheduler = new FxRateSchedulerService(
      fxRateService as unknown as FxRateService,
      config,
    );

    await scheduler.refreshAll();

    expect(fxRateService.refresh).toHaveBeenCalledWith('USD');
    expect(fxRateService.refresh).toHaveBeenCalledWith('EUR');
  });

  it('continues refreshing remaining bases even if one fails', async () => {
    const fxRateService = {
      refresh: jest
        .fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce([]),
    };
    const config = { get: () => 'USD,EUR' } as unknown as ConfigService;

    const scheduler = new FxRateSchedulerService(
      fxRateService as unknown as FxRateService,
      config,
    );

    await expect(scheduler.refreshAll()).resolves.toBeUndefined();
    expect(fxRateService.refresh).toHaveBeenCalledTimes(2);
  });

  it('defaults to USD when FX_BASE_CURRENCIES is not set', async () => {
    const fxRateService = { refresh: jest.fn().mockResolvedValue([]) };
    const config = { get: () => undefined } as unknown as ConfigService;

    const scheduler = new FxRateSchedulerService(
      fxRateService as unknown as FxRateService,
      config,
    );

    await scheduler.refreshAll();

    expect(fxRateService.refresh).toHaveBeenCalledWith('USD');
    expect(fxRateService.refresh).toHaveBeenCalledTimes(1);
  });
});
