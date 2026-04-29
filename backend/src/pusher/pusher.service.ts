import { Injectable } from '@nestjs/common';
import * as Pusher from 'pusher';

@Injectable()
export class PusherService {
  private server: Pusher;

  constructor() {
    this.server = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER || 'ap1',
      useTLS: true,
    });
  }

  trigger(channel: string, event: string, data: unknown) {
    return this.server.trigger(channel, event, data);
  }

  authorizeChannel(socketId: string, channel: string, data?: { user_id: string }) {
    return this.server.authorizeChannel(socketId, channel, data);
  }
}
