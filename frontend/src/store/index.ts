import { create } from 'zustand';
import type { User, Chat, Message } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  friends: User[];
  onlineUsers: Set<string>;
  typingUsers: Map<string, Set<string>>;
  theme: 'light' | 'dark';

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => void;
  setFriends: (friends: User[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  addTypingUser: (chatId: string, userId: string) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  toggleTheme: () => void;
  logout: () => void;
}

function applyTheme(theme: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }
}

const savedTheme =
  typeof window !== 'undefined'
    ? (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
    : 'light';

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
  chats: [],
  currentChat: null,
  messages: [],
  friends: [],
  onlineUsers: new Set(),
  typingUsers: new Map(),
  theme: savedTheme,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },

  setChats: (chats) => set({ chats }),
  setCurrentChat: (chat) => set({ currentChat: chat }),
  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    }),

  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted: true } : msg
      ),
    })),

  setFriends: (friends) => set({ friends }),

  setUserOnline: (userId) =>
    set((state) => {
      const onlineUsers = new Set(state.onlineUsers);
      onlineUsers.add(userId);
      return { onlineUsers };
    }),

  setUserOffline: (userId) =>
    set((state) => {
      const onlineUsers = new Set(state.onlineUsers);
      onlineUsers.delete(userId);
      return { onlineUsers };
    }),

  addTypingUser: (chatId, userId) =>
    set((state) => {
      const typingUsers = new Map(state.typingUsers);
      if (!typingUsers.has(chatId)) typingUsers.set(chatId, new Set());
      typingUsers.get(chatId)!.add(userId);
      return { typingUsers };
    }),

  removeTypingUser: (chatId, userId) =>
    set((state) => {
      const typingUsers = new Map(state.typingUsers);
      if (typingUsers.has(chatId)) typingUsers.get(chatId)!.delete(userId);
      return { typingUsers };
    }),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return { theme: next };
    }),

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null, token: null, chats: [], currentChat: null,
      messages: [], friends: [], onlineUsers: new Set(), typingUsers: new Map(),
    });
  },
}));