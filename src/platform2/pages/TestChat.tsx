"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import Icon from "@/platform2/icons";
import { aiApi, scenariosApi, accountsApi, ApiScenario, ApiAccount } from "@/lib/api";
import { toast } from "sonner";

type ChatMode = "assistant" | "constructor";

type MessageItem = {
  role: "user" | "ai";
  text: string;
  loading?: boolean;
};

type LocalFaqItem = {
  id: string;
  question: string;
  answer: string;
};

const QUICK_MESSAGES = [
  "Есть ли товар в наличии?",
  "Когда будет выдача?",
  "Можно ли скидку?",
];

function modeLabel(mode: ChatMode): string {
  return mode === "constructor" ? "Сценарии" : "ИИ Бот";
}

export default function TestChatPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const [productionMode, setProductionMode] = useState<ChatMode>("assistant");
  const [autoMode, setAutoMode] = useState(true);
  const [overrideMode, setOverrideMode] = useState<ChatMode>("assistant");
  const [selectedScenarioID, setSelectedScenarioID] = useState("");
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [localTone, setLocalTone] = useState<"formal" | "neutral" | "friendly">("neutral");
  const [localDelaySeconds, setLocalDelaySeconds] = useState(3);
  const [localPrompt, setLocalPrompt] = useState("");
  const [localSignature, setLocalSignature] = useState(false);
  const [localFaq, setLocalFaq] = useState<LocalFaqItem[]>([]);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [trace, setTrace] = useState<Array<Record<string, unknown>>>([]);
  const [lastEffectiveMode, setLastEffectiveMode] = useState<ChatMode>("assistant");

  const messagesRef = useRef<HTMLDivElement>(null);

  const effectiveMode: ChatMode = autoMode ? productionMode : overrideMode;
  const activeScenarios = useMemo(
    () => scenarios.filter((s) => s.trigger_type === "chat_message"),
    [scenarios]
  );

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    accountsApi
      .list()
      .then(async (rows) => {
        if (cancelled) return;
        setAccounts(rows);
        if (rows.length === 0) {
          setSelectedAccountID(null);
          return;
        }
        const firstID = rows[0].id;
        setSelectedAccountID(firstID);
        await loadForAccount(firstID, cancelled);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Не удалось загрузить тест-чат");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function loadForAccount(accountID: number, cancelled = false) {
    // Gracefully handle AI config not yet created for account
    const [configResult, accountScenarios, faqItems] = await Promise.all([
      aiApi.getConfig(accountID).catch(() => null),
      scenariosApi.list(accountID).catch(() => []),
      aiApi.getFaq(accountID).catch(() => []),
    ]);
    if (cancelled) return;
    const config = configResult ?? {
      account_id: accountID,
      is_enabled: false,
      tone: "neutral" as const,
      system_prompt: "",
      delay_seconds: 3,
      show_ai_signature: false,
      chat_mode: "assistant" as const,
      constructor_scenario_id: null,
      used_messages: 0,
      limit_messages: 0,
      remaining_messages: 0,
    };

    const mode: ChatMode = config.chat_mode === "constructor" ? "constructor" : "assistant";
    setProductionMode(mode);
    setLastEffectiveMode(mode);
    setOverrideMode(mode);

    setScenarios(accountScenarios);

    const scenarioFromConfig = (config.constructor_scenario_id || "").trim();
    if (scenarioFromConfig) {
      setSelectedScenarioID(scenarioFromConfig);
    } else {
      const firstChatScenario = accountScenarios.find((s) => s.trigger_type === "chat_message");
      setSelectedScenarioID(firstChatScenario?.id || "");
    }

    const normalizedTone =
      config.tone === "formal" || config.tone === "friendly" || config.tone === "neutral"
        ? config.tone
        : "neutral";
    setLocalTone(normalizedTone);
    setLocalDelaySeconds(typeof config.delay_seconds === "number" ? config.delay_seconds : 3);
    setLocalPrompt(config.system_prompt || "");
    setLocalSignature(Boolean(config.show_ai_signature));
    setLocalFaq(
      faqItems.map((item) => ({
        id: `${item.id}`,
        question: item.question || "",
        answer: item.answer || "",
      }))
    );

    setMessages([]);
    setTrace([]);
    setInput("");
  }

  async function handleAccountChange(accountID: number) {
    setSelectedAccountID(accountID);
    setLoading(true);
    try {
      await loadForAccount(accountID);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить данные аккаунта");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(raw?: string) {
    if (!selectedAccountID || testing) return;
    const text = (raw ?? input).trim();
    if (!text) return;

    if (!autoMode && overrideMode === "constructor" && !selectedScenarioID) {
      toast.error("Выберите сценарий для теста режима сценариев");
      return;
    }

    const history = messages
      .filter((m) => !m.loading)
      .map((m) => ({
        role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
        text: m.text,
      }));

    setMessages((prev) => [...prev, { role: "user", text }, { role: "ai", text: "", loading: true }]);
    setInput("");
    setTesting(true);
    setTrace([]);

    try {
      const localFaqPayload = localFaq
        .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
        .filter((item) => item.question.length > 0 && item.answer.length > 0);

      const response = await aiApi.testChat({
        account_id: selectedAccountID,
        message: text,
        history,
        auto_mode: autoMode,
        override_mode: autoMode ? undefined : (overrideMode === "constructor" ? "constructor" : "assistant"),
        scenario_id: !autoMode && overrideMode === "constructor" ? selectedScenarioID : undefined,
        config_override:
          !autoMode && overrideMode === "assistant"
            ? {
                tone: localTone,
                system_prompt: localPrompt.trim(),
                delay_seconds: localDelaySeconds,
                show_ai_signature: localSignature,
                faq: localFaqPayload,
              }
            : undefined,
      });

      setLastEffectiveMode(
        (response.effective_mode === "constructor" ? "constructor" : "assistant") as ChatMode
      );
      setTrace(Array.isArray(response.trace) ? response.trace : []);

      setMessages((prev) => {
        const copy = [...prev];
        const loadingIndex = copy.findIndex((m) => m.role === "ai" && m.loading);
        const nextText = response.reply || "Сценарий выполнен без текстового ответа";
        if (loadingIndex >= 0) {
          copy[loadingIndex] = { role: "ai", text: nextText, loading: false };
        } else {
          copy.push({ role: "ai", text: nextText, loading: false });
        }
        return copy;
      });
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Ошибка тестового сообщения";
      setMessages((prev) => {
        const copy = [...prev];
        const loadingIndex = copy.findIndex((m) => m.role === "ai" && m.loading);
        if (loadingIndex >= 0) {
          copy[loadingIndex] = { role: "ai", text: `Ошибка: ${errorText}`, loading: false };
        }
        return copy;
      });
      toast.error(errorText);
    } finally {
      setTesting(false);
    }
  }

  function addLocalFaq() {
    setLocalFaq((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, question: "", answer: "" },
    ]);
  }

  function updateLocalFaq(index: number, key: "question" | "answer", value: string) {
    setLocalFaq((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function removeLocalFaq(index: number) {
    setLocalFaq((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-5 overflow-hidden -mx-4 -my-4 md:-mx-6 md:-my-6 px-4 py-4 md:px-6 md:py-6">

      {/* LEFT — settings panel (desktop: always visible, mobile: drawer overlay) */}
      {/* Mobile overlay backdrop */}
      {showSettingsPanel && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setShowSettingsPanel(false)}
        />
      )}
      <div className={`
        ${showSettingsPanel ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        fixed lg:relative left-0 top-0 lg:top-auto z-40 lg:z-auto
        h-full lg:h-auto
        w-[320px] lg:w-[340px] shrink-0
        overflow-y-auto space-y-4 pr-1 pb-4
        bg-white dark:bg-gray-950 lg:bg-transparent lg:dark:bg-transparent
        pt-16 lg:pt-0
        transition-transform duration-300 lg:transition-none
      `}>

        {/* Account */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Аккаунт</p>
            <div className="relative">
              <select
                value={selectedAccountID ?? ""}
                onChange={(e) => void handleAccountChange(Number(e.target.value))}
                disabled={loading}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.username ?? `#${a.id}`}</option>
                ))}
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">
              Текущий аккаунт: {accounts.find((a) => a.id === selectedAccountID)?.username ?? String(selectedAccountID ?? "")}
            </p>
          </CardContent>
        </Card>

        {/* Auto mode */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">Авто режим</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {autoMode
                    ? "Тест использует боевой режим из вкладки AI-Ассистент."
                    : "Ручной override только для теста. Боевой режим не изменяется."}
                </p>
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
                {modeLabel(effectiveMode)}
              </p>
              <p className="text-xs text-gray-400">
                {autoMode ? `Боевой режим: ${modeLabel(productionMode)}` : "Локальный режим теста"}
              </p>
            </div>

            {!autoMode && (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOverrideMode("assistant")}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                      overrideMode === "assistant"
                        ? "bg-brand-500 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                    }`}
                  >
                    ИИ Бот
                  </button>
                  <button
                    onClick={() => setOverrideMode("constructor")}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                      overrideMode === "constructor"
                        ? "bg-brand-500 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                    }`}
                  >
                    Сценарии
                  </button>
                </div>

                {overrideMode === "constructor" && (
                  <div>
                    <p className="mb-2 text-xs text-gray-500">Сценарий</p>
                    <div className="relative">
                      <select
                        value={selectedScenarioID}
                        onChange={(e) => setSelectedScenarioID(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Выберите сценарий</option>
                        {activeScenarios.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                )}

                {overrideMode === "assistant" && (
                  <div className="space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Локальные настройки теста</p>
                    <p className="text-xs text-gray-400">Эти параметры используются только в тест-чате и не меняют боевые настройки аккаунта.</p>

                    {/* Tone */}
                    <div>
                      <p className="mb-1.5 text-xs text-gray-500">Тон общения</p>
                      <div className="relative">
                        <select
                          value={localTone}
                          onChange={(e) => setLocalTone(e.target.value as "formal" | "neutral" | "friendly")}
                          className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="neutral">Нейтральный</option>
                          <option value="formal">Официальный</option>
                          <option value="friendly">Дружелюбный</option>
                        </select>
                        <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    {/* Delay */}
                    <div>
                      <p className="text-xs text-gray-500">Задержка ответа: {localDelaySeconds}с</p>
                      <input
                        type="range" min={0} max={30} step={1} value={localDelaySeconds}
                        onChange={(e) => setLocalDelaySeconds(Number(e.target.value))}
                        className="mt-1.5 w-full accent-brand-500"
                      />
                    </div>

                    {/* Signature */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Подпись ассистента</p>
                      <button
                        onClick={() => setLocalSignature((v) => !v)}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${localSignature ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${localSignature ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {/* Instruction */}
                    <div>
                      <p className="mb-1.5 text-xs text-gray-500">Инструкция для ИИ</p>
                      <textarea
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        rows={4}
                        placeholder="Например: отвечай коротко, всегда уточняй логин перед выдачей..."
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      />
                    </div>

                    {/* KB */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">База знаний FAQ</p>
                        <button
                          onClick={addLocalFaq}
                          className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
                        >
                          <Icon name="plus" className="h-3 w-3" />
                          Добавить
                        </button>
                      </div>
                      {localFaq.length === 0 ? (
                        <p className="text-xs text-gray-400">FAQ не добавлен. Ответы будут строиться только по инструкции и контексту лотов.</p>
                      ) : (
                        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                          {localFaq.map((item, i) => (
                            <div key={item.id} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                              <div className="flex items-center justify-end px-3 py-1.5 border-b border-gray-100 dark:border-gray-800">
                                <button
                                  onClick={() => removeLocalFaq(i)}
                                  className="flex items-center gap-0.5 text-xs text-error-500 hover:text-error-600"
                                >
                                  <Icon name="trash" className="h-3 w-3" />
                                  Удалить
                                </button>
                              </div>
                              <div className="p-2 space-y-1.5">
                                <input
                                  value={item.question}
                                  onChange={(e) => updateLocalFaq(i, "question", e.target.value)}
                                  placeholder="Вопрос"
                                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                <textarea
                                  value={item.answer}
                                  onChange={(e) => updateLocalFaq(i, "answer", e.target.value)}
                                  placeholder="Ответ"
                                  rows={2}
                                  className="w-full resize-none rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Trace panel — shown after response */}
        {trace.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Trace</p>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {trace.map((item, index) => {
                  const nodeID = typeof item.node_id === "string" ? item.node_id : `#${index + 1}`;
                  const nodeType = typeof item.node_type === "string" ? item.node_type : "node";
                  const result = typeof item.result === "string" ? item.result : "executed";
                  return (
                    <div key={`${nodeID}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {nodeType} · {nodeID}
                      </p>
                      <p className="text-xs text-gray-400">result: {result}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT — chat */}
      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile settings toggle */}
            <button
              onClick={() => setShowSettingsPanel((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Настройки теста"
            >
              <Icon name="more-dots" className="h-5 w-5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 sm:h-9 sm:w-9">
              <Icon name="cpu" className="h-4 w-4 text-brand-500 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white sm:text-base">Тестовый диалог</p>
              <p className="hidden text-xs text-gray-400 sm:block">Режим теста не влияет на боевой режим аккаунта</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-gray-400 sm:block">Ответил:</span>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600 sm:px-2.5">
              {modeLabel(lastEffectiveMode)}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto px-5 py-5">
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
                {QUICK_MESSAGES.map((q) => (
                  <button
                    key={q}
                    onClick={() => void sendMessage(q)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-700 hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-600 transition-colors dark:border-gray-700 dark:text-gray-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2.5"}`}>
                  {msg.role === "ai" && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
                      <Icon name="cpu" className="h-4 w-4 text-brand-500" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-brand-500 text-white"
                      : "rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white"
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">
                      {msg.loading ? "Печатает…" : msg.text}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
              }}
              placeholder="Напишите сообщение покупателя..."
              disabled={testing || loading}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200 disabled:opacity-50"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || testing || loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Icon name="paper-plane" className="h-4 w-4" />
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setTrace([]); }}
              className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <Icon name="close-line" className="h-3 w-3" />
              Очистить тестовый диалог
            </button>
          )}
        </div>
      </Card>

    </div>
  );
}
