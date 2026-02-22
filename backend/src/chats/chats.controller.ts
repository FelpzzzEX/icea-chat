import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post()
  create(@Body() dto: CreateChatDto, @CurrentUser() user: any) {
    return this.chatsService.create(dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.chatsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChatDto, @CurrentUser() user: any) {
    return this.chatsService.update(id, user.id, dto);
  }

  @Post(':id/members/:memberId')
  addMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser() user: any) {
    return this.chatsService.addMember(id, user.id, memberId);
  }

  @Delete(':id/members/:memberId')
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser() user: any) {
    return this.chatsService.removeMember(id, user.id, memberId);
  }

  @Patch(':id/members/:memberId/role')
  grantChatRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body('chatRole') chatRole: string,
    @CurrentUser() user: any,
  ) {
    return this.chatsService.grantChatRole(id, user.id, memberId, chatRole);
  }

  @Post(':id/kick-requests')
  createKickRequest(
    @Param('id') id: string,
    @Body('targetId') targetId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatsService.createKickRequest(id, user.id, targetId);
  }

  @Get(':id/kick-requests')
  getKickRequests(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatsService.getKickRequests(id, user.id);
  }

  @Post(':id/kick-requests/:requestId/approve')
  approveKickRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatsService.resolveKickRequest(id, requestId, user.id, true);
  }

  @Delete(':id/kick-requests/:requestId')
  rejectKickRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatsService.resolveKickRequest(id, requestId, user.id, false);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatsService.delete(id, user.id);
  }
}