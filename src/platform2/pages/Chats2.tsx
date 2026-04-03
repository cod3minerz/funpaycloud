'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/app/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { Textarea } from '@/app/components/ui/textarea';
import { accounts, chats as initialChats, orders } from '@/platform/data/demoData';
import {
  P2PageHeader,
  P2Panel,
  P2PrimaryAction,
  P2SecondaryAction,
  P2Status,
  statusLabelByOrder,
  statusTypeByOrder,
} from '@/platform2/components/primitives';

type FilterKey = 'all' | 'unread' | 'orders' | 'reply';
type MobileStage = 'list' | 'thread';
type ChatView = {
  id: string;
  buyer: string;
  accountName: string;
  order?: (typeof orders)[number];
  orderId?: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  needsReply: boolean;
  messages: (typeof initialChats)[number]['messages'];
};

const quickReplies = [
  'Здравствуйте! Заказ уже в работе, отправлю результат в течение минуты.',
  'Спасибо за покупку. Если нужен дополнительный товар — подскажу вариант.',
  'Проверяю ваш запрос. Вернусь с решением через 2-3 минуты.',
];

export default function Chats2() {
  const [items, setItems] = useState(initialChats);
  const [activeId, setActiveId] = useState(initialChats[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [draft, setDraft] = useState('');
  const [stage, setStage] = useState<MobileStage>('list');

  const chats = useMemo<ChatView[]>(
    () =>
      items.map(chat => {
        const order = chat.orderId ? orders.find(item => item.id === chat.orderId) : undefined;
        const account = accounts.find(item => item.id === chat.accountId);
        const lastMsg = chat.messages[chat.messages.length - 1];
        const needsReply = chat.unread > 0 || Boolean(lastMsg && !lastMsg.fromUser);

        return {
          ...chat,
          order,
          accountName: account?.username ?? chat.accountId,
          needsReply,
        };
      }),
    [items],
  );

  const filtered = useMemo(
    () =>
      chats.filter(chat => {
        if (filter === 'unread' && chat.unread === 0) return false;
        if (filter === 'orders' && !chat.orderId) return false;
        if (filter === 'reply' && !chat.needsReply) return false;
        if (query) {
          const payload = [chat.buyer, chat.lastMessage, chat.order?.lot ?? ''].join(' ').toLowerCase();
          if (!payload.includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [chats, filter, query],
  );

  const active = filtered.find(item => item.id === activeId) ?? filtered[0];

  function openChat(id: string) {
    setActiveId(id);
    setStage('thread');
    setItems(prev =>
      prev.map(chat =>
        chat.id === id
          ? { ...chat, unread: 0, messages: chat.messages.map(msg => ({ ...msg, read: true })) }
          : chat,
      ),
    );
  }

  function send() {
    if (!active || !draft.trim()) return;
    const text = draft.trim();
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    setItems(prev =>
      prev.map(chat =>
        chat.id === active.id
          ? {
              ...chat,
              lastMessage: text,
              lastTime: time,
              messages: [...chat.messages, { id: 'm-' + Date.now(), fromUser: true, text, time, read: true }],
            }
          : chat,
      ),
    );
    setDraft('');
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Чаты" description="Мессенджерный режим: диалоги, тред, контекст заказа." />

      <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)_300px]">
        <P2Panel
          className={stage === 'thread' ? 'hidden lg:block' : ''}
          title="Диалоги"
          subtitle={filtered.length + ' активных'}
          bodyClassName="space-y-3"
        >
          <label className="p2-search w-full max-w-none">
            <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="p2-input h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              placeholder="Поиск диалога"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'all', label: 'Все' },
              { key: 'unread', label: 'Новые' },
              { key: 'orders', label: 'С заказом' },
              { key: 'reply', label: 'Ждут ответ' },
            ].map(item => (
              <button
                key={item.key}
                className={filter === item.key ? 'p2-btn-primary px-3' : 'p2-btn-soft px-3'}
                onClick={() => setFilter(item.key as FilterKey)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="max-h-[620px] space-y-2 overflow-y-auto p2-scroll">
            {filtered.map(chat => {
              const selected = active?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  className={[
                    'w-full rounded-xl border p-3 text-left',
                    selected
                      ? 'border-[rgba(79,134,255,0.45)] bg-[rgba(79,134,255,0.12)]'
                      : 'border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)]',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--p2-text)]">{chat.buyer}</p>
                      <p className="mt-1 truncate text-xs text-[var(--p2-text-dim)]">{chat.lastMessage}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-[var(--p2-text-dim)]">{chat.lastTime}</p>
                      {chat.unread > 0 ? <span className="p2-chip mt-1">{chat.unread}</span> : null}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="p2-chip">{chat.accountName}</span>
                    {chat.orderId ? <span className="p2-chip">{chat.orderId}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </P2Panel>

        <P2Panel className={stage === 'list' ? 'hidden lg:block' : ''} bodyClassName="p-0">
          {active ? (
            <div className="flex h-[760px] flex-col">
              <div className="flex items-center gap-2 border-b border-[var(--p2-border-soft)] px-4 py-3">
                <button className="p2-icon-btn lg:hidden" onClick={() => setStage('list')}>
                  <ChevronLeftIcon className="size-4" />
                </button>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[var(--p2-text)]">{active.buyer}</h3>
                  <p className="truncate text-xs text-[var(--p2-text-dim)]">{active.order?.lot ?? 'Диалог без привязки к заказу'}</p>
                </div>

                <div className="ml-auto inline-flex items-center gap-2">
                  <P2SecondaryAction asChild className="px-3">
                    <a href={'https://funpay.com/users/' + encodeURIComponent(active.buyer) + '/'} target="_blank" rel="noreferrer">
                      Профиль
                      <ArrowTopRightOnSquareIcon className="size-4" />
                    </a>
                  </P2SecondaryAction>

                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="p2-icon-btn lg:hidden" aria-label="Открыть контекст">
                        <SparklesIcon className="size-4" />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] p2-dialog">
                      <SheetHeader>
                        <SheetTitle>Контекст</SheetTitle>
                      </SheetHeader>
                      <ChatContext chat={active} />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              <div className="p2-messages p2-scroll flex-1 space-y-3 overflow-y-auto p-4">
                {active.messages.map(message => (
                  <div key={message.id} className={message.fromUser ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={message.fromUser ? 'p2-message-out' : 'p2-message-in'}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--p2-text)]">{message.text}</p>
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--p2-text-dim)]">
                        <ClockIcon className="size-3" />
                        {message.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-[var(--p2-border-soft)] bg-[var(--p2-surface)] p-3">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((text, idx) => (
                    <button key={idx} className="p2-btn-soft px-3" onClick={() => setDraft(text)}>
                      <SparklesIcon className="size-3" />
                      Шаблон {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    className="p2-input min-h-12 max-h-32"
                    placeholder="Введите сообщение"
                    onKeyDown={event => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        send();
                      }
                    }}
                  />
                  <P2PrimaryAction className="self-end" onClick={send}>
                    <PaperAirplaneIcon className="size-4" />
                    Отправить
                  </P2PrimaryAction>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-[var(--p2-text-dim)]">Нет диалогов по текущим фильтрам.</div>
          )}
        </P2Panel>

        <P2Panel className="hidden lg:block" title="Контекст" subtitle="Карточка заказа и быстрые действия">
          {active ? <ChatContext chat={active} /> : <p className="text-sm text-[var(--p2-text-dim)]">Выберите диалог.</p>}
        </P2Panel>
      </div>
    </div>
  );
}

function ChatContext({ chat }: { chat: ChatView }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
        <p className="text-xs text-[var(--p2-text-dim)]">Покупатель</p>
        <p className="mt-1 font-semibold">{chat.buyer}</p>
        <p className="mt-1 text-xs text-[var(--p2-text-soft)]">Аккаунт: {chat.accountName}</p>
      </div>

      <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
        <p className="text-xs text-[var(--p2-text-dim)]">Привязанный заказ</p>
        {chat.order ? (
          <>
            <p className="mt-1 font-semibold">{chat.order.id}</p>
            <p className="mt-1 text-xs text-[var(--p2-text-soft)]">{chat.order.lot}</p>
            <div className="mt-2 flex items-center gap-2">
              <P2Status type={statusTypeByOrder(chat.order.status)}>{statusLabelByOrder(chat.order.status)}</P2Status>
              <span className="p2-chip">{chat.order.amount} ₽</span>
            </div>
            <P2SecondaryAction asChild className="mt-3 w-full">
              <Link href="/platform2/orders">Открыть в заказах</Link>
            </P2SecondaryAction>
          </>
        ) : (
          <p className="mt-1 text-sm text-[var(--p2-text-soft)]">К заказу не привязан.</p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 space-y-2">
        <p className="text-xs text-[var(--p2-text-dim)]">Быстрые действия</p>
        <P2PrimaryAction className="w-full justify-start">Выдать товар</P2PrimaryAction>
        <P2SecondaryAction className="w-full justify-start">Эскалация в поддержку</P2SecondaryAction>
      </div>
    </div>
  );
}
