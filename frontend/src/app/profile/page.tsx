'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store';
import { usersApi } from '../../lib/api';
import Sidebar from '../../components/Sidebar';

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

export default function Profile() {
  const router = useRouter();
  const { user, setUser, logout, theme, toggleTheme } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ username: '', bio: '', password: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      loadUser();
    } else {
      setFormData({ username: user.username, bio: user.bio || '', password: '' });
      setAvatarPreview(user.avatar || '');
      setAvatarBase64('');
    }
  }, [user]);

  const loadUser = async () => {
    try { const r = await usersApi.getProfile(); setUser(r.data); }
    catch { router.push('/login'); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage({ type: 'err', text: 'Selecione uma imagem válida.' }); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage({ type: 'err', text: 'A imagem deve ter no máximo 5MB.' }); return; }
    setUploadingAvatar(true);
    try {
      const b64 = await resizeImageToBase64(file);
      setAvatarPreview(b64); setAvatarBase64(b64);
    } catch { setMessage({ type: 'err', text: 'Erro ao processar imagem.' }); }
    finally { setUploadingAvatar(false); }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(''); setAvatarBase64('__remove__');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      const data: any = { username: formData.username, bio: formData.bio };
      if (formData.password) data.password = formData.password;
      if (avatarBase64 === '__remove__') data.avatar = '';
      else if (avatarBase64) data.avatar = avatarBase64;
      const r = await usersApi.updateProfile(data);
      setUser(r.data); setAvatarBase64('');
      setMessage({ type: 'ok', text: 'Perfil atualizado com sucesso!' });
      setFormData({ ...formData, password: '' });
    } catch (err: any) {
      setMessage({ type: 'err', text: err.response?.data?.message || 'Erro ao atualizar perfil' });
    } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) return;
    try { await usersApi.deleteAccount(); logout(); router.push('/login'); }
    catch { setMessage({ type: 'err', text: 'Erro ao deletar conta' }); }
  };

  const ROLE_INFO: Record<string, { label: string; style: string }> = {
    admin:     { label: 'Administrador', style: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    moderator: { label: 'Moderador',     style: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
    user:      { label: 'Usuário',       style: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' },
  };
  const ri = ROLE_INFO[user?.role ?? 'user'] ?? ROLE_INFO.user;

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
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Meu Perfil</h1>

          {message.text && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 border ${
              message.type === 'ok'
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'ok' ? '✓' : '✕'} {message.text}
            </div>
          )}

          {/* Profile card */}
          <div className="card p-6 mb-4">
            {/* Avatar + info */}
            <div className="flex items-center gap-5 pb-5 mb-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl font-bold" style={{ background: '#C41230' }}>
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">{user.username}</p>
                <p className="text-xs text-zinc-400 mb-3">{user.email}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                    className="btn-secondary text-xs px-3 py-1.5 gap-1.5 disabled:opacity-50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {avatarPreview ? 'Trocar foto' : 'Enviar foto'}
                  </button>
                  {avatarPreview && (
                    <button type="button" onClick={handleRemoveAvatar} className="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                      Remover
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
                <p className="text-xs text-zinc-400 mt-2">JPG, PNG ou GIF · máx. 5MB</p>
              </div>

              <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${ri.style}`}>
                {ri.label}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nome de usuário</label>
                <input type="text" value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-base" minLength={3} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Bio</label>
                <textarea value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-base resize-none" rows={3} placeholder="Conte um pouco sobre você..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nova senha <span className="text-zinc-400 font-normal">(deixe em branco para manter)</span>
                </label>
                <input type="password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-base" placeholder="••••••••" minLength={6} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading || uploadingAvatar} className="btn-primary flex-1">
                  {loading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>Salvando...</>
                  ) : 'Salvar Alterações'}
                </button>
                <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>

          {/* Aparência */}
          <div className="card p-5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Aparência</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {theme === 'dark' ? 'Modo escuro ativado' : 'Modo claro ativado'}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={toggleTheme}
                className="relative flex items-center gap-2 group"
                aria-label="Alternar tema"
              >
                {/* Sun icon */}
                <svg className={`w-4 h-4 transition-colors ${theme === 'light' ? 'text-amber-500' : 'text-zinc-400'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>

                {/* Track */}
                <div className={`w-11 h-6 rounded-full border-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-zinc-600 bg-zinc-700'
                    : 'border-zinc-300 bg-zinc-200'
                }`}>
                  {/* Thumb */}
                  <div className={`w-4 h-4 mt-0.5 rounded-full shadow transition-all duration-200 ${
                    theme === 'dark'
                      ? 'translate-x-5 bg-zinc-300'
                      : 'translate-x-0.5 bg-white'
                  }`} />
                </div>

                {/* Moon icon */}
                <svg className={`w-4 h-4 transition-colors ${theme === 'dark' ? 'text-blue-400' : 'text-zinc-400'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Zona de perigo */}
          <div className="card p-5 border-red-100 dark:border-red-900">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.193 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Zona de Perigo</h3>
                <p className="text-sm text-zinc-400 mt-0.5">Ao deletar sua conta, todos os seus dados serão removidos permanentemente.</p>
              </div>
            </div>
            <button onClick={handleDeleteAccount} className="btn-danger text-sm">Deletar Conta</button>
          </div>
        </div>
      </div>
    </div>
  );
}