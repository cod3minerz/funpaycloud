import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Download, Plus, Upload, XCircle } from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';
import { WarehouseItem, WarehouseLot, warehouseLots as initialWarehouseLots } from '@/platform/data/demoData';
import {
  DataTableWrap,
  EmptyState,
  KpiCard,
  KpiGrid,
  PageHeader,
  PageShell,
  PageTitle,
  Panel,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

function maskValue(value: string) {
  if (value.length <= 4) return `${value}***`;
  return `${value.slice(0, 4)}***`;
}

export default function Warehouse() {
  const [lots, setLots] = useState<WarehouseLot[]>(initialWarehouseLots);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(initialWarehouseLots[0]?.lotId ?? null);
  const [addTab, setAddTab] = useState<'single' | 'list' | 'file'>('single');
  const [singleInput, setSingleInput] = useState('');
  const [listInput, setListInput] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const selectedLot = useMemo(() => lots.find(lot => lot.lotId === selectedLotId) ?? null, [lots, selectedLotId]);
  const available = selectedLot ? selectedLot.items.filter(item => item.status === 'available').length : 0;
  const delivered = selectedLot ? selectedLot.items.filter(item => item.status === 'delivered').length : 0;

  function addSingle() {
    if (!singleInput.trim() || !selectedLotId) return;
    const item: WarehouseItem = { id: `wi-${Date.now()}`, value: singleInput.trim(), status: 'available' };
    setLots(prev => prev.map(lot => (lot.lotId === selectedLotId ? { ...lot, items: [...lot.items, item] } : lot)));
    setSingleInput('');
  }

  function addList() {
    if (!listInput.trim() || !selectedLotId) return;
    const lines = listInput
      .split('\n')
      .map(row => row.trim())
      .filter(Boolean);
    const items: WarehouseItem[] = lines.map((value, idx) => ({
      id: `wi-${Date.now()}-${idx}`,
      value,
      status: 'available',
    }));
    setLots(prev => prev.map(lot => (lot.lotId === selectedLotId ? { ...lot, items: [...lot.items, ...items] } : lot)));
    setListInput('');
  }

  function updateTemplate(nextTemplate: string) {
    if (!selectedLotId) return;
    setLots(prev => prev.map(lot => (lot.lotId === selectedLotId ? { ...lot, messageTemplate: nextTemplate } : lot)));
  }

  function toggleAutoDelivery(nextValue: boolean) {
    if (!selectedLotId) return;
    setLots(prev =>
      prev.map(lot => (lot.lotId === selectedLotId ? { ...lot, autoDeliveryEnabled: nextValue } : lot)),
    );
  }

  function livePreview(template: string) {
    return template
      .replace('{товар}', 'SAMPLE-KEY-1234')
      .replace('{имя_покупателя}', 'dmitry_k')
      .replace('{номер_заказа}', 'ORD-1001');
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Склад"
            subtitle="Управление остатками и авто-выдачей в единой структуре: лоты, пополнение и шаблоны сообщений."
          />
          <span className="platform-chip">Лотов на складе: {lots.length}</span>
        </PageHeader>

        {selectedLot && (
          <KpiGrid>
            <KpiCard>
              <div className="text-[13px] font-semibold">Доступно</div>
              <strong className="text-[26px] text-[#4ade80]">{available}</strong>
              <span className="platform-kpi-meta">Товаров готово к выдаче</span>
            </KpiCard>
            <KpiCard>
              <div className="text-[13px] font-semibold">Выдано</div>
              <strong className="text-[26px]">{delivered}</strong>
              <span className="platform-kpi-meta">Успешно доставлено</span>
            </KpiCard>
            <KpiCard>
              <div className="text-[13px] font-semibold">Авто-выдача</div>
              <strong className="text-[22px]">{selectedLot.autoDeliveryEnabled ? 'Включена' : 'Выключена'}</strong>
              <span className="platform-kpi-meta">Текущий режим</span>
            </KpiCard>
            <KpiCard>
              <div className="text-[13px] font-semibold">Записей</div>
              <strong className="text-[26px]">{selectedLot.items.length}</strong>
              <span className="platform-kpi-meta">Всего в выбранном лоте</span>
            </KpiCard>
          </KpiGrid>
        )}

        <div className="platform-split-grid">
          <SectionCard className="p-0">
            <div className="border-b border-[var(--pf-border)] px-4 py-3">
              <h2 className="m-0 text-[15px] font-bold">Лоты склада</h2>
              <div className="mt-1 text-[12px] text-[var(--pf-text-muted)]">Выберите лот для управления остатками</div>
            </div>
            <div className="grid max-h-[640px] overflow-y-auto">
              {lots.map(lot => {
                const lotAvailable = lot.items.filter(item => item.status === 'available').length;
                const isActive = selectedLotId === lot.lotId;
                return (
                  <button
                    key={lot.lotId}
                    className="border-b border-[rgba(148,163,184,0.12)] px-4 py-3 text-left"
                    style={{
                      background: isActive ? 'rgba(91,140,255,0.16)' : 'transparent',
                      borderLeft: isActive ? '3px solid #5b8cff' : '3px solid transparent',
                    }}
                    onClick={() => setSelectedLotId(lot.lotId)}
                  >
                    <div className="text-[13px] font-semibold">{lot.lotTitle}</div>
                    <div className="mt-1 inline-flex items-center gap-2">
                      <span
                        className="platform-chip !min-h-[20px] !text-[10px]"
                        style={{ color: lotAvailable < 1 ? '#fb7185' : lotAvailable < 10 ? '#fbbf24' : '#4ade80' }}
                      >
                        {lotAvailable} доступно
                      </span>
                      {lot.autoDeliveryEnabled && <span className="platform-chip !min-h-[20px] !text-[10px]">авто</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <div className="platform-stack">
            {!selectedLot ? (
              <SectionCard>
                <EmptyState>Выберите лот, чтобы открыть управление складом.</EmptyState>
              </SectionCard>
            ) : (
              <>
                <SectionCard>
                  <ToolbarRow className="justify-between">
                    <div>
                      <h2 className="m-0 text-[18px] font-extrabold">{selectedLot.lotTitle}</h2>
                      <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">
                        Доступно: <strong className="text-[#4ade80]">{available}</strong> · Выдано:{' '}
                        <strong>{delivered}</strong>
                      </div>
                    </div>
                    <button className="platform-btn-secondary">
                      <Download size={14} /> Скачать выданные
                    </button>
                  </ToolbarRow>
                </SectionCard>

                {available === 0 && (
                  <SectionCard className="border-[rgba(251,113,133,0.4)] bg-[rgba(251,113,133,0.08)]">
                    <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#fb7185]">
                      <XCircle size={15} /> Товары закончились. Пополните склад, чтобы не терять заказы.
                    </div>
                  </SectionCard>
                )}

                {available > 0 && available < 10 && (
                  <SectionCard className="border-[rgba(251,191,36,0.36)] bg-[rgba(251,191,36,0.08)]">
                    <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#fbbf24]">
                      <AlertTriangle size={15} /> Осталось мало товаров. Рекомендуется пополнение.
                    </div>
                  </SectionCard>
                )}

                <SectionCard>
                  <h3 className="m-0 text-[15px] font-bold">Добавить товары</h3>
                  <ToolbarRow className="mt-3 platform-toolbar-scroll">
                    {(['single', 'list', 'file'] as const).map(tab => (
                      <button
                        key={tab}
                        className={addTab === tab ? 'platform-btn-primary' : 'platform-btn-secondary'}
                        style={{ minHeight: 34 }}
                        onClick={() => setAddTab(tab)}
                      >
                        {tab === 'single' ? 'По одному' : tab === 'list' ? 'Списком' : 'Файл'}
                      </button>
                    ))}
                  </ToolbarRow>

                  {addTab === 'single' && (
                    <div className="mt-3 grid gap-2 sm:flex">
                      <input
                        className="platform-input"
                        value={singleInput}
                        onChange={event => setSingleInput(event.target.value)}
                        onKeyDown={event => event.key === 'Enter' && addSingle()}
                        placeholder="Введите товар (ключ, аккаунт и т.д.)"
                      />
                      <button className="platform-btn-primary" onClick={addSingle}>
                        <Plus size={14} /> Добавить
                      </button>
                    </div>
                  )}

                  {addTab === 'list' && (
                    <div className="mt-3 grid gap-2">
                      <textarea
                        className="platform-textarea"
                        rows={5}
                        value={listInput}
                        onChange={event => setListInput(event.target.value)}
                        placeholder="Введите по одному товару на строку"
                      />
                      <button className="platform-btn-primary w-fit" onClick={addList}>
                        Добавить список
                      </button>
                    </div>
                  )}

                  {addTab === 'file' && (
                    <div
                      className="mt-3 rounded-[12px] border-2 border-dashed p-8 text-center"
                      style={{
                        borderColor: dragOver ? '#5b8cff' : 'rgba(96,165,250,0.44)',
                        background: dragOver ? 'rgba(91,140,255,0.12)' : 'transparent',
                      }}
                      onDragOver={event => {
                        event.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={event => {
                        event.preventDefault();
                        setDragOver(false);
                      }}
                    >
                      <Upload size={30} className="mx-auto mb-3 text-[var(--pf-text-muted)]" />
                      <div className="font-semibold">Перетащите файл сюда</div>
                      <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">
                        Поддерживаются `.txt` и `.csv` (каждая строка = один товар)
                      </div>
                    </div>
                  )}
                </SectionCard>

                <SectionCard className="p-0">
                  <Panel className="m-4 p-0">
                    <h3 className="m-0 px-4 pt-4 text-[15px] font-bold">Товары на складе</h3>
                    <div className="platform-desktop-table">
                      <DataTableWrap className="tablet-dense-scroll">
                        <table className="platform-table" style={{ minWidth: 720 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 54 }}>#</th>
                              <th>Товар</th>
                              <th>Статус</th>
                              <th className="platform-col-tablet-hide" style={{ textAlign: 'right' }}>
                                Дата выдачи
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLot.items.map((item, idx) => (
                              <tr key={item.id}>
                                <td>{idx + 1}</td>
                                <td className="font-mono">{maskValue(item.value)}</td>
                                <td>
                                  <span className={item.status === 'available' ? 'badge-active' : 'badge-inactive'}>
                                    {item.status === 'available' ? 'Доступен' : 'Выдан'}
                                  </span>
                                </td>
                                <td className="platform-col-tablet-hide" style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>
                                  {item.deliveredAt
                                    ? `${new Date(item.deliveredAt).toLocaleDateString('ru-RU')} ${new Date(item.deliveredAt).toLocaleTimeString('ru-RU', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}`
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </DataTableWrap>
                    </div>

                    <div className="platform-mobile-cards">
                      {selectedLot.items.map((item, idx) => (
                        <article key={item.id} className="platform-mobile-card">
                          <div className="platform-mobile-card-head">
                            <strong>#{idx + 1}</strong>
                            <span className={item.status === 'available' ? 'badge-active' : 'badge-inactive'}>
                              {item.status === 'available' ? 'Доступен' : 'Выдан'}
                            </span>
                          </div>
                          <div className="text-[13px] font-mono">{maskValue(item.value)}</div>
                          <div className="platform-mobile-meta">
                            <span>
                              {item.deliveredAt
                                ? `Выдан: ${new Date(item.deliveredAt).toLocaleDateString('ru-RU')} ${new Date(item.deliveredAt).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                                : 'Дата выдачи: —'}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </Panel>
                </SectionCard>

                <SectionCard>
                  <ToolbarRow className="justify-between">
                    <h3 className="m-0 text-[15px] font-bold">Авто-выдача</h3>
                    <div className="inline-flex items-center gap-2">
                      <Switch checked={selectedLot.autoDeliveryEnabled} onCheckedChange={toggleAutoDelivery} />
                      <span className="text-[13px] font-semibold text-[var(--pf-text-muted)]">
                        {selectedLot.autoDeliveryEnabled ? 'Включена' : 'Выключена'}
                      </span>
                    </div>
                  </ToolbarRow>

                  <div className="mt-3">
                    <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">
                      Шаблон сообщения ({'{товар}'} {'{имя_покупателя}'} {'{номер_заказа}'})
                    </label>
                    <textarea
                      className="platform-textarea"
                      rows={4}
                      value={selectedLot.messageTemplate}
                      onChange={event => updateTemplate(event.target.value)}
                    />
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 text-[13px] text-[var(--pf-text-muted)]">Предпросмотр</div>
                    <Panel className="whitespace-pre-wrap p-3 font-mono text-[13px] text-[var(--pf-text-muted)]">
                      {livePreview(selectedLot.messageTemplate)}
                    </Panel>
                  </div>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </PageShell>
    </motion.div>
  );
}
