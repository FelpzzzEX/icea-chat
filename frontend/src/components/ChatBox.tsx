'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store';
import { socketClient } from '../lib/socket';
import { messagesApi } from '../lib/api';
import GroupMembersPanel from './GroupMembersPanel';
import type { Message, Chat } from '../types';

const EMOJI_GROUPS = [
  { label: '😀', emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥺','🤠','🤡','🤫','🤭','🧐','🤓'] },
  { label: '👍', emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🙏','✍','💅','🤳','💪','🦵','🦶','👂','🦻','👃','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷'] },
  { label: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','🔥','💫','⭐','🌟','✨','⚡','🌈','☀️','🌤','⛅','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄','💨','🌪','🌊','💧','💦'] },
  { label: '🐶', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀','🐡','🐟','🐠','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿','🦔'] },
  { label: '🍕', emojis: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🧄','🧅','🥔','🌽','🥕','🥜','🌰','🍞','🥐','🥖','🥨','🥯','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🌮','🌯','🥙','🍿','🥫','🍱','🍙','🍚','🍛','🍜','🍝','🍣','🍤','🍡','🥟','🥡','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🍫','🍬','🍭','🍮','🍯','🥛','☕','🍵','🧃','🥤','🧋','🍺','🍻','🥂','🍷','🥃','🍸','🍹'] },
  { label: '⚽', emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🏒','🏑','🏏','🥅','⛳','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🎿','🏋','🤼','🤸','⛹','🤺','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩'] },
];

function resizeImageToBase64(file: File, maxPx = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) { if (width > maxPx) { height = (height * maxPx) / width; width = maxPx; } }
        else { if (height > maxPx) { width = (width * maxPx) / height; height = maxPx; } }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const isImageMessage = (content: string) => content.startsWith('data:image/');

export default function ChatBox({ chatId }: { chatId: string }) {
  const router = useRouter();
  const { user, messages, setMessages, addMessage, deleteMessage, currentChat, setCurrentChat, typingUsers } = useStore();

  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const [sendingImage, setSendingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isGroup = currentChat?.type === 'group';
  const isMod = user?.role === 'moderator' || user?.role === 'admin';
  const isCreator = currentChat?.creator?.id === user?.id;
  const canModerate = isMod || isCreator;

  useEffect(() => {
    setMessages([]); setShowMembers(false); setShowEmojis(false); setLoading(true);
    socketClient.off('message:new'); socketClient.off('message:deleted');
    const handleNewMessage = (message: Message) => { if (message.chat?.id === chatId) addMessage(message); };
    const handleDeletedMessage = ({ messageId }: { messageId: string }) => deleteMessage(messageId);
    socketClient.on('message:new', handleNewMessage);
    socketClient.on('message:deleted', handleDeletedMessage);
    loadMessages();
    return () => { socketClient.off('message:new', handleNewMessage); socketClient.off('message:deleted', handleDeletedMessage); };
  }, [chatId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadMessages = async () => {
    try { const r = await messagesApi.getByChatId(chatId); setMessages(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    socketClient.sendMessage(newMessage, chatId);
    socketClient.stopTyping(chatId);
    setNewMessage(''); setShowEmojis(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketClient.startTyping(chatId);
    typingTimeoutRef.current = setTimeout(() => socketClient.stopTyping(chatId), 2000);
  };

  const handleEmojiClick = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? newMessage.length;
      const end = input.selectionEnd ?? newMessage.length;
      const next = newMessage.slice(0, start) + emoji + newMessage.slice(end);
      setNewMessage(next);
      setTimeout(() => input.setSelectionRange(start + emoji.length, start + emoji.length), 0);
      input.focus();
    } else { setNewMessage((p) => p + emoji); }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { alert('A imagem deve ter no máximo 10MB.'); return; }
    setSendingImage(true);
    try { const b64 = await resizeImageToBase64(file); socketClient.sendMessage(b64, chatId); }
    catch { alert('Erro ao processar imagem.'); }
    finally { setSendingImage(false); if (imageInputRef.current) imageInputRef.current.value = ''; }
  };

  const handleDeleteMessage = (messageId: string) => socketClient.deleteMessage(messageId, chatId);
  const handleChatUpdated = (updatedChat: Chat) => setCurrentChat(updatedChat);
  const handleGroupDeleted = () => { setCurrentChat(null as any); router.push('/dashboard'); };

  const formatTime = (date: string) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const typingUsersInChat = typingUsers.get(chatId);
  const isTyping = typingUsersInChat && typingUsersInChat.size > 0;

  const chatName = isGroup ? currentChat?.name : currentChat?.members.find((m) => m.id !== user?.id)?.username;
  const otherMember = !isGroup ? currentChat?.members.find((m) => m.id !== user?.id) : null;
  const headerAvatarSrc = isGroup ? currentChat?.avatar : otherMember?.avatar;
  const isReadOnly = !isGroup && otherMember != null && !otherMember.isActive;

  let lastDate = '';

  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: 'var(--c-page)' }}>
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5"
          style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden">
            {headerAvatarSrc ? (
              <img src={headerAvatarSrc} alt={chatName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: isGroup ? '#52525B' : '#C41230' }}>
                {chatName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--c-txt-1)' }}>{chatName}</h2>
            <p className="text-xs" style={{ color: 'var(--c-txt-3)' }}>
              {isGroup ? `${currentChat?.members.length} membros${canModerate ? ' · Moderador' : ''}` : 'Conversa privada'}
            </p>
          </div>
          {isGroup && (
            <button onClick={() => setShowMembers((v) => !v)}
              className="btn-ghost px-3 py-2 text-sm gap-1.5"
              style={showMembers ? { background: 'var(--c-active)', color: 'var(--c-txt-1)' } : { color: 'var(--c-txt-2)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Membros
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1"
          style={{ background: 'var(--c-messages)' }}
          onClick={() => setShowEmojis(false)}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--c-border)', borderTopColor: 'var(--c-txt-2)' }} />
                <p className="text-xs" style={{ color: 'var(--c-txt-3)' }}>Carregando mensagens...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center animate-fadeIn">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--c-txt-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--c-txt-2)' }}>Nenhuma mensagem ainda</p>
                <p className="text-xs mt-1" style={{ color: 'var(--c-txt-3)' }}>Seja o primeiro a enviar!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwn = message.sender?.id === user?.id;
                const canDelete = !message.isDeleted && (isOwn || isMod || isCreator);
                const msgDate = formatDate(message.createdAt);
                const showDateSep = msgDate !== lastDate;
                lastDate = msgDate;
                const isImage = !message.isDeleted && isImageMessage(message.content);

                return (
                  <div key={message.id}>
                    {showDateSep && (
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
                        <span className="text-xs font-medium px-2" style={{ color: 'var(--c-txt-3)' }}>{msgDate}</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
                      </div>
                    )}
                    <div className={`flex items-end gap-2 mb-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <div className="w-7 h-7 rounded-md flex-shrink-0 overflow-hidden" title={message.sender?.username}>
                          {message.sender?.avatar ? (
                            <img src={message.sender.avatar} alt={message.sender.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{ background: '#52525B' }}>
                              {message.sender?.username?.[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`group relative max-w-xs md:max-w-sm lg:max-w-md flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        {!isOwn && isGroup && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-xs font-semibold" style={{ color: 'var(--c-txt-2)' }}>
                              {message.sender?.username}
                            </span>
                          </div>
                        )}

                        {message.isDeleted ? (
                          <div className="px-3.5 py-2.5 text-sm italic rounded-xl"
                            style={{ background: 'var(--c-active)', color: 'var(--c-txt-3)', border: '1px solid var(--c-border)' }}>
                            Mensagem deletada.
                          </div>
                        ) : isImage ? (
                          <div className="rounded-2xl overflow-hidden" style={{
                            border: '1px solid var(--c-border)',
                            borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px'
                          }}>
                            <img src={message.content} alt="imagem"
                              className="max-w-[260px] max-h-[320px] object-cover block cursor-pointer"
                              onClick={() => window.open(message.content, '_blank')} />
                            <div className="px-2.5 py-1 text-xs"
                              style={{
                                background: isOwn ? '#C41230' : 'var(--c-surface)',
                                color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--c-txt-3)',
                                textAlign: isOwn ? 'right' : 'left'
                              }}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        ) : (
                          <div className="px-3.5 py-2.5 text-sm leading-relaxed" style={isOwn ? {
                            background: '#C41230', color: '#fff',
                            borderRadius: '16px 4px 16px 16px'
                          } : {
                            background: 'var(--c-surface)', color: 'var(--c-txt-1)',
                            border: '1px solid var(--c-border)',
                            borderRadius: '4px 16px 16px 16px'
                          }}>
                            <p className="break-words">{message.content}</p>
                            <p className="text-xs mt-1" style={{
                              color: isOwn ? 'rgba(255,255,255,0.6)' : 'var(--c-txt-3)',
                              textAlign: isOwn ? 'right' : 'left'
                            }}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        )}

                        {canDelete && (
                          <button onClick={() => handleDeleteMessage(message.id)}
                            className={`absolute -top-2.5 ${isOwn ? 'left-0' : 'right-0'}
                              opacity-0 group-hover:opacity-100 transition-opacity
                              text-xs font-medium px-2 py-1 rounded-md shadow-sm whitespace-nowrap`}
                            style={{
                              background: 'var(--c-surface)',
                              border: '1px solid var(--c-border)',
                              color: '#C41230'
                            }}>
                            Deletar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Typing */}
        {isTyping && (
          <div className="px-5 py-2 flex items-center gap-2"
            style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}>
            <span className="flex gap-0.5 items-end h-4">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1 h-1 rounded-full animate-bounce"
                  style={{ background: 'var(--c-txt-3)', animationDelay: `${d}ms` }} />
              ))}
            </span>
            <span className="text-xs" style={{ color: 'var(--c-txt-3)' }}>Alguém está digitando...</span>
          </div>
        )}

        {/* Emoji picker */}
        {showEmojis && (
          <div style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex px-2 pt-1 gap-0.5" style={{ borderBottom: '1px solid var(--c-border)' }}>
              {EMOJI_GROUPS.map((g, i) => (
                <button key={i} onClick={() => setEmojiTab(i)}
                  className="px-2 py-1.5 text-base rounded-t transition-colors"
                  style={emojiTab === i ? { background: 'var(--c-active)' } : {}}>
                  {g.label}
                </button>
              ))}
            </div>
            <div className="p-2 grid grid-cols-10 gap-0.5 max-h-36 overflow-y-auto">
              {EMOJI_GROUPS[emojiTab].emojis.map((emoji) => (
                <button key={emoji} onClick={() => handleEmojiClick(emoji)}
                  className="text-xl p-1 rounded transition-colors leading-none"
                  style={{ transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input / Read-only banner */}
        {isReadOnly ? (
          <div className="px-5 py-4 flex items-center justify-center gap-3"
            style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--c-txt-3)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--c-txt-3)' }}>
              Este usuário deletou a conta. A conversa é somente leitura.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage}
            className="px-4 py-3.5 flex items-center gap-2"
            style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowEmojis((v) => !v); }}
              className="btn-ghost p-2 flex-shrink-0"
              style={showEmojis
                ? { background: 'var(--c-active)', color: 'var(--c-txt-1)' }
                : { color: 'var(--c-txt-3)' }}
              title="Emojis">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button type="button" onClick={() => imageInputRef.current?.click()} disabled={sendingImage}
              className="btn-ghost p-2 flex-shrink-0 disabled:opacity-40"
              style={{ color: 'var(--c-txt-3)' }} title="Enviar imagem">
              {sendingImage ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

            <input ref={inputRef} type="text" value={newMessage} onChange={handleTyping}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowEmojis(false); }}
              placeholder="Digite uma mensagem..." className="input-base flex-1" autoComplete="off" />

            <button type="submit" disabled={!newMessage.trim()}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition-opacity disabled:opacity-40 hover:opacity-80"
              style={{ background: '#C41230' }}>
              <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        )}
      </div>

      {isGroup && showMembers && currentChat && (
        <GroupMembersPanel
          chat={currentChat}
          onClose={() => setShowMembers(false)}
          onChatUpdated={handleChatUpdated}
          onGroupDeleted={handleGroupDeleted}
        />
      )}
    </div>
  );
}