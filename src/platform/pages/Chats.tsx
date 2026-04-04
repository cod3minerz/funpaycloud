import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  ExternalLink,
  Filter,
  Info,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react';
import logoSmall from '@/assets/logoSmall.svg';
import { accounts, chats as initialChats, ChatMessage, orders } from '@/platform/data/demoData';

type ReadStateFilter = 'all' | 'unread';

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

const QUICK_REPLIES = [
  'Добрый день! Товар готов к выдаче, сейчас отправлю.',
  'Спасибо за покупку. Если потребуется помощь, я на связи.',
  'Проверяю ситуацию и вернусь с ответом в течение пары минут.',
  'Отправил инструкцию, напишите если нужен разбор по шагам.',
];

const statusLabel: Record<string, string> = {
  paid: 'Оплачен',
  completed: 'Выполнен',
  refund: 'Возврат',
  dispute: 'Спор',
};

function accountGradient(seed: string) {
  const value = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = value % 360;
  return `linear-gradient(135deg, hsl(${hue} 74% 43%), hsl(${(hue + 30) % 360} 74% 36%))`;
}

function toFunPayUserLink(username: string) {
  return `https://funpay.com/users/${encodeURIComponent(username)}`;
}

function BuyerInfoContent({ chat }: { chat: ChatView }) {
  const buyerOrders = orders.filter(order => order.buyer === chat.buyer);

  return (
    <div className="grid gap-3">
      <section className="platform-panel" style={{ padding: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--pf-text-dim)', fontWeight: 700 }}>ПРОФИЛЬ</div>
        <div style={{ marginTop: 8, fontWeight: 800, fontSize: 16 }}>{chat.buyer}</div>
        <div style={{ marginTop: 6, color: 'var(--pf-text-muted)', fontSize: 13 }}>
          Чатов: <strong style={{ color: 'var(--pf-text)' }}>{chat.messagesCount}</strong> · Непрочитанных:{' '}
          <strong style={{ color: 'var(--pf-text)' }}>{chat.unread}</strong>
        </div>
        <a
          href={toFunPayUserLink(chat.buyer)}
          target="_blank"
          rel="noreferrer"
          className="platform-btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10 }}
        >
          Профиль покупателя <ExternalLink size={12} />
        </a>
      </section>

      <section className="platform-panel" style={{ padding: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--pf-text-dim)', fontWeight: 700 }}>ЗАКАЗЫ</div>
        <div className="grid gap-2" style={{ marginTop: 8 }}>
          {buyerOrders.slice(0, 4).map(order => (
            <div key={order.id} style={{ border: '1px solid var(--pf-border)', borderRadius: 10, padding: '8px 10px', background: 'var(--pf-surface-2)' }}>
              <div className="flex items-center justify-between gap-2">
                <strong style={{ fontSize: 12 }}>{order.id}</strong>
                <span className="platform-chip" style={{ minHeight: 22 }}>{statusLabel[order.status] ?? order.status}</span>
              </div>
              <div style={{ marginTop: 4, color: 'var(--pf-text-muted)', fontSize: 12 }}>{order.lot}</div>
              <div style={{ marginTop: 4, fontWeight: 700, fontSize: 12 }}>{order.amount} ₽</div>
            </div>
          ))}
          {buyerOrders.length === 0 && <div style={{ color: 'var(--pf-text-muted)', fontSize: 12 }}>По этому покупателю пока нет заказов.</div>}
        </div>
      </section>

      <section className="platform-panel" style={{ padding: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--pf-text-dim)', fontWeight: 700 }}>БЫСТРЫЕ ДЕЙСТВИЯ</div>
        <div className="grid gap-2" style={{ marginTop: 8 }}>
          <button className="platform-btn-secondary">Выдать товар повторно</button>
          <button className="platform-btn-secondary">Отправить инструкцию</button>
          <button className="platform-btn-secondary">Эскалация в поддержку</button>
        </div>
      </section>
    </div>
  );
}

export default function Chats() {
  const [chats, setChats] = useState(initialChats);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [readState, setReadState] = useState<ReadStateFilter>('all');
  const [accountScope, setAccountScope] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInfoDesktop, setShowInfoDesktop] = useState(false);
  const [showInfoMobile, setShowInfoMobile] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), []);
  const orderMap = useMemo(() => new Map(orders.map(order => [order.id, order])), []);

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
      if (readState === 'unread' && row.unread === 0) return false;
      if (accountScope !== 'all' && row.accountId !== accountScope) return false;
      if (
        search &&
        !row.buyer.toLowerCase().includes(search.toLowerCase()) &&
        !(row.lotTitle ?? '').toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [rows, readState, accountScope, search]);

  useEffect(() => {
    if (!selectedId && filteredRows[0]) {
      setSelectedId(filteredRows[0].id);
      return;
    }

    if (selectedId && !filteredRows.some(row => row.id === selectedId)) {
      setSelectedId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedId]);

  const selectedChat = rows.find(row => row.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    setChats(prev => prev.map(chat => (chat.id === selectedId ? { ...chat, unread: 0 } : chat)));
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, selectedChat?.messages.length]);

  function openChat(chatId: string) {
    setSelectedId(chatId);
    setShowInfoDesktop(false);
    setShowInfoMobile(false);
  }

  function resetFilters() {
    setReadState('all');
    setAccountScope('all');
  }

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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} style={{ paddingTop: 18 }}>
      <section className="platform-card" style={{ padding: 0, overflow: 'hidden', height: 'min(780px, calc(100dvh - 178px))' }}>
        <div className="grid h-full md:grid-cols-[330px_minmax(0,1fr)]">
          <aside className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col border-r border-[var(--pf-border)]`}>
            <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--pf-border)' }}>
              <div className="flex items-center justify-between gap-2">
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Чаты</h1>
                <button className="platform-topbar-btn" onClick={() => setShowFilters(prev => !prev)} aria-label="Фильтры">
                  <Filter size={14} />
                </button>
              </div>

              <label className="platform-search max-w-none" style={{ marginTop: 10 }}>
                <Search size={14} color="var(--pf-text-dim)" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Поиск по клиенту или товару"
                  aria-label="Поиск по чатам"
                />
              </label>

              {showFilters && (
                <div className="platform-panel" style={{ marginTop: 10, padding: 10 }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--pf-text-dim)', fontWeight: 700 }}>ФИЛЬТРЫ</div>
                  <div className="grid gap-2" style={{ marginTop: 8 }}>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={readState === 'all' ? 'platform-btn-primary' : 'platform-btn-secondary'}
                        style={{ minHeight: 34 }}
                        onClick={() => setReadState('all')}
                      >
                        Все
                      </button>
                      <button
                        className={readState === 'unread' ? 'platform-btn-primary' : 'platform-btn-secondary'}
                        style={{ minHeight: 34 }}
                        onClick={() => setReadState('unread')}
                      >
                        Непрочитанные
                      </button>
                    </div>

                    <select className="platform-select" value={accountScope} onChange={event => setAccountScope(event.target.value)}>
                      <option value="all">Все аккаунты</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.username}
                        </option>
                      ))}
                    </select>

                    <button className="platform-btn-secondary" onClick={resetFilters}>Сбросить фильтры</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {filteredRows.map(row => {
                const isActive = row.id === selectedId;
                return (
                  <button
                    key={row.id}
                    onClick={() => openChat(row.id)}
                    className="platform-messenger-row"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 0,
                      borderBottom: '1px solid rgba(148,163,184,0.14)',
                      background: isActive ? 'rgba(59,130,246,0.14)' : 'transparent',
                      padding: '11px 12px',
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
                          <strong style={{ fontSize: 14 }}>{row.buyer}</strong>
                          <span style={{ color: 'var(--pf-text-dim)', fontSize: 11, whiteSpace: 'nowrap' }}>{row.lastTime}</span>
                        </div>

                        <p
                          style={{
                            margin: '4px 0 0',
                            color: 'var(--pf-text-muted)',
                            fontSize: 12,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {row.lastMessage}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 6 }}>
                          {row.orderId ? (
                            <span className="platform-chip" style={{ minHeight: 20, fontSize: 10 }}>{row.orderId}</span>
                          ) : (
                            <span className="platform-chip" style={{ minHeight: 20, fontSize: 10 }}>Без заказа</span>
                          )}

                          <span style={{ color: 'var(--pf-text-dim)', fontSize: 11 }}>{row.messagesCount} сообщ.</span>
                          {row.requiresReply && (
                            <span style={{ color: '#ffbf73', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <TriangleAlert size={11} /> требует ответа
                            </span>
                          )}
                        </div>
                      </div>

                      {row.unread > 0 && (
                        <span
                          style={{
                            minWidth: 22,
                            height: 22,
                            borderRadius: 999,
                            background: '#ff6b6b',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
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
                <div style={{ padding: '28px 14px', textAlign: 'center', color: 'var(--pf-text-muted)', fontSize: 13 }}>
                  По текущим фильтрам чаты не найдены.
                </div>
              )}
            </div>
          </aside>

          <section className={`${selectedChat ? 'flex' : 'hidden md:flex'} relative min-w-0 flex-col`}>
            {!selectedChat ? (
              <div className="grid h-full place-items-center" style={{ color: 'var(--pf-text-muted)' }}>
                Выберите чат, чтобы открыть переписку.
              </div>
            ) : (
              <>
                <header style={{ padding: '12px 14px', borderBottom: '1px solid var(--pf-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    className="platform-topbar-btn md:hidden"
                    onClick={() => {
                      setSelectedId(null);
                      setShowInfoMobile(false);
                    }}
                    aria-label="Назад к чатам"
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
                      {selectedChat.orderId && <span className="platform-chip">{selectedChat.orderId}</span>}
                      {selectedChat.orderAmount && <span className="platform-chip">{selectedChat.orderAmount} ₽</span>}
                    </div>
                    <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
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

                  <button className="platform-btn-secondary hidden sm:inline-flex" style={{ minHeight: 36 }} onClick={() => setShowInfoDesktop(true)}>
                    <Info size={14} /> Инфо
                  </button>
                  <button className="platform-topbar-btn sm:hidden" onClick={() => setShowInfoMobile(true)} aria-label="Информация о чате">
                    <Info size={14} />
                  </button>
                </header>

                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    padding: 14,
                    backgroundColor: 'var(--pf-surface-2)',
                    backgroundImage: `linear-gradient(180deg, rgba(8,17,34,0.78), rgba(8,17,34,0.92)), url(${logoSmall.src})`,
                    backgroundSize: 'auto, 88px',
                    backgroundRepeat: 'repeat',
                    backgroundPosition: 'center',
                  }}
                >
                  {selectedChat.messages.map(message => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: message.fromUser ? 'flex-end' : 'flex-start',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '78%',
                          borderRadius: message.fromUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: message.fromUser ? '#1d4ed8' : 'rgba(15,24,40,0.95)',
                          border: message.fromUser
                            ? '1px solid rgba(177,198,255,0.42)'
                            : '1px solid rgba(148,163,184,0.2)',
                          padding: '10px 12px',
                          boxShadow: '0 6px 14px rgba(2,6,23,0.35)',
                        }}
                      >
                        <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{message.text}</div>
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 10.5,
                            color: message.fromUser ? 'rgba(255,255,255,0.76)' : 'var(--pf-text-dim)',
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

                <footer style={{ borderTop: '1px solid var(--pf-border)', padding: 10, background: 'rgba(8,18,36,0.98)' }}>
                  {showTemplates && (
                    <div className="platform-panel" style={{ marginBottom: 8, padding: 8 }}>
                      <div style={{ marginBottom: 6, color: 'var(--pf-text-dim)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                        БЫСТРЫЕ ОТВЕТЫ
                      </div>
                      <div className="grid gap-2">
                        {QUICK_REPLIES.map(text => (
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
                    <button className="platform-topbar-btn" onClick={() => setShowTemplates(prev => !prev)} aria-label="Быстрые ответы">
                      <Bot size={14} />
                    </button>

                    <input
                      className="platform-input"
                      value={inputValue}
                      onChange={event => setInputValue(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Напишите сообщение..."
                    />

                    <button className="platform-btn-primary" onClick={sendMessage} aria-label="Отправить">
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </footer>

                <div
                  className="hidden md:block"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: showInfoDesktop ? 'auto' : 'none',
                  }}
                >
                  <button
                    onClick={() => setShowInfoDesktop(false)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      border: 0,
                      background: showInfoDesktop ? 'rgba(2,6,23,0.45)' : 'transparent',
                      opacity: showInfoDesktop ? 1 : 0,
                      transition: 'opacity 0.18s ease',
                      cursor: 'default',
                    }}
                    aria-label="Закрыть информацию"
                  />

                  <aside
                    className="platform-card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 320,
                      zIndex: 3,
                      borderRadius: 0,
                      borderLeft: '1px solid var(--pf-border)',
                      borderTop: 0,
                      borderBottom: 0,
                      borderRight: 0,
                      transform: showInfoDesktop ? 'translateX(0)' : 'translateX(108%)',
                      transition: 'transform 0.2s ease',
                      overflowY: 'auto',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2" style={{ marginBottom: 8 }}>
                      <strong style={{ fontSize: 15 }}>Информация</strong>
                      <button className="platform-topbar-btn" onClick={() => setShowInfoDesktop(false)} aria-label="Закрыть">
                        <X size={14} />
                      </button>
                    </div>
                    <BuyerInfoContent chat={selectedChat} />
                  </aside>
                </div>
              </>
            )}
          </section>
        </div>
      </section>

      {showInfoMobile && selectedChat && (
        <>
          <button className="platform-mobile-overlay md:hidden" onClick={() => setShowInfoMobile(false)} aria-label="Закрыть" />
          <div className="mobile-sheet md:hidden" style={{ maxHeight: '78dvh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-3">
              <strong style={{ fontSize: 16 }}>Информация о чате</strong>
              <button className="platform-topbar-btn" onClick={() => setShowInfoMobile(false)} aria-label="Закрыть">
                <X size={15} />
              </button>
            </div>
            <BuyerInfoContent chat={selectedChat} />
          </div>
        </>
      )}

      {showFilters && (
        <>
          <button className="platform-mobile-overlay md:hidden" onClick={() => setShowFilters(false)} aria-label="Закрыть фильтры" />
          <div className="mobile-sheet md:hidden">
            <div className="flex items-center justify-between mb-3">
              <strong style={{ fontSize: 16 }}>Фильтры чатов</strong>
              <button className="platform-topbar-btn" onClick={() => setShowFilters(false)} aria-label="Закрыть">
                <X size={15} />
              </button>
            </div>

            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button className={readState === 'all' ? 'platform-btn-primary' : 'platform-btn-secondary'} onClick={() => setReadState('all')}>Все</button>
                <button className={readState === 'unread' ? 'platform-btn-primary' : 'platform-btn-secondary'} onClick={() => setReadState('unread')}>Непрочитанные</button>
              </div>
              <select className="platform-select" value={accountScope} onChange={event => setAccountScope(event.target.value)}>
                <option value="all">Все аккаунты</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.username}</option>
                ))}
              </select>
              <button className="platform-btn-secondary" onClick={resetFilters}>Сбросить фильтры</button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
