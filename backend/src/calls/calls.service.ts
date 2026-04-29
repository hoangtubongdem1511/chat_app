import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';

@Injectable()
export class CallsService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  async create(currentUser: any, body: { conversationId: string; type: string }) {
    const { conversationId, type } = body;

    if (!conversationId || !type) {
      throw new BadRequestException('Missing required fields');
    }

    if (!['VIDEO', 'VOICE'].includes(type)) {
      throw new BadRequestException('Invalid call type');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isUserInConversation = conversation.users.some(
      (u) => u.id === currentUser.id,
    );

    if (!isUserInConversation) {
      throw new ForbiddenException('Not authorized for this conversation');
    }

    const activeCall = await this.prisma.call.findFirst({
      where: {
        conversationId,
        status: { in: ['INCOMING', 'ONGOING'] },
      },
    });

    if (activeCall) {
      throw new ConflictException('There is already an active call in this conversation');
    }

    const roomName = `call_${conversationId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const call = await this.prisma.call.create({
      data: {
        roomName,
        type: type as any,
        status: 'INCOMING',
        conversationId,
        callerId: currentUser.id,
        participants: {
          create: { userId: currentUser.id, role: 'CALLER' },
        },
      },
      include: {
        caller: true,
        participants: { include: { user: true } },
        conversation: { include: { users: true } },
      },
    });

    conversation.users.forEach((user) => {
      if (user.id !== currentUser.id && user.email) {
        this.pusher.trigger(user.email, 'call:incoming', {
          ...call,
          conversation: call.conversation,
        });
      }
    });

    return call;
  }

  async getByConversation(currentUser: any, conversationId: string) {
    if (!conversationId) {
      throw new BadRequestException('Conversation ID is required');
    }

    return this.prisma.call.findMany({
      where: {
        conversationId,
        OR: [
          { callerId: currentUser.id },
          { participants: { some: { userId: currentUser.id } } },
        ],
      },
      include: {
        caller: true,
        participants: { include: { user: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }

  async getById(callId: string, currentUser: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: true,
        participants: { include: { user: true } },
        conversation: { include: { users: true } },
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    const isUserInConversation = call.conversation.users.some(
      (u) => u.id === currentUser.id,
    );

    if (!isUserInConversation) {
      throw new ForbiddenException('Not authorized for this call');
    }

    return call;
  }

  async accept(callId: string, currentUser: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: true,
        participants: { include: { user: true } },
        conversation: { include: { users: true } },
      },
    });

    if (!call) throw new NotFoundException('Call not found');
    if (call.status !== 'INCOMING') {
      throw new BadRequestException('Call is not in incoming status');
    }

    const isUserInConversation = call.conversation.users.some(
      (u) => u.id === currentUser.id,
    );
    if (!isUserInConversation) {
      throw new ForbiddenException('Not authorized for this call');
    }

    if (call.callerId === currentUser.id) {
      throw new BadRequestException('Caller cannot accept their own call');
    }

    const existingParticipant = call.participants.find(
      (p) => p.userId === currentUser.id,
    );
    if (existingParticipant) {
      throw new BadRequestException('User already participated in this call');
    }

    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'ONGOING',
        startedAt: new Date(),
        participants: {
          create: { userId: currentUser.id, role: 'RECEIVER' },
        },
      },
      include: {
        caller: true,
        participants: { include: { user: true } },
        conversation: { include: { users: true } },
      },
    });

    call.conversation.users.forEach((user) => {
      if (user.email) {
        this.pusher.trigger(user.email, 'call:accepted', updatedCall);
      }
    });

    return updatedCall;
  }

  async reject(callId: string, currentUser: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: true,
        participants: { include: { user: true } },
        conversation: { include: { users: true } },
      },
    });

    if (!call) throw new NotFoundException('Call not found');
    if (call.status !== 'INCOMING') {
      throw new BadRequestException('Call is not in incoming status');
    }

    const isUserInConversation = call.conversation.users.some(
      (u) => u.id === currentUser.id,
    );
    if (!isUserInConversation) {
      throw new ForbiddenException('Not authorized for this call');
    }

    if (call.callerId === currentUser.id) {
      throw new BadRequestException('Caller cannot reject their own call');
    }

    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: { status: 'REJECTED', endedAt: new Date() },
      include: {
        caller: true,
        participants: { include: { user: true } },
        conversation: { include: { users: true } },
      },
    });

    call.conversation.users.forEach((user) => {
      if (user.email) {
        this.pusher.trigger(user.email, 'call:rejected', updatedCall);
      }
    });

    return updatedCall;
  }

  async end(callId: string, currentUser: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: true,
        participants: { include: { user: true } },
        conversation: { include: { users: true } },
      },
    });

    if (!call) throw new NotFoundException('Call not found');

    if (!['INCOMING', 'ONGOING'].includes(call.status)) {
      throw new BadRequestException('Call is not active');
    }

    const isUserInConversation = call.conversation.users.some(
      (u) => u.id === currentUser.id,
    );
    if (!isUserInConversation) {
      throw new ForbiddenException('Not authorized for this call');
    }

    let duration: number | undefined;
    if (call.status === 'ONGOING' && call.startedAt) {
      const endTime = new Date();
      duration = Math.floor(
        (endTime.getTime() - call.startedAt.getTime()) / 1000,
      );
    }

    let finalStatus: 'ENDED' | 'MISSED' | 'CANCELLED';
    if (call.status === 'INCOMING') {
      finalStatus = call.callerId === currentUser.id ? 'CANCELLED' : 'MISSED';
    } else {
      finalStatus = 'ENDED';
    }

    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: finalStatus,
        endedAt: new Date(),
        duration: duration || undefined,
      },
      include: {
        caller: true,
        participants: { include: { user: true } },
        conversation: { include: { users: true } },
      },
    });

    call.conversation.users.forEach((user) => {
      if (user.email) {
        this.pusher.trigger(user.email, 'call:ended', updatedCall);
      }
    });

    return updatedCall;
  }

  async checkActive(currentUser: any, conversationId: string) {
    if (!conversationId) {
      throw new BadRequestException('Conversation ID is required');
    }

    const activeCalls = await this.prisma.call.findMany({
      where: {
        conversationId,
        status: { in: ['INCOMING', 'ONGOING'] },
      },
      include: {
        caller: true,
        participants: { include: { user: true } },
      },
    });

    return { activeCalls, count: activeCalls.length };
  }

  async cleanup(currentUser: any, conversationId: string) {
    if (!conversationId) {
      throw new BadRequestException('Conversation ID is required');
    }

    const updatedCalls = await this.prisma.call.updateMany({
      where: {
        conversationId,
        status: { in: ['INCOMING', 'ONGOING'] },
      },
      data: { status: 'CANCELLED', endedAt: new Date() },
    });

    return {
      message: `Cleaned up ${updatedCalls.count} active calls`,
      updatedCount: updatedCalls.count,
    };
  }

  async debug(currentUser: { id: string }) {
    const calls = await this.prisma.call.findMany({
      where: {
        OR: [
          { callerId: currentUser.id },
          { participants: { some: { userId: currentUser.id } } },
        ],
      },
      include: {
        participants: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    return {
      totalCalls: calls.length,
      calls: calls.map((call) => ({
        id: call.id,
        status: call.status,
        type: call.type,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        conversationId: call.conversationId,
        participantsCount: call.participants.length,
      })),
    };
  }
}
