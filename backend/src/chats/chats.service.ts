import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

const USER_SELECT = {
  id: true, username: true, email: true, bio: true,
  avatar: true, role: true, isActive: true, createdAt: true, updatedAt: true,
};

const MEMBER_INCLUDE = {
  members: {
    select: {
      chatRole: true,
      user: { select: USER_SELECT },
    },
  },
};

const CREATOR_INCLUDE = { creator: { select: USER_SELECT } };

function mapChat(chat: any) {
  return {
    ...chat,
    members: chat.members?.map((m: any) => ({
      ...m.user,
      chatRole: m.chatRole ?? 'member',
    })) ?? [],
  };
}

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateChatDto, creatorId: string) {
    const memberIds = [...new Set([creatorId, ...dto.memberIds])];
    const chat = await this.prisma.chat.create({
      data: {
        type: dto.type,
        name: dto.name,
        description: dto.description,
        creatorId,
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
      include: { ...CREATOR_INCLUDE, ...MEMBER_INCLUDE },
    });
    return mapChat(chat);
  }

  async findAll(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: { members: { some: { userId } } },
      include: { ...CREATOR_INCLUDE, ...MEMBER_INCLUDE },
      orderBy: { updatedAt: 'desc' },
    });
    return chats.map(mapChat);
  }

  async findOne(id: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id },
      include: { ...CREATOR_INCLUDE, ...MEMBER_INCLUDE },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const mapped = mapChat(chat);
    if (!mapped.members.some((m: any) => m.id === userId)) {
      throw new ForbiddenException('You are not a member of this chat');
    }
    return mapped;
  }

  async update(id: string, userId: string, dto: UpdateChatDto) {
    const chat = await this.findOne(id, userId);
    if (chat.creator.id !== userId) {
      throw new ForbiddenException('Only the group administrator can edit group info');
    }
    const updated = await this.prisma.chat.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
      include: { ...CREATOR_INCLUDE, ...MEMBER_INCLUDE },
    });
    return mapChat(updated);
  }

  async addMember(chatId: string, userId: string, memberId: string) {
    const chat = await this.findOne(chatId, userId);
    if (chat.type === 'private') throw new ForbiddenException('Cannot add members to private chat');
    if (chat.members.some((m: any) => m.id === memberId)) {
      throw new ConflictException('User is already a member');
    }
    await this.prisma.chatMember.create({ data: { chatId, userId: memberId } });
    return this.findOne(chatId, userId);
  }

  async removeMember(chatId: string, userId: string, memberId: string) {
    const chat = await this.findOne(chatId, userId);
    if (chat.type === 'private') throw new ForbiddenException('Cannot remove members from private chat');

    const requesterMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    const isAdmin = chat.creator.id === userId;
    const isMod = requesterMember?.chatRole === 'moderator';

    if (!isAdmin && !isMod) {
      throw new ForbiddenException('Only the administrator or moderators can remove members');
    }
    // Moderators cannot remove the admin or other moderators
    const targetMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: memberId } },
    });
    if (!isAdmin && (memberId === chat.creator.id || targetMember?.chatRole === 'moderator')) {
      throw new ForbiddenException('Moderators cannot remove the administrator or other moderators');
    }

    await this.prisma.chatMember.delete({ where: { chatId_userId: { chatId, userId: memberId } } });
    return this.findOne(chatId, userId);
  }

  async grantChatRole(chatId: string, granterId: string, targetId: string, chatRole: string) {
    const chat = await this.findOne(chatId, granterId);
    if (chat.creator.id !== granterId) {
      throw new ForbiddenException('Only the group administrator can grant roles');
    }
    if (targetId === granterId) throw new ForbiddenException('Cannot change your own role');
    if (targetId === chat.creator.id) throw new ForbiddenException('Cannot change the administrator role');

    await this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId: targetId } },
      data: { chatRole },
    });
    return this.findOne(chatId, granterId);
  }

  // ── Kick Requests ──────────────────────────────────────────────────
  async createKickRequest(chatId: string, requesterId: string, targetId: string) {
    const chat = await this.findOne(chatId, requesterId);

    const requesterMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: requesterId } },
    });
    if (requesterMember?.chatRole !== 'moderator') {
      throw new ForbiddenException('Only moderators can create kick requests');
    }
    if (targetId === chat.creator.id) {
      throw new ForbiddenException('Cannot kick the group administrator');
    }
    const targetMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: targetId } },
    });
    if (targetMember?.chatRole === 'moderator') {
      throw new ForbiddenException('Cannot kick another moderator');
    }

    return this.prisma.kickRequest.create({
      data: { chatId, requesterId, targetId },
      include: {
        target:    { select: USER_SELECT },
        requester: { select: USER_SELECT },
      },
    });
  }

  async getKickRequests(chatId: string, userId: string) {
    const chat = await this.findOne(chatId, userId);
    if (chat.creator.id !== userId) {
      throw new ForbiddenException('Only the group administrator can view kick requests');
    }
    return this.prisma.kickRequest.findMany({
      where: { chatId },
      include: {
        target:    { select: USER_SELECT },
        requester: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveKickRequest(chatId: string, requestId: string, userId: string, approve: boolean) {
    const chat = await this.findOne(chatId, userId);
    if (chat.creator.id !== userId) {
      throw new ForbiddenException('Only the group administrator can resolve kick requests');
    }

    const request = await this.prisma.kickRequest.findUnique({ where: { id: requestId } });
    if (!request || request.chatId !== chatId) throw new NotFoundException('Kick request not found');

    if (approve) {
      await this.prisma.chatMember.delete({
        where: { chatId_userId: { chatId, userId: request.targetId } },
      });
    }
    await this.prisma.kickRequest.delete({ where: { id: requestId } });

    return this.findOne(chatId, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const chat = await this.findOne(id, userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user.role !== 'admin' && chat.creator.id !== userId) {
      throw new ForbiddenException('Only the administrator or a global admin can delete this chat');
    }
    await this.prisma.chat.delete({ where: { id } });
  }
}