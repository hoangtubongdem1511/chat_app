import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

interface CreateConversationBody {
  userId?: string;
  isGroup?: boolean;
  members?: { value: string }[];
  name?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  getAll(@CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.getAll(user.id);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.getById(id, user);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateConversationBody) {
    return this.conversationsService.create(user, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.delete(id, user.id);
  }

  @Post(':id/seen')
  markSeen(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.markSeen(id, user);
  }
}
