import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Users, BarChart2 } from 'lucide-react';
import { salesData, orders, lots, chats, topBuyers } from '@/platform/data/demoData';

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--pf-surface)',
  border: '1px solid var(--pf-border)',
  borderRadius: '12px',
  padding: '20px',
};

const CHART_COLORS = ['var(--pf-accent)', '#7c3aed', '#22c55e', '#eab308', '#ef4444', '#f97316'];

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

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('month');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const days = periodDays[period];

  const currentData = useMemo(() => salesData.slice(Math.max(0, salesData.length - days)), [days]);
  const prevData = useMemo(() => salesData.slice(Math.max(0, salesData.length - 2 * days), salesData.length - days), [days]);

  const totalRevenue = currentData.reduce((s, d) => s + d.revenue, 0);
  const prevRevenue = prevData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = currentData.reduce((s, d) => s + d.orders, 0);
  const prevOrders = prevData.reduce((s, d) => s + d.orders, 0);
  const avgCheck = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const prevAvgCheck = prevOrders ? Math.round(prevRevenue / prevOrders) : 0;
  const conversionRate = chats.length > 0 ? Math.round((orders.length / (chats.length + orders.length)) * 100) : 0;

  // Account distribution
  const acc1Rev = orders.filter(o => o.accountId === 'acc1').reduce((s, o) => s + o.amount, 0);
  const acc2Rev = orders.filter(o => o.accountId === 'acc2').reduce((s, o) => s + o.amount, 0);
  const pieData = [
    { name: 'tonminerz', value: acc1Rev },
    { name: 'shop_pro', value: acc2Rev },
  ];

  // Top lots
  const lotRevMap: Record<string, number> = {};
  orders.forEach(o => {
    lotRevMap[o.lot] = (lotRevMap[o.lot] ?? 0) + o.amount;
  });
  const topLots = Object.entries(lotRevMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + '…' : name, value }));

  // Activity by hour (mock)
  const hourActivity = Array.from({ length: 24 }, (_, h) => {
    const base = h >= 10 && h <= 22 ? 0.4 + Math.random() * 0.6 : Math.random() * 0.3;
    return { hour: h, level: Math.min(1, base) };
  });

  // New vs repeat buyers (mock)
  const buyerPie = [
    { name: 'Новые', value: 62 },
    { name: 'Повторные', value: 38 },
  ];

  function KpiCard({ label, value, prev, icon, suffix = '' }: { label: string; value: number; prev: number; icon: React.ReactNode; suffix?: string }) {
    const pct = pctChange(value, prev);
    const positive = pct >= 0;
    return (
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(59,130,246,0.18)', borderRadius: '8px', padding: '7px' }}>{icon}</div>
          <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>{label}</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
          {typeof value === 'number' && suffix === '₽' ? value.toLocaleString('ru-RU') : value}{suffix}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
          {positive ? <TrendingUp size={13} color="#22c55e" /> : <TrendingDown size={13} color="#ef4444" />}
          <span style={{ color: positive ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{positive ? '+' : ''}{pct}%</span>
          <span style={{ color: 'var(--pf-text-muted)' }}>vs предыдущий период</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'var(--font-sans)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Аналитика</h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['week', 'month', 'quarter', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '7px 14px',
                borderRadius: '7px',
                border: period === p ? 'none' : '1px solid rgba(96,165,250,0.28)',
                background: period === p ? 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : p === 'quarter' ? 'Квартал' : 'Год'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard label="Выручка" value={totalRevenue} prev={prevRevenue} suffix="₽" icon={<DollarSign size={16} color="var(--pf-accent)" />} />
        <KpiCard label="Заказов" value={totalOrders} prev={prevOrders} suffix="" icon={<ShoppingCart size={16} color="var(--pf-accent)" />} />
        <KpiCard label="Средний чек" value={avgCheck} prev={prevAvgCheck} suffix="₽" icon={<BarChart2 size={16} color="var(--pf-accent)" />} />
        <div style={CARD_STYLE}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'rgba(59,130,246,0.18)', borderRadius: '8px', padding: '7px' }}>
              <Users size={16} color="var(--pf-accent)" />
            </div>
            <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Конверсия</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>{conversionRate}%</div>
          <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px' }}>чаты / заказы</div>
        </div>
      </div>

      {/* Row 1: Revenue chart + Account pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '16px' }}>
        <div style={CARD_STYLE}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Динамика выручки</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['area', 'bar'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: chartType === t ? 'none' : '1px solid rgba(96,165,250,0.28)', background: chartType === t ? 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  {t === 'area' ? 'Линейный' : 'Столбчатый'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {chartType === 'area' ? (
              <AreaChart data={currentData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(96,165,250,0.44)" />
                    <stop offset="100%" stopColor="rgba(96,165,250,0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.12)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} tickFormatter={v => v.slice(5)} interval={Math.floor(currentData.length / 6)} />
                <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', color: '#fff' }} formatter={(v: number) => [`${v.toLocaleString('ru-RU')}₽`, 'Выручка']} />
                <Area type="monotone" dataKey="revenue" stroke="var(--pf-accent)" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.12)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} tickFormatter={v => v.slice(5)} interval={Math.floor(currentData.length / 6)} />
                <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', color: '#fff' }} formatter={(v: number) => [`${v.toLocaleString('ru-RU')}₽`, 'Выручка']} />
                <Bar dataKey="revenue" fill="var(--pf-accent)" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>По аккаунтам</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', color: '#fff' }} formatter={(v: number) => [`${v.toLocaleString('ru-RU')}₽`]} />
              <Legend wrapperStyle={{ color: 'var(--pf-text-muted)', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Top lots + Activity heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '16px' }}>
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>Топ товаров по выручке</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topLots} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.12)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#fff', fontSize: 11 }} width={140} />
              <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', color: '#fff' }} formatter={(v: number) => [`${v.toLocaleString('ru-RU')}₽`, 'Выручка']} />
              <Bar dataKey="value" fill="var(--pf-accent)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>Активность по часам</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
            {hourActivity.map(({ hour, level }) => (
              <div key={hour} style={{ position: 'relative' }}>
                <div
                  title={`${hour}:00 — активность ${Math.round(level * 100)}%`}
                  style={{
                    background: `rgba(91,140,255,${0.1 + level * 0.75})`,
                    borderRadius: '6px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: level > 0.5 ? '#fff' : 'var(--pf-text-muted)',
                    fontWeight: 600,
                    cursor: 'default',
                    border: '1px solid rgba(59,130,246,0.18)',
                  }}
                >
                  {hour}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ height: '10px', flex: 1, background: 'linear-gradient(to right, rgba(59,130,246,0.12), rgba(91,140,255,0.82))', borderRadius: '4px' }} />
            <span style={{ color: 'var(--pf-text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>Низкая → Высокая</span>
          </div>
        </div>
      </div>

      {/* Row 3: New vs repeat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>Новые vs Повторные</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={buyerPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                <Cell fill="var(--pf-accent)" />
                <Cell fill="#22c55e" />
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', color: '#fff' }} formatter={(v: number) => [`${v}%`]} />
              <Legend wrapperStyle={{ color: 'var(--pf-text-muted)', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top buyers table */}
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '14px' }}>Топ покупатели</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--pf-text-muted)', borderBottom: '1px solid rgba(59,130,246,0.18)' }}>
                <th style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 500 }}>#</th>
                <th style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 500 }}>Покупатель</th>
                <th style={{ textAlign: 'center', padding: '7px 8px', fontWeight: 500 }}>Заказов</th>
                <th style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 500 }}>Сумма</th>
                <th style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 500 }}>Последний</th>
              </tr>
            </thead>
            <tbody>
              {topBuyers.map((b, i) => (
                <tr key={b.username} style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                  <td style={{ padding: '9px 8px', color: i < 3 ? '#eab308' : 'var(--pf-text-muted)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: '9px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {b.avatar}
                      </div>
                      <span style={{ fontWeight: 600 }}>{b.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: 600 }}>{b.orders}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>{b.total.toLocaleString('ru-RU')}₽</td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', color: 'var(--pf-text-muted)' }}>{new Date(b.lastOrder).toLocaleDateString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
