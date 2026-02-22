'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../../lib/api';
import { useStore } from '../../store';
import { socketClient } from '../../lib/socket';

export default function Register() {
  const router = useRouter();
  const { setUser, setToken } = useStore();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('As senhas não coincidem'); return; }
    if (formData.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    setLoading(true);
    try {
      const response = await authApi.register({ username: formData.username, email: formData.email, password: formData.password });
      setToken(response.data.access_token);
      setUser(response.data.user);
      socketClient.connect(response.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#18181B' }}>
        
        {/* Top Logo/Name */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#C41230' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">ICEA Chat</span>
        </div>

        {/* Centralized Logo PNG */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm p-8 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
            <img 
              src="/icea-logo-2022-branca.png" // Certifique-se de salvar a imagem na pasta /public com este nome
              alt="ICEA Logo" 
              className="w-full h-auto object-contain brightness-110 grayscale invert opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="z-10">
          <blockquote className="text-zinc-300 text-lg font-medium leading-relaxed mb-6">
            "Comunicação rápida, segura e em tempo real para a comunidade do ICEA."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: '#C41230' }}>U</div>
            <div>
              <p className="text-white text-sm font-semibold">ICEA - UFOP</p>
              <p className="text-zinc-500 text-xs">Instituto das Ciências Exatas e Aplicadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fadeIn">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#C41230' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="font-semibold text-sm">ICEA Chat</span>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Criar conta</h1>
          <p className="text-zinc-500 text-sm mb-8">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#C41230' }}>Fazer login</Link>
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Usuário', key: 'username', type: 'text', placeholder: 'Seu nome de usuário' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'seu@email.com' },
              { label: 'Senha', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Confirmar Senha', key: 'confirmPassword', type: 'password', placeholder: '••••••••' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={(formData as any)[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="input-base"
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando conta...
                </>
              ) : 'Cadastrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
