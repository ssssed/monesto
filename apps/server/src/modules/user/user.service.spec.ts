import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { create: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(UserService);
  });

  it('create: успех — возвращает id, telegramId, createdAt', async () => {
    const created = {
      id: 'u1',
      telegramId: '123',
      createdAt: new Date('2026-01-01'),
    };
    prisma.user.create.mockResolvedValue(created);

    const result = await service.create({ telegramId: '123' });

    expect(result).toEqual(created);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { telegramId: '123' },
      select: { id: true, telegramId: true, createdAt: true },
    });
  });

  it('create: конфликт telegramId → ConflictException', async () => {
    const err = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.user.create.mockRejectedValue(err);

    await expect(service.create({ telegramId: 'dup' })).rejects.toThrow(
      ConflictException,
    );
  });
});
