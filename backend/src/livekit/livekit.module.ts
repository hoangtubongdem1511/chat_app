import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LiveKitService } from './livekit.service';
import { LiveKitController } from './livekit.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [LiveKitService],
  controllers: [LiveKitController],
})
export class LiveKitModule {}
