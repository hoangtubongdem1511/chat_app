import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { CallsModule } from './calls/calls.module';
import { PusherModule } from './pusher/pusher.module';
import { LiveKitModule } from './livekit/livekit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    CallsModule,
    PusherModule,
    LiveKitModule,
  ],
})
export class AppModule {}
