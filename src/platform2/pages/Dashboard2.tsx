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
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { accounts, chats, lots, orders, salesData } from '@/platform/data/demoData';

const statusMap: Record<string, { label: string; className: string }> = {
  paid: { label: 'Оплачен', className: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
  completed: { label: 'Выполнен', className: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
  refund: { label: 'Возврат', className: 'text-rose-300 bg-rose-500/15 border-rose-500/30' },
  dispute: { label: 'Спор', className: 'text-orange-300 bg-orange-500/15 border-orange-500/30' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard2() {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalTodayOrders = orders.filter(order => order.createdAt.startsWith(new Date().toISOString().slice(0, 10))).length;
  const unreadChats = chats.filter(chat => chat.unread > 0).length;
  const activeLots = lots.filter(lot => lot.status === 'active').length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Обзор платформы</h1>
          <p className="text-sm text-[var(--p2-text-muted)]">Операционные показатели и текущая нагрузка магазина.</p>
        </div>
        <Button asChild className="p2-primary-btn">
          <Link href="/platform2/orders">Перейти к заказам</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p2-surface border-[var(--p2-border)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[var(--p2-text-dim)]">Общий баланс</CardDescription>
            <CardTitle className="text-2xl font-semibold">{totalBalance.toLocaleString('ru-RU')} ₽</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--p2-text-muted)] inline-flex items-center gap-2">
            <BanknotesIcon className="size-4" /> 2 аккаунта
          </CardContent>
        </Card>

        <Card className="p2-surface border-[var(--p2-border)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[var(--p2-text-dim)]">Заказы сегодня</CardDescription>
            <CardTitle className="text-2xl font-semibold">{totalTodayOrders}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--p2-text-muted)] inline-flex items-center gap-2">
            <ShoppingCartIcon className="size-4" /> активный поток
          </CardContent>
        </Card>

        <Card className="p2-surface border-[var(--p2-border)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[var(--p2-text-dim)]">Активные лоты</CardDescription>
            <CardTitle className="text-2xl font-semibold">{activeLots}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--p2-text-muted)] inline-flex items-center gap-2">
            <CubeIcon className="size-4" /> из {lots.length}
          </CardContent>
        </Card>

        <Card className="p2-surface border-[var(--p2-border)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[var(--p2-text-dim)]">Чаты без ответа</CardDescription>
            <CardTitle className="text-2xl font-semibold">{unreadChats}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--p2-text-muted)] inline-flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="size-4" /> требуют реакции
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <Card className="p2-surface border-[var(--p2-border)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowTrendingUpIcon className="size-4" /> Выручка за 30 дней
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData.slice(-30)} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="p2Revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(37,99,235,0.45)" />
                      <stop offset="100%" stopColor="rgba(37,99,235,0.02)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fill: '#93a8c8', fontSize: 11 }} tickFormatter={value => value.slice(5)} />
                  <YAxis tick={{ fill: '#93a8c8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--p2-surface-2)', border: '1px solid var(--p2-border)', borderRadius: 8 }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#60a5fa" fill="url(#p2Revenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="p2-surface border-[var(--p2-border)]">
          <CardHeader>
            <CardTitle className="text-base">Непрочитанные диалоги</CardTitle>
            <CardDescription className="text-[var(--p2-text-dim)]">Сфокусируйтесь на запросах с высоким риском потери.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {chats
              .filter(chat => chat.unread > 0)
              .slice(0, 5)
              .map(chat => (
                <div key={chat.id} className="rounded-lg border p-3 p2-surface-2" style={{ borderColor: 'var(--p2-border)' }}>
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{chat.buyer}</strong>
                    <Badge variant="outline" className="border-rose-500/40 text-rose-300">{chat.unread}</Badge>
                  </div>
                  <p className="text-xs text-[var(--p2-text-muted)] mt-1 line-clamp-2">{chat.lastMessage}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card className="p2-surface border-[var(--p2-border)]">
        <CardHeader>
          <CardTitle className="text-base">Последние заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p2-table-wrap">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--p2-border)] hover:bg-transparent">
                  <TableHead>Заказ</TableHead>
                  <TableHead>Покупатель</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 8).map(order => (
                  <TableRow key={order.id} className="border-[var(--p2-border)] hover:bg-[var(--p2-surface-2)]">
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.buyer}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{order.lot}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusMap[order.status].className}`}>
                        {statusMap[order.status].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{order.amount} ₽</TableCell>
                    <TableCell className="text-right text-[var(--p2-text-dim)]">{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
