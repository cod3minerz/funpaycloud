"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import Icon from "@/platform2/icons";
import { accountsApi, aiApi, scenariosApi, ApiAccount, AITestHistoryItem, ApiScenario } from "@/lib/api";

type TestMode = "bot" | "scenarios";

type Message = {
  id: string;
  role: "buyer" | "bot";
  text: string;
  ts: string;
};

const suggestedQuestions = [
  "Есть ли товар в наличии?",
  "Когда будет выдача?",
  "Можно ли скидку?",
];

function nowTs() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default function TestChatPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [autoMode, setAutoMode] = useState(false);
  const [testMode, setTestMode] = useState<TestMode>("bot");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    accountsApi.list()
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setAccounts(list);
        if (list.length > 0) setSelectedAccountId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));
  }, []);

  const loadScenarios = useCallback(async (accountId: number) => {
    try {
      const rows = await scenariosApi.list(accountId);
      const list = Array.isArray(rows) ? rows : [];
      setScenarios(list);
      if (list.length > 0) setSelectedScenarioId(list[0].id);
      else setSelectedScenarioId("");
    } catch {
      setScenarios([]);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId !== null) {
      setMessages([]);
      loadScenarios(selectedAccountId);
    }
  }, [selectedAccountId, loadScenarios]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping || selectedAccountId === null) return;

    const userMsg: Message = { id: Date.now().toString(), role: "buyer", text: trimmed, ts: nowTs() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError("");

    // Build history from existing messages
    const history: AITestHistoryItem[] = messages.map((m) => ({
      role: m.role === "buyer" ? "user" : "ai",
      text: m.text,
    }));

    try {
      const res = await aiApi.testChat({
        account_id: selectedAccountId,
        message: trimmed,
        history,
        auto_mode: autoMode,
        override_mode: testMode === "bot" ? "assistant" : "constructor",
        scenario_id: testMode === "scenarios" ? selectedScenarioId : undefined,
      });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: res.reply,
        ts: nowTs(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка получения ответа");
    } finally {
      setIsTyping(false);
    }
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-5 overflow-hidden">

      {/* LEFT — settings */}
      <div className="w-[320px] shrink-0 space-y-4 overflow-y-auto pr-1">

        {/* Account */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Аккаунт</p>
            {loadingAccounts ? (
              <div className="h-10 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ) : (
              <div className="relative">
                <select
                  value={selectedAccountId ?? ""}
                  onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.username}</option>
                  ))}
                </select>
                <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            )}
            {selectedAccount && (
              <p className="text-xs text-gray-400">Текущий аккаунт: {selectedAccount.username}</p>
            )}
          </CardContent>
        </Card>

        {/* Auto mode */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">Авто режим</p>
                <p className="mt-0.5 text-xs text-gray-400">Использует боевые настройки аккаунта без override.</p>
              </div>
              <button
                onClick={() => setAutoMode((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${autoMode ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${autoMode ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Test mode */}
        {!autoMode && (
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Режим теста</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTestMode("bot")}
                  className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                    testMode === "bot"
                      ? "bg-brand-500 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                  }`}
                >
                  ИИ Бот
                </button>
                <button
                  onClick={() => setTestMode("scenarios")}
                  className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                    testMode === "scenarios"
                      ? "bg-brand-500 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                  }`}
                >
                  Сценарии
                </button>
              </div>

              {testMode === "scenarios" && (
                <div>
                  <p className="mb-2 text-xs text-gray-500">Сценарий</p>
                  {scenarios.length === 0 ? (
                    <p className="text-xs text-gray-400">Нет доступных сценариев</p>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedScenarioId}
                        onChange={(e) => setSelectedScenarioId(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        {scenarios.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  )}
                </div>
              )}

              {testMode === "bot" && (
                <p className="text-xs text-gray-400">
                  ИИ Бот использует настройки из раздела «AI-Ассистент» для данного аккаунта.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT — chat */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10">
              <Icon name="cpu" className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Тестовый диалог</p>
              <p className="text-xs text-gray-400">Тест не влияет на боевой режим аккаунта</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-600">
              {autoMode ? "Авто" : testMode === "bot" ? "ИИ Бот" : "Сценарии"}
            </span>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setError(""); }}
                className="ml-2 text-xs text-gray-400 hover:text-gray-600"
              >
                Очистить
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10">
                <Icon name="bolt" className="h-7 w-7 text-brand-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 dark:text-white">Проверьте качество автоответов</p>
                <p className="mt-1 text-sm text-gray-400">Вы пишете как покупатель, система отвечает в выбранном тестовом режиме.</p>
              </div>
              <div className="mt-2 w-full max-w-sm space-y-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={selectedAccountId === null}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "buyer" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "buyer"
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white"
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    <p className={`mt-1 text-right text-[10px] ${msg.role === "buyer" ? "text-white/70" : "text-gray-400"}`}>
                      {msg.ts}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                </div>
              )}
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
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Напишите сообщение покупателя..."
              disabled={selectedAccountId === null || isTyping}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-50 dark:text-gray-200"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping || selectedAccountId === null}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Icon name="paper-plane" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
