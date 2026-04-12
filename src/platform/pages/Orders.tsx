'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiOrder, ordersApi } from '@/lib/api';
import { DataTableWrap, EmptyState, PageHeader, PageShell, PageTitle, SectionCard, ToolbarRow } from '@/platform/components/primitives';

const STATUS_NUM_LABEL: Record<number, string> = {
  0: 'Оплачен',
  1: 'Выполнен',
  2: 'Возврат',
};

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function Orders() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 0 | 1 | 2>('all');

  useEffect(() => {
    accountsApi.list().then(rows => setAccounts(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Parameters<typeof ordersApi.list>[0] = { page, limit: PAGE_SIZE };
    if (accountFilter !== 'all') params.account_id = accountFilter;
    if (statusFilter !== 'all') params.status = statusFilter;

    ordersApi
      .list(params)
      .then(data => {
        if (cancelled) return;
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotal(Number(data.total || 0));
      })
      .catch(err => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Ошибка загрузки заказов');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, accountFilter, statusFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(order =>
      `${order.id} ${order.funpay_order_id} ${order.buyer_username} ${order.description}`.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Заказы" subtitle="Пагинация и фильтры по аккаунту/статусу с реальными данными из БД." />
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={14} color="var(--pf-text-dim)" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск по заказам" />
            </label>
            <select className="platform-select" value={accountFilter} onChange={event => { setAccountFilter(event.target.value); setPage(1); }}>
              <option value="all">Все аккаунты</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
              ))}
            </select>
            <select
              className="platform-select"
              value={statusFilter}
              onChange={event => {
                const v = event.target.value;
                setStatusFilter(v === 'all' ? 'all' : Number(v) as 0 | 1 | 2);
                setPage(1);
              }}
            >
              <option value="all">Все статусы</option>
              <option value="0">Оплачен</option>
              <option value="1">Выполнен</option>
              <option value="2">Возврат</option>
            </select>
          </ToolbarRow>
        </SectionCard>

        <SectionCard className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
            </div>
          ) : (
            <>
              <div className="platform-desktop-table">
                <DataTableWrap>
                  <table className="platform-table" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>FunPay ID</th>
                        <th>Покупатель</th>
                        <th>Описание</th>
                        <th>Аккаунт</th>
                        <th style={{ textAlign: 'right' }}>Сумма</th>
                        <th>Статус</th>
                        <th style={{ textAlign: 'right' }}>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map(order => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.funpay_order_id}</td>
                          <td>{order.buyer_username}</td>
                          <td>{order.description}</td>
                          <td>{accounts.find(acc => acc.id === order.funpay_account_id)?.username || `ID ${order.funpay_account_id}`}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(order.price || 0)} ₽</td>
                          <td>{STATUS_NUM_LABEL[order.status] || String(order.status)}</td>
                          <td style={{ textAlign: 'right' }}>{formatDate(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>
              {visible.length === 0 && <EmptyState>Заказы по текущим фильтрам не найдены.</EmptyState>}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pf-border)] px-4 py-3">
                <span className="platform-kpi-meta">Всего: {total}</span>
                <div className="inline-flex items-center gap-2">
                  <button className="platform-btn-secondary" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1}>Назад</button>
                  <span className="platform-chip">{page} / {totalPages}</span>
                  <button className="platform-btn-secondary" onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>Вперёд</button>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
