'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  Bars3BottomLeftIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { Textarea } from '@/app/components/ui/textarea';
import { accounts, chats as initialChats, orders } from '@/platform/data/demoData';

type FilterType = 'all' | 'unread' | 'orders' | 'requires';
type MobileView = 'list' | 'thread';

const cannedReplies = [
  'Добрый день! Заказ уже в обработке, отправлю результат в течение минуты.',
  'Спасибо за покупку. Если будут вопросы по товару, сразу помогу.',
  'Проверяю ситуацию и вернусь с решением в течение 2-3 минут.',
];

const statusLabel: Record<string, string> = {
  paid: 'Оплачен',
  completed: 'Выполнен',
  refund: 'Возврат',
  dispute: 'Спор',
};

type ChatView = {
  id: string;
  buyer: string;
  buyerAvatar: string;
  accountId: string;
  accountUsername: string;
  unread: number;
  lastMessage: string;
  lastTime: string;
  messagesCount: number;
  requiresReply: boolean;
  orderId?: string;
  orderStatus?: string;
  orderAmount?: number;
  lotTitle?: string;
  messages: typeof initialChats[number]['messages'];
};

export default function Chats2() {
  const [chatState, setChatState] = useState(initialChats);
  const [activeId, setActiveId] = useState(initialChats[0]?.id ?? '');
  const [filter, setFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [mobileView, setMobileView] = useState<MobileView>('list');

  const chatViews = useMemo<ChatView[]>(() => {
    return chatState.map(chat => {
      const linkedOrder = chat.orderId ? orders.find(order => order.id === chat.orderId) : undefined;
      const account = accounts.find(item => item.id === chat.accountId);
      const lastMsg = chat.messages[chat.messages.length - 1];
      const requiresReply = chat.unread > 0 || (!!lastMsg && !lastMsg.fromUser);

      return {
        id: chat.id,
        buyer: chat.buyer,
        buyerAvatar: chat.buyerAvatar,
        accountId: chat.accountId,
        accountUsername: account?.username ?? chat.accountId,
        unread: chat.unread,
        lastMessage: chat.lastMessage,
        lastTime: chat.lastTime,
        messagesCount: chat.messages.length,
        requiresReply,
        orderId: chat.orderId,
        orderStatus: linkedOrder?.status,
        orderAmount: linkedOrder?.amount,
        lotTitle: linkedOrder?.lot,
        messages: chat.messages,
      };
    });
  }, [chatState]);

  const filtered = useMemo(() => {
    return chatViews
      .filter(chat => {
        if (filter === 'unread' && chat.unread === 0) return false;
        if (filter === 'orders' && !chat.orderId) return false;
        if (filter === 'requires' && !chat.requiresReply) return false;
        if (query && !`${chat.buyer} ${chat.lastMessage} ${chat.lotTitle ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.unread - a.unread);
  }, [chatViews, filter, query]);

  const activeChat = useMemo(() => {
    if (!filtered.length) return undefined;
    return filtered.find(chat => chat.id === activeId) ?? filtered[0];
  }, [filtered, activeId]);

  useEffect(() => {
    if (activeChat && activeId !== activeChat.id) {
      setActiveId(activeChat.id);
    }
  }, [activeChat, activeId]);

  function selectChat(id: string) {
    setActiveId(id);
    setMobileView('thread');
    setChatState(prev => prev.map(chat => (chat.id === id ? { ...chat, unread: 0, messages: chat.messages.map(message => ({ ...message, read: true })) } : chat)));
  }

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !activeChat) return;

    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    setChatState(prev =>
      prev.map(chat => {
        if (chat.id !== activeChat.id) return chat;
        return {
          ...chat,
          lastMessage: trimmed,
          lastTime: time,
          messages: [
            ...chat.messages,
            {
              id: `m-${Date.now()}`,
              fromUser: true,
              text: trimmed,
              time,
              read: true,
            },
          ],
        };
      }),
    );

    setDraft('');
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Чаты</h1>
        <p className="text-sm text-[var(--p2-text-muted)]">Messenger-flow для быстрых ответов, контроля SLA и контекста заказа.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)_300px]">
        <Card className={`p2-surface border-[var(--p2-border)] min-h-[680px] ${mobileView === 'thread' ? 'hidden lg:flex' : 'flex'} flex-col`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Диалоги</CardTitle>
            <CardDescription className="text-[var(--p2-text-dim)]">{filtered.length} активных чатов</CardDescription>
            <label className="mt-2 flex items-center gap-2 p2-surface-2 rounded-md px-3 h-10">
              <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск по диалогам"
                className="p2-input border-0 shadow-none h-auto p-0 focus-visible:ring-0"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'all', label: 'Все' },
                { key: 'unread', label: 'Непрочитанные' },
                { key: 'orders', label: 'С заказом' },
                { key: 'requires', label: 'Требуют ответа' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as FilterType)}
                  className={`h-8 rounded-md border text-xs font-semibold ${
                    filter === item.key
                      ? 'border-blue-500/60 bg-blue-500/10 text-blue-200'
                      : 'border-[var(--p2-border)] bg-[var(--p2-surface-2)] text-[var(--p2-text-muted)] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p2-scroll space-y-2">
            {filtered.map(chat => {
              const isActive = chat.id === activeChat?.id;
              return (
                <button
                  type="button"
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    isActive
                      ? 'border-blue-500/45 bg-blue-500/10'
                      : 'border-[var(--p2-border)] bg-[var(--p2-surface-2)] hover:border-[var(--p2-border-strong)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="mt-0.5 size-8 shrink-0 rounded-full bg-[var(--p2-surface-3)] text-sm font-bold inline-flex items-center justify-center">
                        {chat.buyerAvatar}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm truncate">{chat.buyer}</strong>
                          {chat.unread > 0 && <Badge className="h-5 rounded-full px-1.5 text-[10px] bg-blue-600 hover:bg-blue-600">{chat.unread}</Badge>}
                        </div>
                        <p className="text-xs text-[var(--p2-text-dim)] truncate mt-0.5">{chat.lastMessage}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--p2-text-dim)] shrink-0">{chat.lastTime}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="p2-chip">{chat.accountUsername}</span>
                    {chat.orderId && <span className="p2-chip">{chat.orderId}</span>}
                    <span className="p2-chip">{chat.messagesCount} сообщ.</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className={`p2-surface border-[var(--p2-border)] min-h-[680px] ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'} flex-col`}>
          {activeChat ? (
            <>
              <CardHeader className="border-b border-[var(--p2-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 lg:hidden p2-surface-2" onClick={() => setMobileView('list')}>
                    <ChevronLeftIcon className="size-4" />
                  </Button>

                  <span className="size-9 rounded-full bg-[var(--p2-surface-3)] text-sm font-bold inline-flex items-center justify-center">
                    {activeChat.buyerAvatar}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base truncate">{activeChat.buyer}</CardTitle>
                      {activeChat.requiresReply && <Badge variant="outline" className="border-orange-400/40 text-orange-300">Ждёт ответ</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--p2-text-dim)] mt-1">
                      {activeChat.orderId && <span className="p2-chip">{activeChat.orderId}</span>}
                      {activeChat.lotTitle && <span className="p2-chip">{activeChat.lotTitle}</span>}
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 lg:hidden p2-surface-2">
                          <Bars3BottomLeftIcon className="size-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px] p2-surface border-[var(--p2-border)]">
                        <SheetHeader>
                          <SheetTitle>Контекст</SheetTitle>
                        </SheetHeader>
                        <ChatContext activeChat={activeChat} />
                      </SheetContent>
                    </Sheet>

                    <Button asChild variant="outline" className="h-9 p2-surface-2">
                      <a href={`https://funpay.com/users/${encodeURIComponent(activeChat.buyer)}/`} target="_blank" rel="noreferrer">
                        Профиль
                        <ArrowTopRightOnSquareIcon className="size-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 min-h-0 p-0">
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p2-scroll p-4 p2-thread-bg space-y-3">
                    {activeChat.messages.map(message => (
                      <div key={message.id} className={`flex ${message.fromUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${message.fromUser ? 'p2-message-out' : 'p2-message-in'}`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                          <div className="mt-1 text-[10px] text-[var(--p2-text-dim)] inline-flex items-center gap-1">
                            <ClockIcon className="size-3" />
                            {message.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[var(--p2-border)] p-3 space-y-2 bg-[var(--p2-surface)]">
                    <div className="flex flex-wrap gap-2">
                      {cannedReplies.map((text, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDraft(text)}
                          className="h-7 rounded-md border border-[var(--p2-border)] bg-[var(--p2-surface-2)] px-2.5 text-xs text-[var(--p2-text-muted)] hover:text-white"
                        >
                          <SparklesIcon className="size-3 inline mr-1" />
                          Шаблон {idx + 1}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        placeholder="Введите сообщение"
                        className="p2-input min-h-12 max-h-32"
                        onKeyDown={event => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            sendMessage(draft);
                          }
                        }}
                      />
                      <Button className="p2-primary-btn shrink-0 self-end" onClick={() => sendMessage(draft)}>
                        <PaperAirplaneIcon className="size-4" />
                        Отправить
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="h-full flex items-center justify-center text-sm text-[var(--p2-text-dim)]">
              Подходящих чатов не найдено.
            </CardContent>
          )}
        </Card>

        <Card className="hidden lg:flex flex-col p2-surface border-[var(--p2-border)] min-h-[680px]">
          <CardHeader>
            <CardTitle className="text-base">Контекст</CardTitle>
            <CardDescription className="text-[var(--p2-text-dim)]">Заказ, SLA и быстрые действия</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {activeChat ? <ChatContext activeChat={activeChat} /> : <p className="text-sm text-[var(--p2-text-dim)]">Выберите диалог.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChatContext({ activeChat }: { activeChat: ChatView }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--p2-border)] bg-[var(--p2-surface-2)] p-3">
        <p className="text-xs text-[var(--p2-text-dim)] mb-1">Покупатель</p>
        <p className="font-semibold">{activeChat.buyer}</p>
        <p className="text-xs text-[var(--p2-text-dim)] mt-1">Аккаунт: {activeChat.accountUsername}</p>
      </div>

      <div className="rounded-lg border border-[var(--p2-border)] bg-[var(--p2-surface-2)] p-3">
        <p className="text-xs text-[var(--p2-text-dim)] mb-2">Связанный заказ</p>
        {activeChat.orderId ? (
          <>
            <p className="font-semibold">{activeChat.orderId}</p>
            <p className="text-sm mt-1 text-[var(--p2-text-muted)]">{activeChat.lotTitle}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--p2-text-dim)]">
              {activeChat.orderStatus && <span className="p2-chip">{statusLabel[activeChat.orderStatus]}</span>}
              {typeof activeChat.orderAmount === 'number' && <span className="p2-chip">{activeChat.orderAmount} ₽</span>}
            </div>
            <Button asChild variant="outline" className="w-full mt-3 p2-surface-2">
              <Link href="/platform2/orders">Открыть в заказах</Link>
            </Button>
          </>
        ) : (
          <p className="text-sm text-[var(--p2-text-muted)]">Диалог без привязки к заказу.</p>
        )}
      </div>

      <div className="rounded-lg border border-[var(--p2-border)] bg-[var(--p2-surface-2)] p-3 space-y-2">
        <p className="text-xs text-[var(--p2-text-dim)]">Быстрые действия</p>
        <Button className="w-full p2-primary-btn justify-start">
          <ChatBubbleLeftRightIcon className="size-4" />
          Отправить инструкцию
        </Button>
        <Button variant="outline" className="w-full p2-surface-2 justify-start">
          Открыть SLA карточку
        </Button>
        <Button variant="outline" className="w-full p2-surface-2 justify-start">
          Эскалация в поддержку
        </Button>
      </div>
    </div>
  );
}
