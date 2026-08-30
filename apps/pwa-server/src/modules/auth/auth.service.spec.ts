import {
  BadRequestException,
  HttpException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { hashEmailCode } from './lib/email-code';
import { MailService } from './mail/mail.service';

const BOT_TOKEN = 'test-bot-token';

function signTelegramPayload(
  fields: Omit<TelegramAuthDto, 'hash'>,
): TelegramAuthDto {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${String(fields[key as keyof typeof fields])}`)
    .join('\n');
  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  return { ...fields, hash };
}

describe('AuthService', () => {
  let prisma: any;
  let config: Partial<Record<string, string>>;
  let mail: jest.Mocked<MailService>;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      emailVerificationCode: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    config = { TELEGRAM_BOT_TOKEN: BOT_TOKEN };
    mail = { sendVerificationCode: jest.fn().mockResolvedValue(undefined) };

    const configService = {
      get: (key: string) => config[key],
    } as unknown as ConfigService;

    service = new AuthService(
      prisma as unknown as PrismaService,
      configService,
      mail,
    );
  });

  describe('requestEmailCode', () => {
    it('sends a code and stores its hash when no recent code exists', async () => {
      prisma.emailVerificationCode.findFirst.mockResolvedValue(null);

      const result = await service.requestEmailCode('a@b.com');

      expect(result).toEqual({ ok: true });
      expect(prisma.emailVerificationCode.create).toHaveBeenCalledTimes(1);
      const createArgs = prisma.emailVerificationCode.create.mock.calls[0][0];
      expect(createArgs.data.email).toBe('a@b.com');
      expect(createArgs.data.codeHash).toHaveLength(64); // sha256 hex
      expect(mail.sendVerificationCode).toHaveBeenCalledWith(
        'a@b.com',
        expect.stringMatching(/^\d{6}$/),
      );
    });

    it('throws 429 when a code was requested too recently', async () => {
      prisma.emailVerificationCode.findFirst.mockResolvedValue({
        createdAt: new Date(),
      });

      await expect(service.requestEmailCode('a@b.com')).rejects.toThrow(
        HttpException,
      );
      expect(mail.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('sends the configured fixed code for a DEV_FIXED_EMAIL_CODES email', async () => {
      config.DEV_FIXED_EMAIL_CODES = 'root@root.com:000000,test@test.com:111111';
      prisma.emailVerificationCode.findFirst.mockResolvedValue(null);

      await service.requestEmailCode('root@root.com');

      expect(mail.sendVerificationCode).toHaveBeenCalledWith(
        'root@root.com',
        '000000',
      );
    });

    it('skips the resend throttle for a DEV_FIXED_EMAIL_CODES email', async () => {
      config.DEV_FIXED_EMAIL_CODES = 'test@test.com:111111';
      prisma.emailVerificationCode.findFirst.mockResolvedValue({
        createdAt: new Date(),
      });

      await expect(service.requestEmailCode('test@test.com')).resolves.toEqual({
        ok: true,
      });
      expect(mail.sendVerificationCode).toHaveBeenCalledWith(
        'test@test.com',
        '111111',
      );
    });
  });

  describe('verifyEmailCode', () => {
    it('throws BadRequestException when no code was requested', async () => {
      prisma.emailVerificationCode.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyEmailCode('a@b.com', '123456', undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws UnauthorizedException when the code expired', async () => {
      prisma.emailVerificationCode.findFirst.mockResolvedValue({
        id: 1,
        codeHash: hashEmailCode('123456'),
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
      });

      await expect(
        service.verifyEmailCode('a@b.com', '123456', undefined),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException and does not increment further once attempts are exhausted', async () => {
      prisma.emailVerificationCode.findFirst.mockResolvedValue({
        id: 1,
        codeHash: hashEmailCode('123456'),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 5,
      });

      await expect(
        service.verifyEmailCode('a@b.com', '123456', undefined),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.emailVerificationCode.update).not.toHaveBeenCalled();
    });

    it('increments attempts on a wrong code', async () => {
      prisma.emailVerificationCode.findFirst.mockResolvedValue({
        id: 1,
        codeHash: hashEmailCode('123456'),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 1,
      });

      await expect(
        service.verifyEmailCode('a@b.com', '000000', undefined),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.emailVerificationCode.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { attempts: { increment: 1 } },
      });
    });

    it('creates a new user and session on first successful verification', async () => {
      prisma.emailVerificationCode.findFirst.mockResolvedValue({
        id: 1,
        codeHash: hashEmailCode('123456'),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 10, email: 'a@b.com' });
      prisma.session.create.mockResolvedValue({ token: 'session-token' });

      const result = await service.verifyEmailCode('a@b.com', '123456', 'ua');

      expect(prisma.emailVerificationCode.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { consumedAt: expect.any(Date) },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'a@b.com' },
      });
      expect(result).toEqual({
        user: { id: 10, email: 'a@b.com' },
        sessionToken: 'session-token',
      });
    });

    it('reuses an existing user by email', async () => {
      prisma.emailVerificationCode.findFirst.mockResolvedValue({
        id: 1,
        codeHash: hashEmailCode('123456'),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      });
      prisma.user.findUnique.mockResolvedValue({ id: 5, email: 'a@b.com' });
      prisma.session.create.mockResolvedValue({ token: 'session-token' });

      await service.verifyEmailCode('a@b.com', '123456', undefined);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('telegramAuth', () => {
    it('throws ServiceUnavailableException when TELEGRAM_BOT_TOKEN is not configured', async () => {
      config = {};
      const dto = signTelegramPayload({
        id: 1,
        first_name: 'Ada',
        auth_date: Math.floor(Date.now() / 1000),
      });

      await expect(service.telegramAuth(dto, undefined)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws UnauthorizedException for an invalid signature', async () => {
      const dto: TelegramAuthDto = {
        id: 1,
        first_name: 'Ada',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'deadbeef',
      };

      await expect(service.telegramAuth(dto, undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('creates a new user on first valid login', async () => {
      const dto = signTelegramPayload({
        id: 42,
        first_name: 'Ada',
        username: 'ada',
        auth_date: Math.floor(Date.now() / 1000),
      });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 1, telegramId: '42' });
      prisma.session.create.mockResolvedValue({ token: 'tg-session' });

      const result = await service.telegramAuth(dto, undefined);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          telegramId: '42',
          telegramUsername: 'ada',
          firstName: 'Ada',
          lastName: undefined,
        },
      });
      expect(result.sessionToken).toBe('tg-session');
    });

    it('updates profile fields for a returning telegram user', async () => {
      const dto = signTelegramPayload({
        id: 42,
        first_name: 'Ada Updated',
        auth_date: Math.floor(Date.now() / 1000),
      });
      prisma.user.findUnique.mockResolvedValue({ id: 1, telegramId: '42' });
      prisma.user.update.mockResolvedValue({ id: 1, telegramId: '42' });
      prisma.session.create.mockResolvedValue({ token: 'tg-session-2' });

      await service.telegramAuth(dto, undefined);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          telegramUsername: undefined,
          firstName: 'Ada Updated',
          lastName: undefined,
        },
      });
    });
  });

  describe('logout / logoutAll', () => {
    it('logout removes only the current session', async () => {
      await service.logout('session-1', 7);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { id: 'session-1', userId: 7 },
      });
    });

    it('logoutAll removes every session for the user', async () => {
      await service.logoutAll(7);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 7 },
      });
    });
  });
});
