import { Module } from '@nestjs/common';
import { AssetModule } from '../asset/asset.module';
import { AuthModule } from '../auth/auth.module';
import { AllocationRulesController } from './allocation-rules.controller';
import { AllocationRulesService } from './allocation-rules.service';

@Module({
  imports: [AuthModule, AssetModule],
  controllers: [AllocationRulesController],
  providers: [AllocationRulesService],
})
export class AllocationRulesModule {}
