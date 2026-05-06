import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private _server: Server | null = null;

  /** Called once by RealtimeGateway after the WS server is initialised. */
  setServer(server: Server): void {
    this._server = server;
  }

  private get server(): Server {
    if (!this._server) {
      throw new Error('RealtimeService: Socket.io server not initialised yet');
    }
    return this._server;
  }

  /** Emit an event to every socket currently in the per-user room. */
  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /** Emit an event to every socket currently in the per-conversation room. */
  emitToConversation(conversationId: string, event: string, payload: unknown): void {
    this.server.to(`conv:${conversationId}`).emit(event, payload);
  }
}
