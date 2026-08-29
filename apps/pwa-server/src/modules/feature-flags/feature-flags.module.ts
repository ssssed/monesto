import { Module } from '@nestjs/common';
import { FeatureFlagsAdminController } from './feature-flags-admin.controller';
import { FeatureFlagsPublicController } from './feature-flags-public.controller';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  controllers: [FeatureFlagsPublicController, FeatureFlagsAdminController],
  providers: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
