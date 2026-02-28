import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDtoSchema, RegisterDtoSchema } from './dto/auth.dto';
import { ZodValidationPipe } from '../shared/pipes/zod-validation.pipe';
import { swaggerSchemas } from '../../common/swagger-schemas';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация', description: 'Регистрация пользователя. В ответ — JWT (без срока истечения).' })
  @ApiBody({ schema: swaggerSchemas.RegisterBody })
  @ApiResponse({ status: 201, description: 'Успешная регистрация', schema: swaggerSchemas.AuthResponse })
  @ApiResponse({ status: 401, description: 'Логин уже занят', schema: swaggerSchemas.ErrorResponse })
  async register(
    @Body(new ZodValidationPipe(RegisterDtoSchema)) body: { login: string; password: string; name?: string },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Логин', description: 'Вход по логину и паролю. В ответ — JWT (без срока истечения).' })
  @ApiBody({ schema: swaggerSchemas.LoginBody })
  @ApiResponse({ status: 200, description: 'Успешный вход', schema: swaggerSchemas.AuthResponse })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль', schema: swaggerSchemas.ErrorResponse })
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema)) body: { login: string; password: string },
  ) {
    return this.authService.login(body);
  }
}
