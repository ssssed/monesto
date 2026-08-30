import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagsService } from './feature-flags.service';

function prismaKnownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('duplicate', {
    code,
    clientVersion: 'test',
  });
}

describe('FeatureFlagsService', () => {
  let prisma: any;
  let service: FeatureFlagsService;

  beforeEach(() => {
    prisma = {
      featureFlag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new FeatureFlagsService(prisma as unknown as PrismaService);
  });

  it('getPublicMap reduces flags to a key->enabled map', async () => {
    prisma.featureFlag.findMany.mockResolvedValue([
      { key: 'a', enabled: true },
      { key: 'b', enabled: false },
    ]);

    await expect(service.getPublicMap()).resolves.toEqual({
      a: true,
      b: false,
    });
  });

  it('create defaults enabled to false when omitted', async () => {
    prisma.featureFlag.create.mockResolvedValue({ key: 'a', enabled: false });

    await service.create({ key: 'a' }, 9);

    expect(prisma.featureFlag.create).toHaveBeenCalledWith({
      data: { key: 'a', enabled: false, description: undefined, updatedBy: 9 },
    });
  });

  it('create throws ConflictException on a duplicate key', async () => {
    prisma.featureFlag.create.mockRejectedValue(prismaKnownError('P2002'));

    await expect(service.create({ key: 'a' }, 9)).rejects.toThrow(
      ConflictException,
    );
  });

  it('update throws NotFoundException for an unknown key', async () => {
    prisma.featureFlag.findUnique.mockResolvedValue(null);

    await expect(
      service.update('missing', { enabled: true }, 9),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.featureFlag.update).not.toHaveBeenCalled();
  });

  it('update patches an existing flag and records updatedBy', async () => {
    prisma.featureFlag.findUnique.mockResolvedValue({ key: 'a' });
    prisma.featureFlag.update.mockResolvedValue({ key: 'a', enabled: true });

    await service.update('a', { enabled: true }, 9);

    expect(prisma.featureFlag.update).toHaveBeenCalledWith({
      where: { key: 'a' },
      data: { enabled: true, updatedBy: 9 },
    });
  });

  it('remove throws NotFoundException for an unknown key', async () => {
    prisma.featureFlag.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    expect(prisma.featureFlag.delete).not.toHaveBeenCalled();
  });

  it('remove deletes an existing flag', async () => {
    prisma.featureFlag.findUnique.mockResolvedValue({ key: 'a' });

    await expect(service.remove('a')).resolves.toEqual({ ok: true });
    expect(prisma.featureFlag.delete).toHaveBeenCalledWith({
      where: { key: 'a' },
    });
  });
});
