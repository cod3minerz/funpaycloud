'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bot, Plus, RotateCcw, Send, Trash2 } from '@/shared/streamline/icons';
import { toast } from 'sonner';
import { aiApi, accountsApi, ApiAccount, ApiScenario, scenariosApi } from '@/lib/api';
import { PageHeader, PageShell, PageTitle } from '@/platform/components/primitives';

type ChatMode = 'assistant' | 'constructor';

type MessageItem = {
  role: 'user' | 'ai';
  text: string;
  loading?: boolean;
};

type LocalFaqItem = {
  id: string;
  question: string;
  answer: string;
};

const QUICK_MESSAGES = ['Есть ли товар в наличии?', 'Когда будет выдача?', 'Можно ли скидку?'];

function modeLabel(mode: ChatMode): string {
  return mode === 'constructor' ? 'Сценарии' : 'ИИ Бот';
}

export default function TestChatPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const [productionMode, setProductionMode] = useState<ChatMode>('assistant');
  const [autoMode, setAutoMode] = useState(true);
  const [overrideMode, setOverrideMode] = useState<ChatMode>('assistant');
  const [selectedScenarioID, setSelectedScenarioID] = useState('');
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [localTone, setLocalTone] = useState<'formal' | 'neutral' | 'friendly'>('neutral');
  const [localDelaySeconds, setLocalDelaySeconds] = useState(3);
  const [localPrompt, setLocalPrompt] = useState('');
  const [localSignature, setLocalSignature] = useState(false);
  const [localFaq, setLocalFaq] = useState<LocalFaqItem[]>([]);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [trace, setTrace] = useState<Array<Record<string, unknown>>>([]);
  const [lastEffectiveMode, setLastEffectiveMode] = useState<ChatMode>('assistant');

  const messagesRef = useRef<HTMLDivElement>(null);

  const effectiveMode: ChatMode = autoMode ? productionMode : overrideMode;
  const activeScenarios = useMemo(() => scenarios.filter(item => item.trigger_type === 'chat_message'), [scenarios]);

  const selectedAccountName = useMemo(() => {
    const account = accounts.find(item => item.id === selectedAccountID);
    return account?.username || `Аккаунт #${selectedAccountID ?? ''}`;
  }, [accounts, selectedAccountID]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
        await loadForAccount(firstID, cancelled);
      })
      .catch(err => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : 'Не удалось загрузить тест-чат');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadForAccount(accountID: number, cancelled = false) {
    const [config, accountScenarios, faqItems] = await Promise.all([
      aiApi.getConfig(accountID),
      scenariosApi.list(accountID),
      aiApi.getFaq(accountID),
    ]);
    if (cancelled) return;

    const mode: ChatMode = config.chat_mode === 'constructor' ? 'constructor' : 'assistant';
    setProductionMode(mode);
    setLastEffectiveMode(mode);
    setOverrideMode(mode);

    setScenarios(accountScenarios);

    const scenarioFromConfig = (config.constructor_scenario_id || '').trim();
    if (scenarioFromConfig) {
      setSelectedScenarioID(scenarioFromConfig);
    } else {
      const firstChatScenario = accountScenarios.find(item => item.trigger_type === 'chat_message');
      setSelectedScenarioID(firstChatScenario?.id || '');
    }

    const normalizedTone = config.tone === 'formal' || config.tone === 'friendly' || config.tone === 'neutral' ? config.tone : 'neutral';
    setLocalTone(normalizedTone);
    setLocalDelaySeconds(typeof config.delay_seconds === 'number' ? config.delay_seconds : 3);
    setLocalPrompt(config.system_prompt || '');
    setLocalSignature(Boolean(config.show_ai_signature));
    setLocalFaq(
      faqItems.map(item => ({
        id: `${item.id}`,
        question: item.question || '',
        answer: item.answer || '',
      })),
    );

    setMessages([]);
    setTrace([]);
    setInput('');
  }

  async function handleAccountChange(accountID: number) {
    setSelectedAccountID(accountID);
    setLoading(true);
    try {
      await loadForAccount(accountID);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось загрузить данные аккаунта');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(raw?: string) {
    if (!selectedAccountID || testing) return;

    const text = (raw ?? input).trim();
    if (!text) return;

    if (!autoMode && overrideMode === 'constructor' && !selectedScenarioID) {
      toast.error('Выберите сценарий для теста режима сценариев');
      return;
    }

    const history = messages
      .filter(item => !item.loading)
      .map(item => ({ role: (item.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user', text: item.text }));

    setMessages(prev => [...prev, { role: 'user', text }, { role: 'ai', text: '', loading: true }]);
    setInput('');
    setTesting(true);
    setTrace([]);

    try {
      const localFaqPayload = localFaq
        .map(item => ({ question: item.question.trim(), answer: item.answer.trim() }))
        .filter(item => item.question.length > 0 && item.answer.length > 0);

      const response = await aiApi.testChat({
        account_id: selectedAccountID,
        message: text,
        history,
        auto_mode: autoMode,
        override_mode: autoMode ? undefined : overrideMode,
        scenario_id: !autoMode && overrideMode === 'constructor' ? selectedScenarioID : undefined,
        config_override:
          !autoMode && overrideMode === 'assistant'
            ? {
                tone: localTone,
                system_prompt: localPrompt.trim(),
                delay_seconds: localDelaySeconds,
                show_ai_signature: localSignature,
                faq: localFaqPayload,
              }
            : undefined,
      });

      setLastEffectiveMode((response.effective_mode === 'constructor' ? 'constructor' : 'assistant') as ChatMode);
      setTrace(Array.isArray(response.trace) ? response.trace : []);

      setMessages(prev => {
        const copy = [...prev];
        const loadingIndex = copy.findIndex(item => item.role === 'ai' && item.loading);
        const nextText = response.reply || 'Сценарий выполнен без текстового ответа';
        if (loadingIndex >= 0) {
          copy[loadingIndex] = { role: 'ai', text: nextText, loading: false };
        } else {
          copy.push({ role: 'ai', text: nextText, loading: false });
        }
        return copy;
      });
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Ошибка тестового сообщения';
      setMessages(prev => {
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

  function addLocalFaq() {
    setLocalFaq(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        question: '',
        answer: '',
      },
    ]);
  }

  function updateLocalFaq(index: number, key: 'question' | 'answer', value: string) {
    setLocalFaq(prev => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  function removeLocalFaq(index: number) {
    setLocalFaq(prev => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <PageShell>
      <PageHeader>
        <PageTitle title="Тест-чат" subtitle="Отладка автоответчика без отправки реальных сообщений покупателям" />
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Аккаунт</label>
            <select
              value={selectedAccountID ?? ''}
              onChange={event => void handleAccountChange(Number(event.target.value))}
              className="platform-select"
              disabled={loading}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.username || `Аккаунт #${account.id}`}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-[var(--pf-text-dim)]">Текущий аккаунт: {selectedAccountName}</p>
          </div>

          <div className="rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--pf-text)]">Авто режим</p>
              <button
                type="button"
                onClick={() => setAutoMode(prev => !prev)}
                className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
                  autoMode ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-[var(--pf-surface-3)]'
                }`}
                aria-pressed={autoMode}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    autoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-[var(--pf-text-dim)]">
              {autoMode
                ? 'Тест использует боевой режим из вкладки AI-Ассистент.'
                : 'Ручной override только для теста. Боевой режим не изменяется.'}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Режим теста</p>
            <p className="mt-2 text-sm font-medium text-[var(--pf-text)]">{modeLabel(effectiveMode)}</p>
            <p className="mt-1 text-[11px] text-[var(--pf-text-dim)]">
              {autoMode ? `Боевой режим: ${modeLabel(productionMode)}` : 'Локальный режим теста'}
            </p>

            {!autoMode && (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideMode('assistant')}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      overrideMode === 'assistant'
                        ? 'border-[var(--pf-accent-soft-strong)] bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]'
                        : 'border-[var(--pf-border)] text-[var(--pf-text-muted)]'
                    }`}
                  >
                    ИИ Бот
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideMode('constructor')}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      overrideMode === 'constructor'
                        ? 'border-[var(--pf-accent-soft-strong)] bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]'
                        : 'border-[var(--pf-border)] text-[var(--pf-text-muted)]'
                    }`}
                  >
                    Сценарии
                  </button>
                </div>

                {overrideMode === 'constructor' && (
                  <div className="mt-3">
                    <label className="mb-2 block text-[11px] font-semibold text-[var(--pf-text-dim)]">Сценарий</label>
                    <select
                      value={selectedScenarioID}
                      onChange={event => setSelectedScenarioID(event.target.value)}
                      className="platform-select"
                    >
                      <option value="">Выберите сценарий</option>
                      {activeScenarios.map(scenario => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {overrideMode === 'assistant' && (
                  <div className="mt-4 space-y-3 rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Локальные настройки теста</p>
                    <p className="text-[11px] text-[var(--pf-text-dim)]">Эти параметры используются только в тест-чате и не меняют боевые настройки аккаунта.</p>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[var(--pf-text-dim)]">Тон общения</label>
                      <select
                        value={localTone}
                        onChange={event => setLocalTone(event.target.value as 'formal' | 'neutral' | 'friendly')}
                        className="platform-select"
                      >
                        <option value="neutral">Нейтральный</option>
                        <option value="formal">Официальный</option>
                        <option value="friendly">Дружелюбный</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[var(--pf-text-dim)]">Задержка ответа: {localDelaySeconds}с</label>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        step={1}
                        value={localDelaySeconds}
                        onChange={event => setLocalDelaySeconds(Number(event.target.value))}
                        className="w-full accent-[var(--pf-accent)]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--pf-text-dim)]">Подпись ассистента</span>
                      <button
                        type="button"
                        onClick={() => setLocalSignature(prev => !prev)}
                        className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
                          localSignature ? 'bg-[var(--pf-accent)]' : 'bg-[var(--pf-surface-3)]'
                        }`}
                        aria-pressed={localSignature}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                            localSignature ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[var(--pf-text-dim)]">Инструкция для ИИ</label>
                      <textarea
                        value={localPrompt}
                        onChange={event => setLocalPrompt(event.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-[var(--pf-border-strong)] bg-[var(--pf-elevated)] px-3 py-2 text-sm text-[var(--pf-text)] placeholder-[var(--pf-text-soft)] focus:border-[var(--pf-accent-soft-strong)] focus:outline-none"
                        placeholder="Например: отвечай коротко, всегда уточняй логин перед выдачей..."
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[var(--pf-text-dim)]">База знаний FAQ</span>
                        <button
                          type="button"
                          onClick={addLocalFaq}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--pf-border)] px-2 py-1 text-[11px] text-[var(--pf-text-muted)] hover:border-[var(--pf-accent-soft-strong)] hover:text-[var(--pf-text)]"
                        >
                          <Plus size={11} />
                          Добавить
                        </button>
                      </div>
                      {localFaq.length === 0 ? (
                        <p className="text-[11px] text-[var(--pf-text-dim)]">FAQ не добавлен. Ответы будут строиться только по инструкции и контексту лотов.</p>
                      ) : (
                        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                          {localFaq.map((item, index) => (
                            <div key={item.id} className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] p-2">
                              <div className="mb-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeLocalFaq(index)}
                                  className="inline-flex items-center gap-1 text-[11px] text-[var(--pf-text-dim)] hover:text-red-400"
                                >
                                  <Trash2 size={11} />
                                  Удалить
                                </button>
                              </div>
                              <input
                                value={item.question}
                                onChange={event => updateLocalFaq(index, 'question', event.target.value)}
                                className="mb-2 w-full rounded-lg border border-[var(--pf-border-strong)] bg-[var(--pf-elevated)] px-2 py-1.5 text-xs text-[var(--pf-text)] focus:border-[var(--pf-accent-soft-strong)] focus:outline-none"
                                placeholder="Вопрос"
                              />
                              <textarea
                                value={item.answer}
                                onChange={event => updateLocalFaq(index, 'answer', event.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-[var(--pf-border-strong)] bg-[var(--pf-elevated)] px-2 py-1.5 text-xs text-[var(--pf-text)] focus:border-[var(--pf-accent-soft-strong)] focus:outline-none"
                                placeholder="Ответ"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {trace.length > 0 && (
            <div className="rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--pf-text-dim)]">Trace</p>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {trace.map((item, index) => {
                  const nodeID = typeof item.node_id === 'string' ? item.node_id : `#${index + 1}`;
                  const nodeType = typeof item.node_type === 'string' ? item.node_type : 'node';
                  const result = typeof item.result === 'string' ? item.result : 'executed';
                  return (
                    <div key={`${nodeID}-${index}`} className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2">
                      <p className="text-[11px] font-semibold text-[var(--pf-text)]">
                        {nodeType} · {nodeID}
                      </p>
                      <p className="text-[11px] text-[var(--pf-text-dim)]">result: {result}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex min-h-[540px] flex-col overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500">
                <Bot size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--pf-text)]">Тестовый диалог</p>
                <p className="text-[11px] text-[var(--pf-text-dim)]">Режим теста не влияет на боевой режим аккаунта</p>
              </div>
            </div>
            <div className="text-[11px] text-[var(--pf-text-dim)]">Ответил: {modeLabel(lastEffectiveMode)}</div>
          </div>

          <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pf-accent-soft)]">
                  <AlertCircle size={16} className="text-[var(--pf-accent)]" />
                </div>
                <p className="mb-2 text-sm font-medium text-[var(--pf-text)]">Проверьте качество автоответов</p>
                <p className="mb-4 text-xs text-[var(--pf-text-dim)]">Вы пишете как покупатель, система отвечает в выбранном тестовом режиме.</p>
                <div className="flex w-full flex-col gap-2">
                  {QUICK_MESSAGES.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => void sendMessage(item)}
                      className="rounded-lg border border-[var(--pf-border)] px-3 py-2 text-left text-xs text-[var(--pf-text-dim)] transition-colors hover:border-[var(--pf-accent-soft-strong)] hover:bg-[var(--pf-accent-soft)]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}`}>
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--pf-accent)] px-3.5 py-2.5 text-sm text-white">{message.text}</div>
                    </div>
                  ) : (
                    <div className="flex gap-2.5">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500">
                        <Bot size={12} className="text-white" />
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3.5 py-2.5 text-sm text-[var(--pf-text)]">
                        {message.loading ? 'Печатает…' : message.text}
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
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Напишите сообщение покупателя..."
                disabled={testing || loading}
                className="flex-1 rounded-xl border border-[var(--pf-border-strong)] bg-[var(--pf-elevated)] px-4 py-2.5 text-sm text-[var(--pf-text)] placeholder-[var(--pf-text-soft)] focus:border-[var(--pf-accent-soft-strong)] focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || testing || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pf-accent)] text-white transition-colors hover:bg-[var(--pf-accent-hover)] disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setTrace([]);
                }}
                className="mt-2 flex items-center gap-1 text-[11px] text-[var(--pf-text-dim)] hover:text-[var(--pf-text-muted)]"
              >
                <RotateCcw size={11} />
                Очистить тестовый диалог
              </button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
