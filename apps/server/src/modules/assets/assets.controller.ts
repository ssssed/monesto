import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  AssetBaseResponseDto,
  AssetPricedResponseDto,
} from './dto/asset-response.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { XUserIdGuard } from '../user/guards/x-user-id.guard';
import { AssetsService } from './assets.service';

const assetOneOfSchema = {
  oneOf: [
    { $ref: getSchemaPath(AssetBaseResponseDto) },
    { $ref: getSchemaPath(AssetPricedResponseDto) },
  ],
};

@ApiTags('assets')
@ApiSecurity('X-User-Id')
@ApiExtraModels(
  AssetBaseResponseDto,
  AssetPricedResponseDto,
  HistoryResponseDto,
)
@ApiUnauthorizedResponse({
  description: 'Отсутствует или пустой заголовок `X-User-Id`',
})
@ApiNotFoundResponse({
  description:
    'Пользователь с `id` из заголовка не найден (guard) или актив / slug не найден',
})
@Controller('assets')
@UseGuards(XUserIdGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({
    summary: 'Список активов',
    description:
      'Все активы текущего пользователя в формате webapp (`AssetType[]`).',
  })
  @ApiOkResponse({
    description: 'Массив активов (дискриминант `type`: base | priced)',
    schema: {
      type: 'array',
      items: assetOneOfSchema,
    },
  })
  list(@CurrentUser() user: User) {
    return this.assetsService.listForUser(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Создать актив',
    description:
      'Тело как `CreateBaseAssetType` / `CreatePricedAssetType` на фронте.',
  })
  @ApiCreatedResponse({
    description: 'Созданный актив',
    schema: assetOneOfSchema,
  })
  @ApiBadRequestResponse({
    description: 'Невалидное тело или для priced не передан `unit`',
  })
  create(@CurrentUser() user: User, @Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(user.id, dto);
  }

  @Get(':slug/transactions')
  @ApiOperation({
    summary: 'История транзакций по активу',
    description:
      'Соответствует `HistoryType[]` на фронте; сортировка: новые сверху.',
  })
  @ApiParam({ name: 'slug', description: 'Slug актива', example: 'zoloto' })
  @ApiOkResponse({ type: [HistoryResponseDto] })
  listTransactions(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.assetsService.listTransactions(user.id, slug);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Получить актив по slug',
    description: 'Один объект `AssetType` для страницы `/asset/[slug]`.',
  })
  @ApiParam({ name: 'slug', description: 'Slug актива', example: 'zoloto' })
  @ApiOkResponse({
    description: 'Актив (base или priced)',
    schema: assetOneOfSchema,
  })
  getOne(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.assetsService.getBySlug(user.id, slug);
  }

  @Post(':slug/transactions')
  @ApiOperation({
    summary: 'Добавить транзакцию',
    description:
      'Тело как `HistoryEventDataType`. Для base-актива `count` на сервере принудительно 1, `unit` = symbol актива.',
  })
  @ApiParam({ name: 'slug', description: 'Slug актива', example: 'zoloto' })
  @ApiCreatedResponse({
    description: 'Созданная запись истории',
    type: HistoryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Некорректные `price` / `count`' })
  createTransaction(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.assetsService.createTransaction(user.id, slug, dto);
  }
}
