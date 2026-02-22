'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store';
import { usersApi, chatsApi } from '../lib/api';
import type { User, Chat, KickRequest } from '../types';

interface Props {
  chat: Chat;
  onClose: () => void;
  onChatUpdated: (chat: Chat) => void;
  onGroupDeleted?: () => void;
}

function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        let { width, height } = img;
        if (width > height) { if (width > MAX) { height = (height * MAX) / width; width = MAX; } }
        else { if (height > MAX) { width = (width * MAX) / height; height = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Labels de cargo ───────────────────────────────────────────────────
function getMemberLabel(member: User, creatorId: string) {
  if (member.id === creatorId) return { label: 'Administrador', style: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (member.chatRole === 'moderator') return { label: 'Moderador', style: 'bg-red-50 text-red-700 border-red-200' };
  return { label: 'Membro', style: 'bg-zinc-50 text-zinc-500 border-zinc-200' };
}

export default function GroupMembersPanel({ chat, onClose, onChatUpdated, onGroupDeleted }: Props) {
  const router = useRouter();
  const { user: currentUser, setCurrentChat } = useStore();

  const isAdmin = chat.creator?.id === currentUser?.id;
  const myMember = chat.members.find((m) => m.id === currentUser?.id);
  const isMod = myMember?.chatRole === 'moderator';
  const canManage = isAdmin || isMod;

  // ── Toast ─────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const notify = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Edit group ────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: chat.name ?? '', description: chat.description ?? '' });
  const [editAvatar, setEditAvatar] = useState(chat.avatar ?? '');
  const [editAvatarBase64, setEditAvatarBase64] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { notify('err', 'Imagem deve ter no máximo 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const b64 = await resizeImageToBase64(file);
      setEditAvatar(b64); setEditAvatarBase64(b64);
    } catch { notify('err', 'Erro ao processar imagem'); }
    finally { setUploadingAvatar(false); }
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) { notify('err', 'O grupo precisa ter um nome'); return; }
    setSavingEdit(true);
    try {
      const data: any = { name: editForm.name, description: editForm.description };
      if (editAvatarBase64) data.avatar = editAvatarBase64;
      else if (!editAvatar) data.avatar = '';
      const r = await chatsApi.update(chat.id, data);
      onChatUpdated(r.data); setCurrentChat(r.data);
      setEditAvatarBase64(''); setShowEdit(false);
      notify('ok', 'Grupo atualizado!');
    } catch (err: any) { notify('err', err.response?.data?.message || 'Erro ao salvar'); }
    finally { setSavingEdit(false); }
  };

  // ── Add member ────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (showAdd && allUsers.length === 0) {
      setLoadingUsers(true);
      usersApi.getAllUsers()
        .then((r) => setAllUsers(r.data))
        .catch(() => notify('err', 'Erro ao carregar usuários'))
        .finally(() => setLoadingUsers(false));
    }
  }, [showAdd]);

  const memberIds = new Set(chat.members.map((m) => m.id));
  const usersToAdd = allUsers
    .filter((u) => !memberIds.has(u.id))
    .filter((u) =>
      u.username.toLowerCase().includes(addSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(addSearch.toLowerCase())
    );

  const handleAddMember = async (u: User) => {
    setAddingId(u.id);
    try {
      const r = await chatsApi.addMember(chat.id, u.id);
      onChatUpdated(r.data); setCurrentChat(r.data);
      notify('ok', `${u.username} adicionado!`);
    } catch (err: any) { notify('err', err.response?.data?.message || 'Erro ao adicionar'); }
    finally { setAddingId(null); }
  };

  // ── Kick requests ─────────────────────────────────────────────────
  const [kickRequests, setKickRequests] = useState<KickRequest[]>([]);
  const [showKickRequests, setShowKickRequests] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) loadKickRequests();
  }, [chat.id, isAdmin]);

  const loadKickRequests = async () => {
    try { const r = await chatsApi.getKickRequests(chat.id); setKickRequests(r.data); }
    catch { /* silently ignore */ }
  };

  const handleApproveKick = async (requestId: string, targetName: string) => {
    setResolvingId(requestId);
    try {
      const r = await chatsApi.approveKickRequest(chat.id, requestId);
      onChatUpdated(r.data); setCurrentChat(r.data);
      setKickRequests((prev) => prev.filter((k) => k.id !== requestId));
      notify('ok', `${targetName} foi expulso.`);
    } catch (err: any) { notify('err', err.response?.data?.message || 'Erro'); }
    finally { setResolvingId(null); }
  };

  const handleRejectKick = async (requestId: string) => {
    setResolvingId(requestId);
    try {
      await chatsApi.rejectKickRequest(chat.id, requestId);
      setKickRequests((prev) => prev.filter((k) => k.id !== requestId));
      notify('ok', 'Solicitação rejeitada.');
    } catch (err: any) { notify('err', err.response?.data?.message || 'Erro'); }
    finally { setResolvingId(null); }
  };

  // ── Member actions ────────────────────────────────────────────────
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  const handleGrantChatRole = async (member: User, chatRole: string) => {
    setRoleDropdown(null); setLoadingId(`role-${member.id}`);
    try {
      const r = await chatsApi.grantChatRole(chat.id, member.id, chatRole);
      onChatUpdated(r.data); setCurrentChat(r.data);
      notify('ok', `Cargo de ${member.username} atualizado.`);
    } catch (err: any) { notify('err', err.response?.data?.message || 'Erro'); }
    finally { setLoadingId(null); }
  };

  const handleKick = async (member: User) => {
    if (!confirm(`Expulsar ${member.username}?`)) return;
    setLoadingId(`kick-${member.id}`);
    try {
      const r = await chatsApi.removeMember(chat.id, member.id);
      onChatUpdated(r.data); setCurrentChat(r.data);
      notify('ok', `${member.username} foi expulso.`);
    } catch (err: any) { notify('err', err.response?.data?.message || 'Erro'); }
    finally { setLoadingId(null); }
  };

  const handleCreateKickRequest = async (member: User) => {
    if (!confirm(`Solicitar expulsão de ${member.username}?`)) return;
    setLoadingId(`kreq-${member.id}`);
    try {
      await chatsApi.createKickRequest(chat.id, member.id);
      notify('ok', `Solicitação enviada ao administrador.`);
    } catch (err: any) { notify('err', err.response?.data?.message || 'Erro'); }
    finally { setLoadingId(null); }
  };

  // ── Delete group ──────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    try {
      await chatsApi.delete(chat.id);
      onGroupDeleted?.();
      router.push('/dashboard');
    } catch (err: any) {
      notify('err', err.response?.data?.message || 'Erro ao apagar grupo');
      setDeletingGroup(false); setShowDeleteConfirm(false);
    }
  };

  const sortedMembers = [...chat.members].sort((a, b) => {
    const o: Record<string, number> = { [chat.creator?.id]: 0 };
    const ra = a.id === chat.creator?.id ? 0 : a.chatRole === 'moderator' ? 1 : 2;
    const rb = b.id === chat.creator?.id ? 0 : b.chatRole === 'moderator' ? 1 : 2;
    return ra - rb;
  });

  return (
    <div className="w-64 flex flex-col border-l border-zinc-100 bg-zinc-50" style={{ minWidth: 256 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-white">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">Membros</h3>
          <p className="text-xs text-zinc-400">{chat.members.length} {chat.members.length === 1 ? 'membro' : 'membros'}</p>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5 text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mx-3 mt-3 px-3 py-2 rounded-lg text-xs font-medium border ${
          toast.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">

        {/* ── Edit group info (admin only) ──────────────────────────── */}
        {isAdmin && (
          <div className="border-b border-zinc-100">
            <button
              onClick={() => setShowEdit((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-600 hover:bg-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar grupo
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform ${showEdit ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showEdit && (
              <div className="px-3 pb-4 bg-white border-t border-zinc-100 space-y-3">
                {/* Avatar */}
                <div className="flex items-center gap-3 pt-3">
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden border border-zinc-200">
                    {editAvatar ? (
                      <img src={editAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: '#52525B' }}>
                        {editForm.name?.[0]?.toUpperCase() ?? '#'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="btn-secondary text-xs px-2.5 py-1.5 gap-1 disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                      {editAvatar ? 'Trocar' : 'Adicionar'}
                    </button>
                    {editAvatar && (
                      <button type="button"
                        onClick={() => { setEditAvatar(''); setEditAvatarBase64(''); }}
                        className="btn-ghost text-xs px-2.5 py-1 text-red-500 hover:bg-red-50">
                        Remover
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*"
                    onChange={handleAvatarChange} className="hidden" />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Nome *</label>
                  <input type="text" value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-base text-xs py-2" placeholder="Nome do grupo" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Descrição</label>
                  <textarea value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="input-base text-xs py-2 resize-none" rows={2}
                    placeholder="Descrição do grupo" />
                </div>

                <button onClick={handleSaveEdit} disabled={savingEdit || uploadingAvatar}
                  className="btn-primary w-full text-xs py-2 disabled:opacity-50">
                  {savingEdit ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Salvando...
                    </>
                  ) : 'Salvar'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Kick requests (admin only) ────────────────────────────── */}
        {isAdmin && kickRequests.length > 0 && (
          <div className="border-b border-zinc-100">
            <button
              onClick={() => setShowKickRequests((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold hover:bg-white transition-colors"
              style={{ color: '#C41230' }}
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.193 2.5 1.732 2.5z" />
                </svg>
                Solicitações de expulsão
                <span className="w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
                  style={{ background: '#C41230', fontSize: 10 }}>
                  {kickRequests.length}
                </span>
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform ${showKickRequests ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showKickRequests && (
              <div className="px-3 pb-3 bg-white border-t border-zinc-100 space-y-2 pt-2">
                {kickRequests.map((req) => (
                  <div key={req.id} className="rounded-lg border border-zinc-200 p-2.5">
                    <p className="text-xs text-zinc-500 mb-1">
                      <span className="font-semibold text-zinc-700">{req.requester.username}</span>
                      {' '}solicitou expulsão de{' '}
                      <span className="font-semibold text-zinc-700">{req.target.username}</span>
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApproveKick(req.id, req.target.username)}
                        disabled={resolvingId === req.id}
                        className="btn-primary flex-1 text-xs py-1 disabled:opacity-50"
                        style={{ background: '#DC2626' }}
                      >
                        Expulsar
                      </button>
                      <button
                        onClick={() => handleRejectKick(req.id)}
                        disabled={resolvingId === req.id}
                        className="btn-secondary flex-1 text-xs py-1 disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Members list ─────────────────────────────────────────── */}
        <div className="py-2 px-2">
          {sortedMembers.map((member) => {
            const isMe = member.id === currentUser?.id;
            const memberInfo = getMemberLabel(member, chat.creator?.id);
            const isLoadingKick = loadingId === `kick-${member.id}`;
            const isLoadingRole = loadingId === `role-${member.id}`;
            const isLoadingKreq = loadingId === `kreq-${member.id}`;
            const isRoleOpen = roleDropdown === member.id;

            const canKickDirect = isAdmin && member.id !== currentUser?.id;
            const canKickRequest = isMod && member.id !== chat.creator?.id && member.chatRole !== 'moderator' && !isMe;
            const canChangeRole = isAdmin && member.id !== currentUser?.id;

            return (
              <div key={member.id}
                className={`rounded-lg px-2.5 py-2 mb-0.5 transition-colors ${isMe ? 'bg-white border border-zinc-200' : 'hover:bg-white'}`}>
                <div className="flex items-center gap-2.5">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-md flex-shrink-0 overflow-hidden">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{
                          background: member.id === chat.creator?.id ? '#B45309'
                            : member.chatRole === 'moderator' ? '#C41230'
                            : '#52525B'
                        }}>
                        {member.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 truncate">
                      {member.username}{isMe && <span className="text-zinc-400 font-normal"> (você)</span>}
                    </p>
                    <span className={`inline-block text-xs px-1.5 py-px rounded border font-medium ${memberInfo.style}`}
                      style={{ fontSize: 10 }}>
                      {memberInfo.label}
                    </span>
                  </div>

                  {/* Actions */}
                  {!isMe && (canKickDirect || canKickRequest || canChangeRole) && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      {/* Role dropdown (admin only) */}
                      {canChangeRole && (
                        <div className="relative">
                          <button
                            onClick={() => setRoleDropdown(isRoleOpen ? null : member.id)}
                            disabled={!!isLoadingRole}
                            className="btn-ghost p-1.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
                            title="Cargo"
                          >
                            {isLoadingRole ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            )}
                          </button>
                          {isRoleOpen && (
                            <div className="absolute right-0 top-8 z-50 w-36 card rounded-xl shadow-lg overflow-hidden py-1">
                              <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Cargo no grupo</p>
                              {(['member', 'moderator'] as const).map((r) => {
                                const labels = { member: 'Membro', moderator: 'Moderador' };
                                const current = member.chatRole ?? 'member';
                                return (
                                  <button key={r} onClick={() => handleGrantChatRole(member, r)}
                                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2 ${
                                      current === r ? 'font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                                    }`}
                                    style={current === r ? { color: '#C41230' } : {}}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${r === 'moderator' ? 'bg-red-500' : 'bg-zinc-400'}`} />
                                    {labels[r]}
                                    {current === r && <span className="ml-auto text-xs">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Direct kick (admin) */}
                      {canKickDirect && (
                        <button onClick={() => handleKick(member)} disabled={!!isLoadingKick}
                          className="btn-ghost p-1.5 text-zinc-400 hover:text-red-500 disabled:opacity-50"
                          title="Expulsar">
                          {isLoadingKick ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                            </svg>
                          )}
                        </button>
                      )}

                      {/* Kick request (moderator) */}
                      {canKickRequest && !canKickDirect && (
                        <button onClick={() => handleCreateKickRequest(member)} disabled={!!isLoadingKreq}
                          className="btn-ghost p-1.5 text-zinc-400 hover:text-amber-500 disabled:opacity-50"
                          title="Solicitar expulsão">
                          {isLoadingKreq ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.193 2.5 1.732 2.5z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {roleDropdown && <div className="fixed inset-0 z-40" onClick={() => setRoleDropdown(null)} />}

        {/* ── Add member ────────────────────────────────────────────── */}
        {canManage && (
          <div className="border-t border-zinc-100">
            <button onClick={() => setShowAdd((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-600 hover:bg-white transition-colors">
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Adicionar membro
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform ${showAdd ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdd && (
              <div className="px-3 pb-3 bg-white border-t border-zinc-100">
                <input type="text" value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Buscar usuário..." className="input-base mt-2 text-xs py-2" autoFocus />
                <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5">
                  {loadingUsers ? (
                    <div className="flex justify-center py-4">
                      <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
                    </div>
                  ) : usersToAdd.length === 0 ? (
                    <p className="text-xs text-center text-zinc-400 py-3">
                      {addSearch ? 'Nenhum resultado.' : 'Todos os usuários já são membros.'}
                    </p>
                  ) : (
                    usersToAdd.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-zinc-50">
                        <div className="w-7 h-7 rounded-md flex-shrink-0 overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{ background: '#52525B' }}>
                              {u.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-zinc-800 flex-1 truncate">{u.username}</p>
                        <button onClick={() => handleAddMember(u)} disabled={addingId === u.id}
                          className="btn-primary px-2.5 py-1 text-xs disabled:opacity-50">
                          {addingId === u.id ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : 'Add'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Delete group (admin only) ─────────────────────────────── */}
      {isAdmin && (
        <div className="p-3 border-t border-zinc-100">
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger w-full text-xs py-2 gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Apagar Grupo
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Apagar grupo?</p>
              <p className="text-xs text-red-500 mb-3">Todas as mensagens serão deletadas. Irreversível.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} disabled={deletingGroup}
                  className="btn-secondary flex-1 text-xs py-1.5 disabled:opacity-50">Cancelar</button>
                <button onClick={handleDeleteGroup} disabled={deletingGroup}
                  className="btn-primary flex-1 text-xs py-1.5 gap-1 disabled:opacity-50"
                  style={{ background: '#DC2626' }}>
                  {deletingGroup ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  {deletingGroup ? 'Apagando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}