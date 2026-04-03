'use client';

import Link from 'next/link';
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
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { P2Card, P2PageHeader, P2PrimaryAction, P2Stat, P2Status, statusLabelByOrder, statusTypeByOrder } from '@/platform2/components/primitives';
import { accounts, chats, lots, orders, salesData } from '@/platform/data/demoData';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Dashboard2() {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const unreadChats = chats.filter(chat => chat.unread > 0).length;
  const activeLots = lots.filter(lot => lot.status === 'active').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(order => order.createdAt.startsWith(today));

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader
        title="Dashboard"
        description="Operational analytics for orders, listings and chats in one view."
        actions={
          <P2PrimaryAction asChild>
            <Link href="/platform2/orders">Open Orders</Link>
          </P2PrimaryAction>
        }
      />

      <section className="p2-kpi-grid">
        <P2Stat label="Total Balance" value={`${totalBalance.toLocaleString('ru-RU')} ₽`} foot={<><BanknotesIcon className="size-4" />2 accounts</>} />
        <P2Stat label="Orders Today" value={String(todayOrders.length)} foot={<><ShoppingCartIcon className="size-4" />Live stream</>} />
        <P2Stat label="Active Lots" value={String(activeLots)} foot={<><CubeIcon className="size-4" />from {lots.length}</>} />
        <P2Stat label="Unread Chats" value={String(unreadChats)} foot={<><ChatBubbleLeftRightIcon className="size-4" />Need reply</>} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <P2Card title="Monthly Sales" subtitle="Revenue trend (last 30 days)">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData.slice(-30)} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="p2Area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(59,130,246,0.36)" />
                    <stop offset="95%" stopColor="rgba(59,130,246,0.04)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(125,138,165,0.25)" />
                <XAxis dataKey="date" tick={{ fill: '#7d8aa5', fontSize: 11 }} tickFormatter={value => value.slice(5)} />
                <YAxis tick={{ fill: '#7d8aa5', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--p2-surface-2)',
                    border: '1px solid var(--p2-border)',
                    borderRadius: '10px',
                    color: '#e5e7eb',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#p2Area)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </P2Card>

        <P2Card title="Need Attention" subtitle="Dialogs with unread messages">
          <div className="space-y-2">
            {chats
              .filter(chat => chat.unread > 0)
              .slice(0, 5)
              .map(chat => (
                <div key={chat.id} className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-white">{chat.buyer}</strong>
                    <span className="p2-chip">{chat.unread} unread</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--p2-text-muted)] line-clamp-2">{chat.lastMessage}</p>
                </div>
              ))}
          </div>
        </P2Card>
      </div>

      <P2Card title="Recent Orders" subtitle="Latest completed and active operations">
        <div className="p2-table-wrap p2-scroll">
          <table className="p2-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Product</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map(order => (
                <tr key={order.id}>
                  <td className="font-semibold">{order.id}</td>
                  <td>{order.buyer}</td>
                  <td className="max-w-[280px] truncate">{order.lot}</td>
                  <td>
                    <P2Status type={statusTypeByOrder(order.status)}>{statusLabelByOrder(order.status)}</P2Status>
                  </td>
                  <td className="text-right">{order.amount} ₽</td>
                  <td className="text-right text-[var(--p2-text-dim)]">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--p2-text-dim)]">
          <ArrowTrendingUpIcon className="size-4" />
          Daily revenue grew compared to previous period.
        </div>
      </P2Card>
    </div>
  );
}
