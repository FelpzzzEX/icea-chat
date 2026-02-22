import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { ChatsModule } from '../chats/chats.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MessagesModule,
    ChatsModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'icea_chat_super_secret_jwt_key_2025',
    }),
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
