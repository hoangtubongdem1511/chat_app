import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
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
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateMessageDto) {
    return this.messagesService.create(user, body);
  }
}
