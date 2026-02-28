import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { CreateTagDtoSchema, UpdateTagDtoSchema } from './dto/tags.dto';
import { ZodValidationPipe } from '../shared/pipes/zod-validation.pipe';
import { swaggerSchemas } from '../../common/swagger-schemas';

@ApiTags('tags')
@ApiBearerAuth('JWT')
@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Список тегов', schema: { type: 'array', items: swaggerSchemas.TagItem } })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findAll(@CurrentUser() user: User) {
    return this.tagsService.findAll(user.id);
  }

  @Post()
  @ApiBody({ schema: swaggerSchemas.CreateTagBody })
  @ApiResponse({ status: 201, description: 'Созданный тег', schema: swaggerSchemas.TagItem })
  @ApiResponse({ status: 400, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateTagDtoSchema)) body: { name: string; color?: string; alias: string },
  ) {
    return this.tagsService.create(user.id, body);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ schema: swaggerSchemas.UpdateTagBody })
  @ApiResponse({ status: 200, schema: swaggerSchemas.TagItem })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTagDtoSchema)) body: { name?: string; color?: string; alias?: string },
  ) {
    return this.tagsService.update(user.id, id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, schema: swaggerSchemas.OkResponse })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tagsService.remove(user.id, id);
  }
}
