import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  async getAll(userId: string) {
    return this.prisma.conversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      where: { userIds: { has: userId } },
      include: {
        users: true,
        messages: {
          include: { sender: true, seen: true },
        },
      },
    });
  }

  async getById(conversationId: string, currentUser: AuthenticatedUser) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.userIds.includes(currentUser.id)) {
      throw new ForbiddenException('Not authorized for this conversation');
    }

    return conversation;
  }

  async create(
    currentUser: any,
    body: { userId?: string; isGroup?: boolean; members?: { value: string }[]; name?: string },
  ) {
    const { userId, isGroup, members, name } = body;

    if (isGroup) {
      if (!members || members.length < 2 || !name) {
        throw new BadRequestException('Invalid data');
      }

      const newConversation = await this.prisma.conversation.create({
        data: {
          name,
          isGroup: true,
          users: {
            connect: [
              ...members.map((m) => ({ id: m.value })),
              { id: currentUser.id },
            ],
          },
        },
        include: { users: true },
      });

      newConversation.users.forEach((user) => {
        this.realtime.emitToUser(user.id, 'conversation:new', newConversation);
      });

      return newConversation;
    }

    const existing = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { userIds: { equals: [currentUser.id, userId] } },
          { userIds: { equals: [userId, currentUser.id] } },
        ],
      },
    });

    if (existing[0]) {
      return existing[0];
    }

    const newConversation = await this.prisma.conversation.create({
      data: {
        isGroup: false,
        users: {
          connect: [{ id: currentUser.id }, { id: userId }],
        },
      },
      include: { users: true },
    });

    newConversation.users.forEach((user) => {
      this.realtime.emitToUser(user.id, 'conversation:new', newConversation);
    });

    return newConversation;
  }

  async delete(conversationId: string, userId: string) {
    const existing = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true },
    });

    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }

    if (!existing.userIds.includes(userId)) {
      throw new ForbiddenException('Not authorized to delete this conversation');
    }

    const deleted = await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    existing.users.forEach((user) => {
      this.realtime.emitToUser(user.id, 'conversation:remove', existing);
    });

    return deleted;
  }

  async markSeen(conversationId: string, currentUser: AuthenticatedUser) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { include: { seen: true } },
        users: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.userIds.includes(currentUser.id)) {
      throw new ForbiddenException('Not authorized for this conversation');
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];

    if (!lastMessage) {
      return conversation;
    }

    // Idempotency guard: skip DB write and realtime emit if already seen
    if (lastMessage.seenIds.includes(currentUser.id)) {
      return conversation;
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id: lastMessage.id },
      include: { sender: true, seen: true },
      data: {
        seen: { connect: { id: currentUser.id } },
      },
    });

    this.realtime.emitToUser(currentUser.id, 'conversation:update', {
      id: conversationId,
      messages: [updatedMessage],
    });
    this.realtime.emitToConversation(conversationId, 'message:update', updatedMessage);

    return updatedMessage;
  }
}
