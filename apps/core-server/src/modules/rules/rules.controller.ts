import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { CreateRuleDtoSchema, UpdateRuleDtoSchema } from './dto/rules.dto';
import type { CreateRuleDto, UpdateRuleDto } from './dto/rules.dto';
import { ZodValidationPipe } from '../shared/pipes/zod-validation.pipe';
import { swaggerSchemas } from '../../common/swagger-schemas';

@ApiTags('rules')
@ApiBearerAuth('JWT')
@Controller('rules')
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Список правил (триггер + шаги)' })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findAll(@CurrentUser() user: User) {
    return this.rulesService.findAll(user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Правило с шагами' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.rulesService.findOne(user.id, id);
  }

  @Post()
  @ApiBody({ schema: swaggerSchemas.CreateRuleBody })
  @ApiResponse({ status: 201, description: 'Созданное правило с шагами' })
  @ApiResponse({ status: 400, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateRuleDtoSchema)) body: CreateRuleDto,
  ) {
    return this.rulesService.create(user.id, body);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ schema: swaggerSchemas.UpdateRuleBody })
  @ApiResponse({ status: 200, description: 'Обновлённое правило' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRuleDtoSchema)) body: UpdateRuleDto,
  ) {
    return this.rulesService.update(user.id, id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, schema: swaggerSchemas.OkResponse })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.rulesService.remove(user.id, id);
  }
}
