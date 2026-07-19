"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { aiApi, ApiAccount } from "@/lib/api";
import { Card } from "@/platform2/components/ui/card";
import Icon from "@/platform2/icons";

type ChatMode = "assistant" | "constructor";

type MessageItem = {
  role: "user" | "ai";
  text: string;
  loading?: boolean;
  error?: boolean;
};

export type AITestChatProps = {
  accounts: ApiAccount[];
  accountId: number | null;
  accountLoading: boolean;
  mode: "bot" | "scenarios";
  scenarioId: string;
  scenarioName?: string;
  tone: "formal" | "neutral" | "friendly";
  delaySeconds: number;
  systemPrompt: string;
  showAISignature: boolean;
  faq: Array<{ question: string; answer: string }>;
  usedMessages: number;
  limitMessages: number;
  onAccountChange: (accountId: number) => void;
  onUsageChange: (usedMessages: number, limitMessages?: number) => void;
  onOpenSettings: () => void;
};

const QUICK_MESSAGES = [
  "Есть ли товар в наличии?",
  "Когда будет выдача?",
  "Можно ли скидку?",
];

function modeLabel(mode: ChatMode): string {
  return mode === "constructor" ? "Сценарии" : "ИИ Бот";
}

export default function AITestChat({
  accounts,
  accountId,
  accountLoading,
  mode,
  scenarioId,
  scenarioName,
  tone,
  delaySeconds,
  systemPrompt,
  showAISignature,
  faq,
  usedMessages,
  limitMessages,
  onAccountChange,
  onUsageChange,
  onOpenSettings,
}: AITestChatProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [trace, setTrace] = useState<Array<Record<string, unknown>>>([]);
  const [lastEffectiveMode, setLastEffectiveMode] = useState<ChatMode>(
    mode === "scenarios" ? "constructor" : "assistant"
  );
  const messagesRef = useRef<HTMLDivElement>(null);
  const previousAccountId = useRef<number | null>(accountId);

  useEffect(() => {
    const element = messagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (previousAccountId.current === accountId) return;
    previousAccountId.current = accountId;
    setMessages([]);
    setTrace([]);
    setInput("");
    setLastEffectiveMode(mode === "scenarios" ? "constructor" : "assistant");
  }, [accountId, mode]);

  async function sendMessage(raw?: string) {
    if (!accountId || testing || accountLoading) return;
    const text = (raw ?? input).trim();
    if (!text) return;
    if (mode === "scenarios" && !scenarioId) {
      toast.error("Выберите сценарий во вкладке «Настройки»");
      return;
    }

    const history = messages
      .filter((message) => !message.loading && !message.error)
      .map((message) => ({
        role: (message.role === "ai" ? "assistant" : "user") as "assistant" | "user",
        text: message.text,
      }));

    setMessages((previous) => [
      ...previous,
      { role: "user", text },
      { role: "ai", text: "", loading: true },
    ]);
    setInput("");
    setTesting(true);
    setTrace([]);

    try {
      const effectiveMode: ChatMode = mode === "scenarios" ? "constructor" : "assistant";
      const response = await aiApi.testChat({
        account_id: accountId,
        message: text,
        history,
        auto_mode: false,
        override_mode: effectiveMode,
        scenario_id: effectiveMode === "constructor" ? scenarioId : undefined,
        config_override: effectiveMode === "assistant"
          ? {
              tone,
              system_prompt: systemPrompt.trim(),
              delay_seconds: delaySeconds,
              show_ai_signature: showAISignature,
              faq: faq
                .map((item) => ({
                  question: item.question.trim(),
                  answer: item.answer.trim(),
                }))
                .filter((item) => item.question.length > 0 && item.answer.length > 0),
            }
          : undefined,
      });

      const responseMode: ChatMode = response.effective_mode === "constructor" ? "constructor" : "assistant";
      setLastEffectiveMode(responseMode);
      setTrace(Array.isArray(response.trace) ? response.trace : []);
      if (typeof response.used_messages === "number") {
        onUsageChange(response.used_messages, response.limit_messages);
      }
      setMessages((previous) => {
        const copy = [...previous];
        const loadingIndex = copy.findIndex((message) => message.role === "ai" && message.loading);
        const reply = response.reply?.trim() || "Сценарий выполнен без текстового ответа";
        if (loadingIndex >= 0) copy[loadingIndex] = { role: "ai", text: reply };
        else copy.push({ role: "ai", text: reply });
        return copy;
      });
    } catch (error) {
      const rawError = error instanceof Error ? error.message : "Ошибка тестового сообщения";
      const serviceUnavailable = /внешний сервис|временно недоступен|service unavailable|unavailable/i.test(rawError);
      const errorText = serviceUnavailable
        ? "ИИ-провайдер временно недоступен. Подождите 1–2 минуты и попробуйте снова."
        : rawError;
      setMessages((previous) => {
        const copy = [...previous];
        const loadingIndex = copy.findIndex((message) => message.role === "ai" && message.loading);
        if (loadingIndex >= 0) copy[loadingIndex] = { role: "ai", text: `⚠️ ${errorText}`, error: true };
        return copy;
      });
      toast.error(errorText);
    } finally {
      setTesting(false);
    }
  }

  if (accounts.length === 0 && !accountLoading) {
    return (
      <div data-testid="ai-test-chat-empty">
        <Card className="flex min-h-[420px] items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10">
              <Icon name="cpu" className="h-7 w-7 text-brand-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Добавьте FunPay-аккаунт</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Тестовый чат использует данные выбранного аккаунта и его лотов.
            </p>
            <Link
              href="/platform/accounts"
              className="mt-5 inline-flex rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Перейти к аккаунтам
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const selectedAccount = accounts.find((account) => account.id === accountId);
  const effectiveDraftMode: ChatMode = mode === "scenarios" ? "constructor" : "assistant";
  const inputDisabled = !accountId || accountLoading || testing;

  return (
    <div className="min-w-0 space-y-4" data-testid="ai-test-chat">
      <Card className="p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Тест текущего черновика</h2>
              <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-600">
                Текущий черновик
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {modeLabel(effectiveDraftMode)}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Сообщения не отправляются в FunPay. AI-вызовы учитываются в месячном лимите.
            </p>
            {effectiveDraftMode === "constructor" && (
              <p className="mt-1 text-xs text-gray-400">
                Сценарий: {scenarioName || "не выбран"}
              </p>
            )}
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row lg:w-auto">
            <label className="min-w-0 flex-1 lg:w-64">
              <span className="sr-only">FunPay-аккаунт для теста</span>
              <select
                value={accountId ?? ""}
                onChange={(event) => onAccountChange(Number(event.target.value))}
                disabled={accountLoading || testing}
                data-testid="ai-test-account"
                className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username || `Аккаунт #${account.id}`}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={onOpenSettings}
              className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Изменить настройки
            </button>
          </div>
        </div>
      </Card>

      <Card className="flex min-h-[520px] min-w-0 flex-col overflow-hidden lg:h-[calc(100dvh-17rem)] lg:min-h-[560px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
              <Icon name="cpu" className="h-5 w-5 text-brand-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-white sm:text-base">Тестовый диалог</p>
              <p className="truncate text-xs text-gray-400">Аккаунт: {selectedAccount?.username || `#${accountId ?? "—"}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Ответил:</span>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 font-medium text-brand-600">
              {modeLabel(lastEffectiveMode)}
            </span>
            {limitMessages > 0 && (
              <span className="hidden text-gray-400 sm:inline" data-testid="ai-test-usage">
                {usedMessages} / {limitMessages}
              </span>
            )}
          </div>
        </div>

        <div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5" data-testid="ai-test-messages">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[330px] flex-col items-center justify-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10">
                <Icon name="bolt" className="h-7 w-7 text-brand-500" />
              </div>
              <div className="max-w-md text-center">
                <p className="font-semibold text-gray-800 dark:text-white">Проверьте качество ответа</p>
                <p className="mt-1 text-sm text-gray-400">Напишите сообщение от лица покупателя или выберите готовый пример.</p>
              </div>
              <div className="mt-2 grid w-full max-w-xl gap-2 sm:grid-cols-3">
                {QUICK_MESSAGES.map((quickMessage) => (
                  <button
                    key={quickMessage}
                    type="button"
                    onClick={() => void sendMessage(quickMessage)}
                    disabled={inputDisabled}
                    className="min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    {quickMessage}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start gap-2.5"}`}>
                  {message.role === "ai" && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
                      <Icon name="cpu" className="h-4 w-4 text-brand-500" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[75%] ${
                    message.role === "user"
                      ? "rounded-br-sm bg-brand-500 text-white"
                      : message.error
                        ? "rounded-bl-sm bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300"
                        : "rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white"
                  }`}>
                    <p className="whitespace-pre-wrap break-words text-sm" data-testid={message.loading ? "ai-test-typing" : undefined}>
                      {message.loading ? "Печатает…" : message.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 sm:px-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Напишите сообщение покупателя..."
              disabled={inputDisabled}
              data-testid="ai-test-input"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-50 dark:text-gray-200"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || inputDisabled}
              aria-label="Отправить тестовое сообщение"
              data-testid="ai-test-send"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Icon name="paper-plane" className="h-4 w-4" />
            </button>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => { setMessages([]); setTrace([]); }}
              className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <Icon name="close-line" className="h-3 w-3" />
              Очистить тестовый диалог
            </button>
          )}
        </div>
      </Card>

      {trace.length > 0 && (
        <div data-testid="ai-test-trace">
          <Card className="p-4">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-gray-800 dark:text-white">
                Trace сценария · {trace.length} шагов
              </summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {trace.map((item, index) => {
                  const nodeId = typeof item.node_id === "string" ? item.node_id : `#${index + 1}`;
                  const nodeType = typeof item.node_type === "string" ? item.node_type : "node";
                  const result = typeof item.result === "string" ? item.result : "executed";
                  return (
                    <div key={`${nodeId}-${index}`} className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                      <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{nodeType} · {nodeId}</p>
                      <p className="truncate text-xs text-gray-400">result: {result}</p>
                    </div>
                  );
                })}
              </div>
            </details>
          </Card>
        </div>
      )}
    </div>
  );
}
