import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_EMAIL_OTP_MAX_ATTEMPTS,
  DEFAULT_EMAIL_OTP_RESEND_INTERVAL_MS,
  DEFAULT_EMAIL_OTP_TTL_MS,
  DEFAULT_SESSION_TTL_MS,
} from './auth.constants';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { getFixedOtpCode } from './lib/dev-fixed-otp';
import { generateEmailCode, hashEmailCode } from './lib/email-code';
import { verifyTelegramLoginPayload } from './lib/telegram-widget';
import { MAIL_SERVICE } from './mail/mail.service';
import type { MailService } from './mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(MAIL_SERVICE) private readonly mail: MailService,
  ) {}

  async requestEmailCode(email: string): Promise<{ ok: true }> {
    const fixedCode = getFixedOtpCode(
      email,
      this.config.get<string>('DEV_FIXED_EMAIL_CODES'),
    );

    if (!fixedCode) {
      const resendIntervalMs = Number(
        this.config.get<string>('EMAIL_OTP_RESEND_INTERVAL_MS') ??
          DEFAULT_EMAIL_OTP_RESEND_INTERVAL_MS,
      );

      const lastCode = await this.prisma.emailVerificationCode.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      });

      if (
        lastCode &&
        Date.now() - lastCode.createdAt.getTime() < resendIntervalMs
      ) {
        throw new HttpException(
          'Код уже отправлен, повторите попытку позже',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const ttlMs = Number(
      this.config.get<string>('EMAIL_OTP_TTL_MS') ?? DEFAULT_EMAIL_OTP_TTL_MS,
    );
    const code = fixedCode ?? generateEmailCode();

    await this.prisma.emailVerificationCode.create({
      data: {
        email,
        codeHash: hashEmailCode(code),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });

    await this.mail.sendVerificationCode(email, code);

    return { ok: true };
  }

  async verifyEmailCode(
    email: string,
    code: string,
    userAgent: string | undefined,
  ) {
    const record = await this.prisma.emailVerificationCode.findFirst({
      where: { email, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Код не запрашивался для этого email');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Код истёк');
    }

    const maxAttempts = Number(
      this.config.get<string>('EMAIL_OTP_MAX_ATTEMPTS') ??
        DEFAULT_EMAIL_OTP_MAX_ATTEMPTS,
    );
    if (record.attempts >= maxAttempts) {
      throw new UnauthorizedException(
        'Превышено число попыток, запросите новый код',
      );
    }

    if (hashEmailCode(code) !== record.codeHash) {
      await this.prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Неверный код');
    }

    await this.prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({ data: { email } });
    }

    const session = await this.issueSession(user.id, userAgent);
    return { user, sessionToken: session.token };
  }

  async telegramAuth(dto: TelegramAuthDto, userAgent: string | undefined) {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new ServiceUnavailableException(
        'Telegram authentication is not configured (TELEGRAM_BOT_TOKEN)',
      );
    }

    const isValid = verifyTelegramLoginPayload(dto, botToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram login payload');
    }

    const telegramId = String(dto.id);
    let user = await this.prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId,
          telegramUsername: dto.username,
          firstName: dto.first_name,
          lastName: dto.last_name,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: dto.username,
          firstName: dto.first_name,
          lastName: dto.last_name,
        },
      });
    }

    const session = await this.issueSession(user.id, userAgent);
    return { user, sessionToken: session.token };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return { user };
  }

  /** Удаляет только сессию, с которой пришёл запрос. */
  async logout(sessionId: string, userId: number) {
    await this.prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });
    return { ok: true as const };
  }

  /** Удаляет все сессии пользователя (все устройства). */
  async logoutAll(userId: number) {
    await this.prisma.session.deleteMany({ where: { userId } });
    return { ok: true as const };
  }

  private async issueSession(userId: number, userAgent: string | undefined) {
    const ttlMs = Number(
      this.config.get<string>('SESSION_TTL_MS') ?? DEFAULT_SESSION_TTL_MS,
    );
    return this.prisma.session.create({
      data: {
        userId,
        token: crypto.randomUUID(),
        userAgent,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
  }
}
