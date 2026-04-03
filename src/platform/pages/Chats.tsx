import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bot,
  ExternalLink,
  FileText,
  Info,
  Search,
  Send,
  Sparkles,
  TriangleAlert,
  UserCircle2,
} from 'lucide-react';
import { accounts, chats as initialChats, ChatMessage, orders } from '@/platform/data/demoData';

const CANNED = [
  'Добрый день! Ваш товар уже подготовлен и доступен в заказе.',
  'Спасибо за покупку. Если потребуется помощь, сразу напишите.',
  'Понимаю, сейчас проверю ситуацию и вернусь с решением через пару минут.',
  'Отправил инструкцию. Если что-то не сработает, помогу пошагово.',
];

type FilterType = 'all' | 'unread' | 'orders' | 'requires';

type ChatView = {
  id: string;
  buyer: string;
  buyerAvatar: string;
  accountId: string;
  sellerName: string;
  unread: number;
  lastMessage: string;
  lastTime: string;
  messagesCount: number;
  requiresReply: boolean;
  orderId?: string;
  orderStatus?: string;
  orderAmount?: number;
  lotTitle?: string;
  messages: ChatMessage[];
};

const statusClass: Record<string, string> = {
  paid: 'badge-paid',
  completed: 'badge-completed',
  refund: 'badge-refund',
  dispute: 'badge-dispute',
};

const statusLabel: Record<string, string> = {
  paid: 'Оплачен',
  completed: 'Выполнен',
  refund: 'Возврат',
  dispute: 'Спор',
};

function accountGradient(accountId: string) {
  return accountId === 'acc1' ? '#1d4ed8' : '#2563eb';
}

function toFunPayUserLink(username: string) {
  return `https://funpay.com/users/${encodeURIComponent(username)}`;
}

export default function Chats() {
  const [chats, setChats] = useState(initialChats);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [inputValue, setInputValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const orderMap = useMemo(() => new Map(orders.map(order => [order.id, order])), []);
  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), []);

  const rows = useMemo<ChatView[]>(() => {
    return chats.map(chat => {
      const order = chat.orderId ? orderMap.get(chat.orderId) : undefined;
      const lastIncoming = chat.messages[chat.messages.length - 1];
      const requiresReply = chat.unread > 0 || Boolean(lastIncoming && !lastIncoming.fromUser);
      const seller = accountMap.get(chat.accountId);

      return {
        id: chat.id,
        buyer: chat.buyer,
        buyerAvatar: chat.buyerAvatar,
        accountId: chat.accountId,
        sellerName: seller?.username ?? chat.accountId,
        unread: chat.unread,
        lastMessage: chat.lastMessage,
        lastTime: chat.lastTime,
        messagesCount: chat.messages.length,
        requiresReply,
        orderId: chat.orderId,
        orderStatus: order?.status,
        orderAmount: order?.amount,
        lotTitle: order?.lot,
        messages: chat.messages,
      };
    });
  }, [chats, orderMap, accountMap]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (filter === 'unread' && row.unread === 0) return false;
      if (filter === 'orders' && !row.orderId) return false;
      if (filter === 'requires' && !row.requiresReply) return false;
      if (search && !row.buyer.toLowerCase().includes(search.toLowerCase()) && !(row.lotTitle ?? '').toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rows, filter, search]);

  const selectedChat = rows.find(row => row.id === selectedId) ?? null;
  const isListMobile = !selectedId;

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
              unread: 0,
              lastMessage: message.text,
              lastTime: message.time,
              messages: [...chat.messages, message],
            }
          : chat,
      ),
    );

    setInputValue('');
    setShowTemplates(false);
  }

  function openChat(chatId: string) {
    setSelectedId(chatId);
    setShowMobileInfo(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} style={{ paddingTop: 18 }}>
      <div className="grid gap-3 lg:grid-cols-[330px_minmax(0,1fr)_300px]">
        <aside
          className={`platform-card ${isListMobile ? 'block' : 'hidden lg:block'}`}
          style={{ padding: 0, overflow: 'hidden', minHeight: 660 }}
        >
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--pf-border)' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Сообщения</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--pf-text-muted)', fontSize: 13 }}>
              Диалоги, заказы и статус ответов в одном окне.
            </p>

            <label className="platform-search max-w-none" style={{ marginTop: 12 }}>
              <Search size={14} color="var(--pf-text-dim)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по клиенту или товару"
                aria-label="Поиск диалога"
              />
            </label>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {([
                ['all', 'Все'],
                ['unread', 'Непрочит.'],
                ['orders', 'С заказом'],
                ['requires', 'Требуют ответа'],
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

          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {filteredRows.map(row => {
              const isActive = row.id === selectedId;
              return (
                <button
                  key={row.id}
                  onClick={() => openChat(row.id)}
                  className="platform-messenger-row"
                  style={{
                    width: '100%',
                    border: 0,
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: isActive ? 'rgba(91,140,255,0.18)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        background: accountGradient(row.accountId),
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {row.buyerAvatar}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center justify-between gap-2">
                        <strong style={{ fontSize: 14, color: 'var(--pf-text)' }}>{row.buyer}</strong>
                        <span style={{ color: 'var(--pf-text-dim)', fontSize: 11, whiteSpace: 'nowrap' }}>{row.lastTime}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        {row.orderId ? (
                          <span className="platform-chip" style={{ minHeight: 22, fontSize: 10 }}>
                            {row.orderId}
                          </span>
                        ) : (
                          <span className="platform-chip" style={{ minHeight: 22, fontSize: 10 }}>Без заказа</span>
                        )}

                        <span style={{ color: 'var(--pf-text-dim)', fontSize: 11 }}>{row.messagesCount} сообщ.</span>

                        {row.requiresReply && (
                          <span style={{ color: '#ffb86c', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <TriangleAlert size={12} /> требует ответа
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          margin: '6px 0 0',
                          color: 'var(--pf-text-muted)',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {row.lastMessage}
                      </p>

                      {row.lotTitle && (
                        <p
                          style={{
                            margin: '4px 0 0',
                            color: 'var(--pf-text-dim)',
                            fontSize: 11,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          Товар: {row.lotTitle}
                        </p>
                      )}
                    </div>

                    {row.unread > 0 && (
                      <span
                        style={{
                          minWidth: 22,
                          height: 22,
                          borderRadius: 999,
                          background: '#ff6d6d',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '0 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {row.unread}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredRows.length === 0 && (
              <div style={{ padding: '34px 20px', textAlign: 'center', color: 'var(--pf-text-muted)', fontSize: 13 }}>
                Диалоги по текущему фильтру не найдены.
              </div>
            )}
          </div>
        </aside>

        <section
          className={`platform-card ${selectedChat ? 'flex' : 'hidden lg:flex'}`}
          style={{ padding: 0, minHeight: 660, flexDirection: 'column', overflow: 'hidden' }}
        >
          {!selectedChat ? (
            <div className="grid place-items-center" style={{ flex: 1, color: 'var(--pf-text-muted)' }}>
              Выберите диалог, чтобы открыть переписку.
            </div>
          ) : (
            <>
              <header
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--pf-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <button
                  className="platform-topbar-btn md:hidden"
                  onClick={() => {
                    setSelectedId(null);
                    setShowMobileInfo(false);
                  }}
                  aria-label="Назад"
                >
                  <ArrowLeft size={15} />
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
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {selectedChat.buyerAvatar}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong style={{ fontSize: 15 }}>{selectedChat.buyer}</strong>
                    {selectedChat.orderStatus && (
                      <span className={statusClass[selectedChat.orderStatus] ?? 'platform-chip'}>
                        {statusLabel[selectedChat.orderStatus] ?? selectedChat.orderStatus}
                      </span>
                    )}
                    {selectedChat.orderAmount && (
                      <span className="platform-chip">{selectedChat.orderAmount} ₽</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    <a
                      href={toFunPayUserLink(selectedChat.buyer)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--pf-text-muted)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Профиль покупателя <ExternalLink size={11} />
                    </a>
                    <a
                      href={toFunPayUserLink(selectedChat.sellerName)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--pf-text-dim)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Профиль продавца <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                <button className="platform-topbar-btn md:hidden" onClick={() => setShowMobileInfo(v => !v)} aria-label="Инфо">
                  <Info size={15} />
                </button>
              </header>

              <div className="platform-message-pattern" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14 }}>
                {selectedChat.messages.map(message => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.fromUser ? 'flex-end' : 'flex-start',
                      marginBottom: 9,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '78%',
                        borderRadius: message.fromUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: message.fromUser
                          ? '#1d4ed8'
                          : 'rgba(22,27,36,0.92)',
                        border: message.fromUser
                          ? '1px solid rgba(177,198,255,0.4)'
                          : '1px solid rgba(255,255,255,0.08)',
                        padding: '10px 12px',
                        boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                      }}
                    >
                      <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{message.text}</div>
                      <div
                        style={{
                          marginTop: 5,
                          textAlign: 'right',
                          fontSize: 10.5,
                          color: message.fromUser ? 'rgba(255,255,255,0.78)' : 'var(--pf-text-dim)',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>{message.time}</span>
                        {message.fromUser && <span>{message.read ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <footer style={{ borderTop: '1px solid var(--pf-border)', padding: 10, background: 'rgba(18,23,31,0.92)' }}>
                {showTemplates && (
                  <div className="platform-card" style={{ marginBottom: 8, padding: 8 }}>
                    <div style={{ marginBottom: 6, color: 'var(--pf-text-dim)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                      QUICK REPLIES
                    </div>
                    <div className="grid gap-2">
                      {CANNED.map(text => (
                        <button
                          key={text}
                          className="platform-btn-secondary"
                          style={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 34 }}
                          onClick={() => {
                            setInputValue(text);
                            setShowTemplates(false);
                          }}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button className="platform-topbar-btn" onClick={() => setShowTemplates(v => !v)} aria-label="Шаблоны">
                    <FileText size={14} />
                  </button>

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
                    placeholder="Напишите сообщение..."
                  />

                  <button className="platform-topbar-btn" aria-label="AI-подсказка">
                    <Sparkles size={14} />
                  </button>

                  <button className="platform-btn-primary" onClick={sendMessage} aria-label="Отправить">
                    <Send size={14} />
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>

        <aside
          className={`platform-card ${selectedChat ? (showMobileInfo ? 'block lg:block' : 'hidden lg:block') : 'hidden lg:block'}`}
          style={{ minHeight: 660 }}
        >
          {selectedChat && (
            <>
              <div className="flex items-center gap-2">
                <UserCircle2 size={17} color="var(--pf-text-muted)" />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Контекст диалога</h2>
              </div>

              <div className="platform-panel" style={{ marginTop: 12, padding: 12 }}>
                <div className="platform-chip">{selectedChat.orderId ?? 'Без заказа'}</div>
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--pf-text-muted)' }}>
                  Продавец: <strong style={{ color: 'var(--pf-text)' }}>{selectedChat.sellerName}</strong>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--pf-text-muted)' }}>
                  Товар: <strong style={{ color: 'var(--pf-text)' }}>{selectedChat.lotTitle ?? 'Уточняется в переписке'}</strong>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--pf-text-muted)' }}>
                  Сообщений: <strong style={{ color: 'var(--pf-text)' }}>{selectedChat.messagesCount}</strong>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--pf-text-muted)' }}>
                  Непрочитанных: <strong style={{ color: 'var(--pf-text)' }}>{selectedChat.unread}</strong>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--pf-text-dim)', fontWeight: 700 }}>
                  БЫСТРЫЕ СЦЕНАРИИ
                </div>
                <div className="grid gap-2 mt-2">
                  <button className="platform-btn-secondary">Выдать товар повторно</button>
                  <button className="platform-btn-secondary">Отправить инструкцию</button>
                  <button className="platform-btn-secondary">Эскалация в поддержку</button>
                  <button className="platform-btn-primary inline-flex items-center justify-center gap-2">
                    <Bot size={14} /> AI-черновик ответа
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
