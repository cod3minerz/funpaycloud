import React, { useMemo, useState } from 'react';
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
import { BarChart2, DollarSign, ShoppingCart, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { chats, lots, orders, salesData, topBuyers } from '@/platform/data/demoData';
import { KpiCard, KpiGrid, PageHeader, PageShell, PageTitle, Panel, SectionCard, ToolbarRow } from '@/platform/components/primitives';

const CHART_COLORS = ['#5b8cff', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#f97316'];

type Period = 'week' | 'month' | 'quarter' | 'year';

const periodDays: Record<Period, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

function pctChange(curr: number, prev: number) {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function deterministicLevel(hour: number) {
  const base = hour >= 10 && hour <= 22 ? 0.52 : 0.2;
  const mod = ((hour * 37) % 11) / 20;
  return Math.min(1, base + mod);
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
        {suffix === '₽' ? value.toLocaleString('ru-RU') : value}
        {suffix}
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

  const days = periodDays[period];

  const currentData = useMemo(() => salesData.slice(Math.max(0, salesData.length - days)), [days]);
  const prevData = useMemo(
    () => salesData.slice(Math.max(0, salesData.length - 2 * days), salesData.length - days),
    [days],
  );

  const totalRevenue = currentData.reduce((sum, item) => sum + item.revenue, 0);
  const prevRevenue = prevData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = currentData.reduce((sum, item) => sum + item.orders, 0);
  const prevOrders = prevData.reduce((sum, item) => sum + item.orders, 0);
  const avgCheck = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const prevAvgCheck = prevOrders ? Math.round(prevRevenue / prevOrders) : 0;
  const conversionRate = chats.length > 0 ? Math.round((orders.length / (chats.length + orders.length)) * 100) : 0;

  const accountRevenue = useMemo(() => {
    const acc1 = orders.filter(order => order.accountId === 'acc1').reduce((sum, order) => sum + order.amount, 0);
    const acc2 = orders.filter(order => order.accountId === 'acc2').reduce((sum, order) => sum + order.amount, 0);
    return [
      { name: 'tonminerz', value: acc1 },
      { name: 'shop_pro', value: acc2 },
    ];
  }, []);

  const topLots = useMemo(() => {
    const lotRevMap: Record<string, number> = {};
    orders.forEach(order => {
      lotRevMap[order.lot] = (lotRevMap[order.lot] ?? 0) + order.amount;
    });
    return Object.entries(lotRevMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({
        name: name.length > 22 ? `${name.slice(0, 22)}…` : name,
        value,
      }));
  }, []);

  const hourActivity = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => ({
        hour,
        level: deterministicLevel(hour),
      })),
    [],
  );

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

        <KpiGrid>
          <KpiChange label="Выручка" value={totalRevenue} prev={prevRevenue} suffix="₽" icon={<DollarSign size={14} color="#60a5fa" />} />
          <KpiChange label="Заказов" value={totalOrders} prev={prevOrders} icon={<ShoppingCart size={14} color="#60a5fa" />} />
          <KpiChange label="Средний чек" value={avgCheck} prev={prevAvgCheck} suffix="₽" icon={<BarChart2 size={14} color="#60a5fa" />} />
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)]">
                <Users size={14} color="#60a5fa" />
              </span>
              Конверсия
            </div>
            <strong className="text-[26px]">{conversionRate}%</strong>
            <span className="platform-kpi-meta">Диалоги в заказы</span>
          </KpiCard>
        </KpiGrid>

        <div className="platform-stack lg:grid lg:grid-cols-[1.7fr_1fr] lg:gap-4">
          <SectionCard>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="m-0 text-[15px] font-bold">Динамика выручки</h2>
              <div className="inline-flex gap-2">
                <button
                  className={chartType === 'area' ? 'platform-btn-primary' : 'platform-btn-secondary'}
                  style={{ minHeight: 32 }}
                  onClick={() => setChartType('area')}
                >
                  Линия
                </button>
                <button
                  className={chartType === 'bar' ? 'platform-btn-primary' : 'platform-btn-secondary'}
                  style={{ minHeight: 32 }}
                  onClick={() => setChartType('bar')}
                >
                  Бар
                </button>
              </div>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={currentData}>
                    <defs>
                      <linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(96,165,250,0.5)" />
                        <stop offset="100%" stopColor="rgba(96,165,250,0)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} tickFormatter={value => value.slice(5)} />
                    <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--pf-surface)',
                        border: '1px solid rgba(96,165,250,0.46)',
                        borderRadius: 10,
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#5b8cff" fill="url(#analytics-area)" strokeWidth={2} />
                  </AreaChart>
                ) : (
                  <BarChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} tickFormatter={value => value.slice(5)} />
                    <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--pf-surface)',
                        border: '1px solid rgba(96,165,250,0.46)',
                        borderRadius: 10,
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                    />
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
                  <Pie data={accountRevenue} cx="50%" cy="50%" innerRadius={56} outerRadius={84} paddingAngle={4} dataKey="value">
                    {accountRevenue.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--pf-surface)',
                      border: '1px solid rgba(96,165,250,0.46)',
                      borderRadius: 10,
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`]}
                  />
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
                <BarChart data={topLots} layout="vertical" margin={{ left: 12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#fff', fontSize: 11 }} width={150} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--pf-surface)',
                      border: '1px solid rgba(96,165,250,0.46)',
                      borderRadius: 10,
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                  />
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
                  title={`${hour}:00 — активность ${Math.round(level * 100)}%`}
                  className="h-9 rounded-[8px] border border-[rgba(91,140,255,0.24)] text-center text-[11px] font-semibold leading-9"
                  style={{
                    background: `rgba(91,140,255,${0.1 + level * 0.7})`,
                    color: level > 0.5 ? '#fff' : 'var(--pf-text-muted)',
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
                  <Tooltip
                    contentStyle={{
                      background: 'var(--pf-surface)',
                      border: '1px solid rgba(96,165,250,0.46)',
                      borderRadius: 10,
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                  <Legend wrapperStyle={{ color: 'var(--pf-text-muted)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard className="p-0">
            <Panel className="m-4 p-0">
              <h2 className="m-0 px-4 pt-4 text-[15px] font-bold">Топ покупатели</h2>
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
                            <span className="platform-avatar !h-7 !w-7 !text-[11px]">{buyer.avatar}</span>
                            <span className="font-semibold">{buyer.username}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{buyer.orders}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>
                          {buyer.total.toLocaleString('ru-RU')} ₽
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>
                          {new Date(buyer.lastOrder).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </SectionCard>
        </div>

        <SectionCard>
          <ToolbarRow className="justify-between">
            <div className="text-[13px] text-[var(--pf-text-muted)]">Активных лотов: {lots.filter(lot => lot.status === 'active').length}</div>
            <span className="platform-chip">Период: {period}</span>
          </ToolbarRow>
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
