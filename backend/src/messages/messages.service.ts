import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  async getByConversation(conversationId: string, currentUser: AuthenticatedUser) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.userIds.includes(currentUser.id)) {
      throw new ForbiddenException('Not authorized for this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: true, seen: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    currentUser: AuthenticatedUser,
    body: { message?: string; image?: string; conversationId: string; clientId?: string },
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: body.conversationId },
      select: { userIds: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.userIds.includes(currentUser.id)) {
      throw new ForbiddenException('Not authorized for this conversation');
    }

    const newMessage = await this.prisma.message.create({
      data: {
        body: body.message,
        image: body.image,
        conversation: { connect: { id: body.conversationId } },
        sender: { connect: { id: currentUser.id } },
        seen: { connect: { id: currentUser.id } },
        createdAt: new Date(),
      },
      include: { seen: true, sender: true },
    });

    const payload = { ...newMessage, clientId: body.clientId };

    // Don't gate the broadcast or HTTP response on this.
    void this.prisma.conversation
      .update({
        where: { id: body.conversationId },
        data: {
          lastMessageAt: newMessage.createdAt,
        },
        select: { id: true },
      })
      .catch((e) => this.logger.error('lastMessageAt bump failed', e));

    this.realtime.emitToConversation(body.conversationId, 'messages:new', payload);

    conversation.userIds.forEach((userId) => {
      this.realtime.emitToUser(userId, 'conversation:update', {
        id: body.conversationId,
        messages: [newMessage],
      });
    });

    return payload;
  }
}
