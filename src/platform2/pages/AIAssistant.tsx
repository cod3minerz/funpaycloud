"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import { aiApi, scenariosApi, accountsApi, AIConfig, AIFaqItem, ApiScenario, ApiAccount } from "@/lib/api";

type Tone = "formal" | "neutral" | "friendly";

const toneOptions: { id: Tone; label: string; subtitle: string }[] = [
  { id: "formal", label: "Официальный", subtitle: "Здравствуйте, благодарю" },
  { id: "neutral", label: "Нейтральный", subtitle: "Привет, окей, понял" },
  { id: "friendly", label: "Дружелюбный", subtitle: "Привет! Конечно, помогу" },
];

const quickPhrases = [
  "Выдача мгновенная",
  "Возвраты через FunPay",
  "Не давать скидки",
  "Уточнить у продавца",
  "Гарантия 24 часа",
];

export default function AIAssistantPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [account, setAccount] = useState<string>("");
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [scenario, setScenario] = useState<string>("");

  const [mode, setMode] = useState<"bot" | "scenarios">("bot");
  const [autoReply, setAutoReply] = useState(false);
  const [tone, setTone] = useState<Tone>("formal");
  const [delay, setDelay] = useState(10);
  const [signature, setSignature] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [kb, setKb] = useState<AIFaqItem[]>([]);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [addingKb, setAddingKb] = useState(false);
  const [editingKbId, setEditingKbId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [usedMessages, setUsedMessages] = useState(0);
  const [limitMessages, setLimitMessages] = useState(1);

  // Load accounts on mount
  useEffect(() => {
    accountsApi.list().then((list) => {
      setAccounts(list);
      if (list.length > 0) setAccount(String(list[0].id));
    }).catch(() => {});
  }, []);

  // Load AI config + FAQ when account changes
  useEffect(() => {
    if (!account) return;
    aiApi.getConfig(account).then((cfg: AIConfig) => {
      setAutoReply(cfg.is_enabled);
      setTone((cfg.tone as Tone) || "formal");
      setDelay(cfg.delay_seconds ?? 10);
      setSignature(cfg.show_ai_signature ?? false);
      setInstruction(cfg.system_prompt ?? "");
      setUsedMessages(cfg.used_messages ?? 0);
      setLimitMessages(cfg.limit_messages || 1);
      if (cfg.chat_mode === "constructor") setMode("scenarios");
      else setMode("bot");
      if (cfg.constructor_scenario_id) setScenario(cfg.constructor_scenario_id);
    }).catch(() => {});
    aiApi.getFaq(account).then(setKb).catch(() => {});
    scenariosApi.list(account).then((list) => {
      setScenarios(list);
      if (list.length > 0 && !scenario) setScenario(list[0].id);
    }).catch(() => {});
  }, [account]);

  function addPhrase(phrase: string) {
    const trimmed = instruction.trimEnd();
    setInstruction(trimmed ? `${trimmed} ${phrase}.` : `${phrase}.`);
  }

  async function saveKbEntry() {
    if (!newQ.trim() || !newA.trim() || !account) return;
    try {
      const item = await aiApi.addFaq(account, { question: newQ.trim(), answer: newA.trim() });
      setKb((prev) => [...prev, item]);
      setNewQ("");
      setNewA("");
      setAddingKb(false);
    } catch {
      // ignore
    }
  }

  async function deleteKbEntry(id: number) {
    if (!account) return;
    try {
      await aiApi.deleteFaq(account, id);
      setKb((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // ignore
    }
  }

  async function handleSave() {
    if (!account) return;
    setSaving(true);
    try {
      await aiApi.saveConfig(account, {
        is_enabled: autoReply,
        tone,
        system_prompt: instruction,
        delay_seconds: delay,
        show_ai_signature: signature,
        chat_mode: mode === "scenarios" ? "constructor" : "assistant",
        constructor_scenario_id: mode === "scenarios" ? scenario : undefined,
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-24">

      {/* HEADER */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Ассистент</h1>

      {/* COMBINED: AUTO-REPLY + MODE */}
      <Card>
        <CardContent className="p-6">

          {/* Master toggle row */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                {autoReply ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-warning-400" />
              )}
                <span className="text-xs text-gray-400">
                  {autoReply ? "Автоответчик включён" : "Автоответчик выключен"}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white">Автоответчик</h3>
              <p className="mt-0.5 text-sm text-gray-500">Включает боевые ответы покупателям</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setAutoReply((v) => !v)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  autoReply ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    autoReply ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs text-gray-400">{autoReply ? "Включён" : "Выключен"}</span>
            </div>
          </div>

          {/* Mode selector */}
          <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Режим работы</p>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-semibold transition-colors ${mode === "bot" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                ИИ Бот
              </span>
              <button
                onClick={() => setMode((m) => (m === "bot" ? "scenarios" : "bot"))}
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-brand-500 transition-colors"
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    mode === "scenarios" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold transition-colors ${mode === "scenarios" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                Сценарии
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {mode === "bot"
                ? "ИИ отвечает по инструкции и базе знаний"
                : "Ответы идут строго по выбранному сценарию"}
            </p>
          </div>

          {/* Usage bar */}
          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Использовано в этом месяце</p>
                <p className="mt-0.5 text-xs text-gray-400">Обновится 1-го числа</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {usedMessages} / {limitMessages} сообщений
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Аккаунт: {accounts.find((a) => String(a.id) === account)?.username ?? account}</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-1.5 rounded-full bg-brand-500 transition-all"
                style={{ width: `${(usedMessages / limitMessages) * 100}%` }}
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ACCOUNT */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Аккаунт FunPay</p>
        <Card>
          <CardContent className="p-5">
            <div className="relative">
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={String(a.id)}>{a.username ?? `#${a.id}`}</option>
                ))}
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="mt-2 text-xs text-gray-400">AI будет отвечать от имени выбранного аккаунта</p>
          </CardContent>
        </Card>
      </div>

      {/* SCENARIO SELECTOR — only in scenarios mode */}
      {mode === "scenarios" && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Сценарий для чатов этого аккаунта</p>
          <Card>
            <CardContent className="p-5">
              <div className="relative">
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Выбранный сценарий будет единственным автоответчиком для этого аккаунта.
                </p>
                <Link
                  href="/constructor"
                  className="ml-4 shrink-0 text-xs font-medium text-brand-500 hover:text-brand-600"
                >
                  Открыть конструктор
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BOT-ONLY BLOCKS */}
      {mode === "bot" && <>

      {/* TONE */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Тон общения</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {toneOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTone(opt.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                tone === opt.id
                  ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              <p className={`font-semibold ${tone === opt.id ? "text-brand-600" : "text-gray-800 dark:text-white"}`}>
                {opt.label}
              </p>
              <p className="mt-1 text-sm text-gray-400">{opt.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      {/* DELAY */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Задержка ответа</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{delay} сек</p>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="mt-4 w-full accent-brand-500"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>Мгновенно</span>
            <span>Имитация живого ответа</span>
            <span>30 сек</span>
          </div>
        </CardContent>
      </Card>

      {/* SIGNATURE */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Подпись ассистента</p>
              <p className="mt-0.5 text-sm text-gray-500">
                К каждому ответу добавляется строка «— Ассистент FunPay Cloud»
              </p>
            </div>
            <button
              onClick={() => setSignature((v) => !v)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                signature ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  signature ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* INSTRUCTION */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Инструкция для AI</p>
          <button
            onClick={() => setInstruction(
              `Ты вежливый помощник продавца на FunPay. Отвечай кратко и по делу.\n` +
              `При вопросе о товаре — уточни детали заказа.\n` +
              `Если не знаешь ответа — предложи написать продавцу напрямую.\n` +
              `Будь дружелюбным, используй простой язык. Не используй сложные термины.`
            )}
            className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 transition-colors"
          >
            <Icon name="info" className="h-3.5 w-3.5" />
            Пример
          </button>
        </div>
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 text-sm text-gray-500">Опишите своими словами, как должен вести себя ассистент</p>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              maxLength={2000}
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">Лоты из вашего аккаунта добавляются автоматически</p>
              <p className="text-xs text-gray-400">{instruction.length} / 2000</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <p className="text-xs text-gray-400 self-center">Быстрые фразы:</p>
              {quickPhrases.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => addPhrase(phrase)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-600 transition-colors dark:border-gray-700 dark:text-gray-400"
                >
                  + {phrase}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KNOWLEDGE BASE */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 dark:text-white">База знаний</p>
            <p className="text-sm text-gray-500">Частые вопросы — AI использует эти ответы в диалоге</p>
          </div>
          <button
            onClick={() => setAddingKb(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Добавить
          </button>
        </div>

        <Card>
          <CardContent className="divide-y divide-gray-100 p-0 dark:divide-gray-800">
            {kb.length === 0 && !addingKb && (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-gray-400">База знаний пуста</p>
              </div>
            )}
            {kb.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  {editingKbId === String(entry.id) ? (
                    <div className="space-y-2">
                      <input
                        defaultValue={entry.question}
                        onChange={(e) =>
                          setKb((prev) =>
                            prev.map((k) => k.id === entry.id ? { ...k, question: e.target.value } : k)
                          )
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        placeholder="Вопрос"
                      />
                      <input
                        defaultValue={entry.answer}
                        onChange={(e) =>
                          setKb((prev) =>
                            prev.map((k) => k.id === entry.id ? { ...k, answer: e.target.value } : k)
                          )
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        placeholder="Ответ"
                      />
                      <button
                        onClick={() => setEditingKbId(null)}
                        className="text-xs text-brand-500 hover:text-brand-600"
                      >
                        Готово
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800 dark:text-white">{entry.question}</p>
                      <p className="mt-0.5 text-sm text-gray-500">{entry.answer}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditingKbId(String(entry.id))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteKbEntry(entry.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {addingKb && (
              <div className="space-y-2 px-5 py-4">
                <input
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  placeholder="Вопрос покупателя"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <input
                  value={newA}
                  onChange={(e) => setNewA(e.target.value)}
                  placeholder="Ответ ассистента"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={saveKbEntry}>Сохранить</Button>
                  <Button variant="outline" size="sm" onClick={() => { setAddingKb(false); setNewQ(""); setNewA(""); }}>
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      </>} {/* end bot-only */}

      {/* STICKY SAVE */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80 lg:pl-[310px]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Сохранение…" : "Сохранить настройки"}
        </button>
      </div>

    </div>
  );
}
