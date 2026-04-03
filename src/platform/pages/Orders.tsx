import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Package, MessageSquare, Info, X, Send } from 'lucide-react';
import { orders, accounts, Order } from '@/platform/data/demoData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

const CARD_STYLE: React.CSSProperties = {
  background: '#0a1428',
  border: '1px solid rgba(0,121,255,0.18)',
  borderRadius: '12px',
  padding: '20px',
};

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

function formatDt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 10;

export default function Orders() {
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [deliveryText, setDeliveryText] = useState('');

  const now = new Date();
  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (accountFilter !== 'all' && o.accountId !== accountFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.buyer.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFilter === 'today') {
        const d = new Date(o.createdAt);
        if (d.toDateString() !== now.toDateString()) return false;
      }
      if (dateFilter === 'week') {
        const d = new Date(o.createdAt);
        const diff = (now.getTime() - d.getTime()) / 86400000;
        if (diff > 7) return false;
      }
      if (dateFilter === 'month') {
        const d = new Date(o.createdAt);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [accountFilter, statusFilter, search, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleAll() {
    if (selected.length === paginated.length) {
      setSelected([]);
    } else {
      setSelected(paginated.map(o => o.id));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: '#050C1C', color: '#fff', fontFamily: 'Syne, sans-serif' }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Заказы</h1>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ background: 'linear-gradient(135deg, #007BFF, #0052F4)', borderRadius: '10px', padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <span style={{ fontWeight: 600 }}>Выбрано {selected.length} заказов</span>
            <button
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Package size={14} /> Выдать товары
            </button>
            <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div style={{ ...CARD_STYLE, marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={accountFilter}
            onChange={e => { setAccountFilter(e.target.value); setPage(1); }}
            style={{ background: 'rgba(0,121,255,0.1)', border: '1px solid rgba(0,121,255,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">Все аккаунты</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'paid', 'completed', 'refund', 'dispute'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '7px',
                  border: statusFilter === s ? 'none' : '1px solid rgba(0,121,255,0.2)',
                  background: statusFilter === s ? 'linear-gradient(135deg, #007BFF, #0052F4)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {s === 'all' ? 'Все' : statusLabel[s]}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '180px' }}>
            <Search size={16} color="#7DC8FF" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Поиск по ID или покупателю..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'today', 'week', 'month'] as const).map(d => (
              <button
                key={d}
                onClick={() => { setDateFilter(d); setPage(1); }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '7px',
                  border: dateFilter === d ? 'none' : '1px solid rgba(0,121,255,0.2)',
                  background: dateFilter === d ? 'linear-gradient(135deg, #007BFF, #0052F4)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {d === 'all' ? 'Все' : d === 'today' ? 'Сегодня' : d === 'week' ? 'Неделя' : 'Месяц'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={CARD_STYLE}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: '#7DC8FF', borderBottom: '1px solid rgba(0,121,255,0.15)' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '36px' }}>
                  <input
                    type="checkbox"
                    checked={selected.length === paginated.length && paginated.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer', accentColor: '#0079FF' }}
                  />
                </th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500 }}>#</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500 }}>Товар</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500 }}>Покупатель</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 500 }}>Аккаунт</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 500 }}>Сумма</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 500 }}>Статус</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 500 }}>Дата</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 500 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(o => {
                const acc = accounts.find(a => a.id === o.accountId);
                return (
                  <tr
                    key={o.id}
                    style={{ borderBottom: '1px solid rgba(0,121,255,0.07)', background: selected.includes(o.id) ? 'rgba(0,121,255,0.07)' : 'transparent' }}
                  >
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        style={{ cursor: 'pointer', accentColor: '#0079FF' }}
                      />
                    </td>
                    <td style={{ padding: '10px 8px', color: '#7DC8FF', fontFamily: 'monospace' }}>{o.id}</td>
                    <td style={{ padding: '10px 8px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.lot}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #007BFF, #0052F4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                          {o.buyerAvatar}
                        </div>
                        {o.buyer}
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', color: '#7DC8FF' }}>{acc?.username}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>{o.amount}₽</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{ background: `${statusColor[o.status]}20`, color: statusColor[o.status], borderRadius: '6px', padding: '3px 8px', fontSize: '12px', fontWeight: 600 }}>
                        {statusLabel[o.status]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#7DC8FF', whiteSpace: 'nowrap' }}>{formatDt(o.createdAt)}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          title="Выдать"
                          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', padding: '5px 7px', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Package size={13} />
                        </button>
                        <button
                          title="Написать"
                          style={{ background: 'rgba(0,121,255,0.15)', border: '1px solid rgba(0,121,255,0.3)', borderRadius: '6px', padding: '5px 7px', color: '#7DC8FF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <MessageSquare size={13} />
                        </button>
                        <button
                          title="Детали"
                          onClick={() => setDetailOrder(o)}
                          style={{ background: 'rgba(0,121,255,0.15)', border: '1px solid rgba(0,121,255,0.3)', borderRadius: '6px', padding: '5px 7px', color: '#7DC8FF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Info size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#7DC8FF' }}>
                    Заказы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(0,121,255,0.1)' }}>
          <span style={{ color: '#7DC8FF', fontSize: '13px' }}>
            Показано {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} из {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'rgba(0,121,255,0.1)', border: '1px solid rgba(0,121,255,0.2)', borderRadius: '6px', padding: '6px 14px', color: page === 1 ? '#4b5563' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              ← Назад
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{ background: page === p ? 'linear-gradient(135deg, #007BFF, #0052F4)' : 'rgba(0,121,255,0.1)', border: '1px solid rgba(0,121,255,0.2)', borderRadius: '6px', padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: page === p ? 700 : 400 }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: 'rgba(0,121,255,0.1)', border: '1px solid rgba(0,121,255,0.2)', borderRadius: '6px', padding: '6px 14px', color: page === totalPages ? '#4b5563' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              Вперёд →
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent style={{ background: '#0a1428', border: '1px solid rgba(0,121,255,0.3)', color: '#fff', maxWidth: '520px' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#fff' }}>Детали заказа {detailOrder?.id}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: '#7DC8FF', fontSize: '12px', marginBottom: '4px' }}>Покупатель</div>
                  <div style={{ fontWeight: 600 }}>{detailOrder.buyer}</div>
                </div>
                <div>
                  <div style={{ color: '#7DC8FF', fontSize: '12px', marginBottom: '4px' }}>Сумма</div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#22c55e' }}>{detailOrder.amount}₽</div>
                </div>
                <div>
                  <div style={{ color: '#7DC8FF', fontSize: '12px', marginBottom: '4px' }}>Статус</div>
                  <span style={{ background: `${statusColor[detailOrder.status]}20`, color: statusColor[detailOrder.status], borderRadius: '6px', padding: '3px 10px', fontSize: '13px', fontWeight: 600 }}>
                    {statusLabel[detailOrder.status]}
                  </span>
                </div>
                <div>
                  <div style={{ color: '#7DC8FF', fontSize: '12px', marginBottom: '4px' }}>Дата</div>
                  <div>{formatDt(detailOrder.createdAt)}</div>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ color: '#7DC8FF', fontSize: '12px', marginBottom: '4px' }}>Товар</div>
                  <div style={{ fontWeight: 600 }}>{detailOrder.lot}</div>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ color: '#7DC8FF', fontSize: '12px', marginBottom: '4px' }}>Описание</div>
                  <div style={{ color: '#ccc' }}>{detailOrder.description}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,121,255,0.15)', paddingTop: '16px' }}>
                <div style={{ color: '#7DC8FF', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>Выдать товар</div>
                <textarea
                  value={deliveryText}
                  onChange={e => setDeliveryText(e.target.value)}
                  placeholder="Введите товар для выдачи..."
                  rows={3}
                  style={{ width: '100%', background: 'rgba(0,121,255,0.08)', border: '1px solid rgba(0,121,255,0.2)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button style={{ flex: 1, background: 'linear-gradient(135deg, #007BFF, #0052F4)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <Send size={14} /> Выдать товар
                  </button>
                  <button style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#ef4444' }}>
                    Возврат
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
