import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpCircle, Bot, Box, Clapperboard, Clock, Edit2, Gamepad2, Megaphone, Music2, Search, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import { Lot, lots as initialLots } from '@/platform/data/demoData';
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

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function LotIcon({ category }: { category: string }) {
  const Icon =
    category === 'Игры'
      ? Gamepad2
      : category === 'SMM'
        ? Megaphone
        : category === 'Музыка'
          ? Music2
          : category === 'Стриминг'
            ? Clapperboard
            : category === 'AI'
              ? Bot
              : Box;

  return (
    <span className="platform-lot-glyph" aria-hidden="true">
      <Icon size={16} />
    </span>
  );
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
      setCountdown(prev => {
        if (prev <= 0) return interval * 3600;
        return prev - 1;
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
    setLots(prev =>
      prev.map(lot => (lot.id === id ? { ...lot, status: lot.status === 'active' ? 'inactive' : 'active' } : lot)),
    );
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Лоты"
            subtitle="Управление ассортиментом, ценой, статусами и автоподнятием в единой операционной панели."
          />
          <Panel className="w-full max-w-[360px] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
                <ArrowUpCircle size={15} color="var(--pf-text-muted)" />
                Автоподнятие
              </div>
              <Switch checked={autoRaise} onCheckedChange={setAutoRaise} />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="platform-kpi-meta">Интервал</span>
              <input
                type="range"
                min={1}
                max={24}
                value={interval}
                onChange={event => {
                  const next = Number(event.target.value);
                  setIntervalHours(next);
                  setCountdown(next * 3600);
                }}
                style={{ width: 130, accentColor: 'var(--pf-accent)' }}
              />
              <span className="text-[12px] font-semibold">{interval}ч</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-2 text-[12px] text-[var(--pf-text-muted)]">
              <Clock size={12} />
              {autoRaise ? `Следующее поднятие через ${formatTime(countdown)}` : 'Автоподнятие выключено'}
            </div>
          </Panel>
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={14} color="var(--pf-text-dim)" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск по лотам" />
            </label>

            <select
              className="platform-select"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
              style={{ maxWidth: 200 }}
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>

            <span className="platform-chip">Найдено: {filtered.length}</span>
          </ToolbarRow>
        </SectionCard>

        <SectionCard className="p-0">
          <div className="platform-desktop-table">
            <DataTableWrap className="tablet-dense-scroll">
              <table className="platform-table" style={{ minWidth: 840 }}>
                <thead>
                  <tr>
                    <th style={{ width: 340 }}>Лот</th>
                    <th className="platform-col-tablet-hide">Категория</th>
                    <th style={{ textAlign: 'right' }}>Цена</th>
                    <th className="platform-col-tablet-hide" style={{ textAlign: 'right' }}>
                      Продажи / мес
                    </th>
                    <th>Статус</th>
                    <th style={{ textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lot => (
                    <tr key={lot.id}>
                      <td>
                        <div className="flex items-start gap-3">
                          <LotIcon category={lot.category} />
                          <div>
                            <div className="font-semibold">{lot.title}</div>
                            <div className="text-[12px] text-[var(--pf-text-muted)]">{lot.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="platform-col-tablet-hide">
                        <span className="platform-chip">{lot.category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{lot.price} ₽</td>
                      <td className="platform-col-tablet-hide" style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>
                        {lot.salesMonth}
                      </td>
                      <td>
                        <div className="inline-flex items-center gap-2">
                          <Switch checked={lot.status === 'active'} onCheckedChange={() => toggleStatus(lot.id)} />
                          <span className={lot.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                            {lot.status === 'active' ? 'Активен' : 'Неактивен'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="inline-flex w-full items-center justify-end gap-2">
                          <button className="platform-topbar-btn" onClick={() => openEdit(lot)} title="Редактировать">
                            <Edit2 size={14} />
                          </button>
                          <button className="platform-topbar-btn" title="Поднять">
                            <ArrowUpCircle size={14} />
                          </button>
                          <button className="platform-topbar-btn" onClick={() => deleteLot(lot.id)} title="Удалить">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableWrap>
          </div>

          <div className="platform-mobile-cards">
            {filtered.map(lot => (
              <article key={lot.id} className="platform-mobile-card">
                <div className="platform-mobile-card-head">
                  <div className="inline-flex min-w-0 items-start gap-2">
                    <LotIcon category={lot.category} />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold">{lot.title}</div>
                      <div className="text-[12px] text-[var(--pf-text-muted)]">{lot.category}</div>
                    </div>
                  </div>
                  <span className={lot.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                    {lot.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </div>

                <div className="platform-mobile-meta">
                  <span>Цена: {lot.price} ₽</span>
                  <span>Продажи / мес: {lot.salesMonth}</span>
                  <span>{lot.description}</span>
                </div>

                <div className="platform-mobile-actions platform-mobile-action-grid">
                  <button className="platform-btn-secondary" onClick={() => openEdit(lot)}>
                    <Edit2 size={14} /> Редактировать
                  </button>
                  <button className="platform-btn-secondary" onClick={() => toggleStatus(lot.id)}>
                    {lot.status === 'active' ? 'Отключить' : 'Включить'}
                  </button>
                  <button className="platform-topbar-btn" onClick={() => deleteLot(lot.id)} title="Удалить">
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && <EmptyState>Лоты по текущим фильтрам не найдены.</EmptyState>}
        </SectionCard>
      </PageShell>

      <Dialog open={!!editLot} onOpenChange={() => setEditLot(null)}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: 560 }}>
          <DialogHeader>
            <DialogTitle>Редактировать лот</DialogTitle>
          </DialogHeader>
          {editLot && (
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Название</label>
                <input
                  className="platform-input"
                  value={editForm.title ?? ''}
                  onChange={event => setEditForm(prev => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Описание</label>
                <textarea
                  className="platform-textarea"
                  value={editForm.description ?? ''}
                  onChange={event => setEditForm(prev => ({ ...prev, description: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Цена</label>
                  <input
                    className="platform-input"
                    type="number"
                    value={editForm.price ?? ''}
                    onChange={event => setEditForm(prev => ({ ...prev, price: Number(event.target.value) }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Статус</label>
                  <select
                    className="platform-select"
                    value={editForm.status ?? 'inactive'}
                    onChange={event => setEditForm(prev => ({ ...prev, status: event.target.value as Lot['status'] }))}
                  >
                    <option value="active">Активен</option>
                    <option value="inactive">Неактивен</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Автовыдача</label>
                <textarea
                  className="platform-textarea"
                  value={editForm.autoDelivery ?? ''}
                  onChange={event => setEditForm(prev => ({ ...prev, autoDelivery: event.target.value }))}
                  rows={2}
                />
              </div>
              <div className="mt-1 flex gap-2">
                <button className="platform-btn-secondary" style={{ flex: 1 }} onClick={() => setEditLot(null)}>
                  Отмена
                </button>
                <button className="platform-btn-primary" style={{ flex: 1 }} onClick={saveEdit}>
                  Сохранить
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
