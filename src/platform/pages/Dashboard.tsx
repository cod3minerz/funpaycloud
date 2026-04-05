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
  PageHeader,
  PageShell,
  PageTitle,
  Panel,
  SectionCard,
  ToolbarRow,
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

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const totalBalance = useMemo(() => accounts.reduce((sum, account) => sum + account.balance, 0), []);
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = useMemo(() => orders.filter(order => order.createdAt.startsWith(today)), [today]);
  const activeLots = useMemo(() => lots.filter(lot => lot.status === 'active').length, []);
  const unreadChats = useMemo(() => chats.filter(chat => chat.unread > 0).length, []);
  const recentOrders = useMemo(() => [...orders].slice(0, 8), []);
  const recentChats = useMemo(() => chats.slice(0, 6), []);
  const chartData = useMemo(() => salesData.slice(salesData.length - period), [period]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Дашборд"
            subtitle="Оперативная сводка по выручке, заказам, лотам и коммуникациям по всем аккаунтам."
          />
          <ToolbarRow>
            {([7, 30, 90] as const).map(value => (
              <button
                key={value}
                className={period === value ? 'platform-btn-primary' : 'platform-btn-secondary'}
                onClick={() => setPeriod(value)}
              >
                {value} дней
              </button>
            ))}
          </ToolbarRow>
        </PageHeader>

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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-4">
            <SectionCard>
              <ToolbarRow className="mb-3 justify-between">
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                  <TrendingUp size={16} color="var(--pf-accent)" />
                  Динамика выручки
                </span>
                <span className="platform-kpi-meta">Период: {period} дней</span>
              </ToolbarRow>

              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 5, right: 6, left: -6, bottom: 2 }}>
                  <defs>
                    <linearGradient id="pfRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(94,147,255,0.5)" />
                      <stop offset="100%" stopColor="rgba(94,147,255,0.04)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--pf-text-dim)', fontSize: 11 }}
                    tickFormatter={value => value.slice(5)}
                    interval={Math.floor(chartData.length / 6)}
                  />
                  <YAxis tick={{ fill: 'var(--pf-text-dim)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--pf-surface)',
                      border: '1px solid var(--pf-border-strong)',
                      borderRadius: 10,
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--pf-accent)" strokeWidth={2} fill="url(#pfRevenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard>
              <ToolbarRow className="mb-3 justify-between">
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                  <BarChart2 size={16} color="var(--pf-accent)" />
                  Последние заказы
                </span>
                <button className="platform-btn-secondary" onClick={() => router.push('/platform/orders')}>
                  Открыть заказы
                </button>
              </ToolbarRow>

              <DataTableWrap>
                <table className="platform-table" style={{ minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th>Заказ</th>
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
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.lot}
                        </td>
                        <td>
                          <div className="inline-flex items-center gap-2">
                            <span className="platform-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                              {order.buyerAvatar}
                            </span>
                            {order.buyer}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{order.amount} ₽</td>
                        <td>
                          <span className={statusClass[order.status] ?? 'platform-chip'}>
                            {statusLabel[order.status] ?? order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--pf-text-dim)' }}>{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTableWrap>
            </SectionCard>
          </div>

          <div className="grid gap-4">
            <SectionCard>
              <div className="mb-3 text-[15px] font-semibold">Аккаунты</div>
              <div className="grid gap-2">
                {accounts.map(account => (
                  <Panel key={account.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{account.username}</div>
                        <div className="platform-kpi-meta">
                          {account.balance.toLocaleString('ru-RU')} ₽ · {account.lotsCount} лотов
                        </div>
                      </div>
                      <span className={account.online ? 'badge-active' : 'badge-inactive'}>
                        {account.online ? 'Онлайн' : 'Оффлайн'}
                      </span>
                    </div>
                  </Panel>
                ))}
              </div>
            </SectionCard>

            <SectionCard>
              <ToolbarRow className="mb-3 justify-between">
                <span className="text-[15px] font-semibold">Последние диалоги</span>
                <button className="platform-btn-secondary" onClick={() => router.push('/platform/chats')}>
                  Чаты
                </button>
              </ToolbarRow>

              <div className="grid gap-2">
                {recentChats.length === 0 && <EmptyState className="py-4">Диалоги пока отсутствуют</EmptyState>}
                {recentChats.map(chat => (
                  <Panel key={chat.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <span className="platform-avatar">{chat.buyerAvatar}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-[13px]">{chat.buyer}</strong>
                          <span className="platform-kpi-meta">{chat.lastTime}</span>
                        </div>
                        <p
                          className="platform-kpi-meta"
                          style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {chat.lastMessage}
                        </p>
                      </div>
                      {chat.unread > 0 && <span className="badge-dispute">{chat.unread}</span>}
                    </div>
                  </Panel>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </PageShell>
    </motion.div>
  );
}

