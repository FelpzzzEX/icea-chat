import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatsService } from '../chats/chats.service';

const SENDER_SELECT = {
  id: true, username: true, email: true, bio: true,
  avatar: true, role: true, isActive: true, createdAt: true, updatedAt: true,
};

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private chatsService: ChatsService,
  ) {}

  async create(dto: CreateMessageDto, senderId: string) {
    // Valida que o remetente ainda está ativo
    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    if (!sender?.isActive) throw new ForbiddenException('Conta inativa');

    const chat = await this.chatsService.findOne(dto.chatId, senderId);

    // Chats privados com usuário deletado = somente leitura
    if (chat.type === 'private') {
      const other = chat.members.find((m: any) => m.id !== senderId);
      if (other && !other.isActive) {
        throw new ForbiddenException('Este usuário deletou a conta. O chat é somente leitura.');
      }
    }

    return this.prisma.message.create({
      data: { content: dto.content, senderId, chatId: dto.chatId },
      include: {
        sender: { select: SENDER_SELECT },
        chat: { select: { id: true, type: true, name: true } },
      },
    });
  }

  async findByChatId(chatId: string, userId: string) {
    await this.chatsService.findOne(chatId, userId);
    return this.prisma.message.findMany({
      where: { chatId, isDeleted: false },
      include: { sender: { select: SENDER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, chatId: true },
    });
    if (!message) throw new NotFoundException('Message not found');

    const isOwn = message.senderId === userId;

    // Verifica cargo global
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isGlobalMod = user?.role === 'moderator' || user?.role === 'admin';

    // Verifica cargo no grupo
    const chat = await this.prisma.chat.findUnique({ where: { id: message.chatId } });
    const isChatAdmin = chat?.creatorId === userId;
    const chatMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: message.chatId, userId } },
    });
    const isChatMod = chatMember?.chatRole === 'moderator';

    if (!isOwn && !isGlobalMod && !isChatAdmin && !isChatMod) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
  }
}