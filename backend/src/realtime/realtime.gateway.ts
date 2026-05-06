import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { PresenceService } from './presence.service';
import { PrismaService } from '../prisma/prisma.service';

interface SocketData {
  userId: string;
  email: string;
}

type AuthenticatedSocket = Socket & { data: SocketData };

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  path: '/socket.io',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeService,
    private readonly presence: PresenceService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
    this.logger.log('RealtimeGateway initialised');
  }

  async handleConnection(socket: Socket) {
    try {
      const token = (socket.handshake.auth as Record<string, unknown>)?.token as
        | string
        | undefined;

      if (!token) {
        this.logger.warn(`Socket ${socket.id} rejected: no token`);
        socket.disconnect(true);
        return;
      }

      const secret = this.config.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token, { secret });

      const s = socket as AuthenticatedSocket;
      s.data.userId = payload.sub;
      s.data.email = payload.email;

      // Join personal room
      await socket.join(`user:${payload.sub}`);

      // Presence tracking
      const wasOffline = !this.presence.isOnline(payload.sub);
      this.presence.add(payload.sub, socket.id);

      if (wasOffline) {
        socket.broadcast.emit('presence:online', { userId: payload.sub });
      }

      // Send current online list to the newly connected socket
      socket.emit('presence:list', { userIds: this.presence.list() });

      this.logger.log(`Socket ${socket.id} connected — user ${payload.sub}`);
    } catch (err) {
      this.logger.warn(`Socket ${socket.id} rejected: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    const s = socket as AuthenticatedSocket;
    if (!s.data?.userId) return;

    const wentOffline = this.presence.remove(s.data.userId, socket.id);
    if (wentOffline) {
      socket.broadcast.emit('presence:offline', { userId: s.data.userId });
    }

    this.logger.log(`Socket ${socket.id} disconnected — user ${s.data.userId}`);
  }

  @SubscribeMessage('conversation:join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const s = socket as AuthenticatedSocket;
    const { conversationId } = data ?? {};
    if (!conversationId || !s.data?.userId) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || !conversation.userIds.includes(s.data.userId)) {
      this.logger.warn(`User ${s.data.userId} not authorised for conv ${conversationId}`);
      return;
    }

    await socket.join(`conv:${conversationId}`);
    this.logger.log(`User ${s.data.userId} joined conv:${conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  async handleLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data ?? {};
    if (!conversationId) return;
    await socket.leave(`conv:${conversationId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const s = socket as AuthenticatedSocket;
    const { conversationId } = data ?? {};
    if (!conversationId || !s.data?.userId) return;

    socket.to(`conv:${conversationId}`).emit('typing:start', {
      conversationId,
      userId: s.data.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const s = socket as AuthenticatedSocket;
    const { conversationId } = data ?? {};
    if (!conversationId || !s.data?.userId) return;

    socket.to(`conv:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId: s.data.userId,
    });
  }
}
