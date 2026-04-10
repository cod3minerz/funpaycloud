'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BarChart2,
  Loader2,
  MessageSquare,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { analyticsApi, AnalyticsData, dashboardApi, DashboardData } from '@/lib/api';
import {
  DataTableWrap,
  EmptyState,
  KpiCard,
  KpiGrid,
  PageShell,
  Panel,
  SectionCard,
} from '@/platform/components/primitives';

const statusLabel: Record<string, string> = {
  paid: 'Оплачен',
  completed: 'Выполнен',
  refund: 'Возврат',
  dispute: 'Спор',
  0: 'Оплачен',
  1: 'Выполнен',
  2: 'Возврат',
};

const statusClass: Record<string, string> = {
  paid: 'badge-paid',
  completed: 'badge-completed',
  refund: 'badge-refund',
  dispute: 'badge-dispute',
  0: 'badge-paid',
  1: 'badge-completed',
  2: 'badge-refund',
};

const PERIOD_OPTIONS = [
  { key: 'week' as const, label: '7 дней' },
  { key: 'month' as const, label: '30 дней' },
  { key: 'quarter' as const, label: '90 дней' },
] as const;

type Period = (typeof PERIOD_OPTIONS)[number]['key'];

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [dash, anal] = await Promise.all([
          dashboardApi.get(),
          analyticsApi.get({ period }),
        ]);
        if (!cancelled) {
          setDashData(dash);
          setAnalytics(anal);
        }
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Ошибка загрузки дашборда');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [period]);

  const chartData = useMemo(() => analytics?.chart ?? [], [analytics]);
  const recentOrders = useMemo(
    () => (dashData?.recent_orders ?? []) as Array<Record<string, unknown>>,
    [dashData],
  );
  const recentChats = useMemo(
    () => (dashData?.recent_chats ?? []) as Array<Record<string, unknown>>,
    [dashData],
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <SectionCard className="platform-dashboard-head">
          <div className="min-w-0">
            <h1 className="platform-page-title platform-dashboard-title">Дашборд</h1>
            <p className="platform-page-subtitle platform-dashboard-subtitle">
              Операционная сводка по выручке, заказам, лотам и коммуникациям.
            </p>
            <div className="platform-system-status mt-3">
              <span className="platform-system-status-dot" aria-hidden="true" />
              <span>Статус системы: в норме</span>
            </div>
          </div>
          <div className="platform-period-group" role="tablist" aria-label="Период аналитики">
            {PERIOD_OPTIONS.map(option => (
              <button
                key={option.key}
                type="button"
                className={`platform-period-btn${period === option.key ? ' active' : ''}`}
                onClick={() => setPeriod(option.key)}
                aria-pressed={period === option.key}
              >
                {option.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : (
          <>
            <KpiGrid>
              <KpiCard>
                <div className="flex items-center justify-between gap-2">
                  <span className="platform-kpi-meta">Общий баланс</span>
                  <Wallet size={16} color="var(--pf-accent)" />
                </div>
                <div className="text-[26px] font-extrabold tracking-tight">
                  {(dashData?.total_balance ?? 0).toLocaleString('ru-RU')} ₽
                </div>
                <div className="platform-kpi-meta">{dashData?.accounts_count ?? 0} аккаунта в управлении</div>
              </KpiCard>

              <KpiCard>
                <div className="flex items-center justify-between gap-2">
                  <span className="platform-kpi-meta">Заказов сегодня</span>
                  <ShoppingCart size={16} color="var(--pf-accent)" />
                </div>
                <div className="text-[26px] font-extrabold tracking-tight">{dashData?.orders_today ?? 0}</div>
                <div className="platform-kpi-meta">
                  {(dashData?.orders_today_revenue ?? 0).toLocaleString('ru-RU')} ₽ за день
                </div>
              </KpiCard>

              <KpiCard>
                <div className="flex items-center justify-between gap-2">
                  <span className="platform-kpi-meta">Активные лоты</span>
                  <Package size={16} color="var(--pf-accent)" />
                </div>
                <div className="text-[26px] font-extrabold tracking-tight">{dashData?.active_lots ?? 0}</div>
                <div className="platform-kpi-meta">опубликованных</div>
              </KpiCard>

              <KpiCard>
                <div className="flex items-center justify-between gap-2">
                  <span className="platform-kpi-meta">Чаты без ответа</span>
                  <MessageSquare
                    size={16}
                    color={(dashData?.unread_chats ?? 0) > 0 ? 'var(--pf-danger)' : 'var(--pf-accent)'}
                  />
                </div>
                <div className="text-[26px] font-extrabold tracking-tight">{dashData?.unread_chats ?? 0}</div>
                <div className="platform-kpi-meta">
                  {(dashData?.unread_chats ?? 0) > 0 ? 'Нужна реакция команды' : 'Все диалоги обработаны'}
                </div>
              </KpiCard>
            </KpiGrid>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <SectionCard>
                  <div className="platform-section-head">
                    <div className="inline-flex items-center gap-2 text-[15px] font-semibold">
                      <TrendingUp size={16} color="var(--pf-accent)" />
                      Динамика выручки
                    </div>
                    <span className="platform-kpi-meta">
                      Период: {PERIOD_OPTIONS.find(o => o.key === period)?.label}
                    </span>
                  </div>

                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -6, bottom: 2 }}>
                      <defs>
                        <linearGradient id="pfDashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(110,139,255,0.45)" />
                          <stop offset="100%" stopColor="rgba(110,139,255,0.02)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.09)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'var(--pf-text-dim)', fontSize: 11 }}
                        tickFormatter={value => String(value).slice(5)}
                        interval={Math.max(0, Math.floor(chartData.length / 6))}
                      />
                      <YAxis tick={{ fill: 'var(--pf-text-dim)', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--pf-surface-2)',
                          border: '1px solid var(--pf-border-strong)',
                          borderRadius: 10,
                          color: '#fff',
                        }}
                        formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--pf-accent)"
                        strokeWidth={2}
                        fill="url(#pfDashboardRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </SectionCard>

                <SectionCard>
                  <div className="platform-section-head">
                    <div className="inline-flex items-center gap-2 text-[15px] font-semibold">
                      <BarChart2 size={16} color="var(--pf-accent)" />
                      Последние заказы
                    </div>
                    <button
                      type="button"
                      className="platform-link-inline"
                      onClick={() => router.push('/platform/orders')}
                    >
                      Все заказы <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="platform-desktop-table">
                    <DataTableWrap className="tablet-dense-scroll">
                      <table className="platform-table" style={{ minWidth: 760 }}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Товар</th>
                            <th>Покупатель</th>
                            <th style={{ textAlign: 'right' }}>Сумма</th>
                            <th>Статус</th>
                            <th className="platform-col-tablet-hide" style={{ textAlign: 'right' }}>
                              Время
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order, idx) => (
                            <tr key={String(order.id ?? idx)}>
                              <td>{String(order.id ?? '')}</td>
                              <td
                                style={{
                                  maxWidth: 240,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {String(order.lot ?? order.title ?? '')}
                              </td>
                              <td>{String(order.buyer ?? '')}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                {Number(order.amount ?? 0)} ₽
                              </td>
                              <td>
                                <span
                                  className={
                                    statusClass[String(order.status ?? '')] ?? 'platform-chip'
                                  }
                                >
                                  {statusLabel[String(order.status ?? '')] ?? String(order.status ?? '')}
                                </span>
                              </td>
                              <td
                                className="platform-col-tablet-hide"
                                style={{ textAlign: 'right', color: 'var(--pf-text-dim)' }}
                              >
                                {formatTime(String(order.created_at ?? order.createdAt ?? ''))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DataTableWrap>
                  </div>

                  <div className="platform-mobile-cards">
                    {recentOrders.map((order, idx) => (
                      <article key={String(order.id ?? idx)} className="platform-mobile-card">
                        <div className="platform-mobile-card-head">
                          <strong>{String(order.id ?? '')}</strong>
                          <span className={statusClass[String(order.status ?? '')] ?? 'platform-chip'}>
                            {statusLabel[String(order.status ?? '')] ?? String(order.status ?? '')}
                          </span>
                        </div>
                        <div className="text-[13px] font-semibold">
                          {String(order.lot ?? order.title ?? '')}
                        </div>
                        <div className="platform-mobile-meta">
                          <span>Покупатель: {String(order.buyer ?? '')}</span>
                          <span>Сумма: {Number(order.amount ?? 0)} ₽</span>
                          <span>
                            Время: {formatTime(String(order.created_at ?? order.createdAt ?? ''))}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                  {recentOrders.length === 0 && <EmptyState>Нет последних заказов</EmptyState>}
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard>
                  <div className="platform-section-head">
                    <span className="text-[15px] font-semibold">Аккаунты</span>
                    <button
                      type="button"
                      className="platform-link-inline"
                      onClick={() => router.push('/platform/accounts')}
                    >
                      К разделу <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="grid gap-2">
                    {recentOrders.length === 0 && analytics?.by_accounts?.length === 0 && (
                      <EmptyState className="py-4">Нет данных по аккаунтам</EmptyState>
                    )}
                    {(analytics?.by_accounts ?? []).slice(0, 4).map((acc, idx) => (
                      <Panel key={idx} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-semibold">{acc.name}</p>
                          <span className="badge-active">online</span>
                        </div>
                        <p className="mt-1 text-[12px] text-[var(--pf-text-dim)]">
                          Выручка: {(acc.value ?? 0).toLocaleString('ru-RU')} ₽
                        </p>
                      </Panel>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="platform-section-head">
                    <span className="text-[15px] font-semibold">Последние диалоги</span>
                    <button
                      type="button"
                      className="platform-link-inline"
                      onClick={() => router.push('/platform/chats')}
                    >
                      Открыть чаты <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="grid gap-2">
                    {recentChats.length === 0 && (
                      <EmptyState className="py-4">Диалоги пока отсутствуют</EmptyState>
                    )}
                    {recentChats.map((chat, idx) => (
                      <Panel key={String(chat.id ?? idx)} className="p-3">
                        <div className="flex items-start gap-3">
                          <span className="platform-avatar">
                            {String(chat.buyer ?? '?')[0]?.toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <strong className="truncate text-[13px]">
                                {String(chat.buyer ?? '')}
                              </strong>
                              <span className="text-[11px] text-[var(--pf-text-dim)]">
                                {String(chat.last_time ?? chat.lastTime ?? '')}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-[12px] text-[var(--pf-text-dim)]">
                              {String(chat.last_message ?? chat.lastMessage ?? '')}
                            </p>
                          </div>
                        </div>
                        {Number(chat.unread ?? 0) > 0 && (
                          <span className="badge-dispute mt-2 inline-flex">
                            {Number(chat.unread)} непрочит.
                          </span>
                        )}
                      </Panel>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </section>

            <SectionCard className="platform-dashboard-summary">
              <p className="text-[13px] text-[var(--pf-text-dim)]">
                Стартовая зона контроля: ключевые сигналы, очереди действий и коммуникации.
              </p>
              <button
                type="button"
                className="platform-btn-secondary"
                onClick={() => router.push('/platform/analytics')}
              >
                Открыть глубокую аналитику
              </button>
            </SectionCard>
          </>
        )}
      </PageShell>
    </motion.div>
  );
}
