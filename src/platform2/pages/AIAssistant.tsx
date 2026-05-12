"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import { accountsApi, aiApi, scenariosApi, ApiAccount, AIConfig, AIFaqItem, ApiScenario } from "@/lib/api";

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

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

export default function AIAssistantPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [faq, setFaq] = useState<AIFaqItem[]>([]);
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Local editable state
  const [isEnabled, setIsEnabled] = useState(false);
  const [mode, setMode] = useState<"assistant" | "constructor">("assistant");
  const [scenarioId, setScenarioId] = useState("");
  const [tone, setTone] = useState<Tone>("neutral");
  const [delay, setDelay] = useState(5);
  const [signature, setSignature] = useState(false);
  const [instruction, setInstruction] = useState("");

  // FAQ editing state
  const [addingFaq, setAddingFaq] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [addingFaqLoading, setAddingFaqLoading] = useState(false);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);

  useEffect(() => {
    accountsApi.list().then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setAccounts(list);
      if (list.length > 0) setSelectedAccountId(list[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadAccountData = useCallback(async (accountId: number) => {
    setLoading(true);
    setConfig(null);
    setFaq([]);
    setScenarios([]);
    try {
      const [cfg, faqData, scenData] = await Promise.all([
        aiApi.getConfig(accountId),
        aiApi.getFaq(accountId),
        scenariosApi.list(accountId),
      ]);
      setConfig(cfg);
      setIsEnabled(cfg.is_enabled);
      setMode((cfg.chat_mode as "assistant" | "constructor") || "assistant");
      setScenarioId(cfg.constructor_scenario_id || "");
      setTone((cfg.tone as Tone) || "neutral");
      setDelay(cfg.delay_seconds ?? 5);
      setSignature(cfg.show_ai_signature ?? false);
      setInstruction(cfg.system_prompt ?? "");
      setFaq(Array.isArray(faqData) ? faqData : []);
      setScenarios(Array.isArray(scenData) ? scenData : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId !== null) loadAccountData(selectedAccountId);
  }, [selectedAccountId, loadAccountData]);

  async function handleSave() {
    if (!selectedAccountId || !config) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await aiApi.saveConfig(selectedAccountId, {
        is_enabled: isEnabled,
        tone,
        system_prompt: instruction,
        delay_seconds: delay,
        show_ai_signature: signature,
        chat_mode: mode,
        constructor_scenario_id: mode === "constructor" ? scenarioId : undefined,
      });
      setSaveMsg({ text: "Настройки сохранены", ok: true });
    } catch (err) {
      setSaveMsg({ text: err instanceof Error ? err.message : "Ошибка", ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleMode() {
    if (!selectedAccountId) return;
    const newMode = mode === "assistant" ? "constructor" : "assistant";
    setMode(newMode);
    try {
      await aiApi.updateMode(selectedAccountId, {
        chat_mode: newMode,
        constructor_scenario_id: newMode === "constructor" ? scenarioId : undefined,
      });
    } catch {
      setMode(mode);
    }
  }

  async function handleAddFaq() {
    if (!selectedAccountId || !newQ.trim() || !newA.trim()) return;
    setAddingFaqLoading(true);
    try {
      const item = await aiApi.addFaq(selectedAccountId, { question: newQ.trim(), answer: newA.trim() });
      setFaq((prev) => [...prev, item]);
      setNewQ("");
      setNewA("");
      setAddingFaq(false);
    } catch {
      // ignore
    } finally {
      setAddingFaqLoading(false);
    }
  }

  async function handleDeleteFaq(faqId: number) {
    if (!selectedAccountId) return;
    setDeletingFaqId(faqId);
    try {
      await aiApi.deleteFaq(selectedAccountId, faqId);
      setFaq((prev) => prev.filter((f) => f.id !== faqId));
    } catch {
      // ignore
    } finally {
      setDeletingFaqId(null);
    }
  }

  function addPhrase(phrase: string) {
    const trimmed = instruction.trimEnd();
    setInstruction(trimmed ? `${trimmed} ${phrase}.` : `${phrase}.`);
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const usedMessages = config?.used_messages ?? 0;
  const limitMessages = config?.limit_messages ?? 0;

  return (
    <div className="space-y-5 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Ассистент</h1>

      {/* COMBINED: AUTO-REPLY + MODE */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                {isEnabled ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-warning-400" />
                )}
                <span className="text-xs text-gray-400">
                  {isEnabled ? "Автоответчик включён" : "Автоответчик выключен"}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white">Автоответчик</h3>
              <p className="mt-0.5 text-sm text-gray-500">Включает боевые ответы покупателям</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setIsEnabled((v) => !v)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isEnabled ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isEnabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
              <span className="text-xs text-gray-400">{isEnabled ? "Включён" : "Выключен"}</span>
            </div>
          </div>

          {/* Mode selector */}
          <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Режим работы</p>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-semibold transition-colors ${mode === "assistant" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                ИИ Бот
              </span>
              <button
                onClick={handleToggleMode}
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-brand-500 transition-colors"
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  mode === "constructor" ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
              <span className={`text-sm font-semibold transition-colors ${mode === "constructor" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                Сценарии
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {mode === "assistant"
                ? "ИИ отвечает по инструкции и базе знаний"
                : "Ответы идут строго по выбранному сценарию"}
            </p>
          </div>

          {/* Usage bar */}
          {limitMessages > 0 && (
            <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Использовано в этом месяце</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {usedMessages} / {limitMessages} сообщений
                  </p>
                  {selectedAccount && (
                    <p className="mt-0.5 text-xs text-gray-400">Аккаунт: {selectedAccount.username}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all"
                  style={{ width: `${Math.min(100, (usedMessages / limitMessages) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACCOUNT */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Аккаунт FunPay</p>
        <Card>
          <CardContent className="p-5">
            <div className="relative">
              <select
                value={selectedAccountId ?? ""}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.username}</option>
                ))}
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="mt-2 text-xs text-gray-400">AI будет отвечать от имени выбранного аккаунта</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* SCENARIO SELECTOR — only in constructor mode */}
          {mode === "constructor" && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Сценарий для чатов этого аккаунта</p>
              <Card>
                <CardContent className="p-5">
                  <div className="relative">
                    <select
                      value={scenarioId}
                      onChange={(e) => setScenarioId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">— Выберите сценарий —</option>
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
                      href="/platform2/constructor"
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
          {mode === "assistant" && (
            <>
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
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        signature ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* INSTRUCTION */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Инструкция для AI</p>
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
                      <p className="self-center text-xs text-gray-400">Быстрые фразы:</p>
                      {quickPhrases.map((phrase) => (
                        <button
                          key={phrase}
                          onClick={() => addPhrase(phrase)}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400"
                        >
                          + {phrase}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* KNOWLEDGE BASE (FAQ) */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">База знаний</p>
                    <p className="text-sm text-gray-500">Частые вопросы — AI использует эти ответы в диалоге</p>
                  </div>
                  <button
                    onClick={() => setAddingFaq(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" />
                    Добавить
                  </button>
                </div>

                <Card>
                  <CardContent className="divide-y divide-gray-100 p-0 dark:divide-gray-800">
                    {faq.length === 0 && !addingFaq && (
                      <div className="flex items-center justify-center py-10">
                        <p className="text-sm text-gray-400">База знаний пуста</p>
                      </div>
                    )}
                    {faq.map((entry) => (
                      <div key={entry.id} className="flex items-start justify-between gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 dark:text-white">{entry.question}</p>
                          <p className="mt-0.5 text-sm text-gray-500">{entry.answer}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteFaq(entry.id)}
                          disabled={deletingFaqId === entry.id}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {addingFaq && (
                      <div className="space-y-2 px-5 py-4">
                        <input
                          value={newQ}
                          onChange={(e) => setNewQ(e.target.value)}
                          placeholder="Вопрос покупателя"
                          className={inputCls}
                        />
                        <input
                          value={newA}
                          onChange={(e) => setNewA(e.target.value)}
                          placeholder="Ответ ассистента"
                          className={inputCls}
                        />
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" onClick={handleAddFaq} disabled={addingFaqLoading || !newQ.trim() || !newA.trim()}>
                            {addingFaqLoading ? "..." : "Сохранить"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setAddingFaq(false); setNewQ(""); setNewA(""); }}>
                            Отмена
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* STICKY SAVE */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80 lg:pl-[310px]">
        {saveMsg && (
          <p className={`mb-2 text-center text-sm ${saveMsg.ok ? "text-success-600" : "text-error-500"}`}>
            {saveMsg.text}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !config}
          className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Сохранение..." : "Сохранить настройки"}
        </button>
      </div>
    </div>
  );
}
