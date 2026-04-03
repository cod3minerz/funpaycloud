'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { salesData, topBuyers } from '@/platform/data/demoData';
import { P2Panel, P2PageHeader, P2PrimaryAction } from '@/platform2/components/primitives';

type Period = 'week' | 'month' | 'quarter';

const periodMap: Record<Period, number> = {
  week: 7,
  month: 30,
  quarter: 90,
};

export default function Analytics2() {
  const [period, setPeriod] = useState<Period>('month');

  const periodData = useMemo(() => salesData.slice(-periodMap[period]), [period]);
  const totalRevenue = periodData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = periodData.reduce((sum, item) => sum + item.orders, 0);

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader
        title="Analytics"
        description="Revenue and order intelligence for strategic decisions."
        actions={
          <div className="inline-flex items-center gap-2">
            <P2PrimaryAction className={period === 'week' ? 'px-3' : 'px-3 opacity-70'} onClick={() => setPeriod('week')}>7D</P2PrimaryAction>
            <P2PrimaryAction className={period === 'month' ? 'px-3' : 'px-3 opacity-70'} onClick={() => setPeriod('month')}>30D</P2PrimaryAction>
            <P2PrimaryAction className={period === 'quarter' ? 'px-3' : 'px-3 opacity-70'} onClick={() => setPeriod('quarter')}>90D</P2PrimaryAction>
          </div>
        }
      />

      <div className="p2-kpi-grid">
        <article className="p2-kpi">
          <p className="p2-kpi-label">Revenue</p>
          <p className="p2-kpi-value">{totalRevenue.toLocaleString('ru-RU')} ₽</p>
        </article>
        <article className="p2-kpi">
          <p className="p2-kpi-label">Orders</p>
          <p className="p2-kpi-value">{totalOrders.toLocaleString('ru-RU')}</p>
        </article>
        <article className="p2-kpi">
          <p className="p2-kpi-label">Avg check</p>
          <p className="p2-kpi-value">{Math.round(totalRevenue / Math.max(totalOrders, 1)).toLocaleString('ru-RU')} ₽</p>
        </article>
        <article className="p2-kpi">
          <p className="p2-kpi-label">Top buyer</p>
          <p className="p2-kpi-value">{topBuyers[0]?.username ?? '—'}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <P2Panel title="Revenue trend" subtitle="Area chart by day">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={periodData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.36)" />
                    <stop offset="100%" stopColor="rgba(59,130,246,0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,138,165,0.2)" />
                <XAxis dataKey="date" tick={{ fill: '#7d8aa5', fontSize: 11 }} tickFormatter={value => value.slice(5)} />
                <YAxis tick={{ fill: '#7d8aa5', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--p2-surface-2)',
                    border: '1px solid var(--p2-border)',
                    borderRadius: 10,
                    color: '#e5e7eb',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#analyticsArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </P2Panel>

        <P2Panel title="Top buyers" subtitle="Best users by total spend">
          <div className="space-y-2">
            {topBuyers.slice(0, 6).map(buyer => (
              <div key={buyer.username} className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm text-white">{buyer.username}</strong>
                  <span className="p2-chip">{buyer.orders} orders</span>
                </div>
                <p className="text-xs text-[var(--p2-text-dim)] mt-1">{buyer.total.toLocaleString('ru-RU')} ₽ total</p>
              </div>
            ))}
          </div>
        </P2Panel>
      </div>

      <P2Panel title="Orders volume" subtitle="Bar chart by day">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={periodData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,138,165,0.2)" />
              <XAxis dataKey="date" tick={{ fill: '#7d8aa5', fontSize: 11 }} tickFormatter={value => value.slice(5)} />
              <YAxis tick={{ fill: '#7d8aa5', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--p2-surface-2)',
                  border: '1px solid var(--p2-border)',
                  borderRadius: 10,
                  color: '#e5e7eb',
                }}
              />
              <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </P2Panel>
    </div>
  );
}
