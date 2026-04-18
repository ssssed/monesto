import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async telegramAuth(initData: string) {
    const isValid = this.verifyInitData(initData);

    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    const userData = JSON.parse(userJson!);

    // 1. find or create user
    let user = await this.prisma.user.findUnique({
      where: { telegramId: String(userData.id) },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId: String(userData.id),
          firstName: userData.first_name,
          lastName: userData.last_name || '',
          username: userData.username || '',
          languageCode: userData.language_code || 'en',
        },
      });
    }

    // 2. create session
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      },
    });

    return {
      user,
      sessionToken: session.token,
    };
  }

  private verifyInitData(initData: string): boolean {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
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
      .update(BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  }
}
