import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getUsers(@CurrentUser() user: any) {
    return this.usersService.getAllUsers(user.email);
  }

  @Post('settings')
  updateSettings(
    @CurrentUser() user: any,
    @Body() body: { name?: string; image?: string },
  ) {
    return this.usersService.updateSettings(user.id, body.name, body.image);
  }
}
