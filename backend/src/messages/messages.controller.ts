import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @CurrentUser() user: User) {
    return this.messagesService.create(createMessageDto, user.id);
  }

  @Get('chat/:chatId')
  findByChatId(@Param('chatId') chatId: string, @CurrentUser() user: User) {
    return this.messagesService.findByChatId(chatId, user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messagesService.delete(id, user.id);
  }
}
