import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

// Campos que nunca devem ser expostos
const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  bio: true,
  avatar: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(userData: {
    username: string;
    email: string;
    password: string;
    bio?: string;
    avatar?: string;
  }) {
    return this.prisma.user.create({
      data: userData,
      select: USER_SELECT,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...USER_SELECT, password: true }, // senha só interna
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsernameOrEmail(username: string, email: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: USER_SELECT,
      orderBy: { username: 'asc' },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);

    if (dto.username && dto.username !== user.username) {
      const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
      if (existing) throw new ConflictException('Username already exists');
    }

    const data: any = {};
    if (dto.username) data.username = dto.username;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  // ── Bug fix: soft-delete liberando username/email para reutilização ──
  async delete(id: string): Promise<void> {
    const timestamp = Date.now();
    await this.prisma.$transaction([
      // Soft-delete do usuário, liberando username/email
      this.prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          username: `deleted_${timestamp}`,
          email: `deleted_${timestamp}@deleted.invalid`,
          password: '',
          bio: null,
          avatar: null,
        },
      }),
      // Remove de todos os grupos (chats do tipo group)
      this.prisma.chatMember.deleteMany({
        where: {
          userId: id,
          chat: { type: 'group' },
        },
      }),
      // Remove todas as amizades
      this.prisma.friendship.deleteMany({
        where: { OR: [{ userId: id }, { friendId: id }] },
      }),
    ]);
  }

  async addFriend(userId: string, friendId: string) {
  if (userId === friendId) throw new ConflictException('Cannot add yourself as friend');

  const alreadyFriend = await this.prisma.friendship.findUnique({
    where: { userId_friendId: { userId, friendId } },
  });
  if (alreadyFriend) throw new ConflictException('Already friends');

  // Cria os dois lados da amizade de uma vez (mútua)
  await this.prisma.$transaction([
    this.prisma.friendship.create({ data: { userId, friendId } }),
    this.prisma.friendship.upsert({
      where: { userId_friendId: { userId: friendId, friendId: userId } },
      create: { userId: friendId, friendId: userId },
      update: {},
    }),
  ]);

  return this.findById(userId);
}

  async removeFriend(userId: string, friendId: string) {
  await this.prisma.$transaction([
    this.prisma.friendship.deleteMany({ where: { userId, friendId } }),
    this.prisma.friendship.deleteMany({ where: { userId: friendId, friendId: userId } }),
  ]);
  return this.findById(userId);
}

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: { userId },
      include: { friend: { select: USER_SELECT } },
    });
    return friendships.map((f) => f.friend);
  }

  async grantRole(requesterId: string, targetId: string, role: string) {
    if (requesterId === targetId) throw new BadRequestException('You cannot change your own role');

    const requester = await this.findById(requesterId);
    const target = await this.findById(targetId);

    if (requester.role !== 'admin' && requester.role !== 'moderator') {
      throw new ForbiddenException('Only moderators and admins can grant roles');
    }
    if (requester.role === 'moderator' && role === 'admin') {
      throw new ForbiddenException('Moderators cannot grant admin role');
    }
    if (requester.role === 'moderator' && target.role === 'moderator') {
      throw new ForbiddenException('Moderators cannot change the role of another moderator');
    }
    if (target.role === 'admin' && requester.role !== 'admin') {
      throw new ForbiddenException('Only admins can change the role of another admin');
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: USER_SELECT,
    });
  }
}
