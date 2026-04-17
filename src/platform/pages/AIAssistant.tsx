'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  HelpCircle,
  Lightbulb,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiApi, accountsApi, ApiAccount } from '@/lib/api';
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
  onInputChange,
  onSend,
  onQuickSend,
  onClear,
  messagesRef,
}: {
  messages: TestMessage[];
  input: string;
  testing: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickSend: (value: string) => void;
  onClear: () => void;
  messagesRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#0a0f1acc] backdrop-blur-md"
      style={{ boxShadow: '0 0 28px rgba(99,102,241,0.1)' }}
    >
      <div
        className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5"
        style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))' }}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            Тестовый режим
            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-300">
              Beta
            </span>
          </div>
          <div className="text-[10px] text-slate-500">Пишите как покупатель — AI ответит как настроено</div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-amber-500/80">
          <AlertCircle size={10} />
          <span>−1 от лимита</span>
        </div>
      </div>

      <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10"
              style={{ boxShadow: '0 0 20px rgba(99,102,241,0.15)' }}
            >
              <Sparkles size={20} className="text-indigo-400" />
            </div>
            <p className="mb-2 text-sm font-medium text-slate-300">Протестируйте AI-ассистента</p>
            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              Напишите вопрос от лица покупателя и проверьте, как AI ответит с текущими настройками
            </p>
            <div className="flex w-full flex-col gap-2">
              {QUICK_TESTS.map(question => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onQuickSend(question)}
                  className="rounded-lg border border-white/[0.06] px-3 py-2 text-left text-xs text-slate-500 transition-all hover:border-indigo-500/20 hover:bg-indigo-500/5 hover:text-slate-200"
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
                  <div
                    className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  >
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
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.04] px-3.5 py-3">
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.04] px-3.5 py-2.5 text-sm leading-relaxed text-slate-200">
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

      <div className="border-t border-white/[0.06] p-3">
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
            placeholder="Напишите как покупатель..."
            className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-colors focus:border-indigo-500/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || testing}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Send size={15} />
          </button>
        </div>

        {messages.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="mt-2 flex items-center gap-1 text-[10px] text-slate-600 transition-colors hover:text-slate-400"
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
    const [config, faq] = await Promise.all([aiApi.getConfig(accountID), aiApi.getFaq(accountID)]);
    setEnabled(Boolean(config.is_enabled));
    setTone(
      config.tone === 'formal' || config.tone === 'friendly' || config.tone === 'neutral'
        ? config.tone
        : 'neutral',
    );
    setDelay(typeof config.delay_seconds === 'number' ? config.delay_seconds : 3);
    setPrompt(config.system_prompt ?? '');
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

    setSaving(true);
    try {
      const savedConfig = await aiApi.saveConfig(selectedAccountID, {
        is_enabled: enabled,
        tone,
        system_prompt: prompt.trim(),
        delay_seconds: delay,
      });

      const currentFaq = await aiApi.getFaq(selectedAccountID);
      for (const item of currentFaq) {
        await aiApi.deleteFaq(selectedAccountID, item.id);
      }

      const normalizedFaq = faqItems
        .map(item => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }))
        .filter(item => item.question.length > 0 && item.answer.length > 0);

      const recreated: FaqDraft[] = [];
      for (const item of normalizedFaq) {
        const created = await aiApi.addFaq(selectedAccountID, item);
        recreated.push({ id: created.id, question: created.question, answer: created.answer });
      }
      setFaqItems(recreated);
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

  const selectedAccountName = useMemo(() => {
    const account = accounts.find(item => item.id === selectedAccountID);
    return account?.username || `Аккаунт #${selectedAccountID ?? ''}`;
  }, [accounts, selectedAccountID]);

  const nextMonth = useMemo(() => monthLabel(), []);

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
          <div
            className="relative mb-6 overflow-hidden rounded-2xl border border-indigo-500/30 p-6"
            style={{
              background:
                'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.10) 50%, rgba(17,24,39,0.8) 100%)',
              boxShadow: '0 0 40px rgba(99,102,241,0.08)',
            }}
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="absolute bottom-0 right-16 h-20 w-20 rounded-full bg-indigo-500/10 blur-xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">AI активен</span>
                </div>
                <h2 className="mb-1 text-xl font-bold text-white">AI-Ассистент</h2>
                <p className="text-xs text-slate-400">Отвечает покупателям автоматически от вашего имени</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => setEnabled(prev => !prev)}
                  className={`relative h-6 w-12 rounded-full transition-all duration-300 ${
                    enabled
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-violet-500/30'
                      : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                      enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="text-[10px] text-slate-500">{enabled ? 'Включён' : 'Выключен'}</span>
              </div>
            </div>

            <div className="relative mt-5 border-t border-white/[0.06] pt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Использовано в этом месяце</span>
                <span className="text-xs font-semibold text-white">
                  {used} / {limit} сообщений
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usagePercent}%`,
                    background:
                      usagePercent > 80
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-[10px] text-slate-600">Обновится 1 {nextMonth}</span>
                <span className="text-[10px] text-slate-500">Текущий аккаунт: {selectedAccountName}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="border-b border-white/[0.04] p-5">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Аккаунт FunPay
              </label>
              <select
                value={selectedAccountID ?? ''}
                onChange={event => handleAccountChange(Number(event.target.value))}
                className="w-full appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white transition-colors focus:border-indigo-500/50 focus:outline-none"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id} className="bg-slate-900">
                    {account.username || `Аккаунт #${account.id}`}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-slate-600">AI будет отвечать от имени выбранного аккаунта</p>
            </div>

            <div className="border-b border-white/[0.04] p-5">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-slate-400">
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
                        ? 'border-indigo-500/50 bg-indigo-500/10 shadow-sm shadow-indigo-500/10'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className={`mb-1 text-xs font-semibold ${tone === item.key ? 'text-indigo-300' : 'text-white'}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] leading-tight text-slate-600">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Задержка ответа</label>
                <span className="text-xs font-medium text-white">{delay} сек</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={delay}
                onChange={event => setDelay(Number(event.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                <span>Мгновенно</span>
                <span className="text-center text-slate-500">Имитация живого ответа</span>
                <span>30 сек</span>
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <label className="mb-0.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Инструкция для AI
                  </label>
                  <p className="text-[11px] text-slate-600">
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
                placeholder="Например: Я продаю игровые ключи..."
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-200 placeholder-slate-600 transition-colors focus:border-indigo-500/40 focus:outline-none"
              />
              <div className="mt-2 flex justify-between">
                <span className="text-[10px] text-slate-600">Лоты из вашего аккаунта добавляются автоматически</span>
                <span className={`text-[10px] ${prompt.length > 1800 ? 'text-red-400' : 'text-slate-600'}`}>
                  {prompt.length} / 2000
                </span>
              </div>
            </div>

            <div className="px-5 pb-5">
              <p className="mb-2 text-[10px] text-slate-600">Быстрые фразы:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setPrompt(prev => `${prev}${prev ? '. ' : ''}${tag}`)}
                    className="rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-[10px] text-indigo-400 transition-colors hover:bg-indigo-500/10"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/[0.04] p-5">
              <div>
                <h3 className="text-sm font-semibold text-white">База знаний</h3>
                <p className="mt-0.5 text-[11px] text-slate-600">Частые вопросы — AI использует эти ответы в диалоге</p>
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

            <div className="divide-y divide-white/[0.04]">
              {faqItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                    <HelpCircle size={18} className="text-indigo-400" />
                  </div>
                  <p className="mb-1 text-sm text-slate-500">База знаний пуста</p>
                  <p className="text-xs text-slate-600">Добавьте частые вопросы и ответы</p>
                </div>
              ) : (
                faqItems.map((item, index) => (
                  <div key={item.id} className="group p-4 transition-colors hover:bg-white/[0.02]">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-2">
                        <input
                          value={item.question}
                          onChange={event => updateFaq(index, 'question', event.target.value)}
                          placeholder="Вопрос покупателя..."
                          className="w-full border-b border-transparent bg-transparent pb-0.5 text-sm text-slate-300 placeholder-slate-600 transition-colors focus:border-white/[0.08] focus:outline-none"
                        />
                        <input
                          value={item.answer}
                          onChange={event => updateFaq(index, 'answer', event.target.value)}
                          placeholder="Ответ AI..."
                          className="w-full border-b border-transparent bg-transparent pb-0.5 text-xs text-slate-500 placeholder-slate-700 transition-colors focus:border-white/[0.08] focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="self-center text-slate-700 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !selectedAccountID}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: saving ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: saving ? 'none' : '0 4px 20px rgba(99,102,241,0.25)',
            }}
          >
            {saving ? 'Сохраняем...' : 'Сохранить настройки'}
          </button>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-6" style={{ height: 'calc(100vh - 120px)' }}>
            <TestChatPanel
              messages={testMessages}
              input={testInput}
              testing={testing}
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
          className="flex w-full items-center justify-between rounded-xl border border-indigo-500/20 bg-white/[0.02] px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-white">Тестировать AI</span>
          <span className="text-xs text-indigo-300">{mobileChatOpen ? '▲' : '▼'}</span>
        </button>
        {mobileChatOpen ? (
          <div className="mt-3 h-96">
            <TestChatPanel
              messages={testMessages}
              input={testInput}
              testing={testing}
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
