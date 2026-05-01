'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, CheckCheck, Loader2, SendHorizontal, SearchX, MessageSquareQuote, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiChat, ApiMessage, chatsApi, createAccountWebSocket, SendMessageResponse } from '@/lib/api';
import { sanitizeInput } from '@/lib/sanitize';
import { EmptyState, PageHeader, PageShell, PageTitle, RequestErrorState, SectionCard } from '@/platform/components/primitives';

type ChatRow = ApiChat & { unread_count: number };
type ThreadMessage = ApiMessage & { row_id?: number; source?: string | null };
type AccountScope = 'all' | number;
type ThreadRenderItem =
  | { type: 'separator'; key: string; label: string }
  | { type: 'message'; key: string; message: ThreadMessage; grouped: boolean };

type LoadMessagesMode = 'replace' | 'silent-merge' | 'prepend-history' | 'append-live';

const CHAT_PAGE_SIZE = 50;
const MESSAGE_FALLBACK_WINDOW_MS = 15_000;
const PENDING_MATCH_WINDOW_MS = 15_000;

const AVATAR_TONES = [
  'platform-avatar-tone-0',
  'platform-avatar-tone-1',
  'platform-avatar-tone-2',
  'platform-avatar-tone-3',
  'platform-avatar-tone-4',
  'platform-avatar-tone-5',
  'platform-avatar-tone-6',
  'platform-avatar-tone-7',
] as const;

function sortChatsByUpdatedAt(chats: ChatRow[]) {
  return [...chats].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
}

function moveChatToTop(chats: ChatRow[], nodeID: string, accountID?: number) {
  const idx = chats.findIndex(chat => {
    if (chat.node_id !== nodeID) return false;
    if (!accountID) return true;
    return (chat.funpay_account_id ?? 0) === accountID;
  });
  if (idx > 0) {
    const updated = [...chats];
    const [chat] = updated.splice(idx, 1);
    return [chat, ...updated];
  }
  return chats;
}

function isChatMatch(chat: ChatRow | null | undefined, nodeID: string, accountID: number) {
  if (!chat) return false;
  return chat.node_id === nodeID && (chat.funpay_account_id ?? 0) === accountID;
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

function getAvatarToneClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function formatDateSeparator(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
}

function toThreadMessages(rows: ApiMessage[]): ThreadMessage[] {
  return rows.map(msg => ({
    ...msg,
    row_id: msg.id,
    status: msg.status || (msg.is_my_msg ? 'delivered' : undefined),
  }));
}

function normalizeAuthorName(value?: string) {
  return (value || '').trim().toLowerCase();
}

function messageTimestamp(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getMessageClientKey(message: ThreadMessage): string | null {
  if (message.temp_id) return `temp:${message.temp_id}`;
  if (message.funpay_message_id) return `fp:${message.funpay_message_id}`;
  if (message.row_id) return `row:${message.row_id}`;
  return null;
}

function statusRank(status?: ThreadMessage['status']) {
  switch (status) {
    case 'delivered':
      return 3;
    case 'pending':
      return 2;
    case 'failed':
      return 1;
    default:
      return 0;
  }
}

function isFallbackDuplicate(a: ThreadMessage, b: ThreadMessage, windowMs = MESSAGE_FALLBACK_WINDOW_MS) {
  if (a.is_my_msg !== b.is_my_msg) return false;
  if (a.text !== b.text) return false;
  if (!a.is_my_msg && normalizeAuthorName(a.author_name) !== normalizeAuthorName(b.author_name)) {
    return false;
  }
  const aTime = messageTimestamp(a.created_at);
  const bTime = messageTimestamp(b.created_at);
  if (!aTime || !bTime) return false;
  return Math.abs(aTime - bTime) <= windowMs;
}

function choosePreferredMessage(current: ThreadMessage, incoming: ThreadMessage): ThreadMessage {
  const next: ThreadMessage = {
    ...current,
    ...incoming,
    row_id: incoming.row_id ?? current.row_id,
    temp_id: incoming.temp_id ?? current.temp_id,
    funpay_message_id: incoming.funpay_message_id ?? current.funpay_message_id,
    chat_id: incoming.chat_id ?? current.chat_id,
    author_id: incoming.author_id ?? current.author_id,
    author_name: incoming.author_name || current.author_name,
    text: incoming.text || current.text,
    is_my_msg: incoming.is_my_msg ?? current.is_my_msg,
    source: incoming.source ?? current.source,
  };

  if (statusRank(current.status) > statusRank(incoming.status)) {
    next.status = current.status;
  } else {
    next.status = incoming.status ?? current.status;
  }

  if (messageTimestamp(current.created_at) > messageTimestamp(incoming.created_at)) {
    next.created_at = current.created_at;
  } else if (!incoming.created_at) {
    next.created_at = current.created_at;
  }

  return next;
}

function sortThreadMessages(rows: ThreadMessage[]) {
  return [...rows].sort((a, b) => {
    const timeDiff = messageTimestamp(a.created_at) - messageTimestamp(b.created_at);
    if (timeDiff !== 0) return timeDiff;
    const rowDiff = (a.row_id ?? Number.MAX_SAFE_INTEGER) - (b.row_id ?? Number.MAX_SAFE_INTEGER);
    if (rowDiff !== 0) return rowDiff;
    const tempDiff = (a.temp_id ?? Number.MAX_SAFE_INTEGER) - (b.temp_id ?? Number.MAX_SAFE_INTEGER);
    if (tempDiff !== 0) return tempDiff;
    return (a.funpay_message_id ?? Number.MAX_SAFE_INTEGER) - (b.funpay_message_id ?? Number.MAX_SAFE_INTEGER);
  });
}

function mergeThreadMessages(current: ThreadMessage[], incoming: ThreadMessage[], mode: LoadMessagesMode): ThreadMessage[] {
  const baseline = mode === 'replace' ? [] : [...current];

  for (const candidate of incoming) {
    const keyedIndex = baseline.findIndex(existing => {
      if (candidate.temp_id && existing.temp_id === candidate.temp_id) return true;
      if (candidate.funpay_message_id && existing.funpay_message_id === candidate.funpay_message_id) return true;
      if (candidate.row_id && existing.row_id === candidate.row_id) return true;
      const existingKey = getMessageClientKey(existing);
      const candidateKey = getMessageClientKey(candidate);
      return existingKey !== null && candidateKey !== null && existingKey === candidateKey;
    });

    if (keyedIndex >= 0) {
      baseline[keyedIndex] = choosePreferredMessage(baseline[keyedIndex], candidate);
      continue;
    }

    const fallbackIndex = baseline.findIndex(existing => isFallbackDuplicate(existing, candidate));
    if (fallbackIndex >= 0) {
      baseline[fallbackIndex] = choosePreferredMessage(baseline[fallbackIndex], candidate);
      continue;
    }

    baseline.push(candidate);
  }

  return sortThreadMessages(baseline);
}

function getOldestRowId(rows: ThreadMessage[]): number | null {
  for (const row of rows) {
    if (row.row_id) return row.row_id;
  }
  return null;
}

function findRecentOwnPendingCandidate(rows: ThreadMessage[], text: string, createdAt?: string): ThreadMessage | null {
  const targetTime = messageTimestamp(createdAt) || Date.now();
  let match: ThreadMessage | null = null;

  for (const row of rows) {
    if (!row.is_my_msg) continue;
    if (row.status !== 'pending') continue;
    if ((row.funpay_message_id ?? 0) > 0) continue;
    if (row.text !== text) continue;
    const rowTime = messageTimestamp(row.created_at);
    if (!rowTime || Math.abs(targetTime - rowTime) > PENDING_MATCH_WINDOW_MS) continue;
    if (!match || rowTime > messageTimestamp(match.created_at)) {
      match = row;
    }
  }

  return match;
}

function updateChatRows(
  chats: ChatRow[],
  params: {
    nodeID: string;
    accountID: number;
    withUser?: string;
    lastMessage?: string;
    updatedAt?: string;
    unread?: boolean;
    isOpened: boolean;
  },
) {
  let found = false;
  const updated = chats.map(chat => {
    if (!isChatMatch(chat, params.nodeID, params.accountID)) return chat;
    found = true;
    const unread = params.isOpened ? false : Boolean(params.unread);
    return {
      ...chat,
      with_user: params.withUser || chat.with_user,
      last_message: params.lastMessage ?? chat.last_message,
      updated_at: params.updatedAt || chat.updated_at,
      unread,
      unread_count: unread ? Math.max(chat.unread_count, 1) : 0,
    };
  });

  return {
    found,
    rows: found ? moveChatToTop(updated, params.nodeID, params.accountID) : chats,
  };
}

export default function Chats() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [accountScope, setAccountScope] = useState<AccountScope>('all');
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedChatID, setSelectedChatID] = useState<number | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<number | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reconnectTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const heartbeatTimersRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const socketsRef = useRef<Map<number, WebSocket>>(new Map());
  const wsResyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const chatsRef = useRef<ChatRow[]>([]);
  const messagesRef = useRef<ThreadMessage[]>([]);
  const loadingMoreRef = useRef(false);
  const selectedChatRef = useRef<ChatRow | null>(null);
  const messageLoadSeqRef = useRef(0);
  const silentResyncInFlightRef = useRef(false);
  const lastMessagesLoadRef = useRef<{ chatID: number; at: number } | null>(null);
  const threadScrollHeightBeforePrependRef = useRef<number | null>(null);
  const threadScrollTopBeforePrependRef = useRef<number | null>(null);
  const loadChatsRef = useRef<(scope: AccountScope, preserveSelection: boolean) => Promise<number | null>>(
    async () => null,
  );

  const selectedChat = useMemo(
    () => chats.find(chat => chat.id === selectedChatID) || null,
    [chats, selectedChatID],
  );

  const threadRenderItems = useMemo<ThreadRenderItem[]>(() => {
    const items: ThreadRenderItem[] = [];
    let previousMessage: ThreadMessage | null = null;
    let previousDateKey = '';

    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at);
      const dateKey = Number.isNaN(messageDate.getTime())
        ? `unknown-${message.created_at}-${index}`
        : `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`;

      if (dateKey !== previousDateKey) {
        items.push({
          type: 'separator',
          key: `sep-${dateKey}-${index}`,
          label: formatDateSeparator(message.created_at),
        });
        previousDateKey = dateKey;
      }

      const currentTimestamp = messageDate.getTime();
      const previousTimestamp = previousMessage ? new Date(previousMessage.created_at).getTime() : Number.NaN;
      const withinFiveMinutes =
        !Number.isNaN(currentTimestamp) &&
        !Number.isNaN(previousTimestamp) &&
        currentTimestamp - previousTimestamp < 5 * 60 * 1000;

      const grouped =
        Boolean(previousMessage) &&
        previousMessage?.is_my_msg === message.is_my_msg &&
        (previousMessage?.author_name || '').trim() === (message.author_name || '').trim() &&
        withinFiveMinutes;

      items.push({
        type: 'message',
        key:
          message.row_id != null
            ? `row:${message.row_id}`
            : message.temp_id != null
              ? `temp:${message.temp_id}`
              : message.funpay_message_id != null
                ? `fp:${message.funpay_message_id}`
                : `msg-${message.id}-${message.created_at}-${index}`,
        message,
        grouped,
      });

      previousMessage = message;
    });

    return items;
  }, [messages]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
    async (
      chatID: number,
      options?: { silent?: boolean; beforeId?: number; mode?: LoadMessagesMode },
    ) => {
      const mode = options?.mode ?? (options?.silent ? 'silent-merge' : 'replace');
      const beforeId = options?.beforeId ?? 0;
      const shouldTrackSequence = mode !== 'prepend-history';
      const requestID = shouldTrackSequence ? ++messageLoadSeqRef.current : messageLoadSeqRef.current;

      if (mode === 'replace') {
        lastMessagesLoadRef.current = { chatID, at: Date.now() };
        setMessages([]);
        setMessagesError(null);
        setRefreshingMessages(false);
        setLoadingMore(false);
        setLoadingMessages(true);
        setOldestMessageId(null);
        setHasMoreMessages(false);
      } else if (mode === 'silent-merge') {
        lastMessagesLoadRef.current = { chatID, at: Date.now() };
        setRefreshingMessages(true);
        setMessagesError(null);
      } else {
        if (!beforeId) return;
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        const node = threadScrollRef.current;
        threadScrollHeightBeforePrependRef.current = node?.scrollHeight ?? null;
        threadScrollTopBeforePrependRef.current = node?.scrollTop ?? null;
        setLoadingMore(true);
      }

      try {
        const rows = await chatsApi.messages(chatID, CHAT_PAGE_SIZE, beforeId);
        if (selectedChatRef.current?.id !== chatID && mode === 'prepend-history') {
          return;
        }
        if (shouldTrackSequence && requestID !== messageLoadSeqRef.current) return;

        const safeRows = Array.isArray(rows) ? rows : [];
        const nextRows = toThreadMessages(safeRows);

        if (mode === 'replace') {
          const merged = mergeThreadMessages([], nextRows, 'replace');
          setMessages(merged);
          setOldestMessageId(getOldestRowId(merged));
          setHasMoreMessages(safeRows.length === CHAT_PAGE_SIZE && getOldestRowId(merged) != null);
          lastMessagesLoadRef.current = { chatID, at: Date.now() };
          setChats(prev =>
            prev.map(chat => (chat.id === chatID ? { ...chat, unread: false, unread_count: 0 } : chat)),
          );
          requestAnimationFrame(scrollThreadToBottom);
          return;
        }

        if (mode === 'silent-merge') {
          const merged = mergeThreadMessages(messagesRef.current, nextRows, 'silent-merge');
          setMessages(merged);
          setOldestMessageId(getOldestRowId(merged));
          lastMessagesLoadRef.current = { chatID, at: Date.now() };
          setChats(prev =>
            prev.map(chat => (chat.id === chatID ? { ...chat, unread: false, unread_count: 0 } : chat)),
          );
          return;
        }

        const merged = mergeThreadMessages(messagesRef.current, nextRows, 'prepend-history');
        setMessages(merged);
        setOldestMessageId(getOldestRowId(merged));
        setHasMoreMessages(safeRows.length === CHAT_PAGE_SIZE && safeRows.length > 0);
      } catch (err) {
        if (shouldTrackSequence && requestID !== messageLoadSeqRef.current) return;
        const message = err instanceof Error ? err.message : 'Не удалось загрузить сообщения';
        if (mode === 'replace') {
          setMessagesError(message);
          setMessages([]);
          toast.error(message);
        }
      } finally {
        if (mode === 'replace') {
          if (!shouldTrackSequence || requestID === messageLoadSeqRef.current) {
            setLoadingMessages(false);
          }
        } else if (mode === 'silent-merge') {
          if (!shouldTrackSequence || requestID === messageLoadSeqRef.current) {
            setRefreshingMessages(false);
          }
        } else {
          loadingMoreRef.current = false;
          setLoadingMore(false);
          requestAnimationFrame(() => {
            const node = threadScrollRef.current;
            const previousHeight = threadScrollHeightBeforePrependRef.current;
            const previousTop = threadScrollTopBeforePrependRef.current;
            if (!node || previousHeight == null || previousTop == null) return;
            const delta = node.scrollHeight - previousHeight;
            node.scrollTop = previousTop + delta;
            threadScrollHeightBeforePrependRef.current = null;
            threadScrollTopBeforePrependRef.current = null;
          });
        }
      }
    },
    [scrollThreadToBottom],
  );

  const loadChats = useCallback(
    async (scope: AccountScope, preserveSelection: boolean) => {
      const normalizeRows = (rows: ApiChat[], accountID: number): ChatRow[] =>
        rows.map(chat => ({
          ...chat,
          funpay_account_id: chat.funpay_account_id ?? accountID,
          unread_count: chat.unread ? 1 : 0,
        }));

      let mergedChats: ChatRow[] = [];

      if (scope === 'all') {
        const listed = await accountsApi.list();
        const safeAccounts = Array.isArray(listed) ? listed : [];
        setAccounts(prev => {
          if (
            prev.length === safeAccounts.length &&
            prev.every((account, index) => {
              const next = safeAccounts[index];
              return account.id === next.id && (account.username || '') === (next.username || '');
            })
          ) {
            return prev;
          }
          return safeAccounts;
        });

        if (safeAccounts.length > 0) {
          const allHistories = await Promise.all(
            safeAccounts.map(async account => {
              const rows = await chatsApi.history(account.id);
              const safeRows = Array.isArray(rows) ? rows : [];
              return normalizeRows(safeRows, account.id);
            }),
          );
          mergedChats = allHistories.flat();
        }
      } else {
        const history = await chatsApi.history(scope);
        const safeHistory = Array.isArray(history) ? history : [];
        mergedChats = normalizeRows(safeHistory, scope);
      }

      const nextChats = sortChatsByUpdatedAt(mergedChats);

      setChats(nextChats);
      if (nextChats.length === 0) {
        setSelectedChatID(null);
        return null;
      }

      const currentSelected = selectedChatRef.current;
      const nextSelected =
        preserveSelection &&
        currentSelected &&
        nextChats.some(
          chat =>
            chat.id === currentSelected.id &&
            (chat.funpay_account_id ?? 0) === (currentSelected.funpay_account_id ?? 0),
        )
          ? currentSelected.id
          : nextChats[0].id;
      setSelectedChatID(nextSelected);
      return nextSelected;
    },
    [],
  );

  useEffect(() => {
    loadChatsRef.current = loadChats;
  }, [loadChats]);

  const handleChatSelect = useCallback(
    async (chat: ChatRow) => {
      setSelectedChatID(chat.id);
      setMessagesError(null);
      setOldestMessageId(null);
      setHasMoreMessages(false);
      setChats(prev =>
        prev.map(row => (row.id === chat.id ? { ...row, unread: false, unread_count: 0 } : row)),
      );
      await loadMessages(chat.id, { mode: 'replace' });
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
        setAccountScope('all');
        const nextSelected = await loadChats('all', false);
        if (cancelled) return;
        if (nextSelected) {
          await loadMessages(nextSelected, { mode: 'replace' });
        }

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
  }, [reloadKey, loadChats]);

  const runSilentResync = useCallback(async () => {
    if (silentResyncInFlightRef.current) return;
    silentResyncInFlightRef.current = true;
    try {
      const nextSelected = await loadChatsRef.current(accountScope, true);
      const target = nextSelected ?? selectedChatRef.current?.id;
      if (target) {
        await loadMessages(target, { silent: true, mode: 'silent-merge' });
      }
    } catch {
      // no-op
    } finally {
      silentResyncInFlightRef.current = false;
    }
  }, [accountScope, loadMessages]);

  useEffect(() => {
    if (accounts.length === 0) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void runSilentResync();
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [accounts.length, runSilentResync]);

  useEffect(() => {
    if (accounts.length === 0) return;

    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void runSilentResync();
    }, 35000);

    return () => {
      clearInterval(timer);
    };
  }, [accounts.length, runSilentResync]);

  useEffect(() => {
    const targetAccountIDs =
      accountScope === 'all'
        ? accounts.map(account => account.id)
        : typeof accountScope === 'number'
          ? [accountScope]
          : [];
    if (targetAccountIDs.length === 0) return;

    let cancelled = false;

    const scheduleResync = () => {
      if (wsResyncTimerRef.current) {
        clearTimeout(wsResyncTimerRef.current);
      }
      wsResyncTimerRef.current = setTimeout(() => {
        const selectedID = selectedChatRef.current?.id ?? null;
        const lastLoad = lastMessagesLoadRef.current;
        if (selectedID && lastLoad && lastLoad.chatID === selectedID && Date.now() - lastLoad.at < 1500) {
          return;
        }
        void loadChatsRef.current(accountScope, true).then(nextSelected => {
          const target = nextSelected ?? selectedChatRef.current?.id;
          if (target) {
            void loadMessages(target, { silent: true, mode: 'silent-merge' });
          }
        });
      }, 120);
    };

    const connect = async (accountID: number, attempt = 0) => {
      if (cancelled) return;

      let ws: WebSocket;
      try {
        ws = await createAccountWebSocket(accountID, event => {
          const eventAccountID = Number(event.data.account_id ?? accountID);
          const nodeID = String(event.data.node_id ?? event.data.chat_node_id ?? '');
          const openedChat = selectedChatRef.current;
          const isOpened = nodeID ? isChatMatch(openedChat, nodeID, eventAccountID) : false;
          const openedChatID = isOpened && openedChat ? openedChat.id : 0;

          if (event.type === 'pong') {
            return;
          }

          if (event.type === 'chat_updated') {
            if (!nodeID) return;
            const chatExists = chatsRef.current.some(chat => isChatMatch(chat, nodeID, eventAccountID));
            setChats(prev =>
              updateChatRows(prev, {
                nodeID,
                accountID: eventAccountID,
                withUser: String(event.data.with_user ?? ''),
                lastMessage: String(event.data.last_message ?? event.data.text ?? ''),
                updatedAt: String(event.data.updated_at ?? event.data.created_at ?? new Date().toISOString()),
                unread: Boolean(event.data.unread),
                isOpened,
              }).rows,
            );
            if (!chatExists) {
              void loadChatsRef.current(accountScope, true);
            }
            return;
          }

          if (event.type === 'message_confirmed') {
            const tempID = Number(event.data.temp_id ?? 0);
            const realID = Number(event.data.real_funpay_message_id ?? 0);
            if (!tempID || !isOpened) return;

            setMessages(prev =>
              prev.map(message => {
                if (Number(message.temp_id ?? 0) !== tempID) return message;
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
          if (!nodeID) return;

          const text = String(event.data.text ?? '');
          const authorName = String(event.data.author_name ?? event.data.with_user ?? '');
          const withUser = String(event.data.with_user ?? '');
          const createdAt = String(event.data.created_at ?? new Date().toISOString());
          const tempID = Number(event.data.temp_id ?? 0);
          const incomingID = Number(event.data.id ?? event.data.funpay_message_id ?? 0);
          const isMyMsg = Boolean(event.data.is_my_msg);
          const status = String(event.data.status ?? (isMyMsg ? 'pending' : 'delivered'));
          const chatExists = chatsRef.current.some(chat => isChatMatch(chat, nodeID, eventAccountID));

          setChats(prev =>
            updateChatRows(prev, {
              nodeID,
              accountID: eventAccountID,
              withUser,
              lastMessage: text,
              updatedAt: createdAt,
              unread: !isMyMsg,
              isOpened,
            }).rows,
          );

          if (!chatExists) {
            void loadChatsRef.current(accountScope, true);
            return;
          }
          if (!isOpened || openedChatID === 0) return;

          const nextMessage: ThreadMessage = {
            id: incomingID || tempID || Date.now(),
            temp_id: tempID || undefined,
            funpay_message_id:
              Number(event.data.real_funpay_message_id ?? event.data.funpay_message_id ?? event.data.id ?? 0) ||
              undefined,
            chat_id: openedChatID,
            author_id: Number(event.data.author_id ?? 0) || undefined,
            author_name: authorName || (isMyMsg ? 'Вы' : withUser || openedChat?.with_user || 'Пользователь'),
            text,
            is_my_msg: isMyMsg,
            created_at: createdAt,
            status: isMyMsg ? (status as ThreadMessage['status']) : 'delivered',
            source: typeof event.data.source === 'string' ? event.data.source : null,
          };

          setMessages(prev => {
            const replaceAt = (predicate: (message: ThreadMessage) => boolean) => {
              const index = prev.findIndex(predicate);
              if (index < 0) return null;
              const updated = [...prev];
              updated[index] = choosePreferredMessage(updated[index], nextMessage);
              return sortThreadMessages(updated);
            };

            if (event.type === 'message_sent') {
              const byTemp = tempID ? replaceAt(message => Number(message.temp_id ?? 0) === tempID) : null;
              if (byTemp) return byTemp;

              const candidate = findRecentOwnPendingCandidate(prev, text, createdAt);
              if (candidate) {
                return replaceAt(message => message === candidate) ?? prev;
              }

              return mergeThreadMessages(prev, [nextMessage], 'append-live');
            }

            if (isMyMsg) {
              const byTemp = tempID ? replaceAt(message => Number(message.temp_id ?? 0) === tempID) : null;
              if (byTemp) return byTemp;

              const byFunpay = incomingID
                ? replaceAt(message => Number(message.funpay_message_id ?? 0) === incomingID)
                : null;
              if (byFunpay) return byFunpay;

              const candidate = findRecentOwnPendingCandidate(prev, text, createdAt);
              if (candidate) {
                return replaceAt(message => message === candidate) ?? prev;
              }
            }

            return mergeThreadMessages(prev, [nextMessage], 'append-live');
          });

          requestAnimationFrame(scrollThreadToBottom);
        });
      } catch {
        if (cancelled) return;
        const backoff = Math.min(15000, 3000 * Math.pow(2, attempt));
        const jitter = Math.floor(Math.random() * 400);
        const timer = setTimeout(() => void connect(accountID, attempt + 1), backoff + jitter);
        reconnectTimersRef.current.set(accountID, timer);
        return;
      }

      if (cancelled) {
        ws.close();
        return;
      }

      ws.onopen = () => {
        const previousHeartbeat = heartbeatTimersRef.current.get(accountID);
        if (previousHeartbeat) {
          clearInterval(previousHeartbeat);
        }
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        heartbeatTimersRef.current.set(accountID, heartbeat);
        scheduleResync();
      };
      ws.onerror = () => ws.close();
      ws.onclose = () => {
        const heartbeat = heartbeatTimersRef.current.get(accountID);
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeatTimersRef.current.delete(accountID);
        }
        const currentSocket = socketsRef.current.get(accountID);
        if (currentSocket === ws) {
          socketsRef.current.delete(accountID);
        }
        if (cancelled) return;

        const backoff = Math.min(15000, 3000 * Math.pow(2, attempt));
        const jitter = Math.floor(Math.random() * 400);
        const timer = setTimeout(() => void connect(accountID, attempt + 1), backoff + jitter);
        reconnectTimersRef.current.set(accountID, timer);
      };

      socketsRef.current.set(accountID, ws);
    };

    reconnectTimersRef.current.forEach(timer => clearTimeout(timer));
    reconnectTimersRef.current.clear();
    heartbeatTimersRef.current.forEach(timer => clearInterval(timer));
    heartbeatTimersRef.current.clear();
    socketsRef.current.forEach(socket => socket.close());
    socketsRef.current.clear();

    targetAccountIDs.forEach(accountID => void connect(accountID));

    return () => {
      cancelled = true;
      reconnectTimersRef.current.forEach(timer => clearTimeout(timer));
      reconnectTimersRef.current.clear();
      heartbeatTimersRef.current.forEach(timer => clearInterval(timer));
      heartbeatTimersRef.current.clear();
      socketsRef.current.forEach(socket => socket.close());
      socketsRef.current.clear();
      if (wsResyncTimerRef.current) {
        clearTimeout(wsResyncTimerRef.current);
        wsResyncTimerRef.current = null;
      }
    };
  }, [accountScope, accounts, loadMessages, scrollThreadToBottom]);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter(chat => {
      const user = (chat.with_user || '').toLowerCase();
      const preview = (chat.last_message || '').toLowerCase();
      return user.includes(query) || preview.includes(query);
    });
  }, [chats, search]);

  const selectedChatAccountName = useMemo(() => {
    if (!selectedChat) return '';
    const accountID = selectedChat.funpay_account_id;
    if (!accountID) return accountScope === 'all' ? 'Все аккаунты' : '';
    return accounts.find(account => account.id === accountID)?.username || `ID ${accountID}`;
  }, [accounts, accountScope, selectedChat]);

  async function switchAccount(nextScope: AccountScope) {
    setAccountScope(nextScope);
    setSelectedChatID(null);
    setMessages([]);
    setOldestMessageId(null);
    setHasMoreMessages(false);
    setMessagesError(null);
    setLoading(true);
    setLoadError(null);

    try {
      const nextSelected = await loadChats(nextScope, false);
      if (nextSelected) {
        await loadMessages(nextSelected, { mode: 'replace' });
      } else {
        setMessages([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки чатов';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const loadOlderMessages = useCallback(async () => {
    const chat = selectedChatRef.current;
    if (!chat) return;
    if (oldestMessageId == null || !hasMoreMessages || loadingMessages || loadingMoreRef.current) return;
    await loadMessages(chat.id, { beforeId: oldestMessageId, mode: 'prepend-history' });
  }, [hasMoreMessages, loadMessages, loadingMessages, oldestMessageId]);

  const handleThreadScroll = useCallback(() => {
    const node = threadScrollRef.current;
    if (!node) return;
    if (node.scrollTop > 80) return;
    void loadOlderMessages();
  }, [loadOlderMessages]);

  async function sendMessage() {
    if (!selectedChat) return;

    const text = sanitizeInput(inputValue.trim());
    if (!text || sending) return;

    const scopeAccountID = typeof accountScope === 'number' ? accountScope : null;
    const targetAccountID = selectedChat.funpay_account_id ?? scopeAccountID;
    if (!targetAccountID) {
      toast.error('Не удалось определить аккаунт для отправки');
      return;
    }

    setSending(true);
    const nowISO = new Date().toISOString();
    const optimisticID = -Date.now();
    const previousLastMessage = selectedChat.last_message;
    const previousUpdatedAt = selectedChat.updated_at;
    const optimisticAuthorName = accounts.find(account => account.id === targetAccountID)?.username || 'Вы';
    const optimistic: ThreadMessage = {
      id: optimisticID,
      temp_id: optimisticID,
      chat_id: selectedChat.id,
      author_id: 0,
      author_name: optimisticAuthorName,
      text,
      is_my_msg: true,
      created_at: nowISO,
      status: 'pending',
      source: 'manual',
    };

    setMessages(prev => mergeThreadMessages(prev, [optimistic], 'append-live'));
    setChats(prev =>
      moveChatToTop(
        prev.map(chat =>
          chat.node_id === selectedChat.node_id &&
          (chat.funpay_account_id ?? 0) === (selectedChat.funpay_account_id ?? 0)
            ? { ...chat, last_message: text, updated_at: nowISO, unread: false, unread_count: 0 }
            : chat,
        ),
        selectedChat.node_id,
        selectedChat.funpay_account_id,
      ),
    );

    setInputValue('');
    requestAnimationFrame(() => {
      resizeComposer();
      scrollThreadToBottom();
    });

    try {
      const response = await chatsApi.send(targetAccountID, selectedChat.node_id, text);
      const pendingTempID = response?.temp_id ?? optimisticID;
      const pendingTime = response?.created_at || nowISO;

      setMessages(prev =>
        prev.map(message =>
          message.id === optimisticID || message.temp_id === optimisticID
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
      lastMessagesLoadRef.current = { chatID: selectedChat.id, at: Date.now() };

      setChats(prev =>
        moveChatToTop(
          prev.map(chat =>
            chat.node_id === selectedChat.node_id &&
            (chat.funpay_account_id ?? 0) === (selectedChat.funpay_account_id ?? 0)
              ? { ...chat, last_message: text, updated_at: pendingTime, unread: false, unread_count: 0 }
              : chat,
          ),
          selectedChat.node_id,
          selectedChat.funpay_account_id,
        ),
      );
    } catch (err) {
      setMessages(prev =>
        prev.filter(
          message =>
            !(
              (message.id === optimisticID || message.temp_id === optimisticID) &&
              !message.funpay_message_id &&
              !message.row_id
            ),
        ),
      );
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
      void runSilentResync();
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
                  value={accountScope === 'all' ? 'all' : String(accountScope)}
                  onChange={event => {
                    const value = event.target.value;
                    void switchAccount(value === 'all' ? 'all' : Number(value));
                  }}
                >
                  <option value="all">Все аккаунты</option>
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
              </div>

              <div className="platform-chat-scroll">
                {filteredChats.map(chat => {
                  const chatAccountName =
                    chat.funpay_account_id != null
                      ? accounts.find(account => account.id === chat.funpay_account_id)?.username || `ID ${chat.funpay_account_id}`
                      : '';

                  return (
                    <button
                      key={chat.id}
                      className={`platform-chat-row ${chat.id === selectedChatID ? 'active' : ''} ${
                        chat.unread_count > 0 && chat.id !== selectedChatID ? 'unread' : ''
                      }`}
                      onClick={() => void handleChatSelect(chat)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="platform-chat-name">{chat.with_user || 'Пользователь'}</strong>
                          {accountScope === 'all' && chatAccountName && (
                            <div className="text-[11px] text-[var(--pf-text-dim)] truncate">{chatAccountName}</div>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--pf-text-dim)] flex-shrink-0">{formatTime(chat.updated_at)}</span>
                      </div>
                      <p className="platform-chat-preview">{chat.last_message || ''}</p>
                      {chat.unread_count > 0 && chat.id !== selectedChatID && (
                        <div className="platform-chat-meta">
                          <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-[var(--pf-accent)] text-white text-[10px] font-semibold">
                            {chat.unread_count > 9 ? '9+' : chat.unread_count}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
                {filteredChats.length === 0 && chats.length === 0 && (
                  <div className="p-4"><EmptyState icon={SearchX} title="Нет чатов">Если вы только что добавили аккаунт, подождите 30 секунд и обновите страницу.</EmptyState></div>
                )}
                {filteredChats.length === 0 && chats.length > 0 && (
                  <div className="p-4"><EmptyState icon={SearchX} title="Чаты не найдены">По текущему фильтру ничего не найдено.</EmptyState></div>
                )}
              </div>
            </aside>

            <section className="platform-chat-thread">
              {!selectedChat ? (
                <div className="h-full flex items-center justify-center p-8">
                  <EmptyState icon={MessageSquareQuote} title="Выберите чат">Выберите собеседника из списка слева, чтобы начать общение.</EmptyState>
                </div>
              ) : (
                <>
                  <header className="platform-thread-head">
                    <div>
                      <div className="text-[14px] font-bold">{selectedChat.with_user || 'Пользователь'}</div>
                      <div className="text-[12px] text-[var(--pf-text-dim)]">{selectedChatAccountName}</div>
                    </div>
                  </header>

                  <div className="platform-thread-messages">
                    <div ref={threadScrollRef} className="platform-thread-messages-scroll" onScroll={handleThreadScroll}>
                      {loadingMessages && messages.length === 0 ? (
                        <div className="space-y-3 py-2">
                          <div className="platform-skeleton-line-muted h-14 w-[72%] animate-pulse rounded" />
                          <div className="platform-skeleton-line-accent h-14 w-[56%] animate-pulse rounded" />
                          <div className="platform-skeleton-line-muted h-14 w-[68%] animate-pulse rounded" />
                        </div>
                      ) : messagesError ? (
                        <div className="platform-chat-empty gap-3">
                          <p>{messagesError || 'Не удалось загрузить сообщения'}</p>
                          <button className="platform-btn-secondary" onClick={() => void retrySelectedMessages()}>
                            Повторить
                          </button>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center p-8">
                          <EmptyState icon={MessageCircle} title="Нет сообщений">Напишите первым, чтобы начать диалог!</EmptyState>
                        </div>
                      ) : (
                        threadRenderItems.map(item => {
                          if (item.type === 'separator') {
                            return (
                              <div key={item.key} className="flex items-center gap-3 px-4 py-3">
                                <div className="flex-1 h-px bg-[var(--pf-border)]" />
                                <span className="text-xs text-[var(--pf-text-dim)] flex-shrink-0">{item.label}</span>
                                <div className="flex-1 h-px bg-[var(--pf-border)]" />
                              </div>
                            );
                          }

                          const message = item.message;
                          const isOutgoing = message.is_my_msg;
                          const authorName = (message.author_name || (isOutgoing ? 'Вы' : selectedChat.with_user || 'Собеседник')).trim() || 'Пользователь';
                          const formattedTime = formatTime(message.created_at);

                          return (
                            <div
                              key={item.key}
                              className={
                                isOutgoing
                                  ? 'platform-chat-message-outgoing flex gap-2.5 px-4 py-1 rounded border-l-2 pl-[14px] group'
                                  : 'flex gap-2.5 px-4 py-1 rounded hover:bg-[var(--pf-surface-2)] group'
                              }
                            >
                              {item.grouped ? (
                                <div className="w-8 flex-shrink-0" />
                              ) : (
                                <div
                                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                                    isOutgoing ? 'bg-[var(--pf-accent)]' : getAvatarToneClass(authorName)
                                  }`}
                                  aria-hidden="true"
                                >
                                  {getAvatarLabel(authorName)}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                {item.grouped ? (
                                  <div className="h-4 flex items-center gap-1.5">
                                    <span className="text-[11px] text-[var(--pf-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity">
                                      {formattedTime}
                                    </span>
                                    {isOutgoing && (
                                      <span
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label={message.status === 'delivered' ? 'Доставлено' : 'Отправлено'}
                                      >
                                        {message.status === 'delivered' ? (
                                          <CheckCheck size={11} className="text-[var(--pf-accent)]" />
                                        ) : (
                                          <Check size={11} className="text-[var(--pf-text-dim)]" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-baseline gap-2">
                                    <span className={`text-sm font-semibold ${isOutgoing ? 'text-[var(--pf-accent)]' : 'text-[var(--pf-text)]'}`}>{authorName}</span>
                                    <span className="text-[11px] text-[var(--pf-text-dim)]">{formattedTime}</span>
                                    {isOutgoing && (
                                      <span aria-label={message.status === 'delivered' ? 'Доставлено' : 'Отправлено'}>
                                        {message.status === 'delivered' ? (
                                          <CheckCheck size={11} className="text-[var(--pf-accent)] ml-1" />
                                        ) : (
                                          <Check size={11} className="text-[var(--pf-text-dim)] ml-1" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <p className="text-sm text-[var(--pf-text)] leading-relaxed mt-0.5 break-words whitespace-pre-wrap">{message.text}</p>
                              </div>
                            </div>
                          );
                        })
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
