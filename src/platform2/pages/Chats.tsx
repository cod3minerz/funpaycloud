"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import Icon from "@/platform2/icons";
import { accountsApi, chatsApi, createAccountWebSocket, ApiAccount, ApiChat, ApiMessage } from "@/lib/api";

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function dateStr(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function ChatsPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load accounts
  useEffect(() => {
    accountsApi.list().then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setAccounts(list);
      if (list.length > 0) setSelectedAccountId(list[0].id);
      else setLoadingChats(false);
    }).catch(() => setLoadingChats(false));
  }, []);

  // Connect WebSocket and load chats when account changes
  const connectWs = useCallback((accountId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    createAccountWebSocket(accountId, (event) => {
      if (event.type === "new_message") {
        const msg = event.data as unknown as ApiMessage;
        setMessages((prev) => {
          // avoid duplicate
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Update last message in chat list
        setChats((prev) => prev.map((c) => {
          const chatId = (event.data as Record<string, unknown>).chat_id;
          return c.id === chatId ? { ...c, last_message: msg.text, updated_at: msg.created_at } : c;
        }));
      }
    }).then((ws) => {
      wsRef.current = ws;
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedAccountId === null) return;
    setLoadingChats(true);
    setChats([]);
    setSelectedChatId(null);
    setMessages([]);

    connectWs(selectedAccountId);

    chatsApi.history(selectedAccountId)
      .then((rows) => setChats(Array.isArray(rows) ? rows : []))
      .catch(() => setChats([]))
      .finally(() => setLoadingChats(false));

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [selectedAccountId, connectWs]);

  // Load messages when chat selected
  useEffect(() => {
    if (selectedChatId === null) return;
    setLoadingMessages(true);
    setMessages([]);
    chatsApi.messages(selectedChatId, 50)
      .then((rows) => setMessages(Array.isArray(rows) ? rows : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending || selectedAccountId === null) return;
    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (!selectedChat) return;

    setSending(true);
    const optimistic: ApiMessage = {
      id: Date.now(),
      author_name: "Вы",
      text: trimmed,
      is_my_msg: true,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      await chatsApi.send(selectedAccountId, selectedChat.node_id, trimmed);
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === optimistic.id ? { ...m, status: "failed" } : m
      ));
    } finally {
      setSending(false);
    }
  }

  function selectChat(chat: ApiChat) {
    setSelectedChatId(chat.id);
    setMobileView("chat");
    setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unread: false } : c));
  }

  const filteredChats = chats.filter((c) =>
    !search.trim() ||
    c.with_user.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message.toLowerCase().includes(search.toLowerCase())
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

      {/* Sidebar */}
      <div className={`flex w-full flex-col border-r border-gray-100 dark:border-gray-800 sm:w-80 sm:flex lg:w-96 ${mobileView === "chat" ? "hidden sm:flex" : "flex"}`}>
        {/* Sidebar header */}
        <div className="border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="mb-3">
            <select
              value={selectedAccountId ?? ""}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
            </select>
          </div>
          <div className="relative">
            <Icon name="list" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск чатов..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icon name="chat" className="h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">Чатов нет</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors dark:border-gray-800 ${
                  selectedChatId === chat.id
                    ? "bg-brand-500/5 dark:bg-brand-500/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                  {chat.with_user.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">{chat.with_user}</p>
                    <p className="ml-2 shrink-0 text-[10px] text-gray-400">{dateStr(chat.updated_at)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="mt-0.5 truncate text-xs text-gray-500">{chat.last_message}</p>
                    {chat.unread && (
                      <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
                        •
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex flex-1 flex-col ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
        {!selectedChat ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Icon name="chat" className="h-14 w-14 text-gray-200" />
            <p className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-300">Выберите чат</p>
            <p className="mt-1 text-sm text-gray-400">Выберите диалог из списка слева</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <button
                onClick={() => setMobileView("list")}
                className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 sm:hidden dark:hover:bg-gray-800"
              >
                <Icon name="arrow-left" className="h-4 w-4" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                {selectedChat.with_user.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedChat.with_user}</p>
                <p className="text-xs text-gray-400">FunPay чат</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-sm text-gray-400">Начните переписку</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_my_msg ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        msg.is_my_msg
                          ? msg.status === "failed"
                            ? "bg-error-500 text-white"
                            : "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white"
                      }`}>
                        {!msg.is_my_msg && (
                          <p className="mb-1 text-xs font-medium opacity-70">{msg.author_name}</p>
                        )}
                        <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                        <p className={`mt-1 text-right text-[10px] ${msg.is_my_msg ? "text-white/70" : "text-gray-400"}`}>
                          {timeStr(msg.created_at)}
                          {msg.status === "pending" && " ·"}
                          {msg.status === "failed" && " ✕"}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Введите сообщение..."
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <Icon name="paper-plane" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
