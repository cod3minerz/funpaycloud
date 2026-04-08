import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Info, MessageSquare, Package, Search, Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { accounts, Order, orders } from '@/platform/data/demoData';
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

const statusLabel: Record<string, string> = {
  paid: 'Оплачен',
  completed: 'Выполнен',
  refund: 'Возврат',
  dispute: 'Спор',
};

const statusColor: Record<string, string> = {
  paid: '#eab308',
  completed: '#22c55e',
  refund: '#ef4444',
  dispute: '#f97316',
};

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function Orders() {
  const [isMobile, setIsMobile] = useState(false);
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [deliveryText, setDeliveryText] = useState('');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      setIsMobile(media.matches);
      if (!media.matches) setShowFilters(false);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const now = new Date();

  const filtered = useMemo(() => {
    return orders.filter(order => {
      if (accountFilter !== 'all' && order.accountId !== accountFilter) return false;
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (
        search &&
        !order.id.toLowerCase().includes(search.toLowerCase()) &&
        !order.buyer.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (dateFilter === 'today') {
        if (new Date(order.createdAt).toDateString() !== now.toDateString()) return false;
      }
      if (dateFilter === 'week') {
        const diff = (now.getTime() - new Date(order.createdAt).getTime()) / 86400000;
        if (diff > 7) return false;
      }
      if (dateFilter === 'month') {
        const d = new Date(order.createdAt);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [accountFilter, statusFilter, search, dateFilter, now]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSelect(id: string) {
    setSelected(prev => (prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]));
  }

  function toggleAllVisible() {
    if (paginated.length === 0) return;
    const allSelected = paginated.every(order => selected.includes(order.id));
    if (allSelected) {
      setSelected(prev => prev.filter(id => !paginated.find(order => order.id === id)));
      return;
    }
    const next = new Set(selected);
    paginated.forEach(order => next.add(order.id));
    setSelected(Array.from(next));
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
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
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
                onChange={event => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
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
                  onClick={() => {
                    setAccountFilter('all');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
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
              onChange={event => {
                setAccountFilter(event.target.value);
                setPage(1);
              }}
              style={{ maxWidth: 200 }}
            >
              <option value="all">Все аккаунты</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.username}
                </option>
              ))}
            </select>

              <div className={`inline-flex flex-wrap items-center gap-2${isMobile ? ' platform-toolbar-scroll' : ''}`}>
              {(['all', 'paid', 'completed', 'refund', 'dispute'] as const).map(value => (
                <button
                  key={value}
                  className={statusFilter === value ? 'platform-btn-primary' : 'platform-btn-secondary'}
                  style={{ minHeight: 34 }}
                  onClick={() => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                  {value === 'all' ? 'Все' : statusLabel[value]}
                </button>
              ))}
            </div>
 
              <div className={`inline-flex flex-wrap items-center gap-2${isMobile ? ' platform-toolbar-scroll' : ''}`}>
              {(['all', 'today', 'week', 'month'] as const).map(value => (
                <button
                  key={value}
                  className={dateFilter === value ? 'platform-btn-primary' : 'platform-btn-secondary'}
                  style={{ minHeight: 34 }}
                  onClick={() => {
                    setDateFilter(value);
                    setPage(1);
                  }}
                >
                  {value === 'all' ? 'Все даты' : value === 'today' ? 'Сегодня' : value === 'week' ? 'Неделя' : 'Месяц'}
                </button>
              ))}
            </div>
            </ToolbarRow>
          )}
        </SectionCard>

        <SectionCard className="p-0">
          <div className="platform-desktop-table">
            <DataTableWrap className="tablet-dense-scroll">
              <table className="platform-table" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        checked={paginated.length > 0 && paginated.every(order => selected.includes(order.id))}
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
                    const account = accounts.find(item => item.id === order.accountId);
                    const isSelected = selected.includes(order.id);
                    return (
                      <tr key={order.id} style={isSelected ? { background: 'rgba(60,122,246,0.1)' } : undefined}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(order.id)}
                            style={{ accentColor: 'var(--pf-accent)' }}
                          />
                        </td>
                        <td>{order.id}</td>
                        <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        <td className="platform-col-tablet-hide" style={{ color: 'var(--pf-text-muted)' }}>
                          {account?.username ?? order.accountId}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{order.amount} ₽</td>
                        <td>
                          <span
                            className="platform-chip"
                            style={{
                              background: `${statusColor[order.status]}20`,
                              color: statusColor[order.status],
                              borderColor: 'transparent',
                            }}
                          >
                            {statusLabel[order.status]}
                          </span>
                        </td>
                        <td className="platform-col-tablet-hide" style={{ textAlign: 'right', color: 'var(--pf-text-dim)' }}>
                          {formatDate(order.createdAt)}
                        </td>
                        <td>
                          <div className="inline-flex w-full items-center justify-end gap-2">
                            <button className="platform-topbar-btn" title="Выдать">
                              <Package size={14} />
                            </button>
                            <button className="platform-topbar-btn" title="Написать">
                              <MessageSquare size={14} />
                            </button>
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
              const account = accounts.find(item => item.id === order.accountId);
              return (
                <article key={order.id} className="platform-mobile-card">
                  <div className="platform-mobile-card-head">
                    <strong>{order.id}</strong>
                    <span
                      className="platform-chip !min-h-[22px]"
                      style={{
                        background: `${statusColor[order.status]}20`,
                        color: statusColor[order.status],
                        borderColor: 'transparent',
                      }}
                    >
                      {statusLabel[order.status]}
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold">{order.lot}</div>
                  <div className="platform-mobile-meta">
                    <span>Покупатель: {order.buyer}</span>
                    <span>Аккаунт: {account?.username ?? order.accountId}</span>
                    <span>Сумма: {order.amount} ₽</span>
                    <span>Дата: {formatDate(order.createdAt)}</span>
                  </div>
                  <div className="platform-mobile-actions platform-mobile-action-grid">
                    <button className="platform-topbar-btn" title="Выдать">
                      <Package size={14} />
                    </button>
                    <button className="platform-topbar-btn" title="Написать">
                      <MessageSquare size={14} />
                    </button>
                    <button className="platform-btn-secondary" onClick={() => setDetailOrder(order)}>
                      <Info size={14} /> Детали
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {paginated.length === 0 && <EmptyState>Заказы по текущим фильтрам не найдены.</EmptyState>}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pf-border)] px-4 py-3">
            <span className="platform-kpi-meta">
              Показано {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(page * PAGE_SIZE, filtered.length)} из {filtered.length}
            </span>
            <div className="inline-flex items-center gap-2">
              <button
                className="platform-btn-secondary"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Назад
              </button>
              <span className="platform-chip">
                {page} / {totalPages}
              </span>
              <button
                className="platform-btn-secondary"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Вперёд
              </button>
            </div>
          </div>
        </SectionCard>
      </PageShell>

      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: 560 }}>
          <DialogHeader>
            <DialogTitle>Детали заказа {detailOrder?.id}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Panel className="p-3">
                  <div className="platform-kpi-meta">Покупатель</div>
                  <div className="mt-1 font-semibold">{detailOrder.buyer}</div>
                </Panel>
                <Panel className="p-3">
                  <div className="platform-kpi-meta">Сумма</div>
                  <div className="mt-1 text-lg font-extrabold">{detailOrder.amount} ₽</div>
                </Panel>
                <Panel className="p-3">
                  <div className="platform-kpi-meta">Статус</div>
                  <span
                    className="platform-chip mt-1"
                    style={{
                      background: `${statusColor[detailOrder.status]}20`,
                      color: statusColor[detailOrder.status],
                      borderColor: 'transparent',
                    }}
                  >
                    {statusLabel[detailOrder.status]}
                  </span>
                </Panel>
                <Panel className="p-3">
                  <div className="platform-kpi-meta">Создан</div>
                  <div className="mt-1 font-semibold">{formatDate(detailOrder.createdAt)}</div>
                </Panel>
              </div>

              <Panel className="p-3">
                <div className="platform-kpi-meta">Товар</div>
                <div className="mt-1 font-semibold">{detailOrder.lot}</div>
                <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">{detailOrder.description}</div>
              </Panel>

              <Panel className="p-3">
                <div className="platform-kpi-meta mb-2">Ручная выдача / сообщение</div>
                <textarea
                  className="platform-textarea"
                  value={deliveryText}
                  onChange={event => setDeliveryText(event.target.value)}
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
