'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Link2, Loader2, Share2, Users, Wallet, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '@/lib/api';
import {
  KpiCard,
  KpiGrid,
  PageHeader,
  PageShell,
  PageTitle,
  Panel,
  RequestErrorState,
  SectionCard,
} from '@/platform/components/primitives';

const COMMISSION = 20;

function formatRub(value: number) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export default function Referrals() {
  const [loading, setLoading] = useState(true);
  const [refCode, setRefCode] = useState('');
  const [referrals, setReferrals] = useState<Array<Record<string, unknown>>>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'done'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoadError(null);
    settingsApi
      .getReferral()
      .then(data => {
        setRefCode(data.referral_code);
        setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
        setTotalEarned(data.total_earned);
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки реферальных данных';
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const refLink = refCode ? `https://funpay.cloud/r/${refCode}` : '';

  async function handleCopy() {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  }

  async function handleShare() {
    if (!refLink) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'FunPay Cloud', text: 'Подключайтесь по моей ссылке.', url: refLink });
      } else {
        await navigator.clipboard.writeText(refLink);
        toast.success('Ссылка скопирована');
      }
      setShareState('done');
      setTimeout(() => setShareState('idle'), 1600);
    } catch {
      setShareState('idle');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <PageShell>
        <SectionCard>
          <RequestErrorState message={loadError} onRetry={() => { setLoading(true); setReloadKey(prev => prev + 1); }} />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Реферальная программа" />
        </PageHeader>

        {/* 1. Referral link card */}
        <SectionCard>
          <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--pf-text-muted)]">
            <Link2 size={14} className="text-[var(--pf-accent)]" />
            Ваша реферальная ссылка
          </div>

          <Panel className="p-3">
            <div className="flex min-w-0 items-center gap-2 rounded-[8px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2">
              <span className="flex-1 truncate text-[13px] font-mono text-[var(--pf-text-muted)]">
                {refLink || '—'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="platform-btn-primary flex-1" onClick={handleCopy} disabled={!refLink}>
                <Copy size={14} /> {copied ? 'Скопировано' : 'Копировать ссылку'}
              </button>
              <button className="platform-btn-secondary flex-1" onClick={handleShare} disabled={!refLink}>
                <Share2 size={14} /> {shareState === 'done' ? 'Готово' : 'Поделиться'}
              </button>
            </div>
          </Panel>
        </SectionCard>

        {/* 2. KPI cards */}
        <KpiGrid>
          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Приглашено</span>
              <Users size={15} className="text-[var(--pf-accent)]" />
            </div>
            <strong className="text-[28px] font-black">{referrals.length.toLocaleString('ru-RU')}</strong>
            <span className="platform-kpi-meta">пользователей</span>
          </KpiCard>

          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Заработано</span>
              <Wallet size={15} className="text-[var(--pf-success)]" />
            </div>
            <strong className="text-[28px] font-black">{formatRub(totalEarned)}</strong>
            <span className="platform-kpi-meta">за всё время</span>
          </KpiCard>

          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Ваша комиссия</span>
              <Percent size={15} className="text-[var(--pf-warning)]" />
            </div>
            <strong className="text-[28px] font-black">{COMMISSION}%</strong>
            <span className="platform-kpi-meta">с каждой подписки</span>
          </KpiCard>
        </KpiGrid>

        {/* 3. Referrals table */}
        <SectionCard>
          <h3 className="m-0 mb-3 text-[16px] font-bold">Рефералы</h3>
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Users size={32} color="var(--pf-text-dim)" />
              <p className="m-0 text-[14px] font-semibold text-[var(--pf-text-muted)]">
                Пригласите первого пользователя
              </p>
              <p className="m-0 text-[13px] text-[var(--pf-text-dim)]">
                Поделитесь ссылкой выше — после регистрации реферал появится здесь.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="platform-table min-w-[480px]">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th className="text-right">Заработок</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref, idx) => (
                    <tr key={idx}>
                      <td>{String(ref.email ?? `Реферал #${idx + 1}`)}</td>
                      <td>{String(ref.created_at ?? '—')}</td>
                      <td>Активен</td>
                      <td className="text-right">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* 4. How it works */}
        <SectionCard>
          <h3 className="m-0 mb-4 text-[16px] font-bold">Как это работает</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: '1', title: 'Поделитесь ссылкой', desc: 'Отправьте реферальную ссылку друзьям или опубликуйте в соцсетях.' },
              { step: '2', title: 'Друг регистрируется', desc: 'Пользователь переходит по ссылке и создаёт аккаунт на платформе.' },
              { step: '3', title: `Получаете ${COMMISSION}%`, desc: 'С каждого платежа реферала вы получаете комиссию автоматически.' },
            ].map(item => (
              <Panel key={item.step} className="p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[13px] font-black text-[var(--pf-accent)]">
                  {item.step}
                </div>
                <div className="mb-1 text-[14px] font-bold">{item.title}</div>
                <p className="m-0 text-[13px] leading-6 text-[var(--pf-text-muted)]">{item.desc}</p>
              </Panel>
            ))}
          </div>
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
