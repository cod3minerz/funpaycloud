'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Info, Loader2, MessageSquare, Package, Search, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { accountsApi, ApiAccount, ApiOrder, ordersApi } from '@/lib/api';
import { sanitizeInput } from '@/lib/sanitize';
import {
  DataTableWrap,
  EmptyState,
  PageHeader,
  PageShell,
  PageTitle,
  Panel,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

const STATUS_NUM_LABEL: Record<number, string> = {
  0: 'Оплачен',
  1: 'Выполнен',
  2: 'Возврат',
};

const STATUS_NUM_COLOR: Record<number, string> = {
  0: '#eab308',
  1: '#22c55e',
  2: '#ef4444',
};

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return iso;
  }
}

export default function Orders() {
  const [isMobile, setIsMobile] = useState(false);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 0 | 1 | 2>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Array<string | number>>([]);
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState<ApiOrder | null>(null);
  const [deliveryText, setDeliveryText] = useState('');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => { setIsMobile(media.matches); if (!media.matches) setShowFilters(false); };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  // Load accounts for filter dropdown
  useEffect(() => {
    accountsApi.list().then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Parameters<typeof ordersApi.list>[0] = { page, limit: PAGE_SIZE };
    if (accountFilter !== 'all') params.account_id = accountFilter;
    if (statusFilter !== 'all') params.status = statusFilter;

    ordersApi
      .list(params)
      .then(res => {
        if (!cancelled) {
          setOrders(res.data);
          setTotal(res.total);
        }
      })
      .catch(err => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Ошибка загрузки заказов');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, accountFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paginated = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      o =>
        String(o.id ?? '').toLowerCase().includes(q) ||
        String(o.buyer ?? '').toLowerCase().includes(q),
    );
  }, [orders, search]);

  function toggleSelect(id: string | number) {
    setSelected(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]));
  }

  function toggleAllVisible() {
    if (paginated.length === 0) return;
    const allSelected = paginated.every(o => selected.includes(o.id!));
    if (allSelected) {
      setSelected(prev => prev.filter(id => !paginated.find(o => o.id === id)));
    } else {
      const next = new Set(selected);
      paginated.forEach(o => next.add(o.id!));
      setSelected(Array.from(next));
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Заказы"
            subtitle="Операционный контроль заказов: фильтрация, массовые действия, детали и коммуникации."
          />
        </PageHeader>

        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <SectionCard className="p-3">
                <ToolbarRow className="justify-between">
                  <span className="text-[13px] font-semibold">Выбрано: {selected.length}</span>
                  <div className={isMobile ? 'platform-mobile-action-grid' : 'inline-flex items-center gap-2'}>
                    <button className="platform-btn-secondary">
                      <Package size={14} /> Выдать товары
                    </button>
                    <button className="platform-topbar-btn" onClick={() => setSelected([])} aria-label="Снять выбор">
                      <X size={14} />
                    </button>
                  </div>
                </ToolbarRow>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={14} color="var(--pf-text-dim)" />
              <input
                value={search}
                onChange={event => { setSearch(event.target.value); setPage(1); }}
                placeholder="Поиск по ID или покупателю"
              />
            </label>

            {isMobile && (
              <div className="inline-flex items-center gap-2">
                <button
                  className={showFilters ? 'platform-btn-primary' : 'platform-btn-secondary'}
                  onClick={() => setShowFilters(prev => !prev)}
                >
                  <Filter size={14} /> Фильтры
                </button>
                <button
                  className="platform-btn-secondary"
                  onClick={() => { setAccountFilter('all'); setStatusFilter('all'); setPage(1); }}
                >
                  Сброс
                </button>
              </div>
            )}
          </ToolbarRow>

          {(!isMobile || showFilters) && (
            <ToolbarRow className="mt-2">
              <select
                className="platform-select"
                value={accountFilter}
                onChange={event => { setAccountFilter(event.target.value); setPage(1); }}
                style={{ maxWidth: 200 }}
              >
                <option value="all">Все аккаунты</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.username}</option>
                ))}
              </select>

              <div className={`inline-flex flex-wrap items-center gap-2${isMobile ? ' platform-toolbar-scroll' : ''}`}>
                {(['all', 0, 1, 2] as const).map(value => (
                  <button
                    key={value}
                    className={statusFilter === value ? 'platform-btn-primary' : 'platform-btn-secondary'}
                    style={{ minHeight: 34 }}
                    onClick={() => { setStatusFilter(value); setPage(1); }}
                  >
                    {value === 'all' ? 'Все' : STATUS_NUM_LABEL[value]}
                  </button>
                ))}
              </div>
            </ToolbarRow>
          )}
        </SectionCard>

        <SectionCard className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
            </div>
          ) : (
            <>
              <div className="platform-desktop-table">
                <DataTableWrap className="tablet-dense-scroll">
                  <table className="platform-table" style={{ minWidth: 860 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>
                          <input
                            type="checkbox"
                            checked={paginated.length > 0 && paginated.every(o => selected.includes(o.id!))}
                            onChange={toggleAllVisible}
                            style={{ accentColor: 'var(--pf-accent)' }}
                          />
                        </th>
                        <th>Заказ</th>
                        <th>Товар</th>
                        <th>Покупатель</th>
                        <th className="platform-col-tablet-hide">Аккаунт</th>
                        <th style={{ textAlign: 'right' }}>Сумма</th>
                        <th>Статус</th>
                        <th className="platform-col-tablet-hide" style={{ textAlign: 'right' }}>Дата</th>
                        <th style={{ textAlign: 'right' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map(order => {
                        const acc = accounts.find(a => String(a.id) === String(order.account_id));
                        const isSelected = selected.includes(order.id!);
                        const statusColor = STATUS_NUM_COLOR[Number(order.status)] ?? '#94a3b8';
                        const statusText = STATUS_NUM_LABEL[Number(order.status)] ?? String(order.status ?? '');
                        return (
                          <tr key={order.id} style={isSelected ? { background: 'rgba(60,122,246,0.1)' } : undefined}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(order.id!)}
                                style={{ accentColor: 'var(--pf-accent)' }}
                              />
                            </td>
                            <td>{String(order.id ?? '')}</td>
                            <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {String(order.lot ?? '')}
                            </td>
                            <td>{String(order.buyer ?? '')}</td>
                            <td className="platform-col-tablet-hide" style={{ color: 'var(--pf-text-muted)' }}>
                              {acc?.username ?? String(order.account_id ?? '')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(order.amount ?? 0)} ₽</td>
                            <td>
                              <span
                                className="platform-chip"
                                style={{ background: `${statusColor}20`, color: statusColor, borderColor: 'transparent' }}
                              >
                                {statusText}
                              </span>
                            </td>
                            <td className="platform-col-tablet-hide" style={{ textAlign: 'right', color: 'var(--pf-text-dim)' }}>
                              {formatDate(String(order.created_at ?? ''))}
                            </td>
                            <td>
                              <div className="inline-flex w-full items-center justify-end gap-2">
                                <button className="platform-topbar-btn" title="Выдать"><Package size={14} /></button>
                                <button className="platform-topbar-btn" title="Написать"><MessageSquare size={14} /></button>
                                <button className="platform-topbar-btn" title="Детали" onClick={() => setDetailOrder(order)}>
                                  <Info size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>

              <div className="platform-mobile-cards">
                {paginated.map(order => {
                  const acc = accounts.find(a => String(a.id) === String(order.account_id));
                  const statusColor = STATUS_NUM_COLOR[Number(order.status)] ?? '#94a3b8';
                  const statusText = STATUS_NUM_LABEL[Number(order.status)] ?? String(order.status ?? '');
                  return (
                    <article key={order.id} className="platform-mobile-card">
                      <div className="platform-mobile-card-head">
                        <strong>{String(order.id ?? '')}</strong>
                        <span
                          className="platform-chip !min-h-[22px]"
                          style={{ background: `${statusColor}20`, color: statusColor, borderColor: 'transparent' }}
                        >
                          {statusText}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold">{String(order.lot ?? '')}</div>
                      <div className="platform-mobile-meta">
                        <span>Покупатель: {String(order.buyer ?? '')}</span>
                        <span>Аккаунт: {acc?.username ?? String(order.account_id ?? '')}</span>
                        <span>Сумма: {Number(order.amount ?? 0)} ₽</span>
                        <span>Дата: {formatDate(String(order.created_at ?? ''))}</span>
                      </div>
                      <div className="platform-mobile-card-actions">
                        <button className="platform-btn-primary w-full" onClick={() => setDetailOrder(order)}>
                          <Info size={14} /> Детали заказа
                        </button>
                        <div className="platform-mobile-subactions">
                          <button className="platform-btn-secondary"><Package size={14} /> Выдать</button>
                          <button className="platform-btn-secondary"><MessageSquare size={14} /> Чат</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {paginated.length === 0 && <EmptyState>Заказы по текущим фильтрам не найдены.</EmptyState>}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pf-border)] px-4 py-3">
                <span className="platform-kpi-meta">Всего: {total}</span>
                <div className="inline-flex items-center gap-2">
                  <button className="platform-btn-secondary" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1}>
                    Назад
                  </button>
                  <span className="platform-chip">{page} / {totalPages}</span>
                  <button className="platform-btn-secondary" onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
                    Вперёд
                  </button>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </PageShell>

      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: 560 }}>
          <DialogHeader>
            <DialogTitle>Детали заказа {String(detailOrder?.id ?? '')}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Panel className="p-3">
                  <div className="platform-kpi-meta">Покупатель</div>
                  <div className="mt-1 font-semibold">{String(detailOrder.buyer ?? '')}</div>
                </Panel>
                <Panel className="p-3">
                  <div className="platform-kpi-meta">Сумма</div>
                  <div className="mt-1 text-lg font-extrabold">{Number(detailOrder.amount ?? 0)} ₽</div>
                </Panel>
                <Panel className="p-3">
                  <div className="platform-kpi-meta">Статус</div>
                  <span
                    className="platform-chip mt-1"
                    style={{
                      background: `${STATUS_NUM_COLOR[Number(detailOrder.status)] ?? '#94a3b8'}20`,
                      color: STATUS_NUM_COLOR[Number(detailOrder.status)] ?? '#94a3b8',
                      borderColor: 'transparent',
                    }}
                  >
                    {STATUS_NUM_LABEL[Number(detailOrder.status)] ?? String(detailOrder.status ?? '')}
                  </span>
                </Panel>
                <Panel className="p-3">
                  <div className="platform-kpi-meta">Создан</div>
                  <div className="mt-1 font-semibold">{formatDate(String(detailOrder.created_at ?? ''))}</div>
                </Panel>
              </div>

              <Panel className="p-3">
                <div className="platform-kpi-meta">Товар</div>
                <div className="mt-1 font-semibold">{String(detailOrder.lot ?? '')}</div>
                <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">{String(detailOrder.description ?? '')}</div>
              </Panel>

              <Panel className="p-3">
                <div className="platform-kpi-meta mb-2">Ручная выдача / сообщение</div>
                <textarea
                  className="platform-textarea"
                  value={deliveryText}
                  onChange={event => setDeliveryText(sanitizeInput(event.target.value))}
                  placeholder="Введите данные для выдачи или текст для отправки покупателю..."
                  rows={4}
                />
                <div className="mt-2 flex gap-2">
                  <button className="platform-btn-secondary" style={{ flex: 1 }} onClick={() => setDetailOrder(null)}>
                    Отмена
                  </button>
                  <button className="platform-btn-primary" style={{ flex: 1 }}>
                    <Send size={14} /> Отправить
                  </button>
                </div>
              </Panel>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
