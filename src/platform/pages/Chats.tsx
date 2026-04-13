'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiChat, ApiMessage, chatsApi, createAccountWebSocket } from '@/lib/api';
import { sanitizeInput } from '@/lib/sanitize';
import { EmptyState, PageHeader, PageShell, PageTitle, RequestErrorState, SectionCard, ToolbarRow } from '@/platform/components/primitives';

type ChatRow = ApiChat & { accountName: string; unread_count: number };

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Chats() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [activeAccountID, setActiveAccountID] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedChatID, setSelectedChatID] = useState<number | null>(null);
  const [messagesByChat, setMessagesByChat] = useState<Record<number, ApiMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const selectedChatIDRef = useRef<number | null>(null);
  const refreshChatsRef = useRef<(accountID: number, preserveSelection: boolean) => Promise<void>>(async () => {});
  const [reloadKey, setReloadKey] = useState(0);

  const refreshChats = useCallback(async (accountID: number, preserveSelection: boolean) => {
    const history = await chatsApi.history(accountID);
    const safe = Array.isArray(history) ? history : [];
    const accountName = accounts.find(acc => acc.id === accountID)?.username || `ID ${accountID}`;

    const next: ChatRow[] = safe
      .map(chat => ({
        ...chat,
        accountName,
        unread_count: chat.unread ? 1 : 0,
      }))
      .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));

    setChats(next);
    if (next.length === 0) {
      setSelectedChatID(null);
      return;
    }

    const currentSelected = selectedChatIDRef.current;
    if (preserveSelection && currentSelected && next.some(chat => chat.id === currentSelected)) {
      return;
    }

    setSelectedChatID(next[0].id);
  }, [accounts]);

  useEffect(() => {
    selectedChatIDRef.current = selectedChatID;
  }, [selectedChatID]);

  useEffect(() => {
    refreshChatsRef.current = refreshChats;
  }, [refreshChats]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setMessagesByChat({});
      setChats([]);

      try {
        const rows = await accountsApi.list();
        if (cancelled) return;

        const safeAccounts = Array.isArray(rows) ? rows : [];
        setAccounts(safeAccounts);

        if (safeAccounts.length === 0) {
          setActiveAccountID(null);
          setSelectedChatID(null);
          return;
        }

        const firstAccountID = safeAccounts[0].id;
        setActiveAccountID(firstAccountID);

        const history = await chatsApi.history(firstAccountID);
        if (cancelled) return;

        const safeHistory = Array.isArray(history) ? history : [];
        const accountName = safeAccounts[0].username || `ID ${firstAccountID}`;
        const nextChats: ChatRow[] = safeHistory
          .map(chat => ({ ...chat, accountName, unread_count: chat.unread ? 1 : 0 }))
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));

        setChats(nextChats);
        setSelectedChatID(nextChats[0]?.id ?? null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки чатов';
        setLoadError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!activeAccountID) return;
    let cancelled = false;

    function connect(attempt = 0) {
      if (cancelled || !activeAccountID) return;

      const ws = createAccountWebSocket(activeAccountID, event => {
        if (event.type !== 'new_message') return;

        const nodeID = String(event.data.node_id ?? event.data.chat_node_id ?? '');
        if (!nodeID) return;

        const text = String(event.data.text ?? '');
        const authorName = String(event.data.author_name ?? event.data.with_user ?? '');
        const withUser = String(event.data.with_user ?? '');
        const isMyMsg = Boolean(event.data.is_my_msg);
        const created = new Date().toISOString();

        let targetChatID = 0;
        let found = false;

        setChats(prev => {
          const next = prev.map(row => {
            if (row.node_id !== nodeID) {
              return row;
            }
            found = true;
            targetChatID = row.id;
            return {
              ...row,
              with_user: withUser || row.with_user,
              last_message: text,
              updated_at: created,
              unread_count: row.id === selectedChatIDRef.current ? 0 : row.unread_count + 1,
            };
          });

          if (!found) {
            void refreshChatsRef.current(activeAccountID, true);
            return prev;
          }

          return next.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
        });

        if (!found || targetChatID === 0) return;

        setMessagesByChat(prev => {
          const existing = prev[targetChatID] || [];
          const next: ApiMessage = {
            id: Date.now(),
            chat_id: targetChatID,
            author_id: 0,
            author_name: authorName,
            text,
            is_my_msg: isMyMsg,
            created_at: created,
          };
          return { ...prev, [targetChatID]: [...existing, next] };
        });
      });

      ws.onclose = () => {
        if (socketRef.current === ws) {
          socketRef.current = null;
        }
        if (cancelled) return;
        const backoff = Math.min(15000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 300);
        reconnectTimer.current = setTimeout(() => connect(attempt + 1), backoff);
      };

      ws.onerror = () => ws.close();
      socketRef.current = ws;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [activeAccountID]);

  useEffect(() => {
    if (!selectedChatID) return;
    if (messagesByChat[selectedChatID]) {
      setChats(prev => prev.map(chat => (chat.id === selectedChatID ? { ...chat, unread_count: 0 } : chat)));
      return;
    }

    setLoadingMessages(true);
    chatsApi
      .messages(selectedChatID, 50)
      .then(rows => {
        const safeRows = Array.isArray(rows) ? rows : [];
        setMessagesByChat(prev => ({ ...prev, [selectedChatID]: safeRows }));
        setChats(prev => prev.map(chat => (chat.id === selectedChatID ? { ...chat, unread_count: 0 } : chat)));
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Ошибка загрузки сообщений'))
      .finally(() => setLoadingMessages(false));
  }, [selectedChatID, messagesByChat]);

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(row => row.with_user.toLowerCase().includes(q) || row.last_message.toLowerCase().includes(q));
  }, [chats, search]);

  const selectedChat = chats.find(chat => chat.id === selectedChatID) || null;
  const messages = selectedChatID ? messagesByChat[selectedChatID] || [] : [];

  async function sendMessage() {
    if (!selectedChat || !selectedChatID) return;
    const text = sanitizeInput(inputValue.trim());
    if (!text) return;

    setSending(true);
    try {
      await chatsApi.send(selectedChat.funpay_account_id, selectedChat.node_id, text);
      const now = new Date().toISOString();
      const own: ApiMessage = {
        id: Date.now(),
        chat_id: selectedChatID,
        author_id: 0,
        author_name: 'Вы',
        text,
        is_my_msg: true,
        created_at: now,
      };
      setMessagesByChat(prev => ({ ...prev, [selectedChatID]: [...(prev[selectedChatID] || []), own] }));
      setChats(prev =>
        prev
          .map(chat =>
            chat.id === selectedChatID
              ? { ...chat, last_message: text, updated_at: now, unread_count: 0 }
              : chat,
          )
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
      );
      setInputValue('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  }

  async function switchAccount(nextAccountID: number) {
    setActiveAccountID(nextAccountID);
    setSelectedChatID(null);
    setMessagesByChat({});
    setLoading(true);
    setLoadError(null);
    try {
      await refreshChats(nextAccountID, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки чатов';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Чаты" subtitle="История и сообщения в реальном времени по аккаунту." />
        </PageHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
            <p className="text-sm text-[var(--pf-text-dim)]">Подгружаем ваши чаты с FunPay...</p>
          </div>
        ) : loadError ? (
          <SectionCard>
            <RequestErrorState
              message={loadError}
              onRetry={() => setReloadKey(prev => prev + 1)}
            />
          </SectionCard>
        ) : (
          <section className="platform-chat-shell">
            <aside className="platform-chat-list">
              <div className="platform-chat-list-head">
                <select
                  className="platform-select mb-2"
                  value={activeAccountID ?? ''}
                  onChange={event => switchAccount(Number(event.target.value))}
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.username || `ID ${account.id}`}
                    </option>
                  ))}
                </select>

                <label className="platform-search max-w-none">
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Поиск по чатам"
                  />
                </label>
                <ToolbarRow>
                  <span className="platform-chip">Чатов: {chats.length}</span>
                  <span className="platform-chip">Непрочитано: {chats.reduce((sum, item) => sum + item.unread_count, 0)}</span>
                </ToolbarRow>
              </div>

              <div className="platform-chat-scroll">
                {filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    className={`platform-chat-row ${chat.id === selectedChatID ? 'active' : ''}`}
                    onClick={() => setSelectedChatID(chat.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="platform-chat-name">{chat.with_user || 'Пользователь'}</strong>
                      <span className="text-[11px] text-[var(--pf-text-dim)]">{formatTime(chat.updated_at)}</span>
                    </div>
                    <p className="platform-chat-preview">{chat.last_message || ''}</p>
                    <div className="platform-chat-meta">
                      <span>{chat.accountName}</span>
                      {chat.unread_count > 0 && <span className="platform-chip">{chat.unread_count}</span>}
                    </div>
                  </button>
                ))}
                {filteredChats.length === 0 && chats.length === 0 && (
                  <EmptyState>Чаты не найдены. Если вы только что добавили аккаунт, подождите 30 секунд и обновите страницу.</EmptyState>
                )}
                {filteredChats.length === 0 && chats.length > 0 && (
                  <EmptyState>Чаты не найдены по текущему фильтру.</EmptyState>
                )}
              </div>
            </aside>

            <section className="platform-chat-thread">
              {!selectedChat ? (
                <EmptyState>Выберите чат слева.</EmptyState>
              ) : (
                <>
                  <header className="platform-thread-head">
                    <div>
                      <div className="text-[14px] font-bold">{selectedChat.with_user || 'Пользователь'}</div>
                      <div className="text-[12px] text-[var(--pf-text-dim)]">{selectedChat.accountName}</div>
                    </div>
                  </header>

                  <div className="platform-thread-messages">
                    <div className="platform-thread-messages-scroll">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 size={24} className="animate-spin text-[var(--pf-accent)]" />
                        </div>
                      ) : (
                        messages.map(message => (
                          <div
                            key={`${message.id}-${message.created_at}`}
                            className={`platform-message-row ${message.is_my_msg ? 'outgoing' : 'incoming'}`}
                          >
                            <article className="platform-message-bubble">
                              <p className="platform-message-text">{message.text}</p>
                              <div className="platform-message-time">{formatTime(message.created_at)}</div>
                            </article>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <footer className="platform-thread-composer">
                    <div className="platform-composer-row">
                      <input
                        className="platform-input"
                        placeholder="Введите сообщение..."
                        value={inputValue}
                        onChange={event => setInputValue(event.target.value)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <button className="platform-btn-primary" onClick={sendMessage} disabled={sending || !inputValue.trim()}>
                        {sending ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
                      </button>
                    </div>
                  </footer>
                </>
              )}
            </section>
          </section>
        )}
      </PageShell>
    </motion.div>
  );
}
