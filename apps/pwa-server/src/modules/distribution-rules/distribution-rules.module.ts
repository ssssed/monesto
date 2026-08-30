import { Module } from '@nestjs/common';
import { DistributionRulesController } from './distribution-rules.controller';
import { DistributionRulesService } from './distribution-rules.service';

@Module({
  controllers: [DistributionRulesController],
  providers: [DistributionRulesService],
})
export class DistributionRulesModule {}
