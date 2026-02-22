import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { ChatsService } from '../chats/chats.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private connectedUsers = new Map<string, string>();

  constructor(
    private messagesService: MessagesService,
    private chatsService: ChatsService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      this.connectedUsers.set(user.id, client.id);

      const chats = await this.chatsService.findAll(user.id);
      chats.forEach((chat) => {
        client.join(`chat:${chat.id}`);
      });

      this.server.emit('user:online', { userId: user.id });
      this.logger.log(`User ${user.username} connected`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.server.emit('user:offline', { userId });
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string; chatId: string },
  ) {
    try {
      const userId = client.data.userId;
      const message = await this.messagesService.create(
        {
          content: data.content,
          chatId: data.chatId,
        },
        userId,
      );

      this.server.to(`chat:${data.chatId}`).emit('message:new', message);
      
      return { success: true, message };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; chatId: string },
  ) {
    try {
      const userId = client.data.userId;
      await this.messagesService.delete(data.messageId, userId);

      this.server.to(`chat:${data.chatId}`).emit('message:deleted', {
        messageId: data.messageId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const userId = client.data.userId;
      await this.chatsService.findOne(data.chatId, userId);
      
      client.join(`chat:${data.chatId}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error joining chat:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    client.to(`chat:${data.chatId}`).emit('user:typing', {
      userId,
      chatId: data.chatId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    client.to(`chat:${data.chatId}`).emit('user:stopped-typing', {
      userId,
      chatId: data.chatId,
    });
  }
}
