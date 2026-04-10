'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart2, DollarSign, Loader2, ShoppingCart, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { analyticsApi, AnalyticsData } from '@/lib/api';
import {
  KpiCard,
  KpiGrid,
  PageHeader,
  PageShell,
  PageTitle,
  Panel,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

const CHART_COLORS = ['#5b8cff', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#f97316'];

type Period = 'week' | 'month' | 'quarter' | 'year';

function pctChange(curr: number, prev: number) {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function KpiChange({
  label,
  value,
  prev,
  icon,
  suffix = '',
}: {
  label: string;
  value: number;
  prev: number;
  icon: React.ReactNode;
  suffix?: string;
}) {
  const pct = pctChange(value, prev);
  const positive = pct >= 0;
  return (
    <KpiCard>
      <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)]">
          {icon}
        </span>
        {label}
      </div>
      <strong className="text-[26px]">
        {suffix === '₽' ? value.toLocaleString('ru-RU') : value}{suffix}
      </strong>
      <div className="inline-flex items-center gap-1 text-[12px]">
        {positive ? <TrendingUp size={12} color="#4ade80" /> : <TrendingDown size={12} color="#fb7185" />}
        <span className={positive ? 'text-[#4ade80]' : 'text-[#fb7185]'}>{positive ? '+' : ''}{pct}%</span>
        <span className="text-[var(--pf-text-dim)]">vs предыдущий период</span>
      </div>
    </KpiCard>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('month');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [prevData, setPrevData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const PREV_PERIOD: Record<Period, Period> = {
      week: 'week',
      month: 'week',
      quarter: 'month',
      year: 'quarter',
    };

    Promise.all([
      analyticsApi.get({ period }),
      analyticsApi.get({ period: PREV_PERIOD[period] }),
    ])
      .then(([curr, prev]) => {
        if (!cancelled) { setData(curr); setPrevData(prev); }
      })
      .catch(err => { if (!cancelled) toast.error(err instanceof Error ? err.message : 'Ошибка загрузки аналитики'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [period]);

  const chartData = useMemo(() => data?.chart ?? [], [data]);
  const topProducts = useMemo(() => data?.top_products ?? [], [data]);
  const topBuyers = useMemo(() => data?.top_buyers ?? [], [data]);
  const byAccounts = useMemo(() => data?.by_accounts ?? [], [data]);
  const hourActivity = useMemo(() => data?.hourly ?? [], [data]);

  const buyerPie = [
    { name: 'Новые', value: 62 },
    { name: 'Повторные', value: 38 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Аналитика"
            subtitle="Премиальный аналитический слой: выручка, конверсия, топ-товары и активность без визуального перегруза."
          />
          <ToolbarRow>
            {(['week', 'month', 'quarter', 'year'] as Period[]).map(item => (
              <button
                key={item}
                className={period === item ? 'platform-btn-primary' : 'platform-btn-secondary'}
                style={{ minHeight: 34 }}
                onClick={() => setPeriod(item)}
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
        ) : (
          <>
            <KpiGrid>
              <KpiChange
                label="Выручка"
                value={data?.revenue ?? 0}
                prev={prevData?.revenue ?? 0}
                suffix="₽"
                icon={<DollarSign size={14} color="#60a5fa" />}
              />
              <KpiChange
                label="Заказов"
                value={data?.orders_count ?? 0}
                prev={prevData?.orders_count ?? 0}
                icon={<ShoppingCart size={14} color="#60a5fa" />}
              />
              <KpiChange
                label="Средний чек"
                value={data?.avg_check ?? 0}
                prev={prevData?.avg_check ?? 0}
                suffix="₽"
                icon={<BarChart2 size={14} color="#60a5fa" />}
              />
              <KpiCard>
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)]">
                    <Users size={14} color="#60a5fa" />
                  </span>
                  Конверсия
                </div>
                <strong className="text-[26px]">{data?.conversion ?? 0}%</strong>
                <span className="platform-kpi-meta">Диалоги в заказы</span>
              </KpiCard>
            </KpiGrid>

            <div className="platform-stack lg:grid lg:grid-cols-[1.7fr_1fr] lg:gap-4">
              <SectionCard>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="m-0 text-[15px] font-bold">Динамика выручки</h2>
                  <div className="inline-flex gap-2">
                    <button className={chartType === 'area' ? 'platform-btn-primary' : 'platform-btn-secondary'} style={{ minHeight: 32 }} onClick={() => setChartType('area')}>Линия</button>
                    <button className={chartType === 'bar' ? 'platform-btn-primary' : 'platform-btn-secondary'} style={{ minHeight: 32 }} onClick={() => setChartType('bar')}>Бар</button>
                  </div>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(96,165,250,0.5)" />
                            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                        <XAxis dataKey="date" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} tickFormatter={v => String(v).slice(5)} />
                        <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.46)', borderRadius: 10, color: '#fff' }} formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₽`, 'Выручка']} />
                        <Area type="monotone" dataKey="revenue" stroke="#5b8cff" fill="url(#analytics-area)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                        <XAxis dataKey="date" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} tickFormatter={v => String(v).slice(5)} />
                        <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.46)', borderRadius: 10, color: '#fff' }} formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₽`, 'Выручка']} />
                        <Bar dataKey="revenue" fill="#5b8cff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard>
                <h2 className="m-0 text-[15px] font-bold">По аккаунтам</h2>
                <div className="mt-3 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byAccounts} cx="50%" cy="50%" innerRadius={56} outerRadius={84} paddingAngle={4} dataKey="value">
                        {byAccounts.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.46)', borderRadius: 10, color: '#fff' }} formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₽`]} />
                      <Legend wrapperStyle={{ color: 'var(--pf-text-muted)', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            <div className="platform-stack lg:grid lg:grid-cols-[1.7fr_1fr] lg:gap-4">
              <SectionCard>
                <h2 className="m-0 text-[15px] font-bold">Топ товаров по выручке</h2>
                <div className="mt-3 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ left: 12, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#fff', fontSize: 11 }} width={150} />
                      <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.46)', borderRadius: 10, color: '#fff' }} formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₽`, 'Выручка']} />
                      <Bar dataKey="value" fill="#5b8cff" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard>
                <h2 className="m-0 text-[15px] font-bold">Активность по часам</h2>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {hourActivity.map(({ hour, level }) => (
                    <div
                      key={hour}
                      title={`${hour}:00 — активность ${Math.round(Number(level) * 100)}%`}
                      className="h-9 rounded-[8px] border border-[rgba(91,140,255,0.24)] text-center text-[11px] font-semibold leading-9"
                      style={{
                        background: `rgba(91,140,255,${0.1 + Number(level) * 0.7})`,
                        color: Number(level) > 0.5 ? '#fff' : 'var(--pf-text-muted)',
                      }}
                    >
                      {hour}
                    </div>
                  ))}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-[var(--pf-text-dim)]">
                  <span className="inline-block h-[8px] w-[140px] rounded-[999px] bg-gradient-to-r from-[rgba(91,140,255,0.16)] to-[rgba(91,140,255,0.86)]" />
                  Низкая → высокая
                </div>
              </SectionCard>
            </div>

            <div className="platform-stack lg:grid lg:grid-cols-[1fr_1.7fr] lg:gap-4">
              <SectionCard>
                <h2 className="m-0 text-[15px] font-bold">Новые vs повторные</h2>
                <div className="mt-3 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={buyerPie} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value">
                        <Cell fill="#5b8cff" />
                        <Cell fill="#22c55e" />
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.46)', borderRadius: 10, color: '#fff' }} formatter={(v: number) => [`${v}%`]} />
                      <Legend wrapperStyle={{ color: 'var(--pf-text-muted)', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard className="p-0">
                <Panel className="m-4 p-0">
                  <h2 className="m-0 px-4 pt-4 text-[15px] font-bold">Топ покупатели</h2>
                  <div className="platform-desktop-table">
                    <div className="platform-table-wrap">
                      <table className="platform-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Покупатель</th>
                            <th style={{ textAlign: 'right' }}>Заказов</th>
                            <th style={{ textAlign: 'right' }}>Сумма</th>
                            <th style={{ textAlign: 'right' }}>Последний</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topBuyers.map((buyer, idx) => (
                            <tr key={buyer.username}>
                              <td style={{ color: idx < 3 ? '#fbbf24' : 'var(--pf-text-muted)', fontWeight: 800 }}>{idx + 1}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <span className="platform-avatar !h-7 !w-7 !text-[11px]">{buyer.username[0]?.toUpperCase()}</span>
                                  <span className="font-semibold">{buyer.username}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>{buyer.orders}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>{buyer.total.toLocaleString('ru-RU')} ₽</td>
                              <td style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>{new Date(buyer.last_order).toLocaleDateString('ru-RU')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="platform-mobile-cards">
                    {topBuyers.map((buyer, idx) => (
                      <article key={buyer.username} className="platform-mobile-card">
                        <div className="platform-mobile-card-head">
                          <div className="inline-flex items-center gap-2">
                            <span className="platform-avatar !h-7 !w-7 !text-[11px]">{buyer.username[0]?.toUpperCase()}</span>
                            <strong>{buyer.username}</strong>
                          </div>
                          <span className="platform-chip !min-h-[22px]">#{idx + 1}</span>
                        </div>
                        <div className="platform-mobile-meta">
                          <span>Заказов: {buyer.orders}</span>
                          <span className="font-semibold text-[#4ade80]">Сумма: {buyer.total.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </Panel>
              </SectionCard>
            </div>

            <SectionCard>
              <ToolbarRow className="justify-between">
                <div className="text-[13px] text-[var(--pf-text-muted)]">Топ товаров: {topProducts.length}</div>
                <span className="platform-chip">Период: {period}</span>
              </ToolbarRow>
            </SectionCard>
          </>
        )}
      </PageShell>
    </motion.div>
  );
}
