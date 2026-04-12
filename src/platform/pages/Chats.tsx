'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedChatID, setSelectedChatID] = useState<number | null>(null);
  const [messagesByChat, setMessagesByChat] = useState<Record<number, ApiMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const reconnectTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const sockets = useRef<Map<number, WebSocket>>(new Map());
  const closedRef = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const accs = await accountsApi.list();
        if (cancelled) return;
        const safeAccounts = Array.isArray(accs) ? accs : [];
        setAccounts(safeAccounts);

        const rows = await Promise.allSettled(
          safeAccounts.map(async acc => {
            const history = await chatsApi.history(acc.id);
            return { acc, history: Array.isArray(history) ? history : [] };
          }),
        );
        if (cancelled) return;

        const merged: ChatRow[] = [];
        for (const row of rows) {
          if (row.status !== 'fulfilled') continue;
          for (const chat of row.value.history) {
            merged.push({
              ...chat,
              accountName: row.value.acc.username || `ID ${row.value.acc.id}`,
              unread_count: chat.unread ? 1 : 0,
            });
          }
        }
        merged.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
        setChats(merged);
        if (merged.length > 0) setSelectedChatID(merged[0].id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки чатов';
        setLoadError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      closedRef.current = true;
      reconnectTimers.current.forEach(timer => clearTimeout(timer));
      reconnectTimers.current.clear();
      sockets.current.forEach(ws => ws.close());
      sockets.current.clear();
    };
  }, [reloadKey]);

  useEffect(() => {
    if (accounts.length === 0) return;
    closedRef.current = false;

    function connect(accountID: number, attempt = 0) {
      if (closedRef.current) return;
      const ws = createAccountWebSocket(accountID, event => {
        if (event.type !== 'new_message') return;
        const chatID = Number(event.data.chat_id);
        const text = String(event.data.text ?? '');
        const authorName = String(event.data.author_name ?? '');
        const created = new Date().toISOString();

        setChats(prev =>
          prev
            .map(row =>
              row.id === chatID
                ? {
                    ...row,
                    last_message: text,
                    updated_at: created,
                    unread_count: row.id === selectedChatID ? 0 : row.unread_count + 1,
                  }
                : row,
            )
            .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
        );

        setMessagesByChat(prev => {
          const existing = prev[chatID] || [];
          const next: ApiMessage = {
            id: Date.now(),
            chat_id: chatID,
            author_id: 0,
            author_name: authorName,
            text,
            is_my_msg: false,
            created_at: created,
          };
          return { ...prev, [chatID]: [...existing, next] };
        });
      });

      ws.onclose = () => {
        sockets.current.delete(accountID);
        if (closedRef.current) return;
        const backoff = Math.min(15000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 300);
        const timer = setTimeout(() => connect(accountID, attempt + 1), backoff);
        reconnectTimers.current.set(accountID, timer);
      };
      ws.onerror = () => ws.close();
      sockets.current.set(accountID, ws);
    }

    for (const acc of accounts) {
      if (sockets.current.has(acc.id)) continue;
      connect(Number(acc.id));
    }
  }, [accounts, selectedChatID]);

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
      await chatsApi.send(selectedChat.funpay_account_id, selectedChatID, text);
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
          .map(chat => (chat.id === selectedChatID ? { ...chat, last_message: text, updated_at: now } : chat))
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
      );
      setInputValue('');
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
          <PageTitle title="Чаты" subtitle="История и сообщения в реальном времени по всем аккаунтам." />
        </PageHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
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
                {filteredChats.length === 0 && <EmptyState>Чаты не найдены.</EmptyState>}
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
