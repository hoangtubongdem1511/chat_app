import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

interface CreateMessageBody {
  conversationId: string;
  message?: string;
  image?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  getByConversation(
    @Query('conversationId') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagesService.getByConversation(conversationId, user);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateMessageBody) {
    return this.messagesService.create(user, body);
  }
}
