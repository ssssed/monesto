import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { MonthService } from './month.service';
import { UpdateMonthDto } from './dto/month.dto';

@Controller('month')
export class MonthController {
  constructor(private readonly monthService: MonthService) {}

  @Get('current/status')
  async getCurrentMonthStatus(@Req() req) {
    const telegramId = req.telegramId;
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
  @HttpCode(HttpStatus.NO_CONTENT)
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
