import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthSession } from '../auth/decorators/auth-session.decorator';
import type { AuthSessionPayload } from '../auth/guards/session.guard';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateAssetTransactionDto } from './dto/create-asset-transaction.dto';
import { GetAssetTransactionsQueryDto } from './dto/get-asset-transactions-query.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiTags('assets')
@Auth()
@ApiBearerAuth('session')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @ApiOperation({ summary: 'Список активов пользователя' })
  findAll(@AuthSession() session: AuthSessionPayload) {
    return this.assetService.findAll(session.userId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Актив по slug' })
  findOne(
    @Param('slug') slug: string,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetService.findOneBySlug(slug, session.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать актив' })
  create(
    @Body() dto: CreateAssetDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetService.create(dto, session.userId);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Обновить актив' })
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateAssetDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetService.update(slug, dto, session.userId);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Удалить актив' })
  remove(
    @Param('slug') slug: string,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetService.remove(slug, session.userId);
  }

  @Get(':slug/transactions')
  @ApiOperation({ summary: 'История и график транзакций по активу' })
  getTransactions(
    @Param('slug') slug: string,
    @Query() query: GetAssetTransactionsQueryDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetService.getTransactionsBySlug(
      slug,
      session.userId,
      query.period,
    );
  }

  @Post(':slug/transactions')
  @ApiOperation({ summary: 'Создать транзакцию по активу' })
  createTransaction(
    @Param('slug') slug: string,
    @Body() dto: CreateAssetTransactionDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.assetService.createTransaction(slug, session.userId, dto);
  }
}
