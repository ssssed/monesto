import { Module } from '@nestjs/common';
import { AssetModule } from '../asset/asset.module';
import { AuthModule } from '../auth/auth.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule, AssetModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
