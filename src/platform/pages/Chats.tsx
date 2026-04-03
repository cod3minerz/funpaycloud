import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bot, FileText, Search, Send, Sparkles, UserRound } from 'lucide-react';
import { chats as initialChats, ChatMessage } from '@/platform/data/demoData';

const CANNED = [
  'Добрый день! Ваш товар уже готов к выдаче.',
  'Спасибо за покупку! Если будут вопросы — пишите.',
  'Извините за неудобства, уже решаем вашу проблему.',
  'Проверьте, пожалуйста, папку “сообщения от продавца” в заказе.',
];

function accountGradient(accountId: string) {
  return accountId === 'acc1'
    ? 'linear-gradient(145deg, #60a5fa 0%, #2563eb 100%)'
    : 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)';
}

export default function Chats() {
  const [chats, setChats] = useState(initialChats);
  const [selectedId, setSelectedId] = useState<string | null>(initialChats[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'orders'>('all');
  const [inputValue, setInputValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInfoMobile, setShowInfoMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedChat = chats.find(c => c.id === selectedId) ?? null;

  const filteredChats = useMemo(() => {
    return chats.filter(c => {
      if (filter === 'unread' && c.unread === 0) return false;
      if (filter === 'orders' && !c.orderId) return false;
      if (search && !c.buyer.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [chats, filter, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, selectedChat?.messages.length]);

  useEffect(() => {
    if (!selectedId) return;
    setChats(prev => prev.map(chat => (chat.id === selectedId ? { ...chat, unread: 0 } : chat)));
  }, [selectedId]);

  function sendMessage() {
    if (!selectedId || !inputValue.trim()) return;
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      fromUser: true,
      text: inputValue.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    setChats(prev =>
      prev.map(chat =>
        chat.id === selectedId
          ? {
              ...chat,
              lastMessage: message.text,
              lastTime: message.time,
              messages: [...chat.messages, message],
              unread: 0,
            }
          : chat,
      ),
    );

    setInputValue('');
    setShowTemplates(false);
  }

  function openChat(chatId: string) {
    setSelectedId(chatId);
    setShowInfoMobile(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} style={{ paddingTop: 18 }}>
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: '1fr',
        }}
        className="lg:grid-cols-[310px_1fr_290px]"
      >
        <aside
          className={`platform-card ${selectedId ? 'hidden lg:block' : 'block'}`}
          style={{
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--pf-border)' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Чаты</h1>
            <p style={{ margin: '6px 0 0', color: 'var(--pf-text-muted)', fontSize: 13 }}>
              Центр поддержки, автоответов и выдачи.
            </p>
            <label className="platform-search max-w-none" style={{ marginTop: 12 }}>
              <Search size={14} color="var(--pf-text-dim)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск покупателя" />
            </label>
            <div className="flex gap-2 mt-3">
              {([
                ['all', 'Все'],
                ['unread', 'Непрочитанные'],
                ['orders', 'С заказом'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  className={filter === value ? 'platform-btn-primary' : 'platform-btn-secondary'}
                  style={{ minHeight: 34, fontSize: 12, padding: '0 10px' }}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {filteredChats.map(chat => {
              const isActive = chat.id === selectedId;
              return (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  style={{
                    width: '100%',
                    border: 0,
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    background: isActive ? 'rgba(59,130,246,0.14)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      background: accountGradient(chat.accountId),
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {chat.buyerAvatar}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--pf-text)' }}>{chat.buyer}</span>
                      <span style={{ color: 'var(--pf-text-dim)', fontSize: 11 }}>{chat.lastTime}</span>
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 3,
                        color: 'var(--pf-text-muted)',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {chat.lastMessage}
                    </span>
                  </span>
                  {chat.unread > 0 && (
                    <span
                      style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '0 6px',
                        flexShrink: 0,
                      }}
                    >
                      {chat.unread}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredChats.length === 0 && (
              <div style={{ padding: 24, color: 'var(--pf-text-muted)', textAlign: 'center', fontSize: 13 }}>
                Ничего не найдено по текущему фильтру.
              </div>
            )}
          </div>
        </aside>

        <section
          className={`platform-card ${selectedId ? 'flex' : 'hidden lg:flex'}`}
          style={{
            padding: 0,
            overflow: 'hidden',
            minHeight: 600,
            flexDirection: 'column',
          }}
        >
          {!selectedChat ? (
            <div style={{ padding: 30, color: 'var(--pf-text-muted)' }}>Выберите чат для начала работы.</div>
          ) : (
            <>
              <header
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--pf-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <button
                  className="platform-topbar-btn lg:hidden"
                  onClick={() => setSelectedId(null)}
                  aria-label="Назад к списку"
                >
                  <ArrowLeft size={16} />
                </button>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: accountGradient(selectedChat.accountId),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {selectedChat.buyerAvatar}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{selectedChat.buyer}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--pf-text-muted)' }}>
                    {selectedChat.orderId ? `Заказ: ${selectedChat.orderId}` : 'Диалог без заказа'}
                  </span>
                </span>
                <button className="platform-topbar-btn lg:hidden" onClick={() => setShowInfoMobile(v => !v)}>
                  <UserRound size={15} />
                </button>
              </header>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedChat.messages.map(message => (
                  <div key={message.id} style={{ display: 'flex', justifyContent: message.fromUser ? 'flex-end' : 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: '78%',
                        borderRadius: message.fromUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: message.fromUser ? 'linear-gradient(145deg,#3b82f6,#2563eb)' : 'rgba(15,23,42,0.9)',
                        border: message.fromUser ? '1px solid rgba(147,197,253,0.25)' : '1px solid var(--pf-border)',
                        padding: '9px 12px',
                      }}
                    >
                      <div style={{ fontSize: 14, lineHeight: 1.45 }}>{message.text}</div>
                      <div
                        style={{
                          marginTop: 4,
                          textAlign: 'right',
                          fontSize: 11,
                          color: message.fromUser ? 'rgba(255,255,255,0.75)' : 'var(--pf-text-dim)',
                        }}
                      >
                        {message.time}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <footer style={{ borderTop: '1px solid var(--pf-border)', padding: 12 }}>
                {showTemplates && (
                  <div className="platform-card" style={{ marginBottom: 10, padding: 10 }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--pf-text-muted)', fontWeight: 700 }}>
                      Быстрые шаблоны
                    </div>
                    <div className="grid gap-2">
                      {CANNED.map(template => (
                        <button
                          key={template}
                          className="platform-btn-secondary"
                          style={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 36 }}
                          onClick={() => {
                            setInputValue(template);
                            setShowTemplates(false);
                          }}
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    className="platform-input"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Написать сообщение..."
                  />
                  <button className="platform-topbar-btn" onClick={() => setShowTemplates(v => !v)} aria-label="Шаблоны">
                    <FileText size={15} />
                  </button>
                  <button className="platform-topbar-btn" aria-label="AI-подсказка">
                    <Sparkles size={15} />
                  </button>
                  <button className="platform-btn-primary" onClick={sendMessage} aria-label="Отправить">
                    <Send size={15} />
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>

        <aside
          className={`platform-card ${
            selectedId ? (showInfoMobile ? 'block lg:block' : 'hidden lg:block') : 'hidden lg:block'
          }`}
          style={{
            padding: 16,
          }}
        >
          {selectedChat && (
            <>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Контекст диалога</h2>
              <p style={{ margin: '6px 0 0', color: 'var(--pf-text-muted)', fontSize: 13 }}>
                Быстрые действия и подсказки по текущему клиенту.
              </p>

              <div className="platform-card" style={{ marginTop: 12, padding: 12 }}>
                <div className="platform-chip">{selectedChat.orderId ?? 'Без заказа'}</div>
                <div style={{ marginTop: 10, color: 'var(--pf-text-muted)', fontSize: 13 }}>
                  Последняя активность: {selectedChat.lastTime}
                </div>
                <div style={{ marginTop: 8, color: 'var(--pf-text-muted)', fontSize: 13 }}>
                  Непрочитанных: {selectedChat.unread}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--pf-text-dim)', fontWeight: 700 }}>
                  БЫСТРЫЕ КОМАНДЫ
                </div>
                <div className="grid gap-2 mt-2">
                  <button className="platform-btn-secondary">Выдать товар повторно</button>
                  <button className="platform-btn-secondary">Отправить инструкцию</button>
                  <button className="platform-btn-secondary">Передать менеджеру</button>
                  <button className="platform-btn-primary inline-flex items-center justify-center gap-2">
                    <Bot size={14} /> Сгенерировать ответ AI
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

    </motion.div>
  );
}
