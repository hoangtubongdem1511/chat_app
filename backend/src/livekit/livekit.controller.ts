import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LiveKitService } from './livekit.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

@UseGuards(JwtAuthGuard)
@Controller('livekit')
export class LiveKitController {
  constructor(private liveKitService: LiveKitService) {}

  @Post('token')
  async getToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { roomName: string },
  ) {
    const token = await this.liveKitService.generateToken(user, body.roomName);
    return {
      token,
      roomName: body.roomName,
      identity: user.email,
    };
  }
}
