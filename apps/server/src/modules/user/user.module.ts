import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { XUserIdGuard } from './guards/x-user-id.guard';

@Module({
  controllers: [UserController],
  providers: [UserService, XUserIdGuard],
  exports: [UserService, XUserIdGuard],
})
export class UserModule {}
