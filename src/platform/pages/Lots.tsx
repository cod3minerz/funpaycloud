import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Edit2, ArrowUpCircle, Trash2, Clock, ToggleLeft } from 'lucide-react';
import { lots as initialLots, Lot } from '@/platform/data/demoData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--pf-surface)',
  border: '1px solid var(--pf-border)',
  borderRadius: '12px',
  padding: '20px',
};

const BTN_PRIMARY: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  fontSize: '14px',
};

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Lots() {
  const [lots, setLots] = useState<Lot[]>(initialLots);
  const [search, setSearch] = useState('');
  const [autoRaise, setAutoRaise] = useState(true);
  const [interval, setInterval_] = useState(4);
  const [countdown, setCountdown] = useState(interval * 3600 - 37 * 60 - 43);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [editLot, setEditLot] = useState<Lot | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lot>>({});

  useEffect(() => {
    if (!autoRaise) return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 0) return interval * 3600;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRaise, interval]);

  const filtered = lots.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  function toggleStatus(id: string) {
    setLots(prev => prev.map(l => l.id === id ? { ...l, status: l.status === 'active' ? 'inactive' : 'active' } : l));
  }

  function startEditPrice(lot: Lot) {
    setEditingPriceId(lot.id);
    setPriceInput(String(lot.price));
  }

  function savePrice(id: string) {
    const val = parseInt(priceInput);
    if (!isNaN(val) && val > 0) {
      setLots(prev => prev.map(l => l.id === id ? { ...l, price: val } : l));
    }
    setEditingPriceId(null);
  }

  function openEdit(lot: Lot) {
    setEditLot(lot);
    setEditForm({ ...lot });
  }

  function saveEdit() {
    if (!editLot) return;
    setLots(prev => prev.map(l => l.id === editLot.id ? { ...l, ...editForm } : l));
    setEditLot(null);
  }

  function deleteLot(id: string) {
    setLots(prev => prev.filter(l => l.id !== id));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'var(--font-sans)' }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Мои лоты</h1>

      {/* Auto-raise panel */}
      <div style={{ ...CARD_STYLE, marginBottom: '20px', background: 'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(0,82,244,0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(96,165,250,0.28)', borderRadius: '10px', padding: '10px' }}>
              <ArrowUpCircle size={22} color="var(--pf-accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Автоподнятие лотов</div>
              <div style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Автоматически поднимает все активные лоты</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Интервал: {interval}ч</span>
              <input
                type="range"
                min={1}
                max={24}
                value={interval}
                onChange={e => { setInterval_(+e.target.value); setCountdown(+e.target.value * 3600); }}
                style={{ width: '100px', accentColor: 'var(--pf-accent)' }}
              />
            </div>
            {autoRaise && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.18)', borderRadius: '8px', padding: '6px 12px' }}>
                <Clock size={14} color="var(--pf-text-muted)" />
                <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px', fontFamily: 'monospace' }}>
                  Следующее через {formatTime(countdown)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: autoRaise ? '#22c55e' : 'var(--pf-text-muted)', fontWeight: 600, fontSize: '13px' }}>
                {autoRaise ? 'Включено' : 'Выключено'}
              </span>
              <Switch checked={autoRaise} onCheckedChange={setAutoRaise} />
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ ...CARD_STYLE, marginBottom: '20px', padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={16} color="var(--pf-text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по лотам..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '14px' }}
          />
          <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Найдено: {filtered.length}</span>
        </div>
      </div>

      {/* Lots Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {filtered.map(lot => (
          <div
            key={lot.id}
            style={{
              ...CARD_STYLE,
              padding: '16px',
              border: `1px solid ${lot.status === 'active' ? 'rgba(96,165,250,0.32)' : 'rgba(59,130,246,0.12)'}`,
              opacity: lot.status === 'active' ? 1 : 0.7,
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>{lot.categoryIcon}</span>
                <span style={{ background: 'rgba(59,130,246,0.18)', color: 'var(--pf-text-muted)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
                  {lot.category}
                </span>
              </div>
              <Switch checked={lot.status === 'active'} onCheckedChange={() => toggleStatus(lot.id)} />
            </div>

            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', lineHeight: 1.4 }}>{lot.title}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              {editingPriceId === lot.id ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    onBlur={() => savePrice(lot.id)}
                    onKeyDown={e => e.key === 'Enter' && savePrice(lot.id)}
                    autoFocus
                    style={{ width: '80px', background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(96,165,250,0.44)', borderRadius: '6px', padding: '4px 8px', color: '#fff', fontSize: '16px', fontWeight: 700, outline: 'none' }}
                  />
                  <span style={{ color: 'var(--pf-text-muted)' }}>₽</span>
                </div>
              ) : (
                <div
                  onClick={() => startEditPrice(lot)}
                  style={{ cursor: 'pointer', fontSize: '20px', fontWeight: 700, color: 'var(--pf-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Нажмите для редактирования цены"
                >
                  {lot.price}₽
                  <Edit2 size={13} color="var(--pf-text-muted)" />
                </div>
              )}
            </div>

            <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px', marginBottom: '12px' }}>
              Продаж за месяц: <span style={{ color: '#22c55e', fontWeight: 600 }}>{lot.salesMonth}</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => openEdit(lot)}
                style={{ flex: 1, background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(96,165,250,0.32)', borderRadius: '7px', padding: '7px', color: 'var(--pf-text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
              >
                <Edit2 size={12} /> Ред.
              </button>
              <button
                style={{ flex: 1, background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(96,165,250,0.32)', borderRadius: '7px', padding: '7px', color: 'var(--pf-text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
              >
                <ArrowUpCircle size={12} /> Поднять
              </button>
              <button
                onClick={() => deleteLot(lot.id)}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '7px', padding: '7px 10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Lot Dialog */}
      <Dialog open={!!editLot} onOpenChange={() => setEditLot(null)}>
        <DialogContent style={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.4)', color: '#fff', maxWidth: '560px' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#fff' }}>Редактировать лот</DialogTitle>
          </DialogHeader>
          {editLot && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'var(--pf-text-muted)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Название</label>
                <input
                  value={editForm.title ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ color: 'var(--pf-text-muted)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Описание</label>
                <textarea
                  value={editForm.description ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: 'var(--pf-text-muted)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Цена (₽)</label>
                  <input
                    type="number"
                    value={editForm.price ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, price: +e.target.value }))}
                    style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--pf-text-muted)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Мин. кол-во</label>
                  <input
                    type="number"
                    defaultValue={1}
                    style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ color: 'var(--pf-text-muted)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Авто-выдача (шаблон)</label>
                <textarea
                  value={editForm.autoDelivery ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, autoDelivery: e.target.value }))}
                  rows={2}
                  placeholder="Ключ активации или шаблон..."
                  style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Автоподнятие</span>
                <Switch checked={editForm.status === 'active'} onCheckedChange={v => setEditForm(f => ({ ...f, status: v ? 'active' : 'inactive' }))} />
                <span style={{ color: editForm.status === 'active' ? '#22c55e' : 'var(--pf-text-muted)', fontSize: '13px' }}>
                  {editForm.status === 'active' ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={saveEdit} style={{ flex: 1, background: 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                  Сохранить
                </button>
                <button onClick={() => setEditLot(null)} style={{ flex: 1, background: 'transparent', color: 'var(--pf-text-muted)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                  Отмена
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
