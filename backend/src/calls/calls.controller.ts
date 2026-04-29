import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CallsService } from './calls.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

interface CreateCallBody {
  conversationId: string;
  type: 'VIDEO' | 'AUDIO';
}

@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCallBody) {
    return this.callsService.create(user, body);
  }

  @Get()
  getByConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId') conversationId: string,
  ) {
    return this.callsService.getByConversation(user, conversationId);
  }

  @Get('check-active')
  checkActive(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId') conversationId: string,
  ) {
    return this.callsService.checkActive(user, conversationId);
  }

  @Get('debug')
  debug(@CurrentUser() user: AuthenticatedUser) {
    return this.callsService.debug(user);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.callsService.getById(id, user);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.callsService.accept(id, user);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.callsService.reject(id, user);
  }

  @Post(':id/end')
  end(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.callsService.end(id, user);
  }

  @Post('cleanup')
  cleanup(@CurrentUser() user: AuthenticatedUser, @Body() body: { conversationId: string }) {
    return this.callsService.cleanup(user, body.conversationId);
  }
}
