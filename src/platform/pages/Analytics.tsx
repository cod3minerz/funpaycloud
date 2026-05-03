'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { analyticsApi, AnalyticsData, authApi } from '@/lib/api';
import { DataTableWrap, KpiCard, KpiGrid, PageHeader, PageShell, PageTitle, RequestErrorState, SectionCard, ToolbarRow } from '@/platform/components/primitives';

type Period = 'week' | 'month' | 'quarter' | 'year';
const PERIOD_ITEMS: Period[] = ['week', 'month', 'quarter', 'year'];

const COLORS = [
  'var(--pf-accent)',
  'var(--pf-success)',
  'var(--pf-warning)',
  'var(--pf-danger)',
  'var(--pf-accent-2)',
  'var(--pf-text-dim)',
];

function pct(curr: number, prev: number) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('month');
  const [allowedPeriods, setAllowedPeriods] = useState<Set<Period>>(new Set(PERIOD_ITEMS));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [prev, setPrev] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(profile => {
        if (cancelled) return;
        const plan = String(profile.plan || '').toLowerCase();
        if (plan === 'lite' || plan === 'trial') {
          setAllowedPeriods(new Set<Period>(['week']));
          setPeriod(prev => (prev === 'week' ? prev : 'week'));
          return;
        }
        setAllowedPeriods(new Set<Period>(PERIOD_ITEMS));
      })
      .catch(() => {
        if (cancelled) return;
        setAllowedPeriods(new Set<Period>(PERIOD_ITEMS));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const prevMap: Record<Period, Period> = { week: 'week', month: 'week', quarter: 'month', year: 'quarter' };
    setLoading(true);
    setLoadError(null);
    Promise.all([analyticsApi.get({ period }), analyticsApi.get({ period: prevMap[period] })])
      .then(([current, previous]) => {
        if (cancelled) return;
        setData(current);
        setPrev(previous);
      })
      .catch(err => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Ошибка загрузки аналитики';
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

  const chart = useMemo(() => (Array.isArray(data?.chart) ? data!.chart : []), [data]);
  const topProducts = useMemo(() => (Array.isArray(data?.top_products) ? data!.top_products : []), [data]);
  const byAccounts = useMemo(() => (Array.isArray(data?.by_accounts) ? data!.by_accounts : []), [data]);
  const topBuyers = useMemo(() => (Array.isArray(data?.top_buyers) ? data!.top_buyers : []), [data]);
  const hourly = useMemo(() => (Array.isArray(data?.hourly) ? data!.hourly : []), [data]);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Аналитика" />
          <ToolbarRow>
            {PERIOD_ITEMS.map(item => (
              <button
                key={item}
                className={period === item ? 'platform-btn-primary' : 'platform-btn-secondary'}
                disabled={!allowedPeriods.has(item)}
                onClick={() => {
                  if (!allowedPeriods.has(item)) {
                    toast.info('Этот период недоступен на вашем тарифе');
                    return;
                  }
                  setPeriod(item);
                }}
                style={!allowedPeriods.has(item) ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
              >
                {item === 'week' ? 'Неделя' : item === 'month' ? 'Месяц' : item === 'quarter' ? 'Квартал' : 'Год'}
              </button>
            ))}
          </ToolbarRow>
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
                <div className="platform-kpi-meta">Выручка</div>
                <strong className="text-[26px]">{Number(data?.revenue || 0).toLocaleString('ru-RU')} ₽</strong>
                <span className="platform-kpi-meta">{pct(Number(data?.revenue || 0), Number(prev?.revenue || 0))}% к прошлому периоду</span>
              </KpiCard>
              <KpiCard>
                <div className="platform-kpi-meta">Заказов</div>
                <strong className="text-[26px]">{Number(data?.orders_count || 0)}</strong>
                <span className="platform-kpi-meta">{pct(Number(data?.orders_count || 0), Number(prev?.orders_count || 0))}% к прошлому периоду</span>
              </KpiCard>
              <KpiCard>
                <div className="platform-kpi-meta">Средний чек</div>
                <strong className="text-[26px]">{Number(data?.avg_check || 0).toLocaleString('ru-RU')} ₽</strong>
              </KpiCard>
              <KpiCard>
                <div className="platform-kpi-meta">Конверсия</div>
                <strong className="text-[26px]">{Number(data?.conversion || 0)}%</strong>
              </KpiCard>
            </KpiGrid>

            <div className="platform-stack lg:grid lg:grid-cols-[1.7fr_1fr] lg:gap-4">
              <SectionCard>
                <h2 className="m-0 text-[15px] font-bold">Динамика выручки</h2>
                <div className="mt-3 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--pf-border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₽`, 'Выручка']} />
                      <Area type="monotone" dataKey="revenue" stroke="var(--pf-accent)" fill="var(--pf-accent-soft)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard>
                <h2 className="m-0 text-[15px] font-bold">По аккаунтам</h2>
                <div className="mt-3 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byAccounts} dataKey="revenue" nameKey="username" outerRadius={84}>
                        {byAccounts.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₽`, 'Выручка']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            <div className="platform-stack lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-4">
              <SectionCard>
                <h2 className="m-0 text-[15px] font-bold">Топ товаров</h2>
                <div className="mt-3 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--pf-border)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={180} tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₽`, 'Выручка']} />
                      <Bar dataKey="revenue" fill="var(--pf-accent)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard>
                <h2 className="m-0 text-[15px] font-bold">Активность по часам</h2>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {hourly.map(point => (
                    <div key={point.hour} className="rounded-[8px] border border-[color-mix(in_srgb,var(--pf-accent)_35%,transparent)] p-2 text-center">
                      <div className="text-[11px] text-[var(--pf-text-dim)]">{point.hour}:00</div>
                      <div className="text-[13px] font-bold">{point.orders}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            <SectionCard className="p-0">
              <div className="platform-desktop-table">
                <DataTableWrap>
                  <table className="platform-table">
                    <thead>
                      <tr>
                        <th>Покупатель</th>
                        <th className="text-right">Заказов</th>
                        <th className="text-right">Выручка</th>
                        <th className="text-right">Последний заказ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topBuyers.map(row => (
                        <tr key={row.username}>
                          <td>{row.username}</td>
                          <td className="text-right">{row.orders}</td>
                          <td className="text-right">{Number(row.revenue || 0).toLocaleString('ru-RU')} ₽</td>
                          <td className="text-right">{row.last_order}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>
            </SectionCard>
          </>
        )}
      </PageShell>
    </motion.div>
  );
}
