'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Ticket, XCircle } from 'lucide-react';
import { adminApi, AdminPromoCode } from '@/lib/api';

type ValidityPreset = 'day' | 'week' | 'month' | 'custom';
type RewardType = 'plan' | 'ai_messages';

type FormState = {
  code: string;
  generate: boolean;
  validityPreset: ValidityPreset;
  expiresAt: string;
  rewardType: RewardType;
  rewardPlan: 'lite' | 'pro' | 'ultra';
  rewardAiMessages: string;
};

const initialForm: FormState = {
  code: '',
  generate: true,
  validityPreset: 'month',
  expiresAt: '',
  rewardType: 'plan',
  rewardPlan: 'pro',
  rewardAiMessages: '500',
};

function statusLabel(item: AdminPromoCode): string {
  switch (item.status) {
    case 'active':
      return 'Активен';
    case 'deactivated':
      return 'Деактивирован';
    case 'expired':
      return 'Истёк';
    case 'used':
      return 'Использован';
    default:
      return item.status;
  }
}

function statusClass(item: AdminPromoCode): string {
  switch (item.status) {
    case 'active':
      return 'bg-emerald-500/15 text-emerald-300';
    case 'deactivated':
      return 'bg-red-500/15 text-red-300';
    case 'expired':
      return 'bg-amber-500/15 text-amber-300';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}

function rewardLabel(item: AdminPromoCode): string {
  if (item.reward_type === 'plan') {
    return `${String(item.reward_plan || '').toUpperCase()} · ${item.duration_days} дн.`;
  }
  return `+${item.reward_ai_messages} AI`;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ru-RU');
}

export default function AdminPromoCodesPage() {
  const [items, setItems] = useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.promoCodes();
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить промокоды');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const payload = useMemo(() => ({
    code: form.generate ? undefined : form.code.trim() || undefined,
    generate: form.generate,
    validity_preset: form.validityPreset,
    expires_at: form.validityPreset === 'custom' && form.expiresAt
      ? new Date(`${form.expiresAt}T23:59:59Z`).toISOString()
      : undefined,
    reward_type: form.rewardType,
    reward_plan: form.rewardType === 'plan' ? form.rewardPlan : undefined,
    reward_ai_messages: form.rewardType === 'ai_messages'
      ? Number(form.rewardAiMessages) || 0
      : undefined,
    duration_days: form.rewardType === 'plan' ? 30 : undefined,
  }), [form]);

  async function submit() {
    if (!form.generate && form.code.trim().length < 4) {
      setError('Код должен содержать минимум 4 символа');
      return;
    }
    if (form.rewardType === 'ai_messages' && (Number(form.rewardAiMessages) || 0) <= 0) {
      setError('Укажите количество AI сообщений больше 0');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await adminApi.createPromoCode(payload);
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать промокод');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: number) {
    try {
      await adminApi.deactivatePromoCode(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось деактивировать промокод');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Промокоды</h1>
        <p className="text-sm text-slate-400">
          Создавайте коды на тарифы или AI-сообщения. Один код может быть использован только одним пользователем.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Создать промокод</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100">
            <input
              type="checkbox"
              checked={form.generate}
              onChange={event => setForm(prev => ({ ...prev, generate: event.target.checked }))}
            />
            Сгенерировать автоматически
          </label>

          <input
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="Код (если не генерация)"
            value={form.code}
            disabled={form.generate}
            onChange={event => setForm(prev => ({ ...prev, code: event.target.value.toUpperCase() }))}
          />

          <select
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
            value={form.validityPreset}
            onChange={event => setForm(prev => ({ ...prev, validityPreset: event.target.value as ValidityPreset }))}
          >
            <option value="day">Срок: 1 день</option>
            <option value="week">Срок: 1 неделя</option>
            <option value="month">Срок: 1 месяц</option>
            <option value="custom">Срок: до даты</option>
          </select>

          <input
            type="date"
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 disabled:opacity-50"
            value={form.expiresAt}
            disabled={form.validityPreset !== 'custom'}
            onChange={event => setForm(prev => ({ ...prev, expiresAt: event.target.value }))}
          />

          <select
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
            value={form.rewardType}
            onChange={event => setForm(prev => ({ ...prev, rewardType: event.target.value as RewardType }))}
          >
            <option value="plan">Награда: тариф</option>
            <option value="ai_messages">Награда: AI сообщения</option>
          </select>

          {form.rewardType === 'plan' ? (
            <select
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
              value={form.rewardPlan}
              onChange={event => setForm(prev => ({ ...prev, rewardPlan: event.target.value as FormState['rewardPlan'] }))}
            >
              <option value="lite">Lite (30 дней)</option>
              <option value="pro">Pro (30 дней)</option>
              <option value="ultra">Ultra (30 дней)</option>
            </select>
          ) : (
            <input
              type="number"
              min={1}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
              placeholder="Количество AI сообщений"
              value={form.rewardAiMessages}
              onChange={event => setForm(prev => ({ ...prev, rewardAiMessages: event.target.value }))}
            />
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Создать промокод
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Список промокодов</h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-slate-300" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">Промокоды пока не созданы.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">Код</th>
                  <th className="pb-2 pr-3">Награда</th>
                  <th className="pb-2 pr-3">Статус</th>
                  <th className="pb-2 pr-3">Истекает</th>
                  <th className="pb-2 pr-3">Использовал</th>
                  <th className="pb-2 pr-3">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map(item => (
                  <tr key={item.id} className="text-slate-200">
                    <td className="py-2 pr-3 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Ticket size={12} className="text-indigo-300" />
                        {item.code}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{rewardLabel(item)}</td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusClass(item)}`}>
                        {statusLabel(item)}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{formatDate(item.expires_at)}</td>
                    <td className="py-2 pr-3">{item.redeemed_by_email || '—'}</td>
                    <td className="py-2 pr-3">
                      {item.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => deactivate(item.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2 text-xs text-red-300 hover:bg-red-500/20"
                        >
                          <XCircle size={12} />
                          Деактивировать
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Промокод деактивирован</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
