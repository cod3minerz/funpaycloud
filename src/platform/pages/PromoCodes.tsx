'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Gift, Loader2, Sparkles, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { promoApi, PromoRedemptionItem, PromoRedeemResult } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  PageShell,
  PageTitle,
  RequestErrorState,
  SectionCard,
} from '@/platform/components/primitives';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ru-RU');
}

function rewardLabel(item: PromoRedemptionItem | PromoRedeemResult): string {
  if (item.reward_type === 'plan') {
    const plan = (item.reward_plan || '').toLowerCase();
    const map: Record<string, string> = {
      lite: 'Lite',
      pro: 'Pro',
      ultra: 'Ultra',
    };
    const days = item.duration_days || 30;
    return `Тариф ${map[plan] || item.reward_plan || 'Plan'} на ${days} дн.`;
  }
  const count = item.reward_ai_messages || 0;
  return `+${count} AI сообщений`;
}

export default function PromoCodesPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<PromoRedemptionItem[]>([]);
  const [aiMeta, setAiMeta] = useState({ used: 0, limit: 0, remaining: 0 });
  const [lastApplied, setLastApplied] = useState<PromoRedeemResult | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await promoApi.my();
      setItems(Array.isArray(data.items) ? data.items : []);
      setAiMeta({
        used: Number(data.ai?.used || 0),
        limit: Number(data.ai?.limit || 0),
        remaining: Number(data.ai?.remaining || 0),
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Не удалось загрузить промокоды');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitCode() {
    const normalized = code.trim();
    if (!normalized) {
      toast.warning('Введите промокод');
      return;
    }

    setSaving(true);
    try {
      const result = await promoApi.redeem(normalized);
      setLastApplied(result.result);
      setCode('');
      toast.success('Промокод успешно применён');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось применить промокод');
    } finally {
      setSaving(false);
    }
  }

  const usagePercent = useMemo(() => {
    if (aiMeta.limit <= 0) return 0;
    return Math.min(100, Math.round((aiMeta.used / aiMeta.limit) * 100));
  }, [aiMeta.limit, aiMeta.used]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Промокоды" />
        </PageHeader>

        <SectionCard className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--pf-text)]">
                <Ticket size={15} className="text-[var(--pf-accent)]" />
                Применить промокод
              </div>
              <p className="mt-1 text-xs text-[var(--pf-text-muted)]">
                Активируйте код на тариф или дополнительные AI-сообщения.
              </p>
            </div>
            {lastApplied ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={13} />
                {rewardLabel(lastApplied)}
              </span>
            ) : null}
          </div>

          <div className="platform-toolbar">
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Gift size={14} className="text-[var(--pf-text-dim)]" />
              <input
                value={code}
                onChange={event => setCode(event.target.value.toUpperCase())}
                placeholder="Введите промокод"
                aria-label="Промокод"
              />
            </label>
            <button
              type="button"
              className="platform-btn-primary"
              onClick={submitCode}
              disabled={saving}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Применить
            </button>
          </div>
        </SectionCard>

        <SectionCard className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[var(--pf-text)]">Лимит AI сообщений</div>
            <div className="text-xs text-[var(--pf-text-muted)]">
              {aiMeta.used.toLocaleString('ru-RU')} / {aiMeta.limit.toLocaleString('ru-RU')}
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--pf-border)]">
            <progress className="platform-ai-progress normal h-full w-full rounded-full" value={usagePercent} max={100} />
          </div>
          <div className="text-xs text-[var(--pf-text-dim)]">
            Осталось: {aiMeta.remaining.toLocaleString('ru-RU')} сообщений
          </div>
        </SectionCard>

        <SectionCard className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--pf-accent)]" />
            </div>
          ) : loadError ? (
            <RequestErrorState message={loadError} onRetry={load} />
          ) : items.length === 0 ? (
            <EmptyState>Вы ещё не активировали ни одного промокода.</EmptyState>
          ) : (
            <div className="platform-desktop-table">
              <table className="platform-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Код</th>
                    <th>Награда</th>
                    <th>Дата активации</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="font-semibold">{item.code}</td>
                      <td>{rewardLabel(item)}</td>
                      <td>{formatDate(item.redeemed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
