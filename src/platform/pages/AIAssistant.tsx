'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle, Info, Lightbulb, Plus, Trash2 } from '@/shared/streamline/icons';
import { toast } from 'sonner';
import { aiApi, accountsApi, ApiAccount, ApiScenario, scenariosApi } from '@/lib/api';
import { PageHeader, PageShell, PageTitle } from '@/platform/components/primitives';

type FaqDraft = {
  id: number;
  question: string;
  answer: string;
};

type ChatMode = 'assistant' | 'constructor';

const QUICK_TAGS = ['Выдача мгновенная', 'Возвраты через FunPay', 'Не давать скидки', 'Уточнить у продавца', 'Гарантия 24 часа'];
const MAX_PROMPT_LENGTH = 2000;

function clampPercent(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function monthLabel(date = new Date()): string {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

function buildTempFaqID(): number {
  return -Math.floor(Math.random() * 1_000_000_000);
}

export default function AIAssistant() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modeSaving, setModeSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [tone, setTone] = useState<'formal' | 'neutral' | 'friendly'>('neutral');
  const [delay, setDelay] = useState(3);
  const [prompt, setPrompt] = useState('');
  const [showAISignature, setShowAISignature] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('assistant');
  const [constructorScenarioID, setConstructorScenarioID] = useState('');
  const [accountScenarios, setAccountScenarios] = useState<ApiScenario[]>([]);
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(0);
  const [faqItems, setFaqItems] = useState<FaqDraft[]>([]);

  async function loadAccountData(accountID: number) {
    const [config, faq, scenarios] = await Promise.all([
      aiApi.getConfig(accountID),
      aiApi.getFaq(accountID),
      scenariosApi.list(accountID),
    ]);

    setEnabled(Boolean(config.is_enabled));
    setTone(config.tone === 'formal' || config.tone === 'friendly' || config.tone === 'neutral' ? config.tone : 'neutral');
    setDelay(typeof config.delay_seconds === 'number' ? config.delay_seconds : 3);
    setPrompt(config.system_prompt ?? '');
    setShowAISignature(Boolean(config.show_ai_signature));

    const modeValue = config.chat_mode === 'constructor' ? 'constructor' : 'assistant';
    setChatMode(modeValue);
    setAccountScenarios(scenarios);

    const requestedScenarioID = modeValue === 'constructor' ? (config.constructor_scenario_id ?? '') : '';
    const hasRequestedScenario = requestedScenarioID ? scenarios.some(scenario => scenario.id === requestedScenarioID) : false;
    setConstructorScenarioID(hasRequestedScenario ? requestedScenarioID : '');

    setUsed(config.used_messages ?? 0);
    setLimit(config.limit_messages ?? 0);
    setFaqItems(faq.map(item => ({ id: item.id, question: item.question, answer: item.answer })));
  }

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    accountsApi
      .list()
      .then(async rows => {
        if (cancelled) return;
        setAccounts(rows);

        if (rows.length === 0) {
          setSelectedAccountID(null);
          return;
        }

        const firstID = rows[0].id;
        setSelectedAccountID(firstID);
        await loadAccountData(firstID);
      })
      .catch(err => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : 'Не удалось загрузить AI настройки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAccountChange(nextID: number) {
    setSelectedAccountID(nextID);
    setLoading(true);
    try {
      await loadAccountData(nextID);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось загрузить настройки аккаунта');
    } finally {
      setLoading(false);
    }
  }

  function addFaq() {
    setFaqItems(prev => [...prev, { id: buildTempFaqID(), question: '', answer: '' }]);
  }

  function updateFaq(index: number, key: 'question' | 'answer', value: string) {
    setFaqItems(prev => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  function removeFaq(index: number) {
    setFaqItems(prev => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function persistMode(nextMode: ChatMode) {
    if (!selectedAccountID || modeSaving || nextMode === chatMode) return;

    const previousMode = chatMode;
    const previousScenarioID = constructorScenarioID;

    let nextScenarioID = constructorScenarioID;
    if (nextMode === 'constructor' && !nextScenarioID) {
      const firstScenario = activeChatScenarios[0];
      if (firstScenario) {
        nextScenarioID = firstScenario.id;
        setConstructorScenarioID(firstScenario.id);
      }
    }

    setChatMode(nextMode);
    setModeSaving(true);

    try {
      const updated = await aiApi.updateMode(selectedAccountID, {
        chat_mode: nextMode,
        constructor_scenario_id: nextMode === 'constructor' ? nextScenarioID : '',
      });

      setChatMode(updated.chat_mode === 'constructor' ? 'constructor' : 'assistant');
      setUsed(updated.used_messages ?? used);
      setLimit(updated.limit_messages ?? limit);
      toast.success(`Боевой режим: ${updated.chat_mode === 'constructor' ? 'Сценарии' : 'ИИ Бот'}`);
    } catch (err) {
      setChatMode(previousMode);
      setConstructorScenarioID(previousScenarioID);
      toast.error(err instanceof Error ? err.message : 'Не удалось переключить режим');
    } finally {
      setModeSaving(false);
    }
  }

  async function save() {
    if (!selectedAccountID) {
      toast.error('Выберите аккаунт FunPay');
      return;
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      toast.error(`Инструкция превышает ${MAX_PROMPT_LENGTH} символов`);
      return;
    }
    if (chatMode === 'constructor' && !constructorScenarioID) {
      toast.error('Выберите сценарий конструктора для этого аккаунта');
      return;
    }

    const normalizedFaq = faqItems
      .map(item => ({ question: item.question.trim(), answer: item.answer.trim() }))
      .filter(item => item.question.length > 0 && item.answer.length > 0);

    setSaving(true);
    try {
      const savedConfig = await aiApi.saveConfig(selectedAccountID, {
        is_enabled: enabled,
        tone,
        system_prompt: prompt.trim(),
        delay_seconds: delay,
        show_ai_signature: showAISignature,
        chat_mode: chatMode,
        constructor_scenario_id: chatMode === 'constructor' ? constructorScenarioID : '',
      });

      const currentFaq = await aiApi.getFaq(selectedAccountID);
      await Promise.all(currentFaq.map(item => aiApi.deleteFaq(selectedAccountID, item.id)));
      const recreated = await Promise.all(normalizedFaq.map(item => aiApi.addFaq(selectedAccountID, item)));

      setFaqItems(recreated.map(item => ({ id: item.id, question: item.question, answer: item.answer })));
      setUsed(savedConfig.used_messages ?? used);
      setLimit(savedConfig.limit_messages ?? limit);
      toast.success('Настройки AI сохранены');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  }

  const usagePercent = useMemo(() => {
    if (limit <= 0) return 0;
    return clampPercent((used / limit) * 100);
  }, [limit, used]);

  const noAiOnPlan = !loading && limit === 0;
  const selectedAccountName = useMemo(() => {
    const account = accounts.find(item => item.id === selectedAccountID);
    return account?.username || `Аккаунт #${selectedAccountID ?? ''}`;
  }, [accounts, selectedAccountID]);

  const nextMonth = useMemo(() => monthLabel(), []);
  const activeChatScenarios = useMemo(
    () => accountScenarios.filter(scenario => scenario.trigger_type === 'chat_message' && scenario.is_active),
    [accountScenarios],
  );

  const formDisabled = loading || saving || modeSaving;
  const assistantModeActive = chatMode === 'assistant';
  const constructorModeActive = chatMode === 'constructor';

  return (
    <PageShell>
      <PageHeader>
        <PageTitle title="AI-Ассистент" subtitle="Боевые настройки автоответчика для покупателей" />
      </PageHeader>

      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Боевой режим автоответчика</p>
            <p className="mt-1 text-[11px] text-[var(--pf-text-dim)]">Переключение сохраняется сразу и влияет на реальные ответы покупателям.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${assistantModeActive ? 'text-[var(--pf-text)]' : 'text-[var(--pf-text-dim)]'}`}>ИИ Бот</span>
            <button
              type="button"
              disabled={!selectedAccountID || modeSaving}
              onClick={() => void persistMode(assistantModeActive ? 'constructor' : 'assistant')}
              className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                constructorModeActive ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-[var(--pf-surface-3)]'
              }`}
              aria-pressed={constructorModeActive}
              aria-label="Переключить режим автоответчика"
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  constructorModeActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${constructorModeActive ? 'text-[var(--pf-text)]' : 'text-[var(--pf-text-dim)]'}`}>Сценарии</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Status + usage banner */}
        <div className={`relative overflow-hidden rounded-2xl border p-6 ${enabled ? 'platform-ai-hero-enabled' : 'platform-ai-hero-disabled'}`}>
          {enabled && (
            <>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
              <div className="absolute bottom-0 right-16 h-20 w-20 rounded-full bg-indigo-500/10 blur-xl" />
            </>
          )}

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'animate-pulse bg-emerald-500' : 'bg-[var(--pf-surface-3)]'}`} />
                <span className={`text-xs font-medium ${enabled ? 'text-emerald-700' : 'text-[var(--pf-text-dim)]'}`}>
                  {loading ? 'Загрузка...' : enabled ? 'AI активен' : 'AI выключен'}
                </span>
              </div>
              <h2 className="mb-1 text-xl font-bold text-[var(--pf-text)]">AI-Ассистент</h2>
              <p className="text-xs text-[var(--pf-text-dim)]">
                {enabled ? 'Отвечает покупателям автоматически от вашего имени' : 'Включите, чтобы бот отвечал покупателям автоматически'}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => setEnabled(prev => !prev)}
                disabled={formDisabled || (assistantModeActive && noAiOnPlan)}
                className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  enabled ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-violet-500/30' : 'bg-[var(--pf-surface-3)]'
                }`}
                aria-pressed={enabled}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-[10px] text-[var(--pf-text-dim)]">{enabled ? 'Включён' : 'Выключен'}</span>
            </div>
          </div>

          {assistantModeActive && noAiOnPlan ? (
            <div className="relative mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-medium text-amber-700">AI недоступен на вашем тарифе</p>
                <p className="mt-0.5 text-[11px] text-[var(--pf-text-dim)]">Обновитесь до тарифа Pro или Ultra, чтобы использовать AI-ассистента</p>
              </div>
            </div>
          ) : (
            <div className="relative mt-5 border-t border-[var(--pf-border)] pt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-[var(--pf-text-dim)]">Использовано в этом месяце</span>
                <span className="text-xs font-semibold text-[var(--pf-text)]">{used} / {limit} сообщений</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pf-surface-3)]">
                <progress className={`platform-ai-progress h-full w-full rounded-full ${usagePercent > 80 ? 'danger' : 'normal'}`} value={usagePercent} max={100} />
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-[10px] text-[var(--pf-text-soft)]">Обновится 1 {nextMonth}</span>
                <span className="text-[10px] text-[var(--pf-text-dim)]">Аккаунт: {selectedAccountName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <fieldset disabled={formDisabled || (noAiOnPlan && assistantModeActive)} className="group/fields">
          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] group-disabled/fields:opacity-60">
            <div className="border-b border-[var(--pf-border)] p-5">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Аккаунт FunPay</label>
              <select value={selectedAccountID ?? ''} onChange={event => void handleAccountChange(Number(event.target.value))} className="platform-select">
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.username || `Аккаунт #${account.id}`}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-[var(--pf-text-dim)]">AI будет отвечать от имени выбранного аккаунта</p>
            </div>

            {assistantModeActive ? (
              <>
                <div className="border-b border-[var(--pf-border)] p-5">
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Тон общения</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      { key: 'formal', label: 'Официальный', desc: 'Здравствуйте, благодарю' },
                      { key: 'neutral', label: 'Нейтральный', desc: 'Привет, окей, понял' },
                      { key: 'friendly', label: 'Дружелюбный', desc: 'Привет! Конечно, помогу' },
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setTone(item.key as 'formal' | 'neutral' | 'friendly')}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          tone === item.key
                            ? 'border-[var(--pf-accent-soft-strong)] bg-[var(--pf-accent-soft)]'
                            : 'border-[var(--pf-border)] bg-[var(--pf-surface-2)] hover:border-[var(--pf-border-strong)]'
                        }`}
                      >
                        <div className={`mb-1 text-xs font-semibold ${tone === item.key ? 'text-[var(--pf-accent)]' : 'text-[var(--pf-text)]'}`}>{item.label}</div>
                        <div className="text-[10px] leading-tight text-[var(--pf-text-dim)]">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Задержка ответа</label>
                    <span className="text-xs font-medium text-[var(--pf-text)]">{delay} сек</span>
                  </div>
                  <input type="range" min={0} max={30} value={delay} onChange={event => setDelay(Number(event.target.value))} className="w-full accent-indigo-500" />
                  <div className="mt-1 flex justify-between text-[10px] text-[var(--pf-text-dim)]">
                    <span>Мгновенно</span>
                    <span className="text-center text-[var(--pf-text-soft)]">Имитация живого ответа</span>
                    <span>30 сек</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-5">
                <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Сценарий для чатов этого аккаунта</label>
                <select value={constructorScenarioID} onChange={event => setConstructorScenarioID(event.target.value)} className="platform-select">
                  <option value="">Выберите сценарий</option>
                  {activeChatScenarios.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-[var(--pf-text-dim)]">Выбранный сценарий будет единственным автоответчиком для этого аккаунта.</p>
                  <a href="/platform/constructor" className="text-xs font-medium text-[var(--pf-accent)] hover:underline">
                    Открыть конструктор
                  </a>
                </div>
                {activeChatScenarios.length === 0 && (
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <p className="text-xs text-amber-700">Нет активных сценариев с триггером «chat_message». Создайте сценарий во вкладке «Конструктор».</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {assistantModeActive && (
            <>
              <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] group-disabled/fields:opacity-60">
                <div className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm font-semibold text-[var(--pf-text)]">Подпись ассистента</p>
                    <p className="mt-0.5 text-[11px] text-[var(--pf-text-dim)]">
                      К каждому ответу добавляется строка <span className="text-[var(--pf-text-muted)]">«— Ассистент FunPay Cloud»</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAISignature(prev => !prev)}
                    className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
                      showAISignature ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-violet-500/30' : 'bg-[var(--pf-surface-3)]'
                    }`}
                    aria-pressed={showAISignature}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        showAISignature ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] group-disabled/fields:opacity-60">
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <label className="mb-0.5 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Инструкция для AI</label>
                      <p className="text-[11px] text-[var(--pf-text-dim)]">Опишите своими словами, как должен вести себя ассистент</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPrompt(
                          'Я продаю игровые ключи. Отвечай вежливо и коротко. Если спрашивают про сроки — говори что выдача мгновенная. Не давай скидки без моего разрешения. Если не знаешь ответа — скажи что уточнишь у продавца.',
                        )
                      }
                      className="flex items-center gap-1 text-[10px] text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      <Lightbulb size={11} />
                      Пример
                    </button>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={event => setPrompt(event.target.value)}
                    rows={5}
                    maxLength={MAX_PROMPT_LENGTH}
                    placeholder="Например: Я продаю игровые ключи..."
                    className={`w-full resize-none rounded-xl border bg-[var(--pf-elevated)] px-4 py-3 text-sm leading-relaxed text-[var(--pf-text)] placeholder-[var(--pf-text-soft)] transition-colors focus:outline-none ${
                      prompt.length > MAX_PROMPT_LENGTH * 0.9
                        ? 'border-amber-500/40 focus:border-amber-500/60'
                        : 'border-[var(--pf-border-strong)] focus:border-[var(--pf-accent-soft-strong)]'
                    }`}
                  />
                  <div className="mt-2 flex justify-between">
                    <span className="text-[10px] text-[var(--pf-text-dim)]">Лоты из вашего аккаунта добавляются автоматически</span>
                    <span
                      className={`text-[10px] ${
                        prompt.length > MAX_PROMPT_LENGTH
                          ? 'font-semibold text-red-500'
                          : prompt.length > MAX_PROMPT_LENGTH * 0.9
                            ? 'text-amber-600'
                            : 'text-[var(--pf-text-dim)]'
                      }`}
                    >
                      {prompt.length} / {MAX_PROMPT_LENGTH}
                    </span>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <p className="mb-2 text-[10px] text-[var(--pf-text-dim)]">Быстрые фразы:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPrompt(prev => (prev.length < MAX_PROMPT_LENGTH ? `${prev}${prev ? '. ' : ''}${tag}` : prev))}
                        className="rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-[10px] text-indigo-400 transition-colors hover:bg-indigo-500/10"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] group-disabled/fields:opacity-60">
                <div className="flex items-center justify-between border-b border-[var(--pf-border)] p-5">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--pf-text)]">База знаний</h3>
                    <p className="mt-0.5 text-[11px] text-[var(--pf-text-dim)]">Частые вопросы — AI использует эти ответы в диалоге</p>
                  </div>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    <Plus size={12} />
                    Добавить
                  </button>
                </div>

                <div className="divide-y divide-[var(--pf-border)]">
                  {faqItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pf-accent-soft)]">
                        <HelpCircle size={18} className="text-[var(--pf-accent)]" />
                      </div>
                      <p className="mb-1 text-sm text-[var(--pf-text-muted)]">База знаний пуста</p>
                      <p className="text-xs text-[var(--pf-text-dim)]">Добавьте частые вопросы и ответы</p>
                    </div>
                  ) : (
                    faqItems.map((item, index) => (
                      <div key={item.id} className="group p-4 transition-colors hover:bg-[var(--pf-surface-2)]">
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-2">
                            <input
                              value={item.question}
                              onChange={event => updateFaq(index, 'question', event.target.value)}
                              placeholder="Вопрос покупателя..."
                              className="w-full border-b border-transparent bg-transparent pb-0.5 text-sm text-[var(--pf-text)] placeholder-[var(--pf-text-soft)] transition-colors focus:border-[var(--pf-border-strong)] focus:outline-none"
                            />
                            <input
                              value={item.answer}
                              onChange={event => updateFaq(index, 'answer', event.target.value)}
                              placeholder="Ответ AI..."
                              className="w-full border-b border-transparent bg-transparent pb-0.5 text-xs text-[var(--pf-text-dim)] placeholder-[var(--pf-text-soft)] transition-colors focus:border-[var(--pf-border-strong)] focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFaq(index)}
                            className="self-center text-[var(--pf-text-soft)] opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </fieldset>

        <button
          type="button"
          onClick={save}
          disabled={
            saving ||
            loading ||
            !selectedAccountID ||
            (assistantModeActive && noAiOnPlan) ||
            (assistantModeActive && prompt.length > MAX_PROMPT_LENGTH) ||
            (constructorModeActive && !constructorScenarioID)
          }
          className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            saving ? 'platform-ai-save-btn-saving' : 'platform-ai-save-btn'
          }`}
        >
          {saving ? 'Сохраняем...' : 'Сохранить настройки'}
        </button>
      </div>
    </PageShell>
  );
}
