"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import {
  aiApi, scenariosApi, accountsApi,
  AIConfig, AIFaqItem, AITrigger, AILifecycleMessage, AILotConfig,
  ApiScenario, ApiAccount,
} from "@/lib/api";
import { toast } from "sonner";
import TextArea from "@/platform2/components/form/input/TextArea";
import Input from "@/platform2/components/form/input/InputField";

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

const lifecycleEventLabels: Record<string, { label: string; hint: string }> = {
  order_paid: { label: "При оплате заказа", hint: "Отправляется покупателю сразу после оплаты. Переменные: {buyer}, {order_id}, {lot}, {price}" },
  order_confirmed: { label: "При подтверждении заказа", hint: "Отправляется когда покупатель нажал «Подтвердить выполнение»" },
  order_refunded: { label: "При возврате / отмене", hint: "Отправляется если заказ был отменён или возвращён" },
};

function LotConfigEditor({ lotId, initialInstructions, onSave }: {
  lotId: string;
  initialInstructions: string;
  onSave: (instructions: string) => void;
}) {
  const [value, setValue] = useState(initialInstructions);
  return (
    <div className="border-t border-gray-100 px-5 pb-4 pt-3 space-y-3 dark:border-gray-800">
      <TextArea
        value={value}
        onChange={(val) => setValue(val)}
        rows={3}
        placeholder="Особые инструкции для AI при работе с этим товаром..."
      />
      <Button variant="primary" size="sm" onClick={() => onSave(value)}>Сохранить</Button>
    </div>
  );
}

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

  // Умное молчание
  const [callSellerReply, setCallSellerReply] = useState("Сейчас позову продавца, он ответит в ближайшее время 🙂");
  const [silenceSmallTalk, setSilenceSmallTalk] = useState(true);
  const [silenceAfterCompletion, setSilenceAfterCompletion] = useState(true);
  const [savingSilence, setSavingSilence] = useState(false);

  // Триггерные слова
  const [triggers, setTriggers] = useState<AITrigger[]>([]);
  const [newTriggerKeyword, setNewTriggerKeyword] = useState("");
  const [newTriggerResponse, setNewTriggerResponse] = useState("");
  const [addingTrigger, setAddingTrigger] = useState(false);

  // Lifecycle сообщения
  const [lifecycle, setLifecycle] = useState<AILifecycleMessage[]>([]);

  // Lot конфиги
  const [lots, setLots] = useState<{ lot_id: string; title: string }[]>([]);
  const [lotConfigs, setLotConfigs] = useState<Record<string, AILotConfig>>({});
  const [expandedLot, setExpandedLot] = useState<string | null>(null);

  useEffect(() => {
    accountsApi.list().then((list) => {
      setAccounts(list);
      if (list.length > 0) setAccount(String(list[0].id));
    }).catch(() => {});
  }, []);

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
      if (cfg.call_seller_reply) setCallSellerReply(cfg.call_seller_reply);
      if (cfg.silence_smalltalk !== undefined) setSilenceSmallTalk(cfg.silence_smalltalk);
      if (cfg.silence_after_completion !== undefined) setSilenceAfterCompletion(cfg.silence_after_completion);
    }).catch(() => {});

    aiApi.getFaq(account).then(setKb).catch(() => {});

    scenariosApi.list(account).then((list) => {
      setScenarios(list);
      if (list.length > 0 && !scenario) setScenario(list[0].id);
    }).catch(() => {});

    aiApi.getTriggers(account).then((r) => setTriggers(r.data ?? [])).catch(() => {});
    aiApi.getLifecycle(account).then((r) => setLifecycle(r.data ?? [])).catch(() => {});
    aiApi.getLotConfigs(account).then((r) => {
      const map: Record<string, AILotConfig> = {};
      for (const c of r.data ?? []) map[c.lot_id] = c;
      setLotConfigs(map);
    }).catch(() => {});

    // Лоты аккаунта для lot-configs
    fetch(`/api/accounts/${account}/lots`).then(r => r.json()).then((d) => {
      if (d?.data) setLots(d.data.map((l: { lot_id: string; title: string }) => ({ lot_id: l.lot_id, title: l.title })));
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
      setNewQ(""); setNewA(""); setAddingKb(false);
    } catch { /* ignore */ }
  }

  async function deleteKbEntry(id: number) {
    if (!account) return;
    try {
      await aiApi.deleteFaq(account, id);
      setKb((prev) => prev.filter((e) => e.id !== id));
    } catch { /* ignore */ }
  }

  async function handleSave() {
    if (!account) return;
    setSaving(true);
    try {
      await aiApi.saveConfig(account, {
        is_enabled: autoReply,
        tone,
        system_prompt: instruction.trim(),
        delay_seconds: delay,
        show_ai_signature: signature,
        chat_mode: mode === "scenarios" ? "constructor" : "assistant",
        constructor_scenario_id: mode === "scenarios" ? scenario : undefined,
      });
      toast.success("Настройки AI сохранены");
    } catch {
      toast.error("Не удалось сохранить настройки AI");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSilence() {
    if (!account) return;
    setSavingSilence(true);
    try {
      await aiApi.updateSilence(account, {
        call_seller_reply: callSellerReply.trim() || "Сейчас позову продавца, он ответит в ближайшее время 🙂",
        silence_smalltalk: silenceSmallTalk,
        silence_after_completion: silenceAfterCompletion,
      });
      toast.success("Настройки молчания сохранены");
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setSavingSilence(false);
    }
  }

  async function addTrigger() {
    if (!newTriggerKeyword.trim() || !newTriggerResponse.trim() || !account) return;
    try {
      const r = await aiApi.addTrigger(account, { keyword: newTriggerKeyword.trim(), response: newTriggerResponse.trim() });
      setTriggers((prev) => [...prev, r.data]);
      setNewTriggerKeyword(""); setNewTriggerResponse(""); setAddingTrigger(false);
      toast.success("Триггер добавлен");
    } catch {
      toast.error("Не удалось добавить триггер");
    }
  }

  async function deleteTrigger(id: number) {
    if (!account) return;
    try {
      await aiApi.deleteTrigger(account, id);
      setTriggers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Не удалось удалить триггер");
    }
  }

  async function saveLifecycleMsg(eventType: string, message: string, isActive: boolean) {
    if (!account) return;
    try {
      await aiApi.saveLifecycle(account, { event_type: eventType, message, is_active: isActive });
      setLifecycle((prev) => {
        const exists = prev.find((m) => m.event_type === eventType);
        if (exists) return prev.map((m) => m.event_type === eventType ? { ...m, message, is_active: isActive } : m);
        return [...prev, { event_type: eventType as AILifecycleMessage["event_type"], message, is_active: isActive }];
      });
      toast.success("Сохранено");
    } catch {
      toast.error("Не удалось сохранить");
    }
  }

  async function saveLotConfig(lotId: string, instructions: string, isActive: boolean) {
    if (!account) return;
    try {
      await aiApi.saveLotConfig(account, lotId, { instructions, is_active: isActive });
      setLotConfigs((prev) => ({ ...prev, [lotId]: { lot_id: lotId, instructions, is_active: isActive } }));
      toast.success("Инструкция для лота сохранена");
    } catch {
      toast.error("Не удалось сохранить");
    }
  }

  return (
    <div className="space-y-5 pb-24">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Ассистент</h1>
        <Link href="/platform/ai-guide" className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 transition-colors">
          <Icon name="info" className="h-3.5 w-3.5" />
          Как это работает?
        </Link>
      </div>

      {/* COMBINED: AUTO-REPLY + MODE */}
      <Card>
        <CardContent className="p-6">
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
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${autoReply ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-xs text-gray-400">{autoReply ? "Включён" : "Выключен"}</span>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Режим работы</p>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-semibold transition-colors ${mode === "bot" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>ИИ Бот</span>
              <button
                onClick={() => setMode((m) => (m === "bot" ? "scenarios" : "bot"))}
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-brand-500 transition-colors"
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${mode === "scenarios" ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className={`text-sm font-semibold transition-colors ${mode === "scenarios" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>Сценарии</span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {mode === "bot" ? "ИИ отвечает по инструкции и базе знаний" : "Ответы идут строго по выбранному сценарию"}
            </p>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Использовано в этом месяце</p>
                <p className="mt-0.5 text-xs text-gray-400">Обновится 1-го числа</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{usedMessages} / {limitMessages} сообщений</p>
                <p className="mt-0.5 text-xs text-gray-400">Аккаунт: {accounts.find((a) => String(a.id) === account)?.username ?? account}</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min((usedMessages / limitMessages) * 100, 100)}%` }} />
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

      {/* SCENARIO SELECTOR */}
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
                <p className="text-xs text-gray-400">Выбранный сценарий будет единственным автоответчиком для этого аккаунта.</p>
                <Link href="/constructor" className="ml-4 shrink-0 text-xs font-medium text-brand-500 hover:text-brand-600">Открыть конструктор</Link>
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
              <p className={`font-semibold ${tone === opt.id ? "text-brand-600" : "text-gray-800 dark:text-white"}`}>{opt.label}</p>
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
            type="range" min={0} max={30} value={delay}
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
              <p className="mt-0.5 text-sm text-gray-500">К каждому ответу добавляется строка «— Ассистент FunPay Cloud»</p>
            </div>
            <button
              onClick={() => setSignature((v) => !v)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${signature ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${signature ? "translate-x-6" : "translate-x-1"}`} />
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
              `Будь дружелюбным, используй простой язык.`
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
            <TextArea value={instruction} onChange={(val) => setInstruction(val)} maxLength={2000} rows={5} />
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
                      <Input
                        defaultValue={entry.question}
                        onChange={(e) => setKb((prev) => prev.map((k) => k.id === entry.id ? { ...k, question: e.target.value } : k))}
                        placeholder="Вопрос"
                      />
                      <Input
                        defaultValue={entry.answer}
                        onChange={(e) => setKb((prev) => prev.map((k) => k.id === entry.id ? { ...k, answer: e.target.value } : k))}
                        placeholder="Ответ"
                      />
                      <button onClick={() => setEditingKbId(null)} className="text-xs text-brand-500 hover:text-brand-600">Готово</button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800 dark:text-white">{entry.question}</p>
                      <p className="mt-0.5 text-sm text-gray-500">{entry.answer}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditingKbId(String(entry.id))} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteKbEntry(entry.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10">
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {addingKb && (
              <div className="space-y-2 px-5 py-4">
                <Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Вопрос покупателя" />
                <Input value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="Ответ ассистента" />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={saveKbEntry}>Сохранить</Button>
                  <Button variant="outline" size="sm" onClick={() => { setAddingKb(false); setNewQ(""); setNewA(""); }}>Отмена</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TRIGGER WORDS */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 dark:text-white">Триггерные слова</p>
            <p className="text-sm text-gray-500">Мгновенный ответ без LLM — экономит токены и ускоряет реакцию</p>
          </div>
          <button
            onClick={() => setAddingTrigger(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Добавить
          </button>
        </div>
        <Card>
          <CardContent className="divide-y divide-gray-100 p-0 dark:divide-gray-800">
            {triggers.length === 0 && !addingTrigger && (
              <div className="flex flex-col items-center justify-center gap-1.5 py-8">
                <p className="text-sm text-gray-400">Нет триггеров</p>
                <p className="text-xs text-gray-300">Например: слово «цена» → ответ с ценой</p>
              </div>
            )}
            {triggers.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-xs font-mono font-medium text-brand-600">{t.keyword}</span>
                    <Icon name="arrow-right" className="h-3 w-3 text-gray-300" />
                    <span className="truncate text-sm text-gray-600 dark:text-gray-300">{t.response}</span>
                  </div>
                </div>
                <button onClick={() => deleteTrigger(t.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10">
                  <Icon name="trash" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {addingTrigger && (
              <div className="space-y-2 px-5 py-4">
                <Input value={newTriggerKeyword} onChange={(e) => setNewTriggerKeyword(e.target.value)} placeholder="Ключевое слово (например: цена)" />
                <TextArea value={newTriggerResponse} onChange={(val) => setNewTriggerResponse(val)} rows={2} placeholder="Ответ ассистента при совпадении" />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={addTrigger}>Сохранить</Button>
                  <Button variant="outline" size="sm" onClick={() => { setAddingTrigger(false); setNewTriggerKeyword(""); setNewTriggerResponse(""); }}>Отмена</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* LIFECYCLE MESSAGES */}
      <div>
        <p className="mb-2 font-semibold text-gray-800 dark:text-white">Сообщения по событиям заказа</p>
        <p className="mb-3 text-sm text-gray-500">AI автоматически пишет покупателю при изменении статуса заказа</p>
        <div className="space-y-3">
          {(["order_paid", "order_confirmed", "order_refunded"] as const).map((evType) => {
            const meta = lifecycleEventLabels[evType];
            const msg = lifecycle.find((m) => m.event_type === evType);
            const isActive = msg?.is_active ?? false;
            const text = msg?.message ?? "";
            return (
              <Card key={evType}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{meta.label}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{meta.hint}</p>
                    </div>
                    <button
                      onClick={() => saveLifecycleMsg(evType, text, !isActive)}
                      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${isActive ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                  {isActive && (
                    <div className="space-y-2">
                      <TextArea
                        value={text}
                        onChange={(val) => setLifecycle((prev) => {
                          const exists = prev.find((m) => m.event_type === evType);
                          if (exists) return prev.map((m) => m.event_type === evType ? { ...m, message: val } : m);
                          return [...prev, { event_type: evType, message: val, is_active: true }];
                        })}
                        rows={2}
                        placeholder="Текст сообщения..."
                      />
                      <Button variant="primary" size="sm" onClick={() => saveLifecycleMsg(evType, text, true)}>
                        Сохранить
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SMART SILENCE */}
      <div>
        <p className="mb-2 font-semibold text-gray-800 dark:text-white">Умное молчание</p>
        <p className="mb-3 text-sm text-gray-500">Когда AI не должен отвечать</p>
        <Card>
          <CardContent className="divide-y divide-gray-100 p-0 dark:divide-gray-800">
            {[
              { key: "smalltalk", label: "Молчать на «ок», «спасибо», 👍", desc: "Не тратить токены на короткие реакции", value: silenceSmallTalk, set: setSilenceSmallTalk },
              { key: "completion", label: "Молчать после подтверждения заказа", desc: "Заказ закрыт — не беспокоить покупателя", value: silenceAfterCompletion, set: setSilenceAfterCompletion },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.set((v) => !v)}
                  className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${item.value ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ESCALATION */}
      <div>
        <p className="mb-2 font-semibold text-gray-800 dark:text-white">Эскалация к продавцу</p>
        <p className="mb-3 text-sm text-gray-500">
          Если покупатель напишет «позови продавца» — AI уведомит вас в Telegram и ответит этой фразой
        </p>
        <Card>
          <CardContent className="p-5 space-y-3">
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Ответ покупателю</p>
              <TextArea
                value={callSellerReply}
                onChange={(val) => setCallSellerReply(val)}
                rows={2}
                placeholder="Сейчас позову продавца, он ответит в ближайшее время 🙂"
              />
            </div>
            <div className="rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Фразы которые запускают эскалацию: «позови продавца», «хочу поговорить с продавцом», «нужен оператор» и другие.
                После эскалации AI молчит пока продавец сам не ответит.
              </p>
            </div>
            <Button variant="primary" size="sm" disabled={savingSilence} onClick={handleSaveSilence}>
              {savingSilence ? "Сохранение…" : "Сохранить"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* LOT CONFIGS */}
      {lots.length > 0 && (
        <div>
          <p className="mb-2 font-semibold text-gray-800 dark:text-white">Инструкции по лотам</p>
          <p className="mb-3 text-sm text-gray-500">Дополнительные правила AI для конкретного товара</p>
          <div className="space-y-2">
            {lots.map((lot) => {
              const cfg = lotConfigs[lot.lot_id];
              const isExpanded = expandedLot === lot.lot_id;
              return (
                <Card key={lot.lot_id}>
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedLot(isExpanded ? null : lot.lot_id)}
                      className="flex w-full items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{lot.title}</span>
                        {cfg?.instructions && <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs text-brand-600">настроено</span>}
                      </div>
                      <Icon name={isExpanded ? "chevron-up" : "chevron-down"} className="h-4 w-4 text-gray-400" />
                    </button>
                    {isExpanded && (
                      <LotConfigEditor
                        lotId={lot.lot_id}
                        initialInstructions={cfg?.instructions ?? ""}
                        onSave={(instr) => saveLotConfig(lot.lot_id, instr, true)}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

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
