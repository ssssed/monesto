import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TagsModule } from './modules/tags/tags.module';
import { RulesModule } from './modules/rules/rules.module';
import { IncomesModule } from './modules/incomes/incomes.module';
import { ExpensesModule } from './modules/expenses/expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    AccountsModule,
    TagsModule,
    RulesModule,
    IncomesModule,
    ExpensesModule,
  ],
})
export class AppModule {}
