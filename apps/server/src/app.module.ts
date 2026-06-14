import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AllocationRulesModule } from './modules/allocation-rules/allocation-rules.module';
import { AssetModule } from './modules/asset/asset.module';
import { AuthModule } from './modules/auth/auth.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    AssetModule,
    AllocationRulesModule,
    SettingsModule,
  ],
})
export class AppModule {}
