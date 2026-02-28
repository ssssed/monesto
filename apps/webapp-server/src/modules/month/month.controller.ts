import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { MonthService } from './month.service';
import { UpdateMonthDto } from './dto/month.dto';
import { getRequestUserTelegramId } from '../user/utils';

@Controller('month')
export class MonthController {
  constructor(private readonly monthService: MonthService) {}

  @Get('current/status')
  async getCurrentMonthStatus(@Req() req) {
    const telegramId = getRequestUserTelegramId(req.headers);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return this.monthService.getCurrentMonthStatus({
      telegramId,
      year,
      month,
    });
  }

  @Patch(':year/:month')
  async updateMonth(
    @Req() req,
    @Param('year') year: string,
    @Param('month') month: string,
    @Body() dto: UpdateMonthDto,
  ) {
    const telegramId = getRequestUserTelegramId(req.headers);

    return this.monthService.updateMonth({
      telegramId,
      year: Number(year),
      month: Number(month),
      dto,
    });
  }
}
