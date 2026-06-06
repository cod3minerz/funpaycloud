"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import Icon from "@/platform2/icons";
import { accountsApi, chatsApi, createAccountWebSocket, ApiAccount, ApiChat, ApiMessage } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  from: "buyer" | "me";
  text: string;
  time: string;
};

type Conversation = {
  id: string;           // node_id (string chat identifier on FunPay)
  chatApiId: number;    // internal db id for chatsApi.messages()
  funpayAccountId: string; // account id for send
  buyer: string;
  account: string;
  lotTitle: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function mapApiChat(c: ApiChat, accountUsername: string, accountId: string): Conversation {
  return {
    id: c.node_id,
    chatApiId: c.id,
    funpayAccountId: accountId,
    buyer: c.with_user,
    account: accountUsername,
    lotTitle: c.last_message.slice(0, 50),
    lastMessage: c.last_message,
    time: fmtTime(c.updated_at),
    unread: c.unread ? 1 : 0,
    online: false,
    messages: [],
  };
}

function mapApiMessage(m: ApiMessage): Message {
  return {
    id: String(m.id),
    from: m.is_my_msg ? "me" : "buyer",
    text: m.text,
    time: fmtTime(m.created_at),
  };
}

// ── Avatar ────────────────────────────────────────────────────────────────────

const COLORS = ["bg-violet-500", "bg-brand-500", "bg-teal-500", "bg-orange-500", "bg-pink-500"];
function avatarColor(name: string) {
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={`${sz} ${avatarColor(name)} flex shrink-0 items-center justify-center rounded-lg font-bold text-white`}>
      {name[0].toUpperCase()}
    </div>
  );
}

// ── Message group (Slack-style) ───────────────────────────────────────────────

type Group = { from: "buyer" | "me"; name: string; time: string; messages: Message[] };

function groupMessages(conv: Conversation): Group[] {
  const groups: Group[] = [];
  for (const msg of conv.messages) {
    const last = groups[groups.length - 1];
    if (last && last.from === msg.from) {
      last.messages.push(msg);
    } else {
      groups.push({
        from: msg.from,
        name: msg.from === "buyer" ? conv.buyer : "Вы",
        time: msg.time,
        messages: [msg],
      });
    }
  }
  return groups;
}

function MessageGroup({ group }: { group: Group }) {
  const isSelf = group.from === "me";
  return (
    <div className="group flex gap-3 px-6 py-1 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
      {/* Avatar */}
      <div className="pt-0.5">
        <Avatar name={group.name} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + time */}
        <div className="mb-1 flex items-baseline gap-2">
          <span className={`text-sm font-bold ${isSelf ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-white"}`}>
            {group.name}
          </span>
          <span className="text-xs text-gray-400">{group.time}</span>
        </div>

        {/* Messages */}
        <div className="space-y-0.5">
          {group.messages.map((msg) => (
            <p key={msg.id} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {msg.text}
            </p>
          ))}
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex shrink-0 items-start gap-0.5 pt-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {["😊", "👍", "🔁"].map((emoji) => (
          <button key={emoji} className="flex h-7 w-7 items-center justify-center rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatsPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState("all");
  const [input, setInput] = useState("");
  const [chats, setChats] = useState<Conversation[]>([]);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load accounts on mount
  useEffect(() => {
    accountsApi.list().then((list) => {
      setAccounts(list);
    }).catch(() => {});
  }, []);

  // Load chats when account filter changes
  useEffect(() => {
    const targetAccounts = account === "all"
      ? accounts
      : accounts.filter((a) => a.username === account);

    if (targetAccounts.length === 0) return;

    Promise.all(
      targetAccounts.map((a) =>
        chatsApi.history(a.id).then((list) =>
          list.map((c) => mapApiChat(c, a.username ?? `#${a.id}`, String(a.id)))
        ).catch(() => [] as Conversation[])
      )
    ).then((results) => {
      const all = results.flat().sort((a, b) => b.time.localeCompare(a.time));
      setChats(all);
      if (all.length > 0 && !activeId) setActiveId(all[0].id);
    });
  }, [account, accounts]);

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeId) return;
    const conv = chats.find((c) => c.id === activeId);
    if (!conv || conv.messages.length > 0) return;

    chatsApi.messages(conv.chatApiId, 50).then((msgs) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, messages: msgs.map(mapApiMessage) } : c
        )
      );
    }).catch(() => {});
  }, [activeId]);

  // WebSocket for real-time messages
  useEffect(() => {
    if (!activeId) return;
    const conv = chats.find((c) => c.id === activeId);
    if (!conv) return;

    wsRef.current?.close();

    createAccountWebSocket(conv.funpayAccountId, (event) => {
      if (event.type === "new_message" && event.data) {
        const msg = mapApiMessage(event.data as unknown as ApiMessage);
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, lastMessage: msg.text, time: msg.time, messages: [...c.messages, msg] }
              : c
          )
        );
      }
    }).then((ws) => {
      wsRef.current = ws;
    }).catch(() => {});

    return () => {
      wsRef.current?.close();
    };
  }, [activeId]);

  const active = chats.find((c) => c.id === activeId) ?? null;
  const groups = active ? groupMessages(active) : [];

  const filtered = chats.filter((c) => {
    const matchAccount = account === "all" || c.account === account;
    const matchSearch = c.buyer.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.toLowerCase().includes(search.toLowerCase());
    return matchAccount && matchSearch;
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, chats]);

  async function sendMessage() {
    if (!input.trim() || !active) return;
    const text = input.trim();
    const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const optimistic: Message = { id: `m${Date.now()}`, from: "me", text, time: now };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, lastMessage: text, time: now, messages: [...c.messages, optimistic] }
          : c
      )
    );
    setInput("");

    try {
      await chatsApi.send(active.funpayAccountId, active.id, text);
    } catch {
      // message already shown optimistically
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] -m-4 overflow-hidden md:-m-6">

      {/* ── LEFT SIDEBAR ── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Чаты</h1>
            <span className="rounded-full border border-warning-400 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-warning-500">
              Beta
            </span>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Icon name="list" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-400 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800"
            />
          </div>

          {/* Account filter */}
          <div className="relative mt-2">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Все аккаунты</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.username ?? `#${a.id}`}>{a.username ?? `#${a.id}`}</option>
              ))}
            </select>
            <Icon name="chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* DM list */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-gray-400">Чаты не найдены</p>
          )}
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`group w-full px-3 py-2 text-left transition-colors ${
                activeId === conv.id
                  ? "bg-brand-500/10 dark:bg-brand-500/15"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar name={conv.buyer} size="sm" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className={`truncate text-sm font-semibold ${
                      activeId === conv.id ? "text-brand-600 dark:text-brand-400" : "text-gray-800 dark:text-gray-100"
                    }`}>
                      {conv.buyer}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">{conv.time}</span>
                  </div>
                  <p className="truncate text-xs text-gray-400">{conv.lastMessage}</p>
                </div>

                {conv.unread > 0 && (
                  <span className="ml-auto flex h-4.5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {conv.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-gray-950">
      {!active ? (
        <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">Выберите чат</div>
      ) : (<>

        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Avatar name={active.buyer} />
            <div>
              <span className="font-bold text-gray-900 dark:text-white">{active.buyer}</span>
              <p className="text-xs text-gray-400">
                <span className="text-gray-500 dark:text-gray-400">{active.account}</span>
                {" · "}
                <span className="truncate">{active.lotTitle}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Date divider */}
          <div className="flex items-center gap-3 px-6 py-2">
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            <span className="text-xs font-medium text-gray-400">Сегодня</span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
          </div>

          {groups.map((group, i) => (
            <MessageGroup key={i} group={group} />
          ))}

          <div ref={bottomRef} />
        </div>

        {/* ── INPUT BOX ── */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            {/* Text area */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Сообщение для ${active.buyer}`}
              rows={2}
              className="w-full resize-none rounded-t-xl bg-transparent px-4 pt-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
            />

            {/* Toolbar */}
            <div className="flex items-center justify-end px-3 pb-2.5 pt-1">
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  input.trim()
                    ? "bg-brand-500 text-white hover:bg-brand-600"
                    : "bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600"
                }`}
              >
                <Icon name="paper-plane" className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-gray-400">
            <kbd className="rounded border border-gray-200 px-1 py-px font-mono text-[10px] dark:border-gray-700">Enter</kbd> отправить
            {" · "}
            <kbd className="rounded border border-gray-200 px-1 py-px font-mono text-[10px] dark:border-gray-700">Shift+Enter</kbd> новая строка
          </p>
        </div>
      </>)}
      </div>
    </div>
  );
}
