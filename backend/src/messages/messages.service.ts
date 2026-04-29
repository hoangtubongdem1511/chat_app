import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
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
    currentUser: any,
    body: { message?: string; image?: string; conversationId: string },
  ) {
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

    const updatedConversation = await this.prisma.conversation.update({
      where: { id: body.conversationId },
      data: {
        lastMessageAt: new Date(),
        messages: { connect: { id: newMessage.id } },
      },
      include: {
        users: true,
        messages: { include: { seen: true } },
      },
    });

    await this.pusher.trigger(body.conversationId, 'messages:new', newMessage);

    const lastMessage =
      updatedConversation.messages[updatedConversation.messages.length - 1];

    await Promise.all(
      updatedConversation.users
        .filter((user) => user.email)
        .map((user) =>
          this.pusher.trigger(user.email!, 'conversation:update', {
            id: body.conversationId,
            messages: [lastMessage],
          }),
        ),
    );

    return newMessage;
  }
}
