import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpCircle, Clock, Edit2, Search, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import { lots as initialLots, Lot } from '@/platform/data/demoData';

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Lots() {
  const [lots, setLots] = useState<Lot[]>(initialLots);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [autoRaise, setAutoRaise] = useState(true);
  const [interval, setIntervalHours] = useState(4);
  const [countdown, setCountdown] = useState(interval * 3600 - 37 * 60 - 43);
  const [editLot, setEditLot] = useState<Lot | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lot>>({});

  useEffect(() => {
    if (!autoRaise) return;
    const timer = setInterval(() => {
      setCountdown(current => {
        if (current <= 0) return interval * 3600;
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRaise, interval]);

  const filtered = useMemo(() => {
    return lots.filter(lot => {
      if (statusFilter !== 'all' && lot.status !== statusFilter) return false;
      if (search && !`${lot.title} ${lot.category}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [lots, search, statusFilter]);

  function toggleStatus(id: string) {
    setLots(prev => prev.map(lot => (lot.id === id ? { ...lot, status: lot.status === 'active' ? 'inactive' : 'active' } : lot)));
  }

  function openEdit(lot: Lot) {
    setEditLot(lot);
    setEditForm({ ...lot });
  }

  function saveEdit() {
    if (!editLot) return;
    setLots(prev => prev.map(lot => (lot.id === editLot.id ? { ...lot, ...editForm } : lot)));
    setEditLot(null);
  }

  function deleteLot(id: string) {
    setLots(prev => prev.filter(lot => lot.id !== id));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'var(--font-sans)' }}
    >
      <section className="platform-card" style={{ marginBottom: 16 }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="platform-page-title">Лоты</h1>
            <p className="platform-page-subtitle">Управление прайсом, статусами и автоподнятием в единой панели.</p>
          </div>

          <div className="platform-panel" style={{ padding: 12, minWidth: 340 }}>
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <ArrowUpCircle size={15} color="var(--pf-text-muted)" />
                <span style={{ fontWeight: 700, fontSize: 13 }}>Автоподнятие</span>
              </div>
              <Switch checked={autoRaise} onCheckedChange={setAutoRaise} />
            </div>

            <div className="flex items-center gap-3" style={{ marginTop: 10 }}>
              <span style={{ color: 'var(--pf-text-muted)', fontSize: 12 }}>Интервал</span>
              <input
                type="range"
                min={1}
                max={24}
                value={interval}
                onChange={e => {
                  const next = Number(e.target.value);
                  setIntervalHours(next);
                  setCountdown(next * 3600);
                }}
                style={{ width: 130, accentColor: 'var(--pf-accent)' }}
              />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{interval}ч</span>
            </div>

            <div className="flex items-center gap-2" style={{ marginTop: 8, color: 'var(--pf-text-muted)', fontSize: 12 }}>
              <Clock size={13} />
              <span>{autoRaise ? `Следующее поднятие через ${formatTime(countdown)}` : 'Автоподнятие выключено'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="platform-card" style={{ marginBottom: 16 }}>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="platform-search max-w-none" style={{ minHeight: 40 }}>
            <Search size={15} color="var(--pf-text-dim)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по лотам" aria-label="Поиск лота" />
          </label>

          <select className="platform-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} style={{ minWidth: 180 }}>
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>

          <button className="platform-btn-secondary">Найдено: {filtered.length}</button>
        </div>
      </section>

      <section className="platform-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="platform-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 340 }}>Лот</th>
                <th>Категория</th>
                <th style={{ textAlign: 'right' }}>Цена</th>
                <th style={{ textAlign: 'right' }}>Продажи / мес</th>
                <th>Статус</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lot => (
                <tr key={lot.id}>
                  <td>
                    <div className="flex items-start gap-3">
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{lot.categoryIcon}</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{lot.title}</div>
                        <div style={{ color: 'var(--pf-text-muted)', fontSize: 12 }}>{lot.description}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="platform-chip">{lot.category}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{lot.price} ₽</td>
                  <td style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>{lot.salesMonth}</td>
                  <td>
                    <div className="inline-flex items-center gap-2">
                      <Switch checked={lot.status === 'active'} onCheckedChange={() => toggleStatus(lot.id)} />
                      <span className={lot.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                        {lot.status === 'active' ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="inline-flex items-center gap-2">
                      <button className="platform-topbar-btn" title="Редактировать" onClick={() => openEdit(lot)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="platform-topbar-btn" title="Поднять" style={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.4)' }}>
                        <ArrowUpCircle size={14} />
                      </button>
                      <button className="platform-topbar-btn" title="Удалить" style={{ color: '#fb7185', borderColor: 'rgba(251,113,133,0.35)' }} onClick={() => deleteLot(lot.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '34px 12px', color: 'var(--pf-text-muted)' }}>
                    По текущим фильтрам лоты не найдены.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={!!editLot} onOpenChange={() => setEditLot(null)}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: '560px' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#fff' }}>Редактировать лот</DialogTitle>
          </DialogHeader>

          {editLot && (
            <div className="grid gap-3">
              <div>
                <label style={{ color: 'var(--pf-text-muted)', fontSize: 13, display: 'block', marginBottom: 6 }}>Название</label>
                <input
                  className="platform-input"
                  value={editForm.title ?? ''}
                  onChange={e => setEditForm(form => ({ ...form, title: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ color: 'var(--pf-text-muted)', fontSize: 13, display: 'block', marginBottom: 6 }}>Описание</label>
                <textarea
                  className="platform-textarea"
                  value={editForm.description ?? ''}
                  onChange={e => setEditForm(form => ({ ...form, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label style={{ color: 'var(--pf-text-muted)', fontSize: 13, display: 'block', marginBottom: 6 }}>Цена (₽)</label>
                  <input
                    className="platform-input"
                    type="number"
                    value={editForm.price ?? ''}
                    onChange={e => setEditForm(form => ({ ...form, price: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--pf-text-muted)', fontSize: 13, display: 'block', marginBottom: 6 }}>Статус</label>
                  <select
                    className="platform-select"
                    value={editForm.status ?? 'inactive'}
                    onChange={e => setEditForm(form => ({ ...form, status: e.target.value as Lot['status'] }))}
                  >
                    <option value="active">Активен</option>
                    <option value="inactive">Неактивен</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ color: 'var(--pf-text-muted)', fontSize: 13, display: 'block', marginBottom: 6 }}>Автовыдача (шаблон)</label>
                <textarea
                  className="platform-textarea"
                  value={editForm.autoDelivery ?? ''}
                  onChange={e => setEditForm(form => ({ ...form, autoDelivery: e.target.value }))}
                  placeholder="Ключ активации или шаблон"
                  rows={2}
                />
              </div>

              <div className="flex gap-2" style={{ marginTop: 4 }}>
                <button className="platform-btn-secondary" style={{ flex: 1 }} onClick={() => setEditLot(null)}>Отмена</button>
                <button className="platform-btn-primary" style={{ flex: 1 }} onClick={saveEdit}>Сохранить</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
