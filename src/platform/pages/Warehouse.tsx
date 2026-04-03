import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Download, AlertTriangle, XCircle, Upload } from 'lucide-react';
import { warehouseLots as initialWL, WarehouseLot, WarehouseItem } from '@/platform/data/demoData';
import { Switch } from '@/app/components/ui/switch';

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--pf-surface)',
  border: '1px solid var(--pf-border)',
  borderRadius: '12px',
  padding: '20px',
};

function maskValue(v: string) {
  if (v.length <= 4) return v + '***';
  return v.slice(0, 4) + '***';
}

export default function Warehouse() {
  const [lots, setLots] = useState<WarehouseLot[]>(initialWL);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(initialWL[0]?.lotId ?? null);
  const [addTab, setAddTab] = useState<'single' | 'list' | 'file'>('single');
  const [singleInput, setSingleInput] = useState('');
  const [listInput, setListInput] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const selectedLot = lots.find(l => l.lotId === selectedLotId) ?? null;

  const available = selectedLot ? selectedLot.items.filter(i => i.status === 'available').length : 0;
  const delivered = selectedLot ? selectedLot.items.filter(i => i.status === 'delivered').length : 0;

  function addSingle() {
    if (!singleInput.trim() || !selectedLotId) return;
    const item: WarehouseItem = { id: `wi-${Date.now()}`, value: singleInput.trim(), status: 'available' };
    setLots(prev => prev.map(l => l.lotId === selectedLotId ? { ...l, items: [...l.items, item] } : l));
    setSingleInput('');
  }

  function addList() {
    if (!listInput.trim() || !selectedLotId) return;
    const lines = listInput.split('\n').map(s => s.trim()).filter(Boolean);
    const items: WarehouseItem[] = lines.map((v, i) => ({ id: `wi-${Date.now()}-${i}`, value: v, status: 'available' }));
    setLots(prev => prev.map(l => l.lotId === selectedLotId ? { ...l, items: [...l.items, ...items] } : l));
    setListInput('');
  }

  function updateTemplate(val: string) {
    if (!selectedLotId) return;
    setLots(prev => prev.map(l => l.lotId === selectedLotId ? { ...l, messageTemplate: val } : l));
  }

  function toggleAutoDelivery(val: boolean) {
    if (!selectedLotId) return;
    setLots(prev => prev.map(l => l.lotId === selectedLotId ? { ...l, autoDeliveryEnabled: val } : l));
  }

  function livePreview(template: string) {
    return template
      .replace('{товар}', 'SAMPLE-KEY-1234')
      .replace('{имя_покупателя}', 'dmitry_k')
      .replace('{номер_заказа}', 'ORD-1001');
  }

  function availableBadgeColor(count: number) {
    if (count === 0) return '#ef4444';
    if (count < 10) return '#eab308';
    return '#22c55e';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'var(--font-sans)' }}
    >
      {/* Left panel */}
      <div style={{ width: '260px', minWidth: '260px', borderRight: '1px solid var(--pf-border)', background: 'var(--pf-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(59,130,246,0.14)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Склад товаров</h2>
          <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px', marginTop: '4px' }}>{lots.length} лотов со складом</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {lots.map(lot => {
            const avail = lot.items.filter(i => i.status === 'available').length;
            return (
              <div
                key={lot.lotId}
                onClick={() => setSelectedLotId(lot.lotId)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(59,130,246,0.08)',
                  background: selectedLotId === lot.lotId ? 'rgba(59,130,246,0.14)' : 'transparent',
                  borderLeft: `3px solid ${selectedLotId === lot.lotId ? 'var(--pf-accent)' : 'transparent'}`,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', lineHeight: 1.3 }}>{lot.lotTitle}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: `${availableBadgeColor(avail)}20`, color: availableBadgeColor(avail), borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                    {avail} доступно
                  </span>
                  {lot.autoDeliveryEnabled && (
                    <span style={{ background: 'rgba(59,130,246,0.18)', color: 'var(--pf-text-muted)', borderRadius: '12px', padding: '2px 6px', fontSize: '10px', fontWeight: 600 }}>
                      авто
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', minWidth: 0 }}>
        {!selectedLot ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--pf-text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Выберите лот</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{selectedLot.lotTitle}</h1>
                <div style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>
                  Доступно: <span style={{ color: '#22c55e', fontWeight: 700 }}>{available}</span> / Выдано: <span style={{ color: 'var(--pf-text-muted)', fontWeight: 700 }}>{delivered}</span>
                </div>
              </div>
              <button
                style={{ background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', padding: '8px 14px', color: 'var(--pf-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
              >
                <Download size={14} /> Скачать выданные
              </button>
            </div>

            {/* Alerts */}
            {available === 0 && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={18} color="#ef4444" />
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Товары закончились! Добавьте новые товары на склад.</span>
              </div>
            )}
            {available > 0 && available < 10 && (
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} color="#eab308" />
                <span style={{ color: '#eab308', fontWeight: 600 }}>Осталось мало товаров! Пополните склад.</span>
              </div>
            )}

            {/* Add items section */}
            <div style={{ ...CARD_STYLE, marginBottom: '20px' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="var(--pf-accent)" /> Добавить товары
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {(['single', 'list', 'file'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setAddTab(tab)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '7px',
                      border: addTab === tab ? 'none' : '1px solid rgba(96,165,250,0.28)',
                      background: addTab === tab ? 'linear-gradient(135deg, #007BFF, var(--pf-accent-2))' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {tab === 'single' ? 'По одному' : tab === 'list' ? 'Списком' : 'Файл'}
                  </button>
                ))}
              </div>

              {addTab === 'single' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    value={singleInput}
                    onChange={e => setSingleInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSingle()}
                    placeholder="Введите товар (ключ, аккаунт, etc.)..."
                    style={{ flex: 1, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                  <button onClick={addSingle} style={{ background: 'linear-gradient(135deg, #007BFF, var(--pf-accent-2))', border: 'none', borderRadius: '8px', padding: '10px 18px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                    Добавить
                  </button>
                </div>
              )}

              {addTab === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={listInput}
                    onChange={e => setListInput(e.target.value)}
                    placeholder="Введите по одному товару на строку..."
                    rows={5}
                    style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <button onClick={addList} style={{ alignSelf: 'flex-start', background: 'linear-gradient(135deg, #007BFF, var(--pf-accent-2))', border: 'none', borderRadius: '8px', padding: '10px 18px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                    Добавить список
                  </button>
                </div>
              )}

              {addTab === 'file' && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); }}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--pf-accent)' : 'rgba(96,165,250,0.4)'}`,
                    borderRadius: '10px',
                    padding: '40px',
                    textAlign: 'center',
                    background: dragOver ? 'rgba(59,130,246,0.12)' : 'transparent',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={32} color="var(--pf-text-muted)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>Перетащите файл сюда</div>
                  <div style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Поддерживаются .txt и .csv файлы (каждый товар на новой строке)</div>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div style={{ ...CARD_STYLE, marginBottom: '20px' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '14px' }}>Товары на складе</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: 'var(--pf-text-muted)', borderBottom: '1px solid rgba(59,130,246,0.18)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500, width: '48px' }}>#</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>Товар</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 500 }}>Статус</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 500 }}>Дата выдачи</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLot.items.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                        <td style={{ padding: '10px 10px', color: 'var(--pf-text-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: '13px' }}>{maskValue(item.value)}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                          <span style={{
                            background: item.status === 'available' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.18)',
                            color: item.status === 'available' ? '#22c55e' : 'var(--pf-text-muted)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}>
                            {item.status === 'available' ? 'Доступен' : 'Выдан'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', color: 'var(--pf-text-muted)' }}>
                          {item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString('ru-RU') + ' ' + new Date(item.deliveredAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auto-delivery settings */}
            <div style={CARD_STYLE}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>Настройки авто-выдачи</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Switch checked={selectedLot.autoDeliveryEnabled} onCheckedChange={toggleAutoDelivery} />
                <span style={{ color: selectedLot.autoDeliveryEnabled ? '#22c55e' : 'var(--pf-text-muted)', fontWeight: 600 }}>
                  Авто-выдача {selectedLot.autoDeliveryEnabled ? 'включена' : 'выключена'}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'var(--pf-text-muted)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Шаблон сообщения
                  <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(59,130,246,0.18)', borderRadius: '4px', padding: '2px 6px' }}>
                    {'{'+'товар'+'}'} {'{'+'имя_покупателя'+'}'} {'{'+'номер_заказа'+'}'}
                  </span>
                </label>
                <textarea
                  value={selectedLot.messageTemplate}
                  onChange={e => updateTemplate(e.target.value)}
                  rows={4}
                  style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <div style={{ color: 'var(--pf-text-muted)', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>Предпросмотр:</div>
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '8px', padding: '12px', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {livePreview(selectedLot.messageTemplate)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
