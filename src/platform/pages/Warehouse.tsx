'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Download, Loader2, Plus, Save, Upload, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/app/components/ui/switch';
import { accountsApi, ApiAccount, ApiWarehouseItem, ApiWarehouseLot, warehouseApi } from '@/lib/api';
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
  if (!value) return '***';
  if (value.length <= 4) return `${value}***`;
  return `${value.slice(0, 4)}***`;
}

function csvEscape(value: string | number) {
  const stringified = String(value ?? '');
  if (/[",\n]/.test(stringified)) return `"${stringified.replace(/"/g, '""')}"`;
  return stringified;
}

export default function Warehouse() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState<ApiWarehouseLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const [addTab, setAddTab] = useState<'single' | 'list' | 'file'>('single');
  const [singleInput, setSingleInput] = useState('');
  const [listInput, setListInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(false);

  const [templateDraft, setTemplateDraft] = useState('');
  const [autoDeliveryDraft, setAutoDeliveryDraft] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadAccounts() {
    try {
      const rows = await accountsApi.list();
      const safe = Array.isArray(rows) ? rows : [];
      setAccounts(safe);
    } catch {
      setAccounts([]);
    }
  }

  async function loadLots(selectedAccount?: string) {
    setLoading(true);
    try {
      const accountID = selectedAccount && selectedAccount !== 'all' ? Number(selectedAccount) : undefined;
      const rows = await warehouseApi.list(accountID);
      const safe = Array.isArray(rows)
        ? rows.map(row => ({
            ...row,
            stock_items: Array.isArray(row.stock_items) ? row.stock_items : [],
            auto_delivery_template: row.auto_delivery_template || '',
            account_username: row.account_username || `ID ${row.funpay_account_id}`,
          }))
        : [];
      setLots(safe);

      if (safe.length === 0) {
        setSelectedLotId(null);
        return;
      }

      setSelectedLotId(prev => (prev && safe.some(lot => lot.id === prev) ? prev : safe[0].id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки склада');
      setLots([]);
      setSelectedLotId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadLots(accountFilter);
  }, [accountFilter]);

  const selectedLot = useMemo(
    () => lots.find(lot => lot.id === selectedLotId) ?? null,
    [lots, selectedLotId],
  );

  useEffect(() => {
    if (!selectedLot) {
      setTemplateDraft('');
      setAutoDeliveryDraft(false);
      return;
    }
    setTemplateDraft(selectedLot.auto_delivery_template || '');
    setAutoDeliveryDraft(Boolean(selectedLot.auto_delivery_enabled));
  }, [selectedLot]);

  const available = useMemo(
    () => (selectedLot ? selectedLot.stock_items.filter(item => item.status === 'available').length : 0),
    [selectedLot],
  );

  const delivered = useMemo(
    () => (selectedLot ? selectedLot.stock_items.filter(item => item.status === 'delivered').length : 0),
    [selectedLot],
  );

  async function addItems(rawItems: string[]) {
    if (!selectedLot) {
      toast.error('Выберите лот');
      return;
    }

    const items = rawItems.map(item => item.trim()).filter(Boolean);
    if (items.length === 0) {
      toast.error('Введите товары для добавления');
      return;
    }

    setAdding(true);
    try {
      await warehouseApi.addItems(selectedLot.id, items);
      toast.success(`Добавлено позиций: ${items.length}`);
      setSingleInput('');
      setListInput('');
      await loadLots(accountFilter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка пополнения склада');
    } finally {
      setAdding(false);
    }
  }

  async function saveSettings() {
    if (!selectedLot) return;

    setSavingSettings(true);
    try {
      await warehouseApi.updateSettings(selectedLot.id, {
        auto_delivery_enabled: autoDeliveryDraft,
        auto_delivery_template: templateDraft,
      });
      toast.success('Настройки авто-выдачи сохранены');
      await loadLots(accountFilter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения настроек');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleFileImport(file: File) {
    try {
      const text = await file.text();
      const rows = text.split(/\r?\n/).map(row => row.trim()).filter(Boolean);
      if (rows.length === 0) {
        toast.error('Файл пустой');
        return;
      }
      await addItems(rows);
    } catch {
      toast.error('Не удалось прочитать файл');
    }
  }

  function livePreview(template: string) {
    return template
      .replace('{товар}', 'SAMPLE-KEY-1234')
      .replace('{имя_покупателя}', 'dmitry_k')
      .replace('{номер_заказа}', 'ORD-1001');
  }

  function exportDelivered() {
    if (!selectedLot) return;
    const deliveredItems = selectedLot.stock_items.filter(item => item.status === 'delivered');
    if (deliveredItems.length === 0) {
      toast.error('Нет выданных товаров для экспорта');
      return;
    }

    const header = ['ID', 'Значение', 'Статус', 'Дата выдачи'];
    const lines = deliveredItems.map(item => [
      csvEscape(item.id),
      csvEscape(item.value),
      csvEscape(item.status),
      csvEscape(item.delivered_at || ''),
    ]);

    const csv = [header, ...lines].map(row => row.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-delivered-${selectedLot.lot_id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('CSV с выданными товарами выгружен');
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Склад"
            subtitle="Реальные остатки и шаблоны авто-выдачи по лотам из базы данных."
          />
          <span className="platform-chip">Лотов на складе: {lots.length}</span>
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <select
              className="platform-select"
              value={accountFilter}
              onChange={event => setAccountFilter(event.target.value)}
              style={{ maxWidth: 280 }}
            >
              <option value="all">Все аккаунты</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
              ))}
            </select>
          </ToolbarRow>
        </SectionCard>

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
              <strong className="text-[22px]">{autoDeliveryDraft ? 'Включена' : 'Выключена'}</strong>
              <span className="platform-kpi-meta">Текущий режим</span>
            </KpiCard>
            <KpiCard>
              <div className="text-[13px] font-semibold">Записей</div>
              <strong className="text-[26px]">{selectedLot.stock_items.length}</strong>
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

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[var(--pf-accent)]" />
              </div>
            ) : (
              <div className="grid max-h-[640px] overflow-y-auto">
                {lots.map(lot => {
                  const lotAvailable = lot.stock_items.filter(item => item.status === 'available').length;
                  const isActive = selectedLotId === lot.id;
                  return (
                    <button
                      key={lot.id}
                      className="border-b border-[rgba(148,163,184,0.12)] px-4 py-3 text-left"
                      style={{
                        background: isActive ? 'rgba(91,140,255,0.16)' : 'transparent',
                        borderLeft: isActive ? '3px solid #5b8cff' : '3px solid transparent',
                      }}
                      onClick={() => setSelectedLotId(lot.id)}
                    >
                      <div className="text-[13px] font-semibold">{lot.title}</div>
                      <div className="mt-1 text-[11px] text-[var(--pf-text-dim)]">{lot.account_username}</div>
                      <div className="mt-1 inline-flex items-center gap-2">
                        <span
                          className="platform-chip !min-h-[20px] !text-[10px]"
                          style={{ color: lotAvailable < 1 ? '#fb7185' : lotAvailable < 10 ? '#fbbf24' : '#4ade80' }}
                        >
                          {lotAvailable} доступно
                        </span>
                        {lot.auto_delivery_enabled && <span className="platform-chip !min-h-[20px] !text-[10px]">авто</span>}
                      </div>
                    </button>
                  );
                })}

                {lots.length === 0 && (
                  <div className="p-4">
                    <EmptyState>Лоты не найдены.</EmptyState>
                  </div>
                )}
              </div>
            )}
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
                      <h2 className="m-0 text-[18px] font-extrabold">{selectedLot.title}</h2>
                      <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">
                        Аккаунт: <strong>{selectedLot.account_username}</strong> · Доступно:{' '}
                        <strong className="text-[#4ade80]">{available}</strong> · Выдано: <strong>{delivered}</strong>
                      </div>
                    </div>
                    <button className="platform-btn-secondary" onClick={exportDelivered}>
                      <Download size={14} /> Скачать выданные
                    </button>
                  </ToolbarRow>
                </SectionCard>

                {available === 0 && (
                  <SectionCard className="border-[rgba(251,113,133,0.4)] bg-[rgba(251,113,133,0.08)]">
                    <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#fb7185]">
                      <XCircle size={15} /> Товары закончились. Пополните склад.
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
                        onKeyDown={event => event.key === 'Enter' && addItems([singleInput])}
                        placeholder="Введите товар (ключ, аккаунт и т.д.)"
                      />
                      <button className="platform-btn-primary" onClick={() => addItems([singleInput])} disabled={adding}>
                        {adding ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Добавить</>}
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
                      <button className="platform-btn-primary w-fit" onClick={() => addItems(listInput.split(/\r?\n/))} disabled={adding}>
                        {adding ? <Loader2 size={14} className="animate-spin" /> : 'Добавить список'}
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
                        const file = event.dataTransfer.files?.[0];
                        if (file) {
                          void handleFileImport(file);
                        }
                      }}
                    >
                      <Upload size={30} className="mx-auto mb-3 text-[var(--pf-text-muted)]" />
                      <div className="font-semibold">Перетащите файл сюда</div>
                      <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">
                        Поддерживаются .txt и .csv (каждая строка = один товар)
                      </div>
                      <button
                        className="platform-btn-secondary mt-3"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        Выбрать файл
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.csv,text/plain,text/csv"
                        className="hidden"
                        onChange={event => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleFileImport(file);
                          }
                          event.currentTarget.value = '';
                        }}
                      />
                    </div>
                  )}
                </SectionCard>

                <SectionCard>
                  <h3 className="m-0 text-[15px] font-bold">Авто-выдача</h3>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
                    <div>
                      <div className="text-[13px] font-semibold">Включить авто-выдачу</div>
                      <div className="text-[12px] text-[var(--pf-text-dim)]">При новом заказе товар будет выдан автоматически</div>
                    </div>
                    <Switch checked={autoDeliveryDraft} onCheckedChange={setAutoDeliveryDraft} />
                  </div>

                  <div className="mt-3 grid gap-2">
                    <label className="text-[13px] font-semibold text-[var(--pf-text-muted)]">Шаблон сообщения</label>
                    <textarea
                      className="platform-textarea"
                      rows={4}
                      value={templateDraft}
                      onChange={event => setTemplateDraft(event.target.value)}
                      placeholder="Спасибо за покупку! Ваш товар: {товар}"
                    />
                    <div className="rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3 text-[13px]">
                      <div className="mb-1 text-[11px] font-bold tracking-[0.1em] text-[var(--pf-text-dim)]">ПРЕДПРОСМОТР</div>
                      {livePreview(templateDraft || 'Спасибо за покупку! Ваш товар: {товар}')}
                    </div>
                    <button className="platform-btn-primary w-fit" onClick={saveSettings} disabled={savingSettings}>
                      {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Сохранить настройки</>}
                    </button>
                  </div>
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
                              <th className="platform-col-tablet-hide" style={{ textAlign: 'right' }}>Дата выдачи</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLot.stock_items.map((item: ApiWarehouseItem, idx) => (
                              <tr key={item.id}>
                                <td>{idx + 1}</td>
                                <td className="font-mono">{maskValue(item.value)}</td>
                                <td>
                                  <span className={item.status === 'available' ? 'badge-active' : 'badge-inactive'}>
                                    {item.status === 'available' ? 'Доступен' : 'Выдан'}
                                  </span>
                                </td>
                                <td className="platform-col-tablet-hide" style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>
                                  {item.delivered_at
                                    ? `${new Date(item.delivered_at).toLocaleDateString('ru-RU')} ${new Date(item.delivered_at).toLocaleTimeString('ru-RU', {
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
                      {selectedLot.stock_items.map((item: ApiWarehouseItem, idx) => (
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
                              {item.delivered_at
                                ? `Выдан: ${new Date(item.delivered_at).toLocaleDateString('ru-RU')} ${new Date(item.delivered_at).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                                : 'Дата выдачи: —'}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>

                    {selectedLot.stock_items.length === 0 && <EmptyState>Склад этого лота пуст.</EmptyState>}
                  </Panel>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </PageShell>
    </motion.div>
  );
}
