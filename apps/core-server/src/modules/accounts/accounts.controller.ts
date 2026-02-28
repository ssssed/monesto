import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { CreateAccountDtoSchema, UpdateAccountDtoSchema } from './dto/accounts.dto';
import { ZodValidationPipe } from '../shared/pipes/zod-validation.pipe';
import { swaggerSchemas } from '../../common/swagger-schemas';

@ApiTags('accounts')
@ApiBearerAuth('JWT')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Список счетов и активов (массив объектов с id, name, type, currency, tags)' })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findAll(@CurrentUser() user: User) {
    return this.accountsService.findAll(user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Счёт/актив' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.findOne(user.id, id);
  }

  @Post()
  @ApiBody({ schema: swaggerSchemas.CreateAccountBody })
  @ApiResponse({ status: 201, description: 'Созданный счёт/актив' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации', schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateAccountDtoSchema)) body: { name: string; type: 'account' | 'asset'; currency: string; tagIds?: string[] },
  ) {
    return this.accountsService.create(user.id, body);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ schema: swaggerSchemas.UpdateAccountBody })
  @ApiResponse({ status: 200, description: 'Обновлённый счёт/актив' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAccountDtoSchema)) body: { name?: string; type?: 'account' | 'asset'; currency?: string; tagIds?: string[] },
  ) {
    return this.accountsService.update(user.id, id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, schema: swaggerSchemas.OkResponse })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.remove(user.id, id);
  }
}
