import { Module } from '@nestjs/common';
import { VacationPeriodsController } from './vacation-periods.controller';
import { VacationPeriodsService } from './vacation-periods.service';

@Module({
  controllers: [VacationPeriodsController],
  providers: [VacationPeriodsService],
})
export class VacationPeriodsModule {}
