import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PusherService } from './pusher.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

@Controller('pusher')
export class PusherController {
  constructor(private pusherService: PusherService) {}

  @UseGuards(JwtAuthGuard)
  @Post('auth')
  auth(@Req() req: Request, @CurrentUser() user: AuthenticatedUser) {
    if (!user?.email) {
      throw new UnauthorizedException();
    }

    const socketId = req.body.socket_id as string | undefined;
    const channelName = req.body.channel_name as string | undefined;

    if (!socketId || !channelName) {
      throw new BadRequestException('socket_id and channel_name are required');
    }

    return this.pusherService.authorizeChannel(socketId, channelName, {
      user_id: user.email!,
    });
  }
}
