import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LanguageCode } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SESSION_TTL_MS } from './auth.constants';
import { sessionDeviceTypeFromUserAgent } from './lib/session-device-type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async telegramAuth(initData: string, userAgent: string | undefined) {
    if (typeof initData !== 'string' || !initData.trim()) {
      throw new BadRequestException('initData is required');
    }

    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new ServiceUnavailableException(
        'Telegram authentication is not configured (TELEGRAM_BOT_TOKEN)',
      );
    }

    const isValid = this.verifyInitData(initData, botToken);

    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (!userJson) {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    let userData: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    try {
      userData = JSON.parse(userJson) as typeof userData;
    } catch {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    if (userData == null || typeof userData.id !== 'number') {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    // 1. find or create user
    let user = await this.prisma.user.findUnique({
      where: { telegramId: String(userData.id) },
    });

    if (!user) {
      const languageCode: LanguageCode =
        userData.language_code === 'ru' ? LanguageCode.ru : LanguageCode.en;

      user = await this.prisma.user.create({
        data: {
          telegramId: String(userData.id),
          firstName: userData.first_name ?? '',
          lastName: userData.last_name || '',
          username: userData.username || '',
          languageCode,
          settings: {
            create: {},
          },
        },
      });
    }

    // 2. одна сессия на (user, класс устройства по User-Agent); при повторном входе — продление
    const deviceType = sessionDeviceTypeFromUserAgent(userAgent);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const existing = await this.prisma.session.findUnique({
      where: {
        userId_deviceType: {
          userId: user.id,
          deviceType,
        },
      },
    });

    if (existing) {
      const session = await this.prisma.session.update({
        where: { id: existing.id },
        data: { expiresAt },
      });
      return {
        user,
        sessionToken: session.token,
      };
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        deviceType,
        token: crypto.randomUUID(),
        expiresAt,
      },
    });

    return {
      user,
      sessionToken: session.token,
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        username: true,
        languageCode: true,
        registerAt: true,
        updateAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

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
    await this.prisma.session.deleteMany({
      where: { userId },
    });
    return { ok: true as const };
  }

  private verifyInitData(initData: string, botToken: string): boolean {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) return false;

    urlParams.delete('hash');

    const dataCheckString = [...urlParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(calculatedHash, 'hex'),
        Buffer.from(hash, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
