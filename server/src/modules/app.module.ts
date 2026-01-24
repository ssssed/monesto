import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/telegram.module';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { MonthModule } from './month/month.module';
import { UserModule } from './user/user.module';

const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath:
      process.env.NODE_ENV === 'production'
        ? undefined
        : `.env.${process.env.NODE_ENV ?? 'development'}`,
  }),
  PrismaModule,
  MonthModule,
  UserModule,
];

if (botToken) {
  imports.push(TelegramModule, BotModule);
}

@Module({
  imports,
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
