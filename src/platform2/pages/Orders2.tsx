'use client';

import { useMemo, useState } from 'react';
import {
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Textarea } from '@/app/components/ui/textarea';
import { accounts, orders, type Order } from '@/platform/data/demoData';

const statusMap: Record<string, { label: string; className: string }> = {
  paid: { label: 'Оплачен', className: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
  completed: { label: 'Выполнен', className: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
  refund: { label: 'Возврат', className: 'text-rose-300 bg-rose-500/15 border-rose-500/30' },
  dispute: { label: 'Спор', className: 'text-orange-300 bg-orange-500/15 border-orange-500/30' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Orders2() {
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [query, setQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryText, setDeliveryText] = useState('');

  const filtered = useMemo(() => {
    return orders.filter(order => {
      if (accountFilter !== 'all' && order.accountId !== accountFilter) return false;
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (query && !`${order.id} ${order.buyer} ${order.lot}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [accountFilter, statusFilter, query]);

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p2-surface border-[var(--p2-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Заказы</CardTitle>
          <CardDescription className="text-[var(--p2-text-muted)]">Чистый поток обработки и детальный просмотр каждого заказа.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <label className="flex items-center gap-2 p2-surface-2 rounded-md px-3 h-10">
              <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск по ID, покупателю, товару"
                className="p2-input border-0 shadow-none h-auto p-0 focus-visible:ring-0"
              />
            </label>

            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="p2-select-trigger">
                <SelectValue placeholder="Все аккаунты" />
              </SelectTrigger>
              <SelectContent className="p2-select-content">
                <SelectItem value="all" className="p2-select-item">Все аккаунты</SelectItem>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id} className="p2-select-item">{account.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="p2-select-trigger">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent className="p2-select-content">
                <SelectItem value="all" className="p2-select-item">Все статусы</SelectItem>
                <SelectItem value="paid" className="p2-select-item">Оплачен</SelectItem>
                <SelectItem value="completed" className="p2-select-item">Выполнен</SelectItem>
                <SelectItem value="refund" className="p2-select-item">Возврат</SelectItem>
                <SelectItem value="dispute" className="p2-select-item">Спор</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-[var(--p2-text-dim)]">
            <FunnelIcon className="size-4" />
            Показано {filtered.length} из {orders.length} заказов
          </div>
        </CardContent>
      </Card>

      <Card className="p2-surface border-[var(--p2-border)]">
        <CardContent className="pt-6">
          <div className="p2-table-wrap overflow-x-auto p2-scroll">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--p2-border)] hover:bg-transparent">
                  <TableHead>Заказ</TableHead>
                  <TableHead>Покупатель</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Аккаунт</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right">Дата</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(order => {
                  const account = accounts.find(item => item.id === order.accountId);
                  return (
                    <TableRow key={order.id} className="border-[var(--p2-border)] hover:bg-[var(--p2-surface-2)]">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.buyer}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{order.lot}</TableCell>
                      <TableCell>{account?.username ?? order.accountId}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusMap[order.status].className}`}>
                          {statusMap[order.status].label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{order.amount} ₽</TableCell>
                      <TableCell className="text-right text-[var(--p2-text-dim)]">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-8 p2-surface-2" onClick={() => setSelectedOrder(order)}>
                          <InformationCircleIcon className="size-4" />
                          Детали
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={open => {
          if (!open) {
            setSelectedOrder(null);
            setDeliveryText('');
          }
        }}
      >
        <DialogContent className="p2-dialog max-w-xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Заказ {selectedOrder.id}</DialogTitle>
                <DialogDescription className="text-[var(--p2-text-muted)]">
                  Работа с заказом, выдачей и коммуникацией в одном окне.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md p-3 p2-surface-2">
                    <div className="text-xs text-[var(--p2-text-dim)] mb-1">Покупатель</div>
                    <div>{selectedOrder.buyer}</div>
                  </div>
                  <div className="rounded-md p-3 p2-surface-2">
                    <div className="text-xs text-[var(--p2-text-dim)] mb-1">Сумма</div>
                    <div>{selectedOrder.amount} ₽</div>
                  </div>
                  <div className="rounded-md p-3 p2-surface-2 sm:col-span-2">
                    <div className="text-xs text-[var(--p2-text-dim)] mb-1">Товар</div>
                    <div>{selectedOrder.lot}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[var(--p2-text-dim)]">Выдача / ответ клиенту</label>
                  <Textarea
                    className="p2-input min-h-24"
                    value={deliveryText}
                    onChange={e => setDeliveryText(e.target.value)}
                    placeholder="Введите текст выдачи или инструкцию"
                  />
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" className="p2-surface-2" onClick={() => setSelectedOrder(null)}>
                    <XMarkIcon className="size-4" />
                    Закрыть
                  </Button>
                  <Button className="p2-primary-btn">
                    <ShoppingBagIcon className="size-4" />
                    Выдать товар
                  </Button>
                  <Button className="p2-primary-btn">
                    <PaperAirplaneIcon className="size-4" />
                    Отправить ответ
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
