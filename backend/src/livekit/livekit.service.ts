import { Injectable, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

@Injectable()
export class LiveKitService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async generateToken(
    user: Pick<AuthenticatedUser, 'id' | 'email' | 'name'>,
    roomName: string,
  ): Promise<string> {
    if (!roomName) {
      throw new BadRequestException('Room name is required');
    }

    // Verify the requesting user is a participant in the call for this room
    const call = await this.prisma.call.findFirst({
      where: {
        roomName,
        participants: { some: { userId: user.id } },
      },
    });

    if (!call) {
      throw new ForbiddenException('Not authorized for this room');
    }

    const apiKey = this.config.getOrThrow<string>('LIVEKIT_API_KEY');
    const apiSecret = this.config.getOrThrow<string>('LIVEKIT_API_SECRET');

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.email ?? 'unknown',
      name: user.name ?? user.email ?? 'unknown',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return at.toJwt();
  }
}
