import { Module } from '@nestjs/common';
import { IncomeTypesController } from './incomes.controller';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';

@Module({
  controllers: [IncomeTypesController, IncomesController],
  providers: [IncomesService],
})
export class IncomesModule {}
