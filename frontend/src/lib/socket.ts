import { io, Socket } from 'socket.io-client';
import type { Message } from '../types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
    });

    this.socket.on('message:new', (message: Message) => {
      this.emit('message:new', message);
    });

    this.socket.on('message:deleted', (data: { messageId: string }) => {
      this.emit('message:deleted', data);
    });

    this.socket.on('user:online', (data: { userId: string }) => {
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data: { userId: string }) => {
      this.emit('user:offline', data);
    });

    this.socket.on('user:typing', (data: { userId: string; chatId: string }) => {
      this.emit('user:typing', data);
    });

    this.socket.on('user:stopped-typing', (data: { userId: string; chatId: string }) => {
      this.emit('user:stopped-typing', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  sendMessage(content: string, chatId: string) {
    if (this.socket) {
      this.socket.emit('message:send', { content, chatId });
    }
  }

  deleteMessage(messageId: string, chatId: string) {
    if (this.socket) {
      this.socket.emit('message:delete', { messageId, chatId });
    }
  }

  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('chat:join', { chatId });
    }
  }

  startTyping(chatId: string) {
    if (this.socket) {
      this.socket.emit('typing:start', { chatId });
    }
  }

  stopTyping(chatId: string) {
    if (this.socket) {
      this.socket.emit('typing:stop', { chatId });
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        this.listeners.set(
          event,
          callbacks.filter((cb) => cb !== callback)
        );
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

export const socketClient = new SocketClient();
