import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const mockJwt = { sign: jest.fn().mockReturnValue('token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
  });

  describe('register', () => {
    it('should create user and return token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed');
      mockPrisma.user.create.mockResolvedValue({ id: '1', login: 'u1' });
      const result = await service.register({ login: 'u1', password: 'pass123' });
      expect(result.access_token).toBe('token');
      expect(result.user.login).toBe('u1');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { login: 'u1', passwordHash: 'hashed' },
      });
    });
    it('should throw if login taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.register({ login: 'u1', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', login: 'u1', passwordHash: 'hashed' });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      const result = await service.login({ login: 'u1', password: 'pass' });
      expect(result.access_token).toBe('token');
    });
    it('should throw for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', passwordHash: 'hashed' });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);
      await expect(service.login({ login: 'u1', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
    it('should throw for unknown user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ login: 'u1', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
