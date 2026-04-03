'use client';

import { useMemo, useState } from 'react';
import {
  InformationCircleIcon,
  PaperAirplaneIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { accounts, orders } from '@/platform/data/demoData';
import {
  P2PageHeader,
  P2Panel,
  P2PrimaryAction,
  P2SecondaryAction,
  P2Status,
  p2FormatDate,
  statusLabelByOrder,
  statusTypeByOrder,
} from '@/platform2/components/primitives';

type StatusFilter = 'all' | 'paid' | 'completed' | 'refund' | 'dispute';

export default function Orders2() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const filtered = useMemo(
    () =>
      orders.filter(order => {
        if (status !== 'all' && order.status !== status) return false;
        if (query) {
          const payload = [order.id, order.buyer, order.lot, order.category].join(' ').toLowerCase();
          if (!payload.includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [status, query],
  );

  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find(order => order.id === selectedOrderId) ?? null : null),
    [selectedOrderId],
  );

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Заказы" description="Единая таблица обработки, ответов и выдачи." />

      <P2Panel title="Фильтры" subtitle="Поиск по ID, покупателю и категории">
        <div className="p2-toolbar">
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="p2-input"
            placeholder="Поиск заказа"
          />

          <Select value={status} onValueChange={value => setStatus(value as StatusFilter)}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              <SelectItem value="all" className="p2-select-item">Все статусы</SelectItem>
              <SelectItem value="paid" className="p2-select-item">Оплачен</SelectItem>
              <SelectItem value="completed" className="p2-select-item">Выполнен</SelectItem>
              <SelectItem value="refund" className="p2-select-item">Возврат</SelectItem>
              <SelectItem value="dispute" className="p2-select-item">Спор</SelectItem>
            </SelectContent>
          </Select>

          <P2PrimaryAction className="px-4">Применить</P2PrimaryAction>
        </div>
      </P2Panel>

      <P2Panel title="Лента заказов" subtitle={filtered.length + ' заказов по текущим фильтрам'}>
        <div className="p2-table-wrap p2-scroll">
          <table className="p2-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Покупатель</th>
                <th>Лот</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Аккаунт</th>
                <th>Создан</th>
                <th className="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const account = accounts.find(item => item.id === order.accountId);
                return (
                  <tr key={order.id}>
                    <td className="font-semibold">{order.id}</td>
                    <td>{order.buyer}</td>
                    <td className="max-w-[300px] truncate">{order.lot}</td>
                    <td>{order.amount.toLocaleString('ru-RU')} ₽</td>
                    <td>
                      <P2Status type={statusTypeByOrder(order.status)}>{statusLabelByOrder(order.status)}</P2Status>
                    </td>
                    <td>{account?.username ?? '—'}</td>
                    <td className="text-[var(--p2-text-dim)]">{p2FormatDate(order.createdAt)}</td>
                    <td className="text-right">
                      <button className="p2-btn-soft px-3" onClick={() => setSelectedOrderId(order.id)}>
                        <InformationCircleIcon className="size-4" />
                        Детали
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </P2Panel>

      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={open => {
          if (!open) {
            setSelectedOrderId(null);
            setReply('');
          }
        }}
      >
        <DialogContent className="p2-dialog max-w-2xl">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[var(--p2-text)]">Заказ {selectedOrder.id}</DialogTitle>
                <DialogDescription className="text-[var(--p2-text-dim)]">
                  Проверьте контекст, отправьте ответ и выполните выдачу.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                    <p className="text-xs text-[var(--p2-text-dim)]">Покупатель</p>
                    <p className="mt-1 font-semibold">{selectedOrder.buyer}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                    <p className="text-xs text-[var(--p2-text-dim)]">Сумма</p>
                    <p className="mt-1 font-semibold">{selectedOrder.amount.toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 sm:col-span-2">
                    <p className="text-xs text-[var(--p2-text-dim)]">Лот</p>
                    <p className="mt-1 font-semibold">{selectedOrder.lot}</p>
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs text-[var(--p2-text-dim)]">Ответ покупателю / текст выдачи</span>
                  <Textarea
                    value={reply}
                    onChange={event => setReply(event.target.value)}
                    className="p2-input min-h-24"
                    placeholder="Введите сообщение"
                  />
                </label>

                <div className="flex flex-wrap justify-end gap-2">
                  <P2SecondaryAction onClick={() => setSelectedOrderId(null)}>Закрыть</P2SecondaryAction>
                  <P2PrimaryAction>
                    <ShoppingBagIcon className="size-4" />
                    Выдать товар
                  </P2PrimaryAction>
                  <P2PrimaryAction>
                    <PaperAirplaneIcon className="size-4" />
                    Отправить
                  </P2PrimaryAction>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
