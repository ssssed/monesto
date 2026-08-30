import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuthModule } from './modules/auth/auth.module';
import { DistributionRulesModule } from './modules/distribution-rules/distribution-rules.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { FxModule } from './modules/fx/fx.module';
import { IncomeSourcesModule } from './modules/income-sources/income-sources.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { VacationPeriodsModule } from './modules/vacation-periods/vacation-periods.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminAuthModule,
    FeatureFlagsModule,
    FxModule,
    IncomeSourcesModule,
    ExpensesModule,
    AssetsModule,
    DistributionRulesModule,
    VacationPeriodsModule,
    ReportsModule,
  ],
})
export class AppModule {}
