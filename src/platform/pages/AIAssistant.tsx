'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  HelpCircle,
  Info,
  Lightbulb,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiApi, accountsApi, ApiAccount, ApiScenario, scenariosApi } from '@/lib/api';
import { PageHeader, PageShell, PageTitle } from '@/platform/components/primitives';

type FaqDraft = {
  id: number;
  question: string;
  answer: string;
};

type TestMessage = {
  role: 'user' | 'ai';
  text: string;
  loading?: boolean;
};

type ChatMode = 'assistant' | 'constructor';

const QUICK_TAGS = [
  'Выдача мгновенная',
  'Возвраты через FunPay',
  'Не давать скидки',
  'Уточнить у продавца',
  'Гарантия 24 часа',
];

const QUICK_TESTS = [
  'Есть ли товар в наличии?',
  'Как быстро получу ключ?',
  'Можете сделать скидку?',
];

const MAX_PROMPT_LENGTH = 2000;

function clampPercent(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function monthLabel(date = new Date()): string {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(
    new Date(date.getFullYear(), date.getMonth() + 1, 1),
  );
}

function buildTempFaqID(): number {
  return -Math.floor(Math.random() * 1_000_000_000);
}

function TestChatPanel({
  messages,
  input,
  testing,
  limitExhausted,
  disabledByMode,
  onInputChange,
  onSend,
  onQuickSend,
  onClear,
  messagesRef,
}: {
  messages: TestMessage[];
  input: string;
  testing: boolean;
  limitExhausted: boolean;
  disabledByMode: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickSend: (value: string) => void;
  onClear: () => void;
  messagesRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="platform-ai-chat-panel flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)]">
      <div className="platform-ai-chat-head flex items-center gap-3 border-b border-[var(--pf-border)] px-4 py-3.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--pf-text)]">
            Тестовый режим
            <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
              Beta
            </span>
          </div>
          <div className="text-[10px] text-[var(--pf-text-dim)]">Пишите как покупатель — AI ответит как настроено</div>
        </div>
        {!limitExhausted && (
          <div className="flex items-center gap-1 text-[10px] text-amber-500/80">
            <AlertCircle size={10} />
            <span>−1 от лимита</span>
          </div>
        )}
      </div>

      <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {disabledByMode ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pf-accent-soft)]">
              <Info size={18} className="text-[var(--pf-accent)]" />
            </div>
            <p className="mb-1 text-sm text-[var(--pf-text-muted)]">Тест-чат выключен</p>
            <p className="text-xs text-[var(--pf-text-dim)]">
              Сейчас активен режим конструктора. Для теста AI переключитесь на режим AI-Ассистент.
            </p>
          </div>
        ) : limitExhausted ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <AlertCircle size={18} className="text-red-400" />
            </div>
            <p className="mb-1 text-sm text-[var(--pf-text-muted)]">Лимит сообщений исчерпан</p>
            <p className="text-xs text-[var(--pf-text-dim)]">Обновится 1-го следующего месяца</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div
              className="platform-ai-chat-spark mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10"
            >
              <Sparkles size={20} className="text-indigo-400" />
            </div>
            <p className="mb-2 text-sm font-medium text-[var(--pf-text)]">Протестируйте AI-ассистента</p>
            <p className="mb-4 text-xs leading-relaxed text-[var(--pf-text-dim)]">
              Напишите вопрос от лица покупателя и проверьте, как AI ответит с текущими настройками
            </p>
            <div className="flex w-full flex-col gap-2">
              {QUICK_TESTS.map(question => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onQuickSend(question)}
                  className="rounded-lg border border-[var(--pf-border)] px-3 py-2 text-left text-xs text-[var(--pf-text-dim)] transition-all hover:border-[var(--pf-accent-soft-strong)] hover:bg-[var(--pf-accent-soft)] hover:text-[var(--pf-accent)]"
                >
                  &quot;{question}&quot;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`}>
              {message.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="platform-ai-chat-user-bubble max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm text-white">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="max-w-[85%]">
                    {message.loading ? (
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3.5 py-3">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="platform-ai-typing-dot h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl rounded-bl-sm border px-3.5 py-2.5 text-sm leading-relaxed ${
                          message.text.startsWith('Ошибка:')
                            ? 'border-red-500/20 bg-red-500/5 text-red-400'
                            : 'border-[var(--pf-border)] bg-[var(--pf-surface-2)] text-[var(--pf-text)]'
                        }`}
                      >
                        {message.text}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[var(--pf-border)] p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={event => onInputChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onSend();
              }
            }}
            disabled={disabledByMode || limitExhausted || testing}
            placeholder={disabledByMode ? 'Тест-чат недоступен в режиме конструктора' : limitExhausted ? 'Лимит исчерпан' : 'Напишите как покупатель...'}
            className="flex-1 rounded-xl border border-[var(--pf-border-strong)] bg-[var(--pf-elevated)] px-4 py-2.5 text-sm text-[var(--pf-text)] placeholder-[var(--pf-text-soft)] transition-colors focus:border-[var(--pf-accent-soft-strong)] focus:outline-none disabled:opacity-40"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || testing || limitExhausted || disabledByMode}
            className="platform-ai-send-btn flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all disabled:opacity-30"
          >
            <Send size={15} />
          </button>
        </div>

        {messages.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="mt-2 flex items-center gap-1 text-[10px] text-[var(--pf-text-soft)] transition-colors hover:text-[var(--pf-text-dim)]"
          >
            <RotateCcw size={9} />
            Очистить тест
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

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

  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [testMessages]);

  async function loadAccountData(accountID: number) {
    const [config, faq, scenarios] = await Promise.all([
      aiApi.getConfig(accountID),
      aiApi.getFaq(accountID),
      scenariosApi.list(accountID),
    ]);
    setEnabled(Boolean(config.is_enabled));
    setTone(
      config.tone === 'formal' || config.tone === 'friendly' || config.tone === 'neutral'
        ? config.tone
        : 'neutral',
    );
    setDelay(typeof config.delay_seconds === 'number' ? config.delay_seconds : 3);
    setPrompt(config.system_prompt ?? '');
    setShowAISignature(Boolean(config.show_ai_signature));
    const modeValue = config.chat_mode === 'constructor' ? 'constructor' : 'assistant';
    setChatMode(modeValue);
    setAccountScenarios(scenarios);
    const requestedScenarioID = modeValue === 'constructor' ? (config.constructor_scenario_id ?? '') : '';
    const hasRequestedScenario = requestedScenarioID
      ? scenarios.some(scenario => scenario.id === requestedScenarioID)
      : false;
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
          setLoading(false);
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
    setTestMessages([]);
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
      const recreated = await Promise.all(
        normalizedFaq.map(item => aiApi.addFaq(selectedAccountID, item)),
      );

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

  async function sendTestMessage(rawText?: string) {
    if (!selectedAccountID || testing) return;
    if (chatMode === 'constructor') {
      toast.info('Тестовый чат работает только в режиме AI-Ассистент');
      return;
    }
    const text = (rawText ?? testInput).trim();
    if (!text) return;

    const history = testMessages
      .filter(message => !message.loading)
      .map(message => ({
        role: (message.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
        text: message.text,
      }));

    setTestMessages(prev => [...prev, { role: 'user', text }, { role: 'ai', text: '', loading: true }]);
    setTestInput('');
    setTesting(true);
    try {
      const response = await aiApi.test({
        account_id: selectedAccountID,
        message: text,
        history,
        config_override: {
          tone,
          system_prompt: prompt.trim(),
          show_ai_signature: showAISignature,
        },
      });
      setTestMessages(prev => {
        const copy = [...prev];
        const loadingIndex = copy.findIndex(item => item.role === 'ai' && item.loading);
        if (loadingIndex >= 0) {
          copy[loadingIndex] = { role: 'ai', text: response.reply, loading: false };
        } else {
          copy.push({ role: 'ai', text: response.reply, loading: false });
        }
        return copy;
      });
      if (typeof response.limit_messages === 'number') {
        setLimit(response.limit_messages);
      }
      if (typeof response.used_messages === 'number') {
        setUsed(response.used_messages);
      } else if (typeof response.remaining_limit === 'number' && limit > 0) {
        setUsed(limit - response.remaining_limit);
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Ошибка тестового ответа';
      setTestMessages(prev => {
        const copy = [...prev];
        const loadingIndex = copy.findIndex(item => item.role === 'ai' && item.loading);
        if (loadingIndex >= 0) {
          copy[loadingIndex] = { role: 'ai', text: `Ошибка: ${errorText}`, loading: false };
        }
        return copy;
      });
      toast.error(errorText);
    } finally {
      setTesting(false);
    }
  }

  const usagePercent = useMemo(() => {
    if (limit <= 0) return 0;
    return clampPercent((used / limit) * 100);
  }, [limit, used]);

  const limitExhausted = limit > 0 && used >= limit;
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

  const formDisabled = loading || saving;
  const assistantModeActive = chatMode === 'assistant';

  return (
    <PageShell>
      <PageHeader>
        <PageTitle
          title="AI-Ассистент"
          subtitle="Настройка автоответов, базы знаний и тестирование ответов в реальном времени"
        />
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          {/* Status + usage banner */}
          <div className={`relative mb-6 overflow-hidden rounded-2xl border p-6 ${enabled ? 'platform-ai-hero-enabled' : 'platform-ai-hero-disabled'}`}>
            {enabled && (
              <>
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
                <div className="absolute bottom-0 right-16 h-20 w-20 rounded-full bg-indigo-500/10 blur-xl" />
              </>
            )}

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${enabled ? 'animate-pulse bg-emerald-500' : 'bg-[var(--pf-surface-3)]'}`}
                  />
                  <span className={`text-xs font-medium ${enabled ? 'text-emerald-700' : 'text-[var(--pf-text-dim)]'}`}>
                    {loading ? 'Загрузка...' : enabled ? 'AI активен' : 'AI выключен'}
                  </span>
                </div>
                <h2 className="mb-1 text-xl font-bold text-[var(--pf-text)]">AI-Ассистент</h2>
                <p className="text-xs text-[var(--pf-text-dim)]">
                  {enabled
                    ? 'Отвечает покупателям автоматически от вашего имени'
                    : 'Включите, чтобы бот отвечал покупателям автоматически'}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => setEnabled(prev => !prev)}
                  disabled={formDisabled || (assistantModeActive && noAiOnPlan)}
                  className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    enabled
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-violet-500/30'
                      : 'bg-[var(--pf-surface-3)]'
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
                  <p className="mt-0.5 text-[11px] text-[var(--pf-text-dim)]">
                    Обновитесь до тарифа Pro или Ultra, чтобы использовать AI-ассистента
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative mt-5 border-t border-[var(--pf-border)] pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-[var(--pf-text-dim)]">Использовано в этом месяце</span>
                  <span className="text-xs font-semibold text-[var(--pf-text)]">
                    {used} / {limit} сообщений
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pf-surface-3)]">
                  <progress
                    className={`platform-ai-progress h-full w-full rounded-full ${usagePercent > 80 ? 'danger' : 'normal'}`}
                    value={usagePercent}
                    max={100}
                  />
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
                <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">
                  Аккаунт FunPay
                </label>
                <select
                  value={selectedAccountID ?? ''}
                  onChange={event => handleAccountChange(Number(event.target.value))}
                  className="platform-select"
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.username || `Аккаунт #${account.id}`}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-[var(--pf-text-dim)]">AI будет отвечать от имени выбранного аккаунта</p>
              </div>

              <div className="border-b border-[var(--pf-border)] p-5">
                <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">
                  Режим обработки сообщений
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setChatMode('assistant')}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      chatMode === 'assistant'
                        ? 'border-[var(--pf-accent-soft-strong)] bg-[var(--pf-accent-soft)]'
                        : 'border-[var(--pf-border)] bg-[var(--pf-surface-2)] hover:border-[var(--pf-border-strong)]'
                    }`}
                  >
                    <div className={`mb-1 text-xs font-semibold ${chatMode === 'assistant' ? 'text-[var(--pf-accent)]' : 'text-[var(--pf-text)]'}`}>
                      AI-Ассистент
                    </div>
                    <div className="text-[10px] leading-tight text-[var(--pf-text-dim)]">
                      Автоответ от нейросети по промпту и FAQ
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChatMode('constructor');
                      if (!constructorScenarioID && activeChatScenarios.length > 0) {
                        setConstructorScenarioID(activeChatScenarios[0].id);
                      }
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      chatMode === 'constructor'
                        ? 'border-[var(--pf-accent-soft-strong)] bg-[var(--pf-accent-soft)]'
                        : 'border-[var(--pf-border)] bg-[var(--pf-surface-2)] hover:border-[var(--pf-border-strong)]'
                    }`}
                  >
                    <div className={`mb-1 text-xs font-semibold ${chatMode === 'constructor' ? 'text-[var(--pf-accent)]' : 'text-[var(--pf-text)]'}`}>
                      Конструктор сценариев
                    </div>
                    <div className="text-[10px] leading-tight text-[var(--pf-text-dim)]">
                      Выполнение сценариев из вкладки Конструктор
                    </div>
                  </button>
                </div>

                {chatMode === 'constructor' && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-semibold text-[var(--pf-text-muted)]">
                      Сценарий для чатов этого аккаунта
                    </label>
                    <select
                      value={constructorScenarioID}
                      onChange={event => setConstructorScenarioID(event.target.value)}
                      className="platform-select"
                    >
                      <option value="">Выберите сценарий</option>
                      {activeChatScenarios.map(scenario => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-[var(--pf-text-dim)]">
                        В этом режиме AI-ассистент отключается, отвечают только выбранные сценарии.
                      </p>
                      <a href="/platform/constructor" className="text-xs font-medium text-[var(--pf-accent)] hover:underline">
                        Открыть конструктор
                      </a>
                    </div>
                    {activeChatScenarios.length === 0 && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <p className="text-xs text-amber-700">
                          Для режима конструктора нужен хотя бы один активный сценарий с триггером «chat_message».
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-b border-[var(--pf-border)] p-5">
                <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">
                  Тон общения
                </label>
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
                      <div className={`mb-1 text-xs font-semibold ${tone === item.key ? 'text-[var(--pf-accent)]' : 'text-[var(--pf-text)]'}`}>
                        {item.label}
                      </div>
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
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={delay}
                  onChange={event => setDelay(Number(event.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-[var(--pf-text-dim)]">
                  <span>Мгновенно</span>
                  <span className="text-center text-[var(--pf-text-soft)]">Имитация живого ответа</span>
                  <span>30 сек</span>
                </div>
              </div>
            </div>

            {/* Signature toggle */}
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
                  className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${
                    showAISignature
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-violet-500/30'
                      : 'bg-[var(--pf-surface-3)]'
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

            {/* Prompt */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] group-disabled/fields:opacity-60">
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <label className="mb-0.5 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">
                      Инструкция для AI
                    </label>
                    <p className="text-[11px] text-[var(--pf-text-dim)]">
                      Опишите своими словами, как должен вести себя ассистент
                    </p>
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

            {/* FAQ */}
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
          </fieldset>

          <button
            type="button"
            onClick={save}
            disabled={
              saving ||
              loading ||
              !selectedAccountID ||
              (assistantModeActive && noAiOnPlan) ||
              (assistantModeActive && prompt.length > MAX_PROMPT_LENGTH)
            }
            className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              saving ? 'platform-ai-save-btn-saving' : 'platform-ai-save-btn'
            }`}
          >
            {saving ? 'Сохраняем...' : 'Сохранить настройки'}
          </button>
        </div>

        <div className="hidden xl:block">
          <div className="platform-ai-chat-sticky sticky top-6">
            <TestChatPanel
              messages={testMessages}
              input={testInput}
              testing={testing}
              limitExhausted={assistantModeActive && (limitExhausted || noAiOnPlan)}
              disabledByMode={!assistantModeActive}
              onInputChange={setTestInput}
              onSend={() => void sendTestMessage()}
              onQuickSend={question => void sendTestMessage(question)}
              onClear={() => setTestMessages([])}
              messagesRef={messagesRef}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 xl:hidden">
        <button
          type="button"
          onClick={() => setMobileChatOpen(prev => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-[var(--pf-text)]">Тестировать AI</span>
          <span className="text-xs text-[var(--pf-accent)]">{mobileChatOpen ? '▲' : '▼'}</span>
        </button>
        {mobileChatOpen ? (
          <div className="mt-3 h-96">
            <TestChatPanel
              messages={testMessages}
              input={testInput}
              testing={testing}
              limitExhausted={assistantModeActive && (limitExhausted || noAiOnPlan)}
              disabledByMode={!assistantModeActive}
              onInputChange={setTestInput}
              onSend={() => void sendTestMessage()}
              onQuickSend={question => void sendTestMessage(question)}
              onClear={() => setTestMessages([])}
              messagesRef={messagesRef}
            />
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
