'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store';
import { usersApi, chatsApi } from '../../lib/api';
import Sidebar from '../../components/Sidebar';

export default function NewChat() {
  const router = useRouter();
  const { user, setUser, friends } = useStore();
  const [chatType, setChatType] = useState<'private' | 'group'>('private');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      loadUser();
    } else { loadFriends(); }
  }, [user]);

  const loadUser = async () => {
    try { const r = await usersApi.getProfile(); setUser(r.data); }
    catch { router.push('/login'); }
  };

  const loadFriends = async () => {
    try { const r = await usersApi.getFriends(); useStore.getState().setFriends(r.data); }
    catch (e) { console.error(e); }
  };

  const handleToggleUser = (id: string) => {
    if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter((u) => u !== id));
    else if (chatType === 'private') setSelectedUsers([id]);
    else setSelectedUsers([...selectedUsers, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (selectedUsers.length === 0) { setError('Selecione pelo menos um usuário'); return; }
    if (chatType === 'group' && !groupName.trim()) { setError('Digite um nome para o grupo'); return; }
    setLoading(true);
    try {
      const r = await chatsApi.create({ type: chatType, name: chatType === 'group' ? groupName : undefined, description: chatType === 'group' ? groupDescription : undefined, memberIds: selectedUsers });
      router.push(`/chat/${r.data.id}`);
    } catch (err: any) { setError(err.response?.data?.message || 'Erro ao criar conversa'); }
    finally { setLoading(false); }
  };

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

  return (
    <div className="h-screen flex bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-xl mx-auto animate-fadeIn">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Nova Conversa</h1>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="card p-5">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Tipo de conversa</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { type: 'private' as const, label: 'Privada', sub: 'Com 1 pessoa',
                    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { type: 'group' as const, label: 'Grupo', sub: 'Com várias pessoas',
                    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                ] as const).map((opt) => {
                  const active = chatType === opt.type;
                  return (
                    <button key={opt.type} type="button" onClick={() => { setChatType(opt.type); setSelectedUsers([]); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        active ? 'border-red-700 dark:border-red-700' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                      style={active ? { borderColor: '#C41230', background: 'rgb(196 18 48 / 0.07)' } : {}}>
                      <svg className={`w-5 h-5 mb-2 ${active ? '' : 'text-zinc-400'}`}
                        style={active ? { color: '#C41230' } : {}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                      </svg>
                      <p className={`text-sm font-semibold ${active ? '' : 'text-zinc-700 dark:text-zinc-300'}`}
                        style={active ? { color: '#9F1239' } : {}}>{opt.label}</p>
                      <p className={`text-xs mt-0.5 ${active ? 'text-red-400' : 'text-zinc-400'}`}>{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {chatType === 'group' && (
              <div className="card p-5 space-y-4">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Detalhes do Grupo</p>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Nome do grupo *</label>
                  <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="input-base" placeholder="Digite o nome do grupo" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Descrição <span className="text-zinc-400 font-normal">(opcional)</span></label>
                  <textarea value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} className="input-base resize-none" rows={2} placeholder="Descreva o propósito do grupo" />
                </div>
              </div>
            )}

            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Selecionar {chatType === 'private' ? 'amigo' : 'membros'}
                </p>
              </div>
              {friends.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-zinc-400">Você ainda não tem amigos.</p>
                  <button type="button" onClick={() => router.push('/friends')} className="text-xs font-semibold mt-1 hover:underline" style={{ color: '#C41230' }}>
                    Adicionar amigos →
                  </button>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {friends.map((friend) => {
                    const selected = selectedUsers.includes(friend.id);
                    return (
                      <label key={friend.id}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${selected ? '' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'}`}
                        style={selected ? { background: 'rgb(196 18 48 / 0.06)' } : {}}>
                        <input type="checkbox" checked={selected} onChange={() => handleToggleUser(friend.id)} className="sr-only" />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-red-700' : 'border-zinc-300 dark:border-zinc-600'}`}
                          style={selected ? { borderColor: '#C41230', background: '#C41230' } : {}}>
                          {selected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold"
                              style={{ background: selected ? '#C41230' : '#52525B' }}>
                              {friend.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selected ? '' : 'text-zinc-800 dark:text-zinc-200'}`}
                            style={selected ? { color: '#9F1239' } : {}}>
                            {friend.username}
                          </p>
                          {friend.bio && <p className="text-xs text-zinc-400 truncate">{friend.bio}</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading || selectedUsers.length === 0} className="btn-primary flex-1">
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>Criando...</>
                ) : 'Criar Conversa'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}