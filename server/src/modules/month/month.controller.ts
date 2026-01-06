import { Controller, Get, Body, Patch, Param, Req } from '@nestjs/common';
import { MonthService } from './month.service';
import { UpdateMonthDto } from './dto/month.dto';

@Controller('month')
export class MonthController {
  constructor(private readonly monthService: MonthService) {}

  @Get('current/status')
  async getCurrentMonthStatus(@Req() req) {
    const telegramId = req.telegramId;

    return this.monthService.getCurrentMonthStatus(telegramId);
  }

  @Patch(':year/:month')
  async updateMonth(
    @Req() req,
    @Param('year') year: string,
    @Param('month') month: string,
    @Body() dto: UpdateMonthDto,
  ) {
    const telegramId = req.telegramId;

    return this.monthService.updateMonth({
      telegramId,
      year: Number(year),
      month: Number(month),
      dto,
    });
  }
}
