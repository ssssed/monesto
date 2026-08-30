import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FxRateResponseDto } from './dto/fx-rate-response.dto';
import { GetFxRatesQueryDto } from './dto/get-fx-rates-query.dto';
import { FxRateService } from './fx-rate.service';
import { DEFAULT_FX_BASE_CURRENCIES } from './fx.constants';

@ApiTags('fx-rates')
@Controller('fx-rates')
export class FxRateController {
  constructor(private readonly fxRateService: FxRateService) {}

  @Get()
  @ApiOperation({
    summary:
      'Последний известный курс каждой валюты относительно base (по умолчанию USD)',
  })
  @ApiOkResponse({ type: [FxRateResponseDto] })
  listLatest(@Query() query: GetFxRatesQueryDto) {
    return this.fxRateService.listLatest(
      query.base ?? DEFAULT_FX_BASE_CURRENCIES,
    );
  }

  @Get(':base/:quote')
  @ApiOperation({ summary: 'Последний известный курс для конкретной пары' })
  @ApiOkResponse({ type: FxRateResponseDto })
  getLatest(@Param('base') base: string, @Param('quote') quote: string) {
    return this.fxRateService.getLatest(base, quote);
  }
}
