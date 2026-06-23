'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi, AdminChat, AdminChatMessage } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Input from '@/platform2/components/form/input/InputField';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function sourceBadge(source?: string | null) {
  if (!source || source === 'manual') return null;
  const map: Record<string, { label: string; cls: string }> = {
    assistant_ai: { label: 'AI', cls: 'bg-brand-500/10 text-brand-600 dark:text-brand-400' },
    scenario:     { label: 'Сценарий', cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    plugin:       { label: 'Плагин', cls: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    system:       { label: 'Система', cls: 'bg-gray-500/10 text-gray-500' },
  };
  const info = map[source] ?? { label: source, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${info.cls}`}>
      {info.label}
    </span>
  );
}

export default function AdminChatsPage() {
  const searchParams = useSearchParams();
  const [accountIdInput, setAccountIdInput] = useState(searchParams.get('account_id') ?? '');
  const [loadedAccountId, setLoadedAccountId] = useState<number | null>(null);
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [filterBuyer, setFilterBuyer] = useState(searchParams.get('buyer') ?? '');

  const [selectedChat, setSelectedChat] = useState<AdminChat | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [beforeId, setBeforeId] = useState<number>(0);
  const [hasMore, setHasMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadChats(accountId: number) {
    setChatsLoading(true);
    setChatsError(null);
    try {
      const data = await adminApi.accountChats(accountId);
      setChats(data.chats ?? []);
      setLoadedAccountId(accountId);
    } catch (err) {
      setChatsError(err instanceof Error ? err.message : 'Ошибка загрузки чатов');
    } finally {
      setChatsLoading(false);
    }
  }

  async function loadMessages(chat: AdminChat, prepend = false) {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const limit = 80;
      const data = await adminApi.chatMessages(chat.id, {
        limit,
        before_id: prepend ? beforeId : 0,
      });
      const msgs = data.messages ?? [];
      if (prepend) {
        setMessages((prev) => [...msgs, ...prev]);
      } else {
        setMessages(msgs);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      setHasMore(msgs.length >= limit);
      if (msgs.length > 0) setBeforeId(msgs[0].id);
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : 'Ошибка загрузки сообщений');
    } finally {
      setMessagesLoading(false);
    }
  }

  function selectChat(chat: AdminChat) {
    setSelectedChat(chat);
    setMessages([]);
    setBeforeId(0);
    setHasMore(false);
    loadMessages(chat);
  }

  function handleSearch() {
    const id = parseInt(accountIdInput);
    if (!id || id <= 0) return;
    setSelectedChat(null);
    setMessages([]);
    loadChats(id);
  }

  // Auto-load if account_id in URL
  useEffect(() => {
    const id = parseInt(searchParams.get('account_id') ?? '');
    if (id > 0) loadChats(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredChats = filterBuyer
    ? chats.filter((c) => c.with_user.toLowerCase().includes(filterBuyer.toLowerCase()))
    : chats;

  // Stats
  const aiChats = chats.filter((c) => {
    // We can't easily know without loading messages; just show total
    return false;
  }).length;
  void aiChats;

  return (
    <div className="flex h-[calc(100vh-64px)] gap-4 overflow-hidden">

      {/* LEFT: account input + chat list */}
      <div className="flex w-72 shrink-0 flex-col gap-3">
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Account ID</p>
            <div className="flex gap-2">
              <Input
                placeholder="Введите ID аккаунта"
                value={accountIdInput}
                onChange={(e) => setAccountIdInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={!accountIdInput || chatsLoading}
                className="shrink-0 rounded-xl bg-brand-500 px-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                →
              </button>
            </div>
            {loadedAccountId && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Фильтр по покупателю"
                  value={filterBuyer}
                  onChange={(e) => setFilterBuyer(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar">
          {chatsLoading && (
            <div className="py-8 text-center text-sm text-gray-400">Загрузка чатов...</div>
          )}
          {chatsError && (
            <div className="rounded-xl bg-error-50 p-3 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">{chatsError}</div>
          )}
          {!chatsLoading && loadedAccountId && filteredChats.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">Чатов не найдено</div>
          )}
          {filteredChats.map((chat) => {
            const active = selectedChat?.id === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'bg-brand-500 text-white'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{chat.with_user || 'Без имени'}</span>
                  {(chat.unread || chat.funpay_unread) && (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-white' : 'bg-brand-500'}`} />
                  )}
                </div>
                <p className={`mt-0.5 truncate text-xs ${active ? 'text-white/70' : 'text-gray-400'}`}>
                  {chat.last_message || '—'}
                </p>
                <p className={`mt-0.5 text-[10px] ${active ? 'text-white/50' : 'text-gray-300 dark:text-gray-600'}`}>
                  {formatTime(chat.updated_at)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: messages */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!selectedChat ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            {loadedAccountId ? 'Выберите чат слева' : 'Введите ID аккаунта и нажмите →'}
          </div>
        ) : (
          <Card className="flex flex-1 flex-col overflow-hidden">
            {/* Chat header */}
            <div className="shrink-0 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedChat.with_user}</p>
                  <p className="text-xs text-gray-400">node: {selectedChat.node_id} · chat_id: {selectedChat.id}</p>
                </div>
                <button
                  onClick={() => loadMessages(selectedChat)}
                  className="text-xs text-brand-500 hover:text-brand-600"
                >
                  Обновить
                </button>
              </div>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="shrink-0 border-b border-gray-50 p-2 text-center dark:border-gray-800">
                <button
                  onClick={() => loadMessages(selectedChat, true)}
                  disabled={messagesLoading}
                  className="text-xs text-brand-500 hover:text-brand-600 disabled:opacity-50"
                >
                  {messagesLoading ? 'Загрузка...' : '↑ Загрузить ещё'}
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 no-scrollbar">
              {messagesLoading && messages.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">Загрузка сообщений...</div>
              )}
              {messagesError && (
                <div className="rounded-xl bg-error-50 p-3 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">{messagesError}</div>
              )}
              {messages.map((msg) => {
                const isAI = msg.source === 'assistant_ai';
                const isMine = msg.is_my_msg;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                        isMine
                          ? isAI
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-800 text-white dark:bg-gray-700'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[11px] font-semibold ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                          {msg.author_name || (isMine ? 'Продавец' : 'Покупатель')}
                        </span>
                        {sourceBadge(msg.source)}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      <p className={`mt-1 text-[10px] text-right ${isMine ? 'text-white/40' : 'text-gray-300 dark:text-gray-600'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
