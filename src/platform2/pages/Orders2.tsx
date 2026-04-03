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
import { Textarea } from '@/app/components/ui/textarea';
import type { Order } from '@/platform/data/demoData';
import { accounts, orders } from '@/platform/data/demoData';
import {
  P2Card,
  P2PageHeader,
  P2PrimaryAction,
  P2SecondaryAction,
  P2Status,
  statusLabelByOrder,
  statusTypeByOrder,
} from '@/platform2/components/primitives';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Orders2() {
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reply, setReply] = useState('');

  const filteredOrders = useMemo(
    () =>
      orders.filter(order => {
        if (accountFilter !== 'all' && order.accountId !== accountFilter) return false;
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;

        if (search) {
          const payload = `${order.id} ${order.buyer} ${order.lot}`.toLowerCase();
          if (!payload.includes(search.toLowerCase())) return false;
        }

        return true;
      }),
    [accountFilter, statusFilter, search],
  );

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader
        title="Orders"
        description="Track payments, status and fulfillment with fast actions."
      />

      <P2Card title="Filters" subtitle="Narrow down by account, status and search">
        <div className="p2-toolbar">
          <label className="p2-search max-w-none w-full">
            <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="p2-input border-0 shadow-none h-auto p-0 focus-visible:ring-0"
              placeholder="Search by order, buyer or product"
            />
          </label>

          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              <SelectItem value="all" className="p2-select-item">All accounts</SelectItem>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id} className="p2-select-item">
                  {account.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              <SelectItem value="all" className="p2-select-item">All statuses</SelectItem>
              <SelectItem value="paid" className="p2-select-item">Paid</SelectItem>
              <SelectItem value="completed" className="p2-select-item">Completed</SelectItem>
              <SelectItem value="refund" className="p2-select-item">Refund</SelectItem>
              <SelectItem value="dispute" className="p2-select-item">Dispute</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--p2-text-dim)]">
          <FunnelIcon className="size-4" />
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </P2Card>

      <P2Card title="Orders Table" subtitle="Actionable status matrix for your team">
        <div className="p2-table-wrap p2-scroll">
          <table className="p2-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Product</th>
                <th>Account</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td className="font-semibold">{order.id}</td>
                  <td>{order.buyer}</td>
                  <td className="max-w-[240px] truncate">{order.lot}</td>
                  <td>{accounts.find(account => account.id === order.accountId)?.username ?? order.accountId}</td>
                  <td>
                    <P2Status type={statusTypeByOrder(order.status)}>{statusLabelByOrder(order.status)}</P2Status>
                  </td>
                  <td className="text-right">{order.amount} ₽</td>
                  <td className="text-right text-[var(--p2-text-dim)]">{formatDate(order.createdAt)}</td>
                  <td className="text-right">
                    <button className="p2-secondary-btn inline-flex items-center gap-1.5 px-3" onClick={() => setSelectedOrder(order)}>
                      <InformationCircleIcon className="size-4" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </P2Card>

      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={open => {
          if (!open) {
            setSelectedOrder(null);
            setReply('');
          }
        }}
      >
        <DialogContent className="p2-dialog max-w-xl">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Order {selectedOrder.id}</DialogTitle>
                <DialogDescription className="text-[var(--p2-text-dim)]">
                  View order details, send response and trigger fulfillment.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                    <p className="text-[11px] text-[var(--p2-text-dim)]">Buyer</p>
                    <p className="mt-1 font-semibold">{selectedOrder.buyer}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                    <p className="text-[11px] text-[var(--p2-text-dim)]">Amount</p>
                    <p className="mt-1 font-semibold">{selectedOrder.amount} ₽</p>
                  </div>
                  <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 sm:col-span-2">
                    <p className="text-[11px] text-[var(--p2-text-dim)]">Product</p>
                    <p className="mt-1 font-semibold">{selectedOrder.lot}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[var(--p2-text-dim)]">Reply / Delivery Text</label>
                  <Textarea
                    value={reply}
                    onChange={event => setReply(event.target.value)}
                    className="p2-input min-h-24"
                    placeholder="Type message for customer"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <P2SecondaryAction onClick={() => setSelectedOrder(null)}>
                    <XMarkIcon className="size-4" />
                    Close
                  </P2SecondaryAction>
                  <P2PrimaryAction>
                    <ShoppingBagIcon className="size-4" />
                    Deliver Item
                  </P2PrimaryAction>
                  <P2PrimaryAction>
                    <PaperAirplaneIcon className="size-4" />
                    Send Reply
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
