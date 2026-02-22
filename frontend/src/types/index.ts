export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  friends?: User[];
  // Cargo dentro de um grupo específico (vem junto com o membro no chat)
  chatRole?: 'member' | 'moderator';
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  creator: User;
  members: User[];
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface KickRequest {
  id: string;
  chatId: string;
  target: User;
  requester: User;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  chat: Chat;
  isDeleted: boolean;
  createdAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  usernameOrEmail: string;
  password: string;
}

export interface CreateChatDto {
  type: 'private' | 'group';
  name?: string;
  description?: string;
  memberIds: string[];
}

export interface UpdateUserDto {
  username?: string;
  bio?: string;
  avatar?: string;
  password?: string;
}

export interface UpdateChatDto {
  name?: string;
  description?: string;
  avatar?: string;
}