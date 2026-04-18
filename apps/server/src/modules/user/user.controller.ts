import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserCreatedResponseDto } from './dto/user-created-response.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать пользователя',
    description:
      'Регистрация по `telegramId`. Возвращает внутренний `id` для заголовка `X-User-Id`.',
  })
  @ApiCreatedResponse({
    description: 'Пользователь создан',
    type: UserCreatedResponseDto,
  })
  @ApiConflictResponse({
    description: 'Пользователь с таким `telegramId` уже существует',
  })
  @ApiBadRequestResponse({ description: 'Невалидное тело запроса' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
