"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import { aiApi, scenariosApi, accountsApi, AITestHistoryItem, ApiScenario, ApiAccount } from "@/lib/api";

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

function now() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default function TestChatPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [account, setAccount] = useState<string>("");
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [autoMode, setAutoMode] = useState(false);
  const [testMode, setTestMode] = useState<TestMode>("bot");
  const [selectedScenario, setSelectedScenario] = useState("");
  const [tone, setTone] = useState("Официальный");
  const [delay, setDelay] = useState(10);
  const [signature, setSignature] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [newKbQ, setNewKbQ] = useState("");
  const [newKbA, setNewKbA] = useState("");
  const [addingKb, setAddingKb] = useState(false);
  const [kbList, setKbList] = useState<{ question: string; answer: string }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    accountsApi.list().then((list) => {
      setAccounts(list);
      if (list.length > 0) setAccount(String(list[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!account) return;
    scenariosApi.list(account).then((list) => {
      setScenarios(list);
      if (list.length > 0) setSelectedScenario(list[0].id);
    }).catch(() => {});
    // Load AI config for tone/instruction defaults
    aiApi.getConfig(account).then((cfg) => {
      const toneMap: Record<string, string> = { formal: "Официальный", neutral: "Нейтральный", friendly: "Дружелюбный" };
      setTone(toneMap[cfg.tone] ?? "Официальный");
      setInstruction(cfg.system_prompt ?? "");
      setSignature(cfg.show_ai_signature ?? false);
      setDelay(cfg.delay_seconds ?? 10);
    }).catch(() => {});
    aiApi.getFaq(account).then((items) => {
      setKbList(items.map((i) => ({ question: i.question, answer: i.answer })));
    }).catch(() => {});
  }, [account]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping || !account) return;
    const userMsg: Message = { id: Date.now().toString(), role: "buyer", text: trimmed, ts: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Build history for API
    const history: AITestHistoryItem[] = messages.map((m) => ({
      role: m.role === "buyer" ? "user" : "assistant",
      text: m.text,
    }));

    const toneApiMap: Record<string, string> = { "Официальный": "formal", "Нейтральный": "neutral", "Дружелюбный": "friendly" };

    try {
      const resp = await aiApi.testChat({
        account_id: Number(account),
        message: trimmed,
        history,
        auto_mode: autoMode,
        override_mode: testMode === "scenarios" ? "constructor" : "assistant",
        scenario_id: testMode === "scenarios" ? selectedScenario : undefined,
        config_override: testMode === "bot" ? {
          tone: toneApiMap[tone] ?? "formal",
          system_prompt: instruction,
          show_ai_signature: signature,
          faq: kbList,
        } : undefined,
      });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: resp.reply,
        ts: now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: unknown) {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: e instanceof Error ? e.message : "Ошибка. Попробуйте ещё раз.",
        ts: now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-5 overflow-hidden">

      {/* LEFT — settings */}
      <div className="w-[360px] shrink-0 overflow-y-auto space-y-4 pr-1">

        {/* Account */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Аккаунт</p>
            <div className="relative">
              <select
                value={account}
                onChange={(e) => { setAccount(e.target.value); setMessages([]); }}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={String(a.id)}>{a.username ?? `#${a.id}`}</option>
                ))}
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">Текущий аккаунт: {accounts.find((a) => String(a.id) === account)?.username ?? account}</p>
          </CardContent>
        </Card>

        {/* Auto mode */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">Авто режим</p>
                <p className="mt-0.5 text-xs text-gray-400">Ручной override только для теста. Боевой режим не изменяется.</p>
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
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Режим теста</p>
              <p className="mt-1 font-bold text-gray-800 dark:text-white">
                {testMode === "bot" ? "ИИ Бот" : "Сценарии"}
              </p>
              <p className="text-xs text-gray-400">Локальный режим теста</p>
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

            {testMode === "scenarios" ? (
              <div>
                <p className="mb-2 text-xs text-gray-500">Сценарий</p>
                <div className="relative">
                  <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Локальные настройки теста</p>
                <p className="text-xs text-gray-400">Эти параметры используются только в тест-чате и не меняют боевые настройки аккаунта.</p>

                {/* Tone */}
                <div>
                  <p className="mb-1.5 text-xs text-gray-500">Тон общения</p>
                  <div className="relative">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option>Официальный</option>
                      <option>Нейтральный</option>
                      <option>Дружелюбный</option>
                    </select>
                    <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Delay */}
                <div>
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-500">Задержка ответа: {delay}с</p>
                  </div>
                  <input
                    type="range" min={0} max={30} value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    className="mt-1.5 w-full accent-brand-500"
                  />
                </div>

                {/* Signature */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Подпись ассистента</p>
                  <button
                    onClick={() => setSignature((v) => !v)}
                    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${signature ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${signature ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>

                {/* Instruction */}
                <div>
                  <p className="mb-1.5 text-xs text-gray-500">Инструкция для ИИ</p>
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  />
                </div>

                {/* KB */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">База знаний FAQ</p>
                    <button
                      onClick={() => setAddingKb(true)}
                      className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
                    >
                      <Icon name="plus" className="h-3 w-3" />
                      Добавить
                    </button>
                  </div>
                  <div className="space-y-2">
                    {kbList.map((e, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-xs text-gray-500 truncate">{e.question}</span>
                          <button
                            onClick={() => setKbList((prev) => prev.filter((_, j) => j !== i))}
                            className="ml-2 flex items-center gap-0.5 text-xs text-error-500 hover:text-error-600"
                          >
                            <Icon name="trash" className="h-3 w-3" />
                            Удалить
                          </button>
                        </div>
                        <p className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300">{e.answer}</p>
                      </div>
                    ))}
                    {addingKb && (
                      <div className="space-y-1.5 rounded-lg border border-brand-300 bg-white p-2 dark:bg-gray-900">
                        <input value={newKbQ} onChange={(e) => setNewKbQ(e.target.value)} placeholder="Вопрос"
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        <textarea value={newKbA} onChange={(e) => setNewKbA(e.target.value)} placeholder="Ответ" rows={2}
                          className="w-full resize-none rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        <div className="flex gap-1.5">
                          <button onClick={() => { if (newKbQ && newKbA) { setKbList((p) => [...p, { question: newKbQ, answer: newKbA }]); setNewKbQ(""); setNewKbA(""); setAddingKb(false); } }}
                            className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-medium text-white">Сохранить</button>
                          <button onClick={() => { setAddingKb(false); setNewKbQ(""); setNewKbA(""); }}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-500 dark:border-gray-700">Отмена</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
              <p className="text-xs text-gray-400">Режим теста не влияет на боевой режим аккаунта</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Ответил:</span>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-600">
              {testMode === "bot" ? "ИИ Бот" : "Сценарии"}
            </span>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
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
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-700 hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-600 transition-colors dark:border-gray-700 dark:text-gray-300"
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
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
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
