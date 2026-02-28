import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TagsService', () => {
  let service: TagsService;
  const mockPrisma = {
    tag: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TagsService);
  });

  describe('findAll', () => {
    it('should return tags for user', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([{ id: '1', name: 't1', alias: 't1' }]);
      const result = await service.findAll('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create tag with default color', async () => {
      mockPrisma.tag.create.mockResolvedValue({ id: '1', name: 'Sber', alias: 'sber', color: '#64748b' });
      await service.create('user-1', { name: 'Sber', alias: 'sber' });
      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', name: 'Sber', color: '#64748b', alias: 'sber' },
      });
    });
  });

  describe('remove', () => {
    it('should throw if tag not found', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue(null);
      await expect(service.remove('user-1', 'id')).rejects.toThrow(NotFoundException);
    });
  });
});
