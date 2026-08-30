import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthSession } from '../auth/decorators/auth-session.decorator';
import type { AuthSessionPayload } from '../auth/guards/session.guard';
import { AssetsService } from './assets.service';
import { CreateAssetTransactionDto } from './dto/create-asset-transaction.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiTags('assets')
@Auth()
@ApiBearerAuth('session')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Список активов пользователя' })
  findAll(@AuthSession() session: AuthSessionPayload) {
    return this.assetsService.findAll(session.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Актив по id' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetsService.findOne(id, session.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать актив' })
  create(
    @Body() dto: CreateAssetDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetsService.create(dto, session.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить актив' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetsService.update(id, dto, session.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить актив' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetsService.remove(id, session.userId);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'История транзакций по активу' })
  getTransactions(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetsService.getTransactions(id, session.userId);
  }

  @Post(':id/transactions')
  @ApiOperation({
    summary: 'Создать транзакцию по активу (пополнение/списание/корректировка)',
  })
  createTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAssetTransactionDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetsService.createTransaction(id, session.userId, dto);
  }
}
