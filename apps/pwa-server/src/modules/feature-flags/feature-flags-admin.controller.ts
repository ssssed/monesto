import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuth } from '../admin-auth/decorators/admin-auth.decorator';
import { AdminAuthSession } from '../admin-auth/decorators/admin-auth-session.decorator';
import type { AdminAuthSessionPayload } from '../admin-auth/guards/admin-session.guard';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { FeatureFlagResponseDto } from './dto/feature-flag-response.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('admin-feature-flags')
@AdminAuth()
@ApiBearerAuth('admin-session')
@Controller('admin/feature-flags')
export class FeatureFlagsAdminController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Список всех фичафлагов' })
  @ApiOkResponse({ type: [FeatureFlagResponseDto] })
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Создать фичафлаг' })
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  create(
    @Body() dto: CreateFeatureFlagDto,
    @AdminAuthSession() session: AdminAuthSessionPayload,
  ) {
    return this.featureFlagsService.create(dto, session.adminId);
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Обновить фичафлаг (например, включить/выключить)' })
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  update(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
    @AdminAuthSession() session: AdminAuthSessionPayload,
  ) {
    return this.featureFlagsService.update(key, dto, session.adminId);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Удалить фичафлаг' })
  remove(@Param('key') key: string) {
    return this.featureFlagsService.remove(key);
  }
}
