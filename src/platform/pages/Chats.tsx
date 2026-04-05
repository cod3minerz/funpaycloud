import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bot,
  ExternalLink,
  Filter,
  Info,
  Search,
  SendHorizontal,
  TriangleAlert,
  X,
} from 'lucide-react';
import { accounts, chats as initialChats, ChatMessage, orders } from '@/platform/data/demoData';
import { PageHeader, PageShell, PageTitle, Panel, ToolbarRow } from '@/platform/components/primitives';

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
  'Добрый день. Заказ уже в обработке, сейчас отправлю детали.',
  'Спасибо за покупку. Если потребуется помощь, я на связи.',
  'Проверяю ситуацию и вернусь с ответом в течение пары минут.',
  'Отправил инструкцию по заказу. Если что-то не так, напишите.',
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
  return `linear-gradient(135deg, hsl(${hue} 74% 43%), hsl(${(hue + 32) % 360} 74% 36%))`;
}

function toFunPayUserLink(username: string) {
  return `https://funpay.com/users/${encodeURIComponent(username)}`;
}

function BuyerInfo({ chat }: { chat: ChatView }) {
  const buyerOrders = orders.filter(order => order.buyer === chat.buyer);

  return (
    <div className="platform-stack">
      <Panel className="p-3">
        <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--pf-text-dim)]">ПРОФИЛЬ</div>
        <div className="mt-2 text-[17px] font-extrabold">{chat.buyer}</div>
        <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">
          Чатов: <strong className="text-[var(--pf-text)]">{chat.messagesCount}</strong> · Непрочитанных:{' '}
          <strong className="text-[var(--pf-text)]">{chat.unread}</strong>
        </div>
        <a
          href={toFunPayUserLink(chat.buyer)}
          target="_blank"
          rel="noreferrer"
          className="platform-btn-secondary mt-3 inline-flex"
        >
          Профиль на FunPay <ExternalLink size={13} />
        </a>
      </Panel>

      <Panel className="p-3">
        <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--pf-text-dim)]">ЗАКАЗЫ</div>
        <div className="mt-2 grid gap-2">
          {buyerOrders.slice(0, 5).map(order => (
            <div key={order.id} className="platform-floating-pane">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[12px]">{order.id}</strong>
                <span className="platform-chip !min-h-[22px] !text-[10px]">{statusLabel[order.status] ?? order.status}</span>
              </div>
              <div className="mt-1 text-[12px] text-[var(--pf-text-muted)]">{order.lot}</div>
              <div className="mt-1 text-[12px] font-bold">{order.amount} ₽</div>
            </div>
          ))}
          {buyerOrders.length === 0 && (
            <div className="text-[12px] text-[var(--pf-text-muted)]">По этому покупателю пока нет заказов.</div>
          )}
        </div>
      </Panel>

      <Panel className="p-3">
        <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--pf-text-dim)]">БЫСТРЫЕ ДЕЙСТВИЯ</div>
        <div className="mt-2 grid gap-2">
          <button className="platform-btn-secondary">Выдать товар повторно</button>
          <button className="platform-btn-secondary">Отправить инструкцию</button>
          <button className="platform-btn-secondary">Эскалация в поддержку</button>
        </div>
      </Panel>
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
  const [showInfoDesktop, setShowInfoDesktop] = useState(false);
  const [showInfoMobile, setShowInfoMobile] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
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
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileThreadOpen(true);
    }
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Чаты"
            subtitle="Единый мессенджер для диалогов, заказов и оперативных ответов без лишнего интерфейсного шума."
          />
          <ToolbarRow>
            <span className="platform-chip">Всего диалогов: {rows.length}</span>
            <span className="platform-chip">Непрочитанные: {rows.filter(row => row.unread > 0).length}</span>
          </ToolbarRow>
        </PageHeader>

        <section className="platform-chat-shell">
          <aside className={`platform-chat-list ${mobileThreadOpen ? 'mobile-hidden' : ''}`}>
            <div className="platform-chat-list-head">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[15px] font-bold">Диалоги</div>
                <button
                  className="platform-topbar-btn"
                  onClick={() => setShowFilters(prev => !prev)}
                  aria-label="Открыть фильтры"
                >
                  <Filter size={14} />
                </button>
              </div>

              <label className="platform-search max-w-none">
                <Search size={14} color="var(--pf-text-dim)" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Поиск по покупателю или товару"
                  aria-label="Поиск по чатам"
                />
              </label>

              {showFilters && (
                <Panel className="p-3">
                  <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--pf-text-dim)]">ФИЛЬТРЫ</div>
                  <div className="mt-2 grid gap-2">
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

                    <button className="platform-btn-secondary" onClick={resetFilters}>
                      Сбросить фильтры
                    </button>
                  </div>
                </Panel>
              )}
            </div>

            <div className="platform-chat-scroll">
              {filteredRows.map(row => {
                const isActive = row.id === selectedId;
                return (
                  <button
                    key={row.id}
                    className={`platform-chat-row${isActive ? ' active' : ''}${row.unread > 0 ? ' unread' : ''}`}
                    onClick={() => openChat(row.id)}
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

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="platform-chat-name">{row.buyer}</span>
                          <span className="text-[11px] text-[var(--pf-text-dim)]">{row.lastTime}</span>
                        </div>

                        <p className="platform-chat-preview">{row.lastMessage}</p>

                        <div className="platform-chat-meta">
                          {row.orderId ? (
                            <span className="platform-chip !min-h-[20px] !text-[10px]">{row.orderId}</span>
                          ) : (
                            <span className="platform-chip !min-h-[20px] !text-[10px]">Без заказа</span>
                          )}

                          <span className="text-[11px] text-[var(--pf-text-dim)]">{row.messagesCount} сообщ.</span>

                          {row.unread > 0 && <span className="platform-unread-dot" aria-hidden="true" />}

                          {row.requiresReply && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#ffcb87]">
                              <TriangleAlert size={11} /> требует ответа
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredRows.length === 0 && (
                <div className="platform-empty">По текущим фильтрам чаты не найдены.</div>
              )}
            </div>
          </aside>

          <section className={`platform-chat-thread ${!mobileThreadOpen && !selectedChat ? 'mobile-hidden' : ''}`}>
            {selectedChat ? (
              <>
                <header className="platform-thread-head">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      className="platform-topbar-btn platform-mobile-only"
                      onClick={() => setMobileThreadOpen(false)}
                      aria-label="Назад к чатам"
                    >
                      <ArrowLeft size={15} />
                    </button>

                    <span
                      className="platform-avatar"
                      style={{
                        width: 36,
                        height: 36,
                        background: accountGradient(selectedChat.accountId),
                        fontSize: 12,
                      }}
                    >
                      {selectedChat.buyerAvatar}
                    </span>

                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-bold">{selectedChat.buyer}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--pf-text-dim)]">
                        <span>{selectedChat.sellerName}</span>
                        {selectedChat.orderId && <span className="platform-chip !min-h-[20px] !text-[10px]">{selectedChat.orderId}</span>}
                        {selectedChat.lotTitle && <span className="truncate">{selectedChat.lotTitle}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2">
                    <a
                      href={toFunPayUserLink(selectedChat.buyer)}
                      target="_blank"
                      rel="noreferrer"
                      className="platform-topbar-btn hidden sm:inline-flex"
                      aria-label="Открыть профиль покупателя"
                    >
                      <ExternalLink size={14} />
                    </a>

                    <button
                      type="button"
                      className="platform-topbar-btn"
                      onClick={() => {
                        if (window.matchMedia('(max-width: 767px)').matches) {
                          setShowInfoMobile(true);
                        } else {
                          setShowInfoDesktop(prev => !prev);
                        }
                      }}
                      aria-label="Информация по чату"
                    >
                      <Info size={14} />
                    </button>
                  </div>
                </header>

                <div className="platform-thread-messages">
                  {selectedChat.messages.map(message => (
                    <div key={message.id} className={`platform-message-row ${message.fromUser ? 'outgoing' : 'incoming'}`}>
                      <article className="platform-message-bubble">
                        <p className="platform-message-text">{message.text}</p>
                        <div className="platform-message-time">
                          {message.time} · {message.read ? 'прочитано' : 'доставлено'}
                        </div>
                      </article>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <footer className="platform-thread-composer">
                  {showTemplates && (
                    <Panel className="p-2">
                      <div className="grid gap-2">
                        {QUICK_REPLIES.map(reply => (
                          <button
                            key={reply}
                            type="button"
                            className="platform-btn-secondary justify-start"
                            onClick={() => {
                              setInputValue(reply);
                              setShowTemplates(false);
                            }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    </Panel>
                  )}

                  <div className="platform-composer-row">
                    <input
                      className="platform-input"
                      placeholder="Введите сообщение..."
                      value={inputValue}
                      onChange={event => setInputValue(event.target.value)}
                      onKeyDown={event => event.key === 'Enter' && sendMessage()}
                    />

                    <button
                      type="button"
                      className="platform-topbar-btn"
                      onClick={() => setShowTemplates(prev => !prev)}
                      title="Быстрые ответы"
                    >
                      <Bot size={15} />
                    </button>

                    <button
                      type="button"
                      className="platform-btn-primary"
                      onClick={sendMessage}
                      disabled={!inputValue.trim()}
                    >
                      <SendHorizontal size={15} />
                    </button>
                  </div>
                </footer>

                {showInfoDesktop && (
                  <aside className="platform-info-drawer hidden md:block">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <strong className="text-[14px]">Информация</strong>
                      <button
                        type="button"
                        className="platform-topbar-btn"
                        onClick={() => setShowInfoDesktop(false)}
                        aria-label="Закрыть панель"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <BuyerInfo chat={selectedChat} />
                  </aside>
                )}
              </>
            ) : (
              <div className="platform-chat-empty">
                <div>
                  <div className="text-[16px] font-semibold">Выберите чат</div>
                  <p className="mt-1 text-[13px] text-[var(--pf-text-muted)]">Список диалогов находится слева.</p>
                </div>
              </div>
            )}
          </section>
        </section>
      </PageShell>

      {showInfoMobile && selectedChat && (
        <>
          <button className="platform-mobile-overlay" onClick={() => setShowInfoMobile(false)} aria-label="Закрыть" />
          <div className="mobile-sheet">
            <div className="mb-3 flex items-center justify-between gap-2">
              <strong className="text-[15px]">Информация по диалогу</strong>
              <button className="platform-topbar-btn" onClick={() => setShowInfoMobile(false)} aria-label="Закрыть">
                <X size={14} />
              </button>
            </div>
            <BuyerInfo chat={selectedChat} />
          </div>
        </>
      )}
    </motion.div>
  );
}
