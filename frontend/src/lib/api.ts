import axios from 'axios';
import type {
  User, Chat, Message, LoginDto, RegisterDto,
  LoginResponse, CreateChatDto, UpdateUserDto, UpdateChatDto, KickRequest,
} from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (data: RegisterDto) => api.post<LoginResponse>('/auth/register', data),
  login: (data: LoginDto) => api.post<LoginResponse>('/auth/login', data),
};

export const usersApi = {
  getProfile: () => api.get<User>('/users/me'),
  getAllUsers: () => api.get<User[]>('/users'),
  getUser: (id: string) => api.get<User>(`/users/${id}`),
  updateProfile: (data: UpdateUserDto) => api.put<User>('/users/me', data),
  deleteAccount: () => api.delete('/users/me'),
  addFriend: (friendId: string) => api.post<User>(`/users/friends/${friendId}`),
  removeFriend: (friendId: string) => api.delete(`/users/friends/${friendId}`),
  getFriends: () => api.get<User[]>('/users/me/friends'),
  grantRole: (userId: string, role: string) =>
    api.patch<User>(`/users/${userId}/role`, { role }),
};

export const chatsApi = {
  create: (data: CreateChatDto) => api.post<Chat>('/chats', data),
  getAll: () => api.get<Chat[]>('/chats'),
  getOne: (id: string) => api.get<Chat>(`/chats/${id}`),
  update: (id: string, data: UpdateChatDto) => api.patch<Chat>(`/chats/${id}`, data),
  addMember: (chatId: string, memberId: string) =>
    api.post<Chat>(`/chats/${chatId}/members/${memberId}`),
  removeMember: (chatId: string, memberId: string) =>
    api.delete<Chat>(`/chats/${chatId}/members/${memberId}`),
  grantChatRole: (chatId: string, memberId: string, chatRole: string) =>
    api.patch<Chat>(`/chats/${chatId}/members/${memberId}/role`, { chatRole }),
  getKickRequests: (chatId: string) =>
    api.get<KickRequest[]>(`/chats/${chatId}/kick-requests`),
  createKickRequest: (chatId: string, targetId: string) =>
    api.post<KickRequest>(`/chats/${chatId}/kick-requests`, { targetId }),
  approveKickRequest: (chatId: string, requestId: string) =>
    api.post<Chat>(`/chats/${chatId}/kick-requests/${requestId}/approve`),
  rejectKickRequest: (chatId: string, requestId: string) =>
    api.delete(`/chats/${chatId}/kick-requests/${requestId}`),
  delete: (id: string) => api.delete(`/chats/${id}`),
};

export const messagesApi = {
  create: (content: string, chatId: string) =>
    api.post<Message>('/messages', { content, chatId }),
  getByChatId: (chatId: string) => api.get<Message[]>(`/messages/chat/${chatId}`),
  delete: (id: string) => api.delete(`/messages/${id}`),
};

export default api;