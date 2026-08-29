import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { FxModule } from '../fx/fx.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [FxModule, AssetsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
