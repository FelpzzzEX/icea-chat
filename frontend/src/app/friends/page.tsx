'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store';
import { usersApi, chatsApi } from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import type { User } from '../../types';

export default function Friends() {
  const router = useRouter();
  const { user, setUser, friends, setFriends } = useStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'friends' | 'all'>('friends');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      loadUser();
    } else { loadData(); }
  }, [user]);

  const loadUser = async () => {
    try { const r = await usersApi.getProfile(); setUser(r.data); }
    catch { router.push('/login'); }
  };

  const loadData = async () => {
    try {
      const [fr, ur] = await Promise.all([usersApi.getFriends(), usersApi.getAllUsers()]);
      setFriends(fr.data);
      setAllUsers(ur.data.filter((u) => u.id !== user?.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const notify = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAddFriend = async (id: string) => {
    try { await usersApi.addFriend(id); notify('ok', 'Amigo adicionado!'); loadData(); }
    catch (e: any) { notify('err', e.response?.data?.message || 'Erro'); }
  };

  const handleRemoveFriend = async (id: string) => {
    if (!confirm('Remover este amigo?')) return;
    try { await usersApi.removeFriend(id); notify('ok', 'Amigo removido.'); loadData(); }
    catch { notify('err', 'Erro ao remover amigo'); }
  };

  const handleStartChat = async (id: string) => {
    try { const r = await chatsApi.create({ type: 'private', memberIds: [id] }); router.push(`/chat/${r.data.id}`); }
    catch { notify('err', 'Erro ao criar conversa'); }
  };

  const isFriend = (id: string) => friends.some((f) => f.id === id);

  if (!user) {
    return (
      <div className="h-screen flex bg-zinc-100 dark:bg-zinc-950">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const UserRow = ({ u, isFriendRow }: { u: User; isFriendRow: boolean }) => (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden">
          {u.avatar ? (
            <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: '#52525B' }}>
              {u.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{u.username}</p>
          {u.bio && <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs">{u.bio}</p>}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {isFriendRow ? (
          <>
            <button onClick={() => handleStartChat(u.id)} className="btn-primary text-xs px-3 py-1.5">Conversar</button>
            <button onClick={() => handleRemoveFriend(u.id)} className="btn-danger text-xs px-3 py-1.5">Remover</button>
          </>
        ) : isFriend(u.id) ? (
          <button onClick={() => handleRemoveFriend(u.id)} className="btn-danger text-xs px-3 py-1.5">Remover</button>
        ) : (
          <button onClick={() => handleAddFriend(u.id)} className="btn-primary text-xs px-3 py-1.5">Adicionar</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Amigos</h1>

          {message.text && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium border ${
              message.type === 'ok'
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-5 gap-1">
            {(['friends', 'all'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  tab === t ? 'border-red-700 text-red-700' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
                style={tab === t ? { borderColor: '#C41230', color: '#C41230' } : {}}>
                {t === 'friends' ? `Meus Amigos (${friends.length})` : 'Todos os Usuários'}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
              </div>
            ) : tab === 'friends' ? (
              friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nenhum amigo ainda</p>
                  <button onClick={() => setTab('all')} className="text-xs font-semibold mt-1.5 hover:underline" style={{ color: '#C41230' }}>
                    Ver todos os usuários →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {friends.map((f) => <UserRow key={f.id} u={f} isFriendRow={true} />)}
                </div>
              )
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {allUsers.map((u) => <UserRow key={u.id} u={u} isFriendRow={false} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}