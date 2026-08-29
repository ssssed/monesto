import { FxRateController } from './fx-rate.controller';
import { FxRateService } from './fx-rate.service';

describe('FxRateController', () => {
  let service: jest.Mocked<FxRateService>;
  let controller: FxRateController;

  beforeEach(() => {
    service = {
      listLatest: jest.fn(),
      getLatest: jest.fn(),
    } as unknown as jest.Mocked<FxRateService>;
    controller = new FxRateController(service);
  });

  it('listLatest defaults to USD when no base is given', () => {
    controller.listLatest({});
    expect(service.listLatest).toHaveBeenCalledWith('USD');
  });

  it('listLatest passes through an explicit base', () => {
    controller.listLatest({ base: 'EUR' });
    expect(service.listLatest).toHaveBeenCalledWith('EUR');
  });

  it('getLatest passes base and quote', () => {
    controller.getLatest('USD', 'RUB');
    expect(service.getLatest).toHaveBeenCalledWith('USD', 'RUB');
  });
});
