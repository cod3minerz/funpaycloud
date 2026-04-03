import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, ArrowLeft, Bot, FileText, ExternalLink, ChevronDown } from 'lucide-react';
import { chats as initialChats, Chat, ChatMessage } from '@/platform/data/demoData';

const CARD_STYLE: React.CSSProperties = {
  background: '#0a1428',
  border: '1px solid rgba(0,121,255,0.18)',
  borderRadius: '12px',
};

const CANNED = [
  'Добрый день! Ваш товар уже готов к выдаче.',
  'Спасибо за покупку! Если будут вопросы — пишите.',
  'Извините за неудобства, мы решим вашу проблему.',
];

export default function Chats() {
  const [chats, setChats] = useState(initialChats);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'orders'>('all');
  const [inputValue, setInputValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedChat = chats.find(c => c.id === selectedId) ?? null;

  const filteredChats = chats.filter(c => {
    if (filter === 'unread' && c.unread === 0) return false;
    if (filter === 'orders' && !c.orderId) return false;
    if (search && !c.buyer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, selectedChat?.messages.length]);

  function sendMessage() {
    if (!inputValue.trim() || !selectedId) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      fromUser: true,
      text: inputValue.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };
    setChats(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, lastTime: newMsg.time, unread: 0 }
        : c
    ));
    setInputValue('');
  }

  function useCanned(text: string) {
    setInputValue(text);
    setShowTemplates(false);
  }

  const avatarColor = (accountId: string) =>
    accountId === 'acc1'
      ? 'linear-gradient(135deg, #007BFF, #0052F4)'
      : 'linear-gradient(135deg, #7c3aed, #4f46e5)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', height: 'calc(100vh - 0px)', background: '#050C1C', fontFamily: 'Syne, sans-serif', overflow: 'hidden' }}
    >
      {/* Left panel */}
      <div style={{
        width: '320px',
        minWidth: '320px',
        borderRight: '1px solid rgba(0,121,255,0.18)',
        display: selectedId ? 'none' : 'flex',
        flexDirection: 'column',
        background: '#0a1428',
      }}
        className="lg:flex"
      >
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,121,255,0.12)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Чаты</h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по покупателю..."
            style={{
              width: '100%',
              background: 'rgba(0,121,255,0.08)',
              border: '1px solid rgba(0,121,255,0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {(['all', 'unread', 'orders'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flex: 1,
                  padding: '5px 6px',
                  borderRadius: '6px',
                  border: filter === f ? 'none' : '1px solid rgba(0,121,255,0.2)',
                  background: filter === f ? 'linear-gradient(135deg, #007BFF, #0052F4)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {f === 'all' ? 'Все' : f === 'unread' ? 'Непрочитанные' : 'С заказами'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelectedId(chat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                borderLeft: `3px solid ${chat.accountId === 'acc1' ? '#0079FF' : '#7c3aed'}`,
                background: selectedId === chat.id ? 'rgba(0,121,255,0.15)' : 'transparent',
                borderBottom: '1px solid rgba(0,121,255,0.06)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarColor(chat.accountId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
                {chat.buyerAvatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{chat.buyer}</span>
                  <span style={{ color: '#7DC8FF', fontSize: '11px' }}>{chat.lastTime}</span>
                </div>
                <div style={{ color: '#7DC8FF', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {chat.lastMessage}
                </div>
              </div>
              {chat.unread > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '2px 7px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  {chat.unread}
                </span>
              )}
            </div>
          ))}
          {filteredChats.length === 0 && (
            <div style={{ textAlign: 'center', color: '#7DC8FF', padding: '40px 16px', fontSize: '14px' }}>
              Чаты не найдены
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050C1C', minWidth: 0 }}>
        {!selectedChat ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7DC8FF' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Выберите чат</div>
            <div style={{ fontSize: '14px' }}>Выберите чат из списка слева для начала общения</div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,121,255,0.18)', display: 'flex', alignItems: 'center', gap: '12px', background: '#0a1428' }}>
              <button
                onClick={() => setSelectedId(null)}
                style={{ background: 'transparent', border: 'none', color: '#7DC8FF', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarColor(selectedChat.accountId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>
                {selectedChat.buyerAvatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedChat.buyer}</div>
                <a href="#" style={{ color: '#7DC8FF', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Профиль FunPay <ExternalLink size={11} />
                </a>
              </div>
              {selectedChat.orderId && (
                <span style={{ background: 'rgba(0,121,255,0.15)', color: '#7DC8FF', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(0,121,255,0.3)' }}>
                  {selectedChat.orderId}
                </span>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedChat.messages.map(msg => (
                <div
                  key={msg.id}
                  style={{ display: 'flex', justifyContent: msg.fromUser ? 'flex-end' : 'flex-start' }}
                >
                  <div style={{
                    maxWidth: '70%',
                    background: msg.fromUser ? '#0079FF' : '#0d1e38',
                    color: '#fff',
                    borderRadius: msg.fromUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '10px 14px',
                    border: msg.fromUser ? 'none' : '1px solid rgba(0,121,255,0.2)',
                  }}>
                    <div style={{ fontSize: '14px', lineHeight: 1.5 }}>{msg.text}</div>
                    <div style={{ color: msg.fromUser ? 'rgba(255,255,255,0.6)' : '#7DC8FF', fontSize: '11px', marginTop: '4px', textAlign: 'right' }}>{msg.time}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(0,121,255,0.18)', background: '#0a1428', position: 'relative' }}>
              {showTemplates && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '20px',
                  background: '#0d1e38',
                  border: '1px solid rgba(0,121,255,0.3)',
                  borderRadius: '10px',
                  padding: '8px',
                  zIndex: 10,
                  width: '340px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ color: '#7DC8FF', fontSize: '12px', padding: '4px 8px', marginBottom: '4px', fontWeight: 600 }}>Шаблоны ответов</div>
                  {CANNED.map((t, i) => (
                    <div
                      key={i}
                      onClick={() => useCanned(t)}
                      style={{ padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,121,255,0.15)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Написать сообщение..."
                  style={{
                    flex: 1,
                    background: 'rgba(0,121,255,0.08)',
                    border: '1px solid rgba(0,121,255,0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => setShowTemplates(v => !v)}
                  style={{ background: 'rgba(0,121,255,0.15)', border: '1px solid rgba(0,121,255,0.3)', borderRadius: '8px', padding: '10px 12px', color: '#7DC8FF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                >
                  <FileText size={15} /> Шаблоны <ChevronDown size={13} />
                </button>
                <button
                  style={{ background: 'linear-gradient(135deg, #007BFF, #0052F4)', border: 'none', borderRadius: '8px', padding: '10px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                >
                  <Bot size={15} /> AI
                </button>
                <button
                  onClick={sendMessage}
                  style={{ background: 'linear-gradient(135deg, #007BFF, #0052F4)', border: 'none', borderRadius: '8px', padding: '10px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
