'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store';
import { usersApi } from '../../lib/api';
import { socketClient } from '../../lib/socket';
import Sidebar from '../../components/Sidebar';

export default function Dashboard() {
  const router = useRouter();
  const { user, setUser } = useStore();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) { router.push('/login'); return; }
    if (!user) loadUser();
    if (!socketClient['socket']?.connected) socketClient.connect(storedToken);
  }, []);

  const loadUser = async () => {
    try { const r = await usersApi.getProfile(); setUser(r.data); }
    catch { router.push('/login'); }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: '#C41230' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Olá, {user.username}!</h2>
          <p className="text-zinc-400 text-sm max-w-xs">Selecione uma conversa na barra lateral ou inicie uma nova.</p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => router.push('/new-chat')} className="btn-primary">Nova conversa</button>
            <button onClick={() => router.push('/friends')} className="btn-secondary">Ver amigos</button>
          </div>
        </div>
      </div>
    </div>
  );
}