import { Module } from '@nestjs/common';
import { AllocationRulesModule } from '../allocation-rules/allocation-rules.module';
import { DevCronsController } from './dev-crons.controller';
import { DevCronsService } from './dev-crons.service';
import { DevOnlyGuard } from './guards/dev-only.guard';

@Module({
  imports: [AllocationRulesModule],
  controllers: [DevCronsController],
  providers: [DevCronsService, DevOnlyGuard],
})
export class DevModule {}
