import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AllocationRulesModule } from './modules/allocation-rules/allocation-rules.module';
import { AssetModule } from './modules/asset/asset.module';
import { AuthModule } from './modules/auth/auth.module';
import { DevModule } from './modules/dev/dev.module';
import { FinanceMonthModule } from './modules/finance-month/finance-month.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    AssetModule,
    AllocationRulesModule,
    SettingsModule,
    FinanceMonthModule,
    DevModule,
  ],
})
export class AppModule {}
