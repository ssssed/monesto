import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/telegram.module';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { MonthModule } from './month/month.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TelegramModule,
    BotModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
    }),
    PrismaModule,
    MonthModule,
    UserModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
