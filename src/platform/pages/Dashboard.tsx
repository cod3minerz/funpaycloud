import React, { useMemo, useState } from 'react';
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
  MessageSquare,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { accounts, chats, lots, orders, salesData } from '@/platform/data/demoData';
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
};

const statusClass: Record<string, string> = {
  paid: 'badge-paid',
  completed: 'badge-completed',
  refund: 'badge-refund',
  dispute: 'badge-dispute',
};

const PERIOD_OPTIONS = [
  { key: 7, label: '7 дней' },
  { key: 30, label: '30 дней' },
  { key: 90, label: '90 дней' },
] as const;

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const chartData = useMemo(() => salesData.slice(salesData.length - period), [period]);
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = useMemo(() => orders.filter(order => order.createdAt.startsWith(today)), [today]);
  const totalBalance = useMemo(() => accounts.reduce((sum, account) => sum + account.balance, 0), []);
  const activeLots = useMemo(() => lots.filter(lot => lot.status === 'active').length, []);
  const unreadChats = useMemo(() => chats.filter(chat => chat.unread > 0).length, []);
  const recentOrders = useMemo(() => orders.slice(0, 5), []);
  const recentChats = useMemo(() => chats.slice(0, 4), []);

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

        <KpiGrid>
          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Общий баланс</span>
              <Wallet size={16} color="var(--pf-accent)" />
            </div>
            <div className="text-[26px] font-extrabold tracking-tight">{totalBalance.toLocaleString('ru-RU')} ₽</div>
            <div className="platform-kpi-meta">{accounts.length} аккаунта в управлении</div>
          </KpiCard>

          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Заказов сегодня</span>
              <ShoppingCart size={16} color="var(--pf-accent)" />
            </div>
            <div className="text-[26px] font-extrabold tracking-tight">{todayOrders.length}</div>
            <div className="platform-kpi-meta">
              {todayOrders.reduce((sum, order) => sum + order.amount, 0).toLocaleString('ru-RU')} ₽ за день
            </div>
          </KpiCard>

          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Активные лоты</span>
              <Package size={16} color="var(--pf-accent)" />
            </div>
            <div className="text-[26px] font-extrabold tracking-tight">{activeLots}</div>
            <div className="platform-kpi-meta">из {lots.length} опубликованных</div>
          </KpiCard>

          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Чаты без ответа</span>
              <MessageSquare size={16} color={unreadChats > 0 ? 'var(--pf-danger)' : 'var(--pf-accent)'} />
            </div>
            <div className="text-[26px] font-extrabold tracking-tight">{unreadChats}</div>
            <div className="platform-kpi-meta">{unreadChats > 0 ? 'Нужна реакция команды' : 'Все диалоги обработаны'}</div>
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
                <span className="platform-kpi-meta">Период: {PERIOD_OPTIONS.find(option => option.key === period)?.label}</span>
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
                    tickFormatter={value => value.slice(5)}
                    interval={Math.floor(chartData.length / 6)}
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
                  <Area type="monotone" dataKey="revenue" stroke="var(--pf-accent)" strokeWidth={2} fill="url(#pfDashboardRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard>
              <div className="platform-section-head">
                <div className="inline-flex items-center gap-2 text-[15px] font-semibold">
                  <BarChart2 size={16} color="var(--pf-accent)" />
                  Последние заказы
                </div>
                <button type="button" className="platform-link-inline" onClick={() => router.push('/platform/orders')}>
                  Все заказы <ArrowRight size={14} />
                </button>
              </div>

              <div className="platform-desktop-table">
                <DataTableWrap>
                  <table className="platform-table" style={{ minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Товар</th>
                        <th>Покупатель</th>
                        <th style={{ textAlign: 'right' }}>Сумма</th>
                        <th>Статус</th>
                        <th style={{ textAlign: 'right' }}>Время</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.lot}
                          </td>
                          <td>{order.buyer}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{order.amount} ₽</td>
                          <td>
                            <span className={statusClass[order.status] ?? 'platform-chip'}>
                              {statusLabel[order.status] ?? order.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--pf-text-dim)' }}>{formatTime(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>

              <div className="platform-mobile-cards">
                {recentOrders.map(order => (
                  <article key={order.id} className="platform-mobile-card">
                    <div className="platform-mobile-card-head">
                      <strong>{order.id}</strong>
                      <span className={statusClass[order.status] ?? 'platform-chip'}>{statusLabel[order.status] ?? order.status}</span>
                    </div>
                    <div className="text-[13px] font-semibold">{order.lot}</div>
                    <div className="platform-mobile-meta">
                      <span>Покупатель: {order.buyer}</span>
                      <span>Сумма: {order.amount} ₽</span>
                      <span>Время: {formatTime(order.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard>
              <div className="platform-section-head">
                <span className="text-[15px] font-semibold">Аккаунты</span>
                <button type="button" className="platform-link-inline" onClick={() => router.push('/platform/accounts')}>
                  К разделу <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid gap-2">
                {accounts.slice(0, 4).map(account => (
                  <Panel key={account.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold">{account.username}</p>
                      <span className={account.online ? 'badge-active' : 'badge-inactive'}>
                        {account.online ? 'online' : 'offline'}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--pf-text-dim)]">
                      Баланс: {account.balance.toLocaleString('ru-RU')} ₽ · Лотов: {account.lotsCount}
                    </p>
                  </Panel>
                ))}
              </div>
            </SectionCard>

            <SectionCard>
              <div className="platform-section-head">
                <span className="text-[15px] font-semibold">Последние диалоги</span>
                <button type="button" className="platform-link-inline" onClick={() => router.push('/platform/chats')}>
                  Открыть чаты <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid gap-2">
                {recentChats.length === 0 && <EmptyState className="py-4">Диалоги пока отсутствуют</EmptyState>}
                {recentChats.map(chat => (
                  <Panel key={chat.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <span className="platform-avatar">{chat.buyerAvatar}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="truncate text-[13px]">{chat.buyer}</strong>
                          <span className="text-[11px] text-[var(--pf-text-dim)]">{chat.lastTime}</span>
                        </div>
                        <p className="mt-1 truncate text-[12px] text-[var(--pf-text-dim)]">{chat.lastMessage}</p>
                      </div>
                    </div>
                    {chat.unread > 0 && <span className="badge-dispute mt-2 inline-flex">{chat.unread} непрочит.</span>}
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
          <button type="button" className="platform-btn-secondary" onClick={() => router.push('/platform/analytics')}>
            Открыть глубокую аналитику
          </button>
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
