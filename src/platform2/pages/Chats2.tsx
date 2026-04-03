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
import { P2Card, P2PageHeader, P2PrimaryAction, P2SecondaryAction, P2Status, statusLabelByOrder, statusTypeByOrder } from '@/platform2/components/primitives';

type FilterKey = 'all' | 'unread' | 'orders' | 'requires';

type MobileStage = 'list' | 'thread';

const cannedReplies = [
  'Добрый день! Заказ уже обрабатывается. Отправлю результат в течение минуты.',
  'Спасибо за покупку. Если нужен доп. товар — подскажу лучший вариант.',
  'Проверяю ситуацию и вернусь с решением через 2-3 минуты.',
];

type ChatView = {
  id: string;
  accountName: string;
  buyer: string;
  order?: (typeof orders)[number];
};

export default function Chats2() {
  const [chatItems, setChatItems] = useState(initialChats);
  const [activeId, setActiveId] = useState(initialChats[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [draft, setDraft] = useState('');
  const [mobileStage, setMobileStage] = useState<MobileStage>('list');

  const chatViews = useMemo(() => {
    return chatItems.map(chat => {
      const linkedOrder = chat.orderId ? orders.find(order => order.id === chat.orderId) : undefined;
      const account = accounts.find(item => item.id === chat.accountId);
      const lastMessage = chat.messages[chat.messages.length - 1];
      const requiresReply = chat.unread > 0 || (lastMessage && !lastMessage.fromUser);

      return {
        ...chat,
        accountName: account?.username ?? chat.accountId,
        order: linkedOrder,
        requiresReply,
      };
    });
  }, [chatItems]);

  const filteredChats = useMemo(
    () =>
      chatViews.filter(chat => {
        if (filter === 'unread' && chat.unread === 0) return false;
        if (filter === 'orders' && !chat.orderId) return false;
        if (filter === 'requires' && !chat.requiresReply) return false;

        if (query) {
          const payload = `${chat.buyer} ${chat.lastMessage} ${chat.order?.lot ?? ''}`.toLowerCase();
          if (!payload.includes(query.toLowerCase())) return false;
        }

        return true;
      }),
    [chatViews, filter, query],
  );

  const activeChat = filteredChats.find(chat => chat.id === activeId) ?? filteredChats[0];

  function openChat(chatId: string) {
    setActiveId(chatId);
    setMobileStage('thread');

    setChatItems(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, unread: 0, messages: chat.messages.map(message => ({ ...message, read: true })) }
          : chat,
      ),
    );
  }

  function sendMessage() {
    if (!activeChat || !draft.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const nextText = draft.trim();

    setChatItems(prev =>
      prev.map(chat => {
        if (chat.id !== activeChat.id) return chat;

        return {
          ...chat,
          lastMessage: nextText,
          lastTime: time,
          messages: [
            ...chat.messages,
            {
              id: `m-${Date.now()}`,
              fromUser: true,
              text: nextText,
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
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Chats" description="Messenger-grade workspace for customer communication." />

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)_300px]">
        <P2Card
          className={mobileStage === 'thread' ? 'hidden lg:block' : 'block'}
          title="Dialogs"
          subtitle={`${filteredChats.length} active conversations`}
          bodyClassName="space-y-3"
        >
          <label className="p2-search max-w-none w-full">
            <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="p2-input border-0 shadow-none h-auto p-0 focus-visible:ring-0"
              placeholder="Search dialogs"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'orders', label: 'With order' },
              { key: 'requires', label: 'Need reply' },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key as FilterKey)}
                className={filter === item.key ? 'p2-primary-btn px-3' : 'p2-secondary-btn px-3'}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto p2-scroll">
            {filteredChats.map(chat => {
              const active = activeChat?.id === chat.id;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => openChat(chat.id)}
                  className={[
                    'w-full text-left rounded-xl border p-3 transition',
                    active
                      ? 'border-blue-500/45 bg-blue-500/12'
                      : 'border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] hover:border-[var(--p2-border)]',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-white truncate">{chat.buyer}</strong>
                        {chat.unread > 0 ? <span className="p2-chip">{chat.unread}</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-[var(--p2-text-muted)] truncate">{chat.lastMessage}</p>
                    </div>
                    <span className="text-[11px] text-[var(--p2-text-dim)] shrink-0">{chat.lastTime}</span>
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[var(--p2-text-dim)]">
                    <span className="p2-chip">{chat.accountName}</span>
                    {chat.orderId ? <span className="p2-chip">{chat.orderId}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </P2Card>

        <P2Card className={mobileStage === 'list' ? 'hidden lg:block' : 'block'} bodyClassName="p-0">
          {activeChat ? (
            <div className="flex h-[760px] flex-col">
              <div className="border-b border-[var(--p2-border-soft)] px-4 py-3 flex items-center gap-2">
                <button className="p2-icon-btn lg:hidden" onClick={() => setMobileStage('list')}>
                  <ChevronLeftIcon className="size-4" />
                </button>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{activeChat.buyer}</h3>
                  <p className="text-xs text-[var(--p2-text-dim)] truncate">{activeChat.order?.lot ?? 'Dialog without linked order'}</p>
                </div>

                <div className="ml-auto inline-flex items-center gap-2">
                  <P2SecondaryAction asChild className="px-3">
                    <a href={`https://funpay.com/users/${encodeURIComponent(activeChat.buyer)}/`} target="_blank" rel="noreferrer">
                      Profile
                      <ArrowTopRightOnSquareIcon className="size-4" />
                    </a>
                  </P2SecondaryAction>

                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="p2-icon-btn lg:hidden" aria-label="Open context">
                        <SparklesIcon className="size-4" />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] p2-surface border-[var(--p2-border-soft)]">
                      <SheetHeader>
                        <SheetTitle>Context</SheetTitle>
                      </SheetHeader>
                      <ChatContext chat={activeChat} />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p2-scroll p-4 space-y-3 p2-messenger-bg">
                {activeChat.messages.map(message => (
                  <div key={message.id} className={message.fromUser ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={message.fromUser ? 'p2-message-out' : 'p2-message-in'}>
                      <p className="text-sm text-[var(--p2-text)] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--p2-text-dim)]">
                        <ClockIcon className="size-3" />
                        {message.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--p2-border-soft)] p-3 space-y-2 bg-[var(--p2-surface)]">
                <div className="flex flex-wrap gap-2">
                  {cannedReplies.map((text, idx) => (
                    <button key={idx} className="p2-secondary-btn px-3" onClick={() => setDraft(text)}>
                      <SparklesIcon className="size-3" />
                      Reply {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    className="p2-input min-h-12 max-h-32"
                    placeholder="Type your message"
                    onKeyDown={event => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <P2PrimaryAction className="self-end" onClick={sendMessage}>
                    <PaperAirplaneIcon className="size-4" />
                    Send
                  </P2PrimaryAction>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-[var(--p2-text-dim)]">No dialogs matched current filters.</div>
          )}
        </P2Card>

        <P2Card className="hidden lg:block" title="Context" subtitle="Order info and quick actions">
          {activeChat ? <ChatContext chat={activeChat} /> : <p className="text-sm text-[var(--p2-text-dim)]">Select a dialog.</p>}
        </P2Card>
      </div>
    </div>
  );
}

function ChatContext({ chat }: { chat: ChatView }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
        <p className="text-[11px] text-[var(--p2-text-dim)]">Customer</p>
        <p className="mt-1 font-semibold">{chat.buyer}</p>
        <p className="text-xs text-[var(--p2-text-muted)] mt-1">Account: {chat.accountName}</p>
      </div>

      <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
        <p className="text-[11px] text-[var(--p2-text-dim)]">Linked order</p>
        {chat.order ? (
          <>
            <p className="mt-1 font-semibold">{chat.order.id}</p>
            <p className="text-xs text-[var(--p2-text-muted)] mt-1">{chat.order.lot}</p>
            <div className="mt-2 flex items-center gap-2">
              <P2Status type={statusTypeByOrder(chat.order.status)}>{statusLabelByOrder(chat.order.status)}</P2Status>
              <span className="p2-chip">{chat.order.amount} ₽</span>
            </div>
            <P2SecondaryAction asChild className="w-full mt-3">
              <Link href="/platform2/orders">Open in orders</Link>
            </P2SecondaryAction>
          </>
        ) : (
          <p className="text-sm text-[var(--p2-text-muted)] mt-1">No linked order for this conversation.</p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 space-y-2">
        <p className="text-[11px] text-[var(--p2-text-dim)]">Quick actions</p>
        <P2PrimaryAction className="w-full justify-start">Send instruction</P2PrimaryAction>
        <P2SecondaryAction className="w-full justify-start">Escalate to support</P2SecondaryAction>
      </div>
    </div>
  );
}
