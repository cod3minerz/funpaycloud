'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { analyticsApi, dashboardApi, DashboardData, AnalyticsData } from '@/lib/api';
import { DataTableWrap, EmptyState, KpiCard, KpiGrid, PageHeader, PageShell, PageTitle, RequestErrorState, SectionCard } from '@/platform/components/primitives';

type Period = 'week' | 'month' | 'quarter';

const PERIOD_OPTIONS: Array<{ key: Period; label: string }> = [
  { key: 'week', label: '7 дней' },
  { key: 'month', label: '30 дней' },
  { key: 'quarter', label: '90 дней' },
];

export default function Dashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([dashboardApi.get(), analyticsApi.get({ period })])
      .then(([dash, anal]) => {
        if (cancelled) return;
        setDashData(dash);
        setAnalytics(anal);
      })
      .catch(err => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Ошибка загрузки дашборда';
          setLoadError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, reloadKey]);

  const recentOrders = useMemo(() => (Array.isArray(dashData?.recent_orders) ? dashData!.recent_orders : []), [dashData]);
  const recentChats = useMemo(() => (Array.isArray(dashData?.recent_chats) ? dashData!.recent_chats : []), [dashData]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Дашборд" subtitle="Сводка по заказам, чатам, лотам и выручке." />
          <div className="platform-period-group" role="tablist" aria-label="Период аналитики">
            {PERIOD_OPTIONS.map(option => (
              <button
                key={option.key}
                type="button"
                className={`platform-period-btn${period === option.key ? ' active' : ''}`}
                onClick={() => setPeriod(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </PageHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : loadError ? (
          <SectionCard>
            <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
          </SectionCard>
        ) : (
          <>
            <KpiGrid>
              <KpiCard>
                <div className="platform-kpi-meta">Общий баланс</div>
                <div className="text-[26px] font-extrabold">{Number(dashData?.total_balance || 0).toLocaleString('ru-RU')} ₽</div>
              </KpiCard>
              <KpiCard>
                <div className="platform-kpi-meta">Заказов сегодня</div>
                <div className="text-[26px] font-extrabold">{Number(dashData?.orders_today || 0)}</div>
              </KpiCard>
              <KpiCard>
                <div className="platform-kpi-meta">Активные лоты</div>
                <div className="text-[26px] font-extrabold">{Number(dashData?.active_lots || 0)}</div>
              </KpiCard>
              <KpiCard>
                <div className="platform-kpi-meta">Чаты без ответа</div>
                <div className="text-[26px] font-extrabold">{Number(dashData?.unread_chats || 0)}</div>
              </KpiCard>
            </KpiGrid>

            <SectionCard>
              <h2 className="m-0 text-[15px] font-bold">Динамика выручки</h2>
              <div className="mt-3 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.isArray(analytics?.chart) ? analytics!.chart : []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--pf-text-dim)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--pf-text-dim)', fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--pf-accent)" fill="rgba(91,140,255,0.24)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <SectionCard className="p-0">
                <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
                  <strong>Последние заказы</strong>
                  <button className="platform-btn-secondary" onClick={() => router.push('/platform/orders')}>Открыть</button>
                </div>
                <div className="platform-desktop-table">
                  <DataTableWrap>
                    <table className="platform-table" style={{ minWidth: 680 }}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>FunPay ID</th>
                          <th>Покупатель</th>
                          <th style={{ textAlign: 'right' }}>Сумма</th>
                          <th>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.funpay_order_id}</td>
                            <td>{order.buyer_username}</td>
                            <td style={{ textAlign: 'right' }}>{Number(order.price || 0)} ₽</td>
                            <td>{order.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataTableWrap>
                </div>
                {recentOrders.length === 0 && <EmptyState>Нет последних заказов</EmptyState>}
              </SectionCard>

              <SectionCard className="p-0">
                <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
                  <strong>Последние чаты</strong>
                  <button className="platform-btn-secondary" onClick={() => router.push('/platform/chats')}>Открыть</button>
                </div>
                <div className="grid gap-2 p-4">
                  {recentChats.map(chat => (
                    <article key={chat.id} className="platform-panel p-3">
                      <div className="flex items-center justify-between gap-2">
                        <strong>{chat.with_user || 'Покупатель'}</strong>
                        <span className="platform-kpi-meta">{new Date(chat.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-[var(--pf-text-muted)]">{chat.last_message || ''}</p>
                    </article>
                  ))}
                </div>
                {recentChats.length === 0 && <EmptyState>Диалоги пока отсутствуют</EmptyState>}
              </SectionCard>
            </section>
          </>
        )}
      </PageShell>
    </motion.div>
  );
}
