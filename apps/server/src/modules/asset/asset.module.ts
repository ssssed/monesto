import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { CurrencyConverterFactory } from './profit/currency-converter.factory';
import { ProfitCalculatorService } from './profit/profit-calculator.service';
import { GoldCurrencyConversionStrategy } from './profit/strategies/gold-currency-conversion.strategy';
import { RubCurrencyConversionStrategy } from './profit/strategies/rub-currency-conversion.strategy';
import { UsdCurrencyConversionStrategy } from './profit/strategies/usd-currency-conversion.strategy';

@Module({
  imports: [AuthModule],
  controllers: [AssetController],
  exports: [AssetService],
  providers: [
    AssetService,
    RubCurrencyConversionStrategy,
    UsdCurrencyConversionStrategy,
    GoldCurrencyConversionStrategy,
    CurrencyConverterFactory,
    ProfitCalculatorService,
  ],
})
export class AssetModule {}
