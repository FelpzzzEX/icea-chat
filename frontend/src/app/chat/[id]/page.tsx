'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '../../../store';
import { usersApi, chatsApi } from '../../../lib/api';
import { socketClient } from '../../../lib/socket';
import Sidebar from '../../../components/Sidebar';
import ChatBox from '../../../components/ChatBox';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const { user, setUser, currentChat, setCurrentChat } = useStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    if (!user) loadUser();
    else loadChat();
    if (!socketClient['socket']?.connected) socketClient.connect(token);
  }, [chatId]);

  const loadUser = async () => {
    try { const r = await usersApi.getProfile(); setUser(r.data); loadChat(); }
    catch { router.push('/login'); }
  };

  const loadChat = async () => {
    try { const r = await chatsApi.getOne(chatId); setCurrentChat(r.data); socketClient.joinChat(chatId); }
    catch (e) { console.error(e); }
  };

  if (!user || !currentChat) {
    return (
      <div className="h-screen flex bg-zinc-100 dark:bg-zinc-950">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <ChatBox chatId={chatId} />
    </div>
  );
}