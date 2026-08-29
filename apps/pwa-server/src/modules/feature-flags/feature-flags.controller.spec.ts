import { FeatureFlagsAdminController } from './feature-flags-admin.controller';
import { FeatureFlagsPublicController } from './feature-flags-public.controller';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsPublicController', () => {
  it('getPublicFlags delegates to the service', () => {
    const service = {
      getPublicMap: jest.fn(),
    } as unknown as jest.Mocked<FeatureFlagsService>;
    const controller = new FeatureFlagsPublicController(service);
    controller.getPublicFlags();
    expect(service.getPublicMap).toHaveBeenCalled();
  });
});

describe('FeatureFlagsAdminController', () => {
  let service: jest.Mocked<FeatureFlagsService>;
  let controller: FeatureFlagsAdminController;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<FeatureFlagsService>;
    controller = new FeatureFlagsAdminController(service);
  });

  it('create passes dto and adminId', () => {
    controller.create({ key: 'a' }, { sessionId: 's', adminId: 9 });
    expect(service.create).toHaveBeenCalledWith({ key: 'a' }, 9);
  });

  it('update passes key, dto and adminId', () => {
    controller.update('a', { enabled: true }, { sessionId: 's', adminId: 9 });
    expect(service.update).toHaveBeenCalledWith('a', { enabled: true }, 9);
  });

  it('remove passes key', () => {
    controller.remove('a');
    expect(service.remove).toHaveBeenCalledWith('a');
  });
});
