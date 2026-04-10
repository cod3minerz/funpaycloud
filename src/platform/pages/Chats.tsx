'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bot,
  ExternalLink,
  Filter,
  Info,
  Loader2,
  Search,
  SendHorizontal,
  TriangleAlert,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiChat, ApiMessage, chatsApi, createAccountWebSocket } from '@/lib/api';
import { sanitizeInput } from '@/lib/sanitize';
import { PageHeader, PageShell, PageTitle, Panel, ToolbarRow } from '@/platform/components/primitives';

type ReadStateFilter = 'all' | 'unread';

type ChatView = ApiChat & {
  accountId: string | number;
  sellerName: string;
  messages: ApiMessage[];
  messagesLoaded: boolean;
};

const QUICK_REPLIES = [
  'Добрый день. Заказ уже в обработке, сейчас отправлю детали.',
  'Спасибо за покупку. Если потребуется помощь, я на связи.',
  'Проверяю ситуацию и вернусь с ответом в течение пары минут.',
  'Отправил инструкцию по заказу. Если что-то не так, напишите.',
];

const CHAT_AVATAR_PALETTE = [
  ['#2a3344', '#1d2432'],
  ['#243349', '#1b2738'],
  ['#2b3a52', '#202a3a'],
  ['#2b3548', '#1f2837'],
  ['#28364c', '#1d2738'],
  ['#2b3442', '#212834'],
] as const;

function accountGradient(seed: string) {
  const value = String(seed).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const [from, to] = CHAT_AVATAR_PALETTE[value % CHAT_AVATAR_PALETTE.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function toFunPayUserLink(username: string) {
  return `https://funpay.com/users/${encodeURIComponent(username)}`;
}

export default function Chats() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [chats, setChats] = useState<ChatView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [readState, setReadState] = useState<ReadStateFilter>('all');
  const [accountScope, setAccountScope] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showInfoDesktop, setShowInfoDesktop] = useState(false);
  const [showInfoMobile, setShowInfoMobile] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  // Track open WebSockets
  const wsRefs = useRef<Map<string | number, WebSocket>>(new Map());

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  // Load accounts then load chats for each
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const accs = await accountsApi.list();
        if (cancelled) return;
        setAccounts(accs);

        const chatsByAccount = await Promise.allSettled(
          accs.map(acc => chatsApi.history(acc.id).then(cs => ({ acc, cs }))),
        );

        if (cancelled) return;

        const allChats: ChatView[] = [];
        for (const result of chatsByAccount) {
          if (result.status === 'fulfilled') {
            const { acc, cs } = result.value;
            for (const c of cs) {
              allChats.push({
                ...c,
                accountId: acc.id,
                sellerName: acc.username,
                messages: [],
                messagesLoaded: false,
              });
            }
          }
        }
        setChats(allChats);
        if (allChats.length > 0) setSelectedId(allChats[0].id);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Ошибка загрузки чатов');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      // Close all WebSockets
      wsRefs.current.forEach(ws => ws.close());
      wsRefs.current.clear();
    };
  }, []);

  // Connect WebSockets for each account
  useEffect(() => {
    if (accounts.length === 0) return;

    for (const acc of accounts) {
      if (wsRefs.current.has(acc.id)) continue;

      const ws = createAccountWebSocket(acc.id, event => {
        if (event.type === 'new_message') {
          const payload = event.payload as Record<string, unknown>;
          const chatId = payload.chat_id as string | number;
          const msg: ApiMessage = {
            id: String(Date.now()),
            text: String(payload.text ?? ''),
            from_user: false,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            read: false,
          };
          setChats(prev =>
            prev.map(c =>
              String(c.id) === String(chatId)
                ? { ...c, unread: (c.unread ?? 0) + 1, last_message: msg.text, messages: [...c.messages, msg] }
                : c,
            ),
          );
        }
      });

      wsRefs.current.set(acc.id, ws);
    }
  }, [accounts]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedId === null) return;

    const chat = chats.find(c => c.id === selectedId);
    if (!chat || chat.messagesLoaded) {
      // Mark unread as 0
      setChats(prev => prev.map(c => (c.id === selectedId ? { ...c, unread: 0 } : c)));
      return;
    }

    chatsApi
      .messages(selectedId)
      .then(msgs => {
        setChats(prev =>
          prev.map(c =>
            c.id === selectedId ? { ...c, messages: msgs, messagesLoaded: true, unread: 0 } : c,
          ),
        );
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Ошибка загрузки сообщений'));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [selectedId, chats]);

  const filteredRows = useMemo(() => {
    return chats.filter(c => {
      if (readState === 'unread' && (c.unread ?? 0) === 0) return false;
      if (accountScope !== 'all' && String(c.accountId) !== accountScope) return false;
      if (search && !String(c.buyer ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [chats, readState, accountScope, search]);

  const selectedChat = chats.find(c => c.id === selectedId) ?? null;
  const visibleMessages = selectedChat?.messages ?? [];

  function openChat(chatId: string | number) {
    setSelectedId(chatId);
    setShowInfoDesktop(false);
    setShowInfoMobile(false);
    if (isMobile) setMobileThreadOpen(true);
  }

  async function sendMessage() {
    if (!selectedId || !inputValue.trim() || !selectedChat) return;
    const text = sanitizeInput(inputValue.trim());
    if (!text) return;

    setSending(true);
    try {
      await chatsApi.send(selectedChat.accountId, selectedId, text);
      const msg: ApiMessage = {
        id: String(Date.now()),
        text,
        from_user: true,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        read: true,
      };
      setChats(prev =>
        prev.map(c =>
          c.id === selectedId
            ? { ...c, last_message: text, messages: [...c.messages, msg] }
            : c,
        ),
      );
      setInputValue('');
      setShowTemplates(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
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
            <span className="platform-chip">Всего диалогов: {chats.length}</span>
            <span className="platform-chip">Непрочитанные: {chats.filter(c => (c.unread ?? 0) > 0).length}</span>
          </ToolbarRow>
        </PageHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : (
          <section className="platform-chat-shell">
            <aside className={`platform-chat-list ${isMobile && mobileThreadOpen ? 'mobile-hidden' : ''}`}>
              <div className="platform-chat-list-head">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-bold">Диалоги</div>
                  <button
                    type="button"
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
                    placeholder="Поиск по покупателю"
                  />
                </label>

                {showFilters && (
                  <Panel className="p-3">
                    <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--pf-text-dim)]">ФИЛЬТРЫ</div>
                    <div className="mt-2 grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button className={readState === 'all' ? 'platform-btn-primary' : 'platform-btn-secondary'} style={{ minHeight: 34 }} onClick={() => setReadState('all')}>Все</button>
                        <button className={readState === 'unread' ? 'platform-btn-primary' : 'platform-btn-secondary'} style={{ minHeight: 34 }} onClick={() => setReadState('unread')}>Непрочитанные</button>
                      </div>
                      <select className="platform-select" value={accountScope} onChange={e => setAccountScope(e.target.value)}>
                        <option value="all">Все аккаунты</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={String(acc.id)}>{acc.username}</option>
                        ))}
                      </select>
                      <button className="platform-btn-secondary" onClick={() => { setReadState('all'); setAccountScope('all'); }}>Сбросить фильтры</button>
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
                      type="button"
                      className={`platform-chat-row${isActive ? ' active' : ''}${(row.unread ?? 0) > 0 ? ' unread' : ''}`}
                      onClick={() => openChat(row.id)}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          style={{
                            width: 38, height: 38, borderRadius: 999,
                            background: accountGradient(String(row.accountId)),
                            border: '1px solid rgba(148,163,184,0.22)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            color: '#dbe8ff', fontWeight: 800, flexShrink: 0,
                          }}
                        >
                          {String(row.buyer ?? '?')[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="platform-chat-name">{String(row.buyer ?? '')}</span>
                            <span className="text-[11px] text-[var(--pf-text-dim)]">{String(row.last_time ?? '')}</span>
                          </div>
                          <p className="platform-chat-preview">{String(row.last_message ?? '')}</p>
                          <div className="platform-chat-meta">
                            <span className="text-[11px] text-[var(--pf-text-dim)]">{row.sellerName}</span>
                            {(row.unread ?? 0) > 0 && <span className="platform-unread-dot" aria-hidden="true" />}
                            {(row.unread ?? 0) > 0 && (
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

            <section className={`platform-chat-thread ${isMobile && !mobileThreadOpen ? 'mobile-thread-collapsed' : ''}`}>
              {selectedChat ? (
                <>
                  <header className="platform-thread-head">
                    <div className="flex min-w-0 items-center gap-3">
                      <button type="button" className="platform-topbar-btn platform-mobile-only" onClick={() => setMobileThreadOpen(false)}>
                        <ArrowLeft size={15} />
                      </button>
                      <span
                        className="platform-avatar"
                        style={{
                          width: 36, height: 36,
                          background: accountGradient(String(selectedChat.accountId)),
                          border: '1px solid rgba(148,163,184,0.22)',
                          color: '#dbe8ff', fontSize: 12,
                        }}
                      >
                        {String(selectedChat.buyer ?? '?')[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-bold">{String(selectedChat.buyer ?? '')}</div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--pf-text-dim)]">
                          <span>{selectedChat.sellerName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <a href={toFunPayUserLink(String(selectedChat.buyer ?? ''))} target="_blank" rel="noreferrer" className="platform-topbar-btn hidden sm:inline-flex">
                        <ExternalLink size={14} />
                      </a>
                      <button type="button" className="platform-topbar-btn" onClick={() => { if (isMobile) setShowInfoMobile(true); else setShowInfoDesktop(p => !p); }}>
                        <Info size={14} />
                      </button>
                    </div>
                  </header>

                  <div className="platform-thread-messages">
                    <div ref={threadScrollRef} className="platform-thread-messages-scroll">
                      {visibleMessages.map(message => (
                        <div key={message.id} className={`platform-message-row ${message.from_user ? 'outgoing' : 'incoming'}`}>
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
                              onClick={() => { setInputValue(reply); setShowTemplates(false); }}
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
                        onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
                      />
                      <button type="button" className="platform-topbar-btn" onClick={() => setShowTemplates(prev => !prev)} title="Быстрые ответы">
                        <Bot size={15} />
                      </button>
                      <button type="button" className="platform-btn-primary" onClick={sendMessage} disabled={!inputValue.trim() || sending}>
                        {sending ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
                      </button>
                    </div>
                  </footer>

                  {showInfoDesktop && (
                    <aside className="platform-info-drawer hidden md:block">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <strong className="text-[14px]">Информация</strong>
                        <button type="button" className="platform-topbar-btn" onClick={() => setShowInfoDesktop(false)}>
                          <X size={14} />
                        </button>
                      </div>
                      <Panel className="p-3">
                        <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--pf-text-dim)]">ПРОФИЛЬ</div>
                        <div className="mt-2 text-[17px] font-extrabold">{String(selectedChat.buyer ?? '')}</div>
                        <a href={toFunPayUserLink(String(selectedChat.buyer ?? ''))} target="_blank" rel="noreferrer" className="platform-btn-secondary mt-3 inline-flex">
                          Профиль на FunPay <ExternalLink size={13} />
                        </a>
                      </Panel>
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
        )}
      </PageShell>

      {showInfoMobile && selectedChat && (
        <>
          <button type="button" className="platform-mobile-overlay" onClick={() => setShowInfoMobile(false)} aria-label="Закрыть" />
          <div className="mobile-sheet">
            <div className="platform-mobile-sheet">
              <div className="mb-3 flex items-center justify-between gap-2">
                <strong className="text-[15px]">Информация по диалогу</strong>
                <button className="platform-topbar-btn" onClick={() => setShowInfoMobile(false)}>
                  <X size={14} />
                </button>
              </div>
              <Panel className="p-3">
                <div className="text-[17px] font-extrabold">{String(selectedChat.buyer ?? '')}</div>
                <a href={toFunPayUserLink(String(selectedChat.buyer ?? ''))} target="_blank" rel="noreferrer" className="platform-btn-secondary mt-3 inline-flex">
                  Профиль на FunPay <ExternalLink size={13} />
                </a>
              </Panel>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
