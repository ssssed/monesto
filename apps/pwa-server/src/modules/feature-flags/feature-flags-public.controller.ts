import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsPublicController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({
    summary: 'Публичная карта фичафлагов, доступных клиентским приложениям',
  })
  @ApiOkResponse({ schema: { example: { year_summary: true } } })
  getPublicFlags() {
    return this.featureFlagsService.getPublicMap();
  }
}
