'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, CheckCheck, Loader2, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiChat, ApiMessage, chatsApi, createAccountWebSocket, SendMessageResponse } from '@/lib/api';
import { sanitizeInput } from '@/lib/sanitize';
import { EmptyState, PageHeader, PageShell, PageTitle, RequestErrorState, SectionCard, ToolbarRow } from '@/platform/components/primitives';

type ChatRow = ApiChat & { unread_count: number };
type ThreadMessage = ApiMessage;

function sortChatsByUpdatedAt(chats: ChatRow[]) {
  return [...chats].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
}

function moveChatToTop(chats: ChatRow[], nodeID: string) {
  const idx = chats.findIndex(chat => chat.node_id === nodeID);
  if (idx > 0) {
    const updated = [...chats];
    const [chat] = updated.splice(idx, 1);
    return [chat, ...updated];
  }
  return chats;
}

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function getAvatarLabel(name?: string) {
  const normalized = (name || '').trim();
  if (!normalized) return '?';
  return normalized[0].toUpperCase();
}

function toThreadMessages(rows: ApiMessage[]): ThreadMessage[] {
  return rows.map(msg => ({
    ...msg,
    status: msg.status || (msg.is_my_msg ? 'delivered' : undefined),
  }));
}

export default function Chats() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [activeAccountID, setActiveAccountID] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedChatID, setSelectedChatID] = useState<number | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedChatRef = useRef<ChatRow | null>(null);
  const messageLoadSeqRef = useRef(0);
  const loadChatsRef = useRef<(accountID: number, preserveSelection: boolean) => Promise<number | null>>(
    async () => null,
  );

  const selectedChat = useMemo(
    () => chats.find(chat => chat.id === selectedChatID) || null,
    [chats, selectedChatID],
  );

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const scrollThreadToBottom = useCallback(() => {
    const node = threadScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  const resizeComposer = useCallback((node?: HTMLTextAreaElement | null) => {
    const target = node ?? composerRef.current;
    if (!target) return;
    target.style.height = '44px';
    const nextHeight = Math.min(120, Math.max(44, target.scrollHeight));
    target.style.height = `${nextHeight}px`;
  }, []);

  const loadMessages = useCallback(
    async (chatID: number, options?: { silent?: boolean }) => {
      const requestID = ++messageLoadSeqRef.current;
      const silent = Boolean(options?.silent);

      if (!silent) {
        setMessages([]);
      }
      setMessagesError(null);
      setLoadingMessages(true);

      try {
        const rows = await chatsApi.messages(chatID, 50);
        if (requestID !== messageLoadSeqRef.current) return;

        const safeRows = Array.isArray(rows) ? rows : [];
        setMessages(toThreadMessages(safeRows));
        setChats(prev =>
          prev.map(chat => (chat.id === chatID ? { ...chat, unread: false, unread_count: 0 } : chat)),
        );
        requestAnimationFrame(scrollThreadToBottom);
      } catch (err) {
        if (requestID !== messageLoadSeqRef.current) return;
        const message = err instanceof Error ? err.message : 'Не удалось загрузить сообщения';
        setMessagesError(message);
        if (!silent) {
          setMessages([]);
          toast.error(message);
        }
      } finally {
        if (requestID === messageLoadSeqRef.current) {
          setLoadingMessages(false);
        }
      }
    },
    [scrollThreadToBottom],
  );

  const loadChats = useCallback(async (accountID: number, preserveSelection: boolean) => {
    const history = await chatsApi.history(accountID);
    const safeHistory = Array.isArray(history) ? history : [];

    const nextChats = sortChatsByUpdatedAt(
      safeHistory.map(chat => ({
        ...chat,
        unread_count: chat.unread ? 1 : 0,
      })),
    );

    setChats(nextChats);
    if (nextChats.length === 0) {
      setSelectedChatID(null);
      return null;
    }

    const currentSelected = selectedChatRef.current?.id;
    const nextSelected =
      preserveSelection && currentSelected && nextChats.some(chat => chat.id === currentSelected)
        ? currentSelected
        : nextChats[0].id;
    setSelectedChatID(nextSelected);
    return nextSelected;
  }, []);

  useEffect(() => {
    loadChatsRef.current = loadChats;
  }, [loadChats]);

  const handleChatSelect = useCallback(
    async (chat: ChatRow) => {
      setSelectedChatID(chat.id);
      setMessagesError(null);
      setChats(prev =>
        prev.map(row => (row.id === chat.id ? { ...row, unread: false, unread_count: 0 } : row)),
      );
      await loadMessages(chat.id);
      requestAnimationFrame(scrollThreadToBottom);
    },
    [loadMessages, scrollThreadToBottom],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setLoadError(null);
      setMessagesError(null);
      setMessages([]);
      setChats([]);
      setSelectedChatID(null);

      try {
        const rows = await accountsApi.list();
        if (cancelled) return;

        const safeAccounts = Array.isArray(rows) ? rows : [];
        setAccounts(safeAccounts);

        if (safeAccounts.length === 0) {
          setActiveAccountID(null);
          return;
        }

        const firstAccountID = safeAccounts[0].id;
        setActiveAccountID(firstAccountID);
        const nextSelected = await loadChats(firstAccountID, false);
        if (cancelled) return;

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки чатов';
        if (!cancelled) {
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, loadChats, loadMessages]);

  useEffect(() => {
    if (!activeAccountID) return;

    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const currentSelected = selectedChatRef.current?.id ?? null;
        const nextSelected = await loadChatsRef.current(activeAccountID, true);
        const target = currentSelected && nextSelected === currentSelected ? currentSelected : nextSelected;
        if (target) {
          await loadMessages(target, { silent: true });
        }
      } catch {
        // no-op
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [activeAccountID, loadMessages]);

  useEffect(() => {
    if (!activeAccountID) return;

    let cancelled = false;

    const connect = (attempt = 0) => {
      if (cancelled) return;

      const ws = createAccountWebSocket(activeAccountID, event => {
        if (event.type === 'message_confirmed') {
          const tempID = Number(event.data.temp_id ?? 0);
          const realID = Number(event.data.real_funpay_message_id ?? 0);
          if (!tempID) return;

          setMessages(prev =>
            prev.map(message => {
              const msgTempID = Number(message.temp_id ?? message.id);
              if (msgTempID !== tempID) return message;
              return {
                ...message,
                id: realID || message.id,
                temp_id: tempID,
                funpay_message_id: realID || message.funpay_message_id,
                status: 'delivered',
              };
            }),
          );
          return;
        }

        if (event.type !== 'new_message' && event.type !== 'message_sent') return;

        const nodeID = String(event.data.node_id ?? event.data.chat_node_id ?? '');
        if (!nodeID) return;

        const text = String(event.data.text ?? '');
        const authorName = String(event.data.author_name ?? event.data.with_user ?? '');
        const withUser = String(event.data.with_user ?? '');
        const createdAt = String(event.data.created_at ?? new Date().toISOString());
        const tempID = Number(event.data.temp_id ?? 0);
        const isMyMsg = Boolean(event.data.is_my_msg);
        const status = String(event.data.status ?? (isMyMsg ? 'pending' : 'delivered'));

        let found = false;
        let isOpened = false;
        let targetChatID = 0;

        setChats(prev => {
          const updated = prev.map(chat => {
            if (chat.node_id !== nodeID) return chat;

            found = true;
            targetChatID = chat.id;
            isOpened = selectedChatRef.current?.node_id === nodeID;

            const unread = isOpened ? false : !isMyMsg;
            return {
              ...chat,
              with_user: withUser || chat.with_user,
              last_message: text,
              updated_at: createdAt,
              unread,
              unread_count: unread ? chat.unread_count + 1 : 0,
            };
          });

          if (!found) {
            void loadChatsRef.current(activeAccountID, true);
            return prev;
          }
          return moveChatToTop(updated, nodeID);
        });

        if (!found || !isOpened || targetChatID === 0) return;

        const parsedCreatedAt = new Date(createdAt).getTime();
        setMessages(prev => {
          const duplicate = prev.some(message => {
            if (message.is_my_msg !== isMyMsg || message.text !== text) return false;
            if (message.created_at === createdAt) return true;

            const currentTime = new Date(message.created_at).getTime();
            if (!Number.isNaN(parsedCreatedAt) && !Number.isNaN(currentTime)) {
              return Math.abs(currentTime - parsedCreatedAt) <= 5000;
            }
            return false;
          });
          if (duplicate) return prev;

          const nextMessage: ThreadMessage = {
            id: Number(event.data.id ?? (tempID || Date.now())),
            temp_id: tempID || undefined,
            funpay_message_id: Number(event.data.real_funpay_message_id ?? event.data.funpay_message_id ?? 0) || undefined,
            chat_id: targetChatID,
            author_id: Number(event.data.author_id ?? 0),
            author_name: authorName,
            text,
            is_my_msg: isMyMsg,
            created_at: createdAt,
            status: isMyMsg ? (status as ThreadMessage['status']) : 'delivered',
          };
          return [...prev, nextMessage];
        });

        requestAnimationFrame(scrollThreadToBottom);
      });

      ws.onopen = () => {
        void loadChatsRef.current(activeAccountID, true).then(nextSelected => {
          const selectedID = selectedChatRef.current?.id ?? nextSelected;
          if (selectedID) {
            void loadMessages(selectedID, { silent: true });
          }
        });
      };
      ws.onerror = () => ws.close();
      ws.onclose = () => {
        if (socketRef.current === ws) {
          socketRef.current = null;
        }
        if (cancelled) return;

        const backoff = Math.min(15000, 3000 * Math.pow(2, attempt));
        const jitter = Math.floor(Math.random() * 400);
        reconnectTimerRef.current = setTimeout(() => connect(attempt + 1), backoff + jitter);
      };

      socketRef.current = ws;
    };

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [activeAccountID, loadMessages]);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter(chat => {
      const user = (chat.with_user || '').toLowerCase();
      const preview = (chat.last_message || '').toLowerCase();
      return user.includes(query) || preview.includes(query);
    });
  }, [chats, search]);

  const activeAccountName = useMemo(() => {
    if (!activeAccountID) return '';
    return accounts.find(account => account.id === activeAccountID)?.username || `ID ${activeAccountID}`;
  }, [accounts, activeAccountID]);

  async function switchAccount(nextAccountID: number) {
    setActiveAccountID(nextAccountID);
    setSelectedChatID(null);
    setMessages([]);
    setMessagesError(null);
    setLoading(true);
    setLoadError(null);

    try {
      await loadChats(nextAccountID, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки чатов';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!selectedChat || !activeAccountID) return;

    const text = sanitizeInput(inputValue.trim());
    if (!text || sending) return;

    setSending(true);
    const nowISO = new Date().toISOString();
    const optimisticID = -Date.now();
    const previousLastMessage = selectedChat.last_message;
    const previousUpdatedAt = selectedChat.updated_at;
    const optimistic: ThreadMessage = {
      id: optimisticID,
      temp_id: optimisticID,
      chat_id: selectedChat.id,
      author_id: 0,
      author_name: 'Вы',
      text,
      is_my_msg: true,
      created_at: nowISO,
      status: 'pending',
    };

    setMessages(prev => [...prev, optimistic]);
    setChats(prev =>
      moveChatToTop(
        prev.map(chat =>
          chat.node_id === selectedChat.node_id
            ? { ...chat, last_message: text, updated_at: nowISO, unread: false, unread_count: 0 }
            : chat,
        ),
        selectedChat.node_id,
      ),
    );

    setInputValue('');
    requestAnimationFrame(() => {
      resizeComposer();
      scrollThreadToBottom();
    });

    try {
      const response = await chatsApi.send(activeAccountID, selectedChat.node_id, text);
      const pendingTempID = response?.temp_id ?? optimisticID;
      const pendingTime = response?.created_at || nowISO;

      setMessages(prev =>
        prev.map(message =>
          message.id === optimisticID
            ? {
                ...message,
                id: pendingTempID,
                temp_id: pendingTempID,
                created_at: pendingTime,
                status: (response?.status as SendMessageResponse['status']) || 'pending',
              }
            : message,
        ),
      );

      setChats(prev =>
        moveChatToTop(
          prev.map(chat =>
            chat.node_id === selectedChat.node_id
              ? { ...chat, last_message: text, updated_at: pendingTime, unread: false, unread_count: 0 }
              : chat,
          ),
          selectedChat.node_id,
        ),
      );
    } catch (err) {
      setMessages(prev => prev.filter(message => message.id !== optimisticID));
      setChats(prev =>
        sortChatsByUpdatedAt(
          prev.map(chat =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  last_message: previousLastMessage,
                  updated_at: previousUpdatedAt,
                  unread: false,
                  unread_count: 0,
                }
              : chat,
          ),
        ),
      );
      setInputValue(text);
      requestAnimationFrame(() => {
        resizeComposer();
        composerRef.current?.focus();
      });
      toast.error(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  }

  async function retrySelectedMessages() {
    const chat = selectedChatRef.current;
    if (!chat) return;
    await handleChatSelect(chat);
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
            <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
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
                {activeAccountName && <div className="platform-account-badge">{activeAccountName}</div>}
              </div>

              <div className="platform-chat-scroll">
                {filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    className={`platform-chat-row ${chat.id === selectedChatID ? 'active' : ''} ${
                      chat.unread_count > 0 && chat.id !== selectedChatID ? 'unread' : ''
                    }`}
                    onClick={() => void handleChatSelect(chat)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="platform-chat-name">{chat.with_user || 'Пользователь'}</strong>
                      <span className="text-[11px] text-[var(--pf-text-dim)]">{formatTime(chat.updated_at)}</span>
                    </div>
                    <p className="platform-chat-preview">{chat.last_message || ''}</p>
                    {chat.unread_count > 0 && (
                      <div className="platform-chat-meta">
                        <span className="platform-chip">{chat.unread_count}</span>
                      </div>
                    )}
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
                      <div className="text-[12px] text-[var(--pf-text-dim)]">{activeAccountName}</div>
                    </div>
                  </header>

                  <div className="platform-thread-messages">
                    <div ref={threadScrollRef} className="platform-thread-messages-scroll">
                      {loadingMessages ? (
                        <div className="space-y-3 py-2">
                          <div className="h-14 w-[72%] animate-pulse rounded-xl bg-[rgba(148,163,184,0.15)]" />
                          <div className="ml-auto h-14 w-[56%] animate-pulse rounded-xl bg-[rgba(110,139,255,0.18)]" />
                          <div className="h-14 w-[68%] animate-pulse rounded-xl bg-[rgba(148,163,184,0.15)]" />
                        </div>
                      ) : messagesError ? (
                        <div className="platform-chat-empty gap-3">
                          <p>{messagesError || 'Не удалось загрузить сообщения'}</p>
                          <button className="platform-btn-secondary" onClick={() => void retrySelectedMessages()}>
                            Повторить
                          </button>
                        </div>
                      ) : messages.length === 0 ? (
                        <EmptyState>Нет сообщений. Напишите первым!</EmptyState>
                      ) : (
                        messages.map(message => (
                          <div
                            key={`${message.temp_id ?? message.id}-${message.created_at}`}
                            className={`platform-message-row ${message.is_my_msg ? 'outgoing' : 'incoming'}`}
                          >
                            {!message.is_my_msg && (
                              <div className="platform-message-avatar" aria-hidden="true">
                                {getAvatarLabel(message.author_name || selectedChat.with_user)}
                              </div>
                            )}
                            <article className={`platform-message-bubble ${message.is_my_msg ? 'outgoing' : 'incoming'}`}>
                              {!message.is_my_msg && (
                                <div className="mb-1 text-[11px] font-semibold text-[var(--pf-text-dim)]">
                                  {message.author_name || selectedChat.with_user || 'Собеседник'}
                                </div>
                              )}
                              <p className="platform-message-text">{message.text}</p>
                              <div className="platform-message-time">
                                {formatTime(message.created_at)}
                                {message.is_my_msg && (
                                  <span
                                    className="platform-message-status"
                                    aria-label={message.status === 'delivered' ? 'Доставлено' : 'Отправлено'}
                                  >
                                    {message.status === 'delivered' ? (
                                      <CheckCheck size={12} className="text-blue-400" />
                                    ) : (
                                      <Check size={12} className="text-gray-400" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </article>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <footer className="platform-thread-composer">
                    <div className="platform-composer-row">
                      <textarea
                        ref={composerRef}
                        className="platform-textarea"
                        placeholder="Введите сообщение..."
                        value={inputValue}
                        onChange={event => setInputValue(event.target.value)}
                        onInput={event => resizeComposer(event.currentTarget)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void sendMessage();
                          }
                        }}
                        rows={1}
                      />
                      <button className="platform-btn-primary" onClick={() => void sendMessage()} disabled={sending || !inputValue.trim()}>
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
