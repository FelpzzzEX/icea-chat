'use client';

import { useStore } from '../store';
import { chatsApi } from '../lib/api';
import { socketClient } from '../lib/socket';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Chat } from '../types';

export default function Sidebar() {
  const router = useRouter();
  const { user, chats, setChats, setCurrentChat, currentChat, logout } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadChats(); }, []);

  const loadChats = async () => {
    try { const r = await chatsApi.getAll(); setChats(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat);
    socketClient.joinChat(chat.id);
    router.push(`/chat/${chat.id}`);
  };

  const handleLogout = () => {
    socketClient.disconnect();
    logout();
    router.push('/login');
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') return chat.name || 'Grupo sem nome';
    return chat.members.find((m) => m.id !== user?.id)?.username || 'Usuário';
  };
  const getChatInitial = (chat: Chat) => getChatName(chat)[0]?.toUpperCase() ?? '?';

  return (
    <div className="w-72 flex flex-col h-full" style={{
      background: 'var(--c-sidebar)',
      borderRight: '1px solid var(--c-border)',
    }}>
      {/* User header */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
        className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: '#C41230' }}>
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-txt-1)' }}>{user?.username}</p>
            <p className="text-xs truncate" style={{ color: 'var(--c-txt-3)' }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost p-2" style={{ color: 'var(--c-txt-3)' }} title="Sair">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--c-border)' }}>
        <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--c-txt-3)' }}>CONVERSAS</span>
        <div className="flex items-center gap-1">
          <button onClick={() => router.push('/friends')} className="btn-ghost p-1.5" title="Amigos">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          <button onClick={() => router.push('/new-chat')} title="Nova conversa"
            className="w-7 h-7 rounded-md flex items-center justify-center text-white transition-opacity hover:opacity-80"
            style={{ background: '#C41230' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--c-border)', borderTopColor: 'var(--c-txt-3)' }} />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'var(--c-active)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--c-txt-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--c-txt-3)' }}>Nenhuma conversa</p>
            <button onClick={() => router.push('/new-chat')}
              className="mt-1.5 text-xs font-semibold hover:underline" style={{ color: '#C41230' }}>
              Criar nova →
            </button>
          </div>
        ) : chats.map((chat) => {
          const isActive = currentChat?.id === chat.id;
          const name = getChatName(chat);
          const otherMember = chat.type === 'private' ? chat.members.find((m) => m.id !== user?.id) : null;
          const avatarSrc = chat.type === 'group' ? chat.avatar : otherMember?.avatar;

          return (
            <button key={chat.id} onClick={() => selectChat(chat)}
              className="w-full px-3 py-2.5 flex items-center gap-3 text-left transition-all mx-1"
              style={{
                width: 'calc(100% - 8px)',
                borderRadius: 8,
                background: isActive ? 'var(--c-active)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--c-hover)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ background: chat.type === 'group' ? '#52525B' : '#C41230' }}>
                    {getChatInitial(chat)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--c-txt-1)' }}>{name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-txt-3)' }}>
                  {chat.type === 'group' ? `${chat.members.length} membros` : 'Conversa privada'}
                </p>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#C41230' }} />}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <button onClick={() => router.push('/profile')}
          className="btn-ghost w-full text-sm justify-start gap-2.5"
          style={{ color: 'var(--c-txt-2)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Meu Perfil
        </button>
      </div>
    </div>
  );
}