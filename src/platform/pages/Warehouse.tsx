'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Download, Loader2, Plus, Save, Trash2, Upload, XCircle, SearchX, MousePointerClick, PackageOpen } from '@/shared/streamline/icons';
import { toast } from 'sonner';
import { Switch } from '@/app/components/ui/switch';
import { accountsApi, ApiAccount, ApiWarehouseItem, ApiWarehouseLot, lotsApi, warehouseApi } from '@/lib/api';
import {
  DataTableWrap,
  EmptyState,
  KpiCard,
  KpiGrid,
  PageHeader,
  PageShell,
  PageTitle,
  Panel,
  RequestErrorState,
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

function normalizeWarehouseLot(row: ApiWarehouseLot): ApiWarehouseLot {
  return {
    ...row,
    stock_items: Array.isArray(row.stock_items) ? row.stock_items : [],
    auto_delivery_template: row.auto_delivery_template || '',
    account_username: row.account_username || `ID ${row.funpay_account_id}`,
    description: row.description || '',
    currency: row.currency || 'RUB',
    category_name: row.category_name || '',
    node_type: row.node_type || 'lots',
    image_url: row.image_url || '',
    external_url: row.external_url || '',
    edit_url: row.edit_url || '',
    params: Array.isArray(row.params) ? row.params : [],
  };
}

function formatMoney(price?: number, currency?: string) {
  if (typeof price !== 'number' || Number.isNaN(price)) return '—';

  const units: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    USDT: 'USDT',
  };
  const unit = units[currency || 'RUB'] || currency || '';

  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)}${unit ? ` ${unit}` : ''}`;
}

function formatAmount(amount?: number) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—';
  return `${new Intl.NumberFormat('ru-RU').format(amount)} шт.`;
}

function getNodeTypeLabel(nodeType?: string) {
  if (nodeType === 'chips') return 'Игровая валюта';
  if (nodeType === 'lots') return 'Обычный лот';
  return nodeType || '—';
}

function getLotAvailableCount(lot?: ApiWarehouseLot | null) {
  if (!lot) return 0;
  const stockAvailable = Array.isArray(lot.stock_items)
    ? lot.stock_items.filter(item => item.status === 'available').length
    : 0;
  const lotAmount = typeof lot.amount === 'number' && !Number.isNaN(lot.amount) ? lot.amount : 0;
  return Math.max(stockAvailable, lotAmount);
}

export default function Warehouse() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lots, setLots] = useState<ApiWarehouseLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [selectedLotDetails, setSelectedLotDetails] = useState<ApiWarehouseLot | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailReloadKey, setDetailReloadKey] = useState(0);

  const [addTab, setAddTab] = useState<'single' | 'list' | 'file'>('single');
  const [singleInput, setSingleInput] = useState('');
  const [listInput, setListInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(false);

  const [templateDraft, setTemplateDraft] = useState('');
  const [autoDeliveryDraft, setAutoDeliveryDraft] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingLot, setDeletingLot] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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

  async function loadLots(selectedAccount?: string, refresh = false) {
    setLoading(true);
    setRefreshing(refresh);
    setLoadError(null);
    try {
      const accountID = selectedAccount && selectedAccount !== 'all' ? Number(selectedAccount) : undefined;
      const rows = await warehouseApi.list(accountID, { refresh });
      const safe = Array.isArray(rows) ? rows.map(normalizeWarehouseLot) : [];
      setLots(safe);

      if (safe.length === 0) {
        setSelectedLotId(null);
        setSelectedLotDetails(null);
        setDetailsError(null);
        return;
      }

      setSelectedLotId(prev => (prev && safe.some(lot => lot.id === prev) ? prev : safe[0].id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки склада';
      setLoadError(message);
      toast.error(message);
      setLots([]);
      setSelectedLotId(null);
      setSelectedLotDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadLotDetails(lot: ApiWarehouseLot) {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const row = await warehouseApi.details(lot.funpay_account_id, lot.lot_id);
      setSelectedLotDetails(normalizeWarehouseLot(row));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки карточки лота';
      if (message.toLowerCase().includes('лот не найден')) {
        toast.error('Лот больше не найден на FunPay. Обновляю список.');
        await loadLots(accountFilter, true);
        setSelectedLotDetails(null);
        setDetailsError(null);
        return;
      }
      setDetailsError(message);
      setSelectedLotDetails(normalizeWarehouseLot(lot));
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    void loadLots(accountFilter, accountFilter !== 'all');
  }, [accountFilter, reloadKey]);

  const selectedLotSummary = useMemo(
    () => lots.find(lot => lot.id === selectedLotId) ?? null,
    [lots, selectedLotId],
  );

  useEffect(() => {
    if (!selectedLotSummary) {
      setSelectedLotDetails(null);
      setDetailsError(null);
      return;
    }
    void loadLotDetails(selectedLotSummary);
  }, [selectedLotSummary?.id, detailReloadKey]);

  const selectedLot = useMemo(() => {
    if (!selectedLotSummary) return null;
    if (
      !selectedLotDetails ||
      selectedLotDetails.id !== selectedLotSummary.id ||
      selectedLotDetails.funpay_account_id !== selectedLotSummary.funpay_account_id
    ) {
      return selectedLotSummary;
    }
    return normalizeWarehouseLot({
      ...selectedLotSummary,
      ...selectedLotDetails,
      stock_items: Array.isArray(selectedLotDetails.stock_items)
        ? selectedLotDetails.stock_items
        : selectedLotSummary.stock_items,
    });
  }, [selectedLotSummary, selectedLotDetails]);

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
    () => getLotAvailableCount(selectedLot),
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
      await warehouseApi.addStock(selectedLot.funpay_account_id, selectedLot.lot_id, items);
      toast.success(`Добавлено позиций: ${items.length}`);
      setSingleInput('');
      setListInput('');
      await loadLots(accountFilter);
      setDetailReloadKey(prev => prev + 1);
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
      await warehouseApi.updateStockByLotID(selectedLot.funpay_account_id, selectedLot.lot_id, {
        auto_delivery_enabled: autoDeliveryDraft,
        auto_delivery_template: templateDraft,
      });
      toast.success('Настройки авто-выдачи сохранены');
      await loadLots(accountFilter);
      setDetailReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения настроек');
    } finally {
      setSavingSettings(false);
    }
  }

  async function removeSelectedLot() {
    if (!selectedLot) return;
    if (!window.confirm(`Удалить лот «${selectedLot.title}»?`)) return;

    setDeletingLot(true);
    try {
      await lotsApi.delete(selectedLot.funpay_account_id, selectedLot.lot_id);
      toast.success('Лот удалён');
      setSelectedLotDetails(null);
      await loadLots(accountFilter, true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления лота');
    } finally {
      setDeletingLot(false);
    }
  }

  async function removeItem(index: number) {
    if (!selectedLot) return;
    try {
      await warehouseApi.deleteStockItem(selectedLot.funpay_account_id, selectedLot.lot_id, index);
      toast.success('Позиция удалена');
      await loadLots(accountFilter);
      setDetailReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления позиции');
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
          <PageTitle title="Склад" />
          <span className="platform-chip">Лотов на складе: {lots.length}</span>
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <select
              className="platform-select w-full sm:max-w-[280px]"
              value={accountFilter}
              onChange={event => setAccountFilter(event.target.value)}
              aria-label="Фильтр по аккаунту"
            >
              <option value="all">Все аккаунты</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
              ))}
            </select>
            <button
              className="platform-btn-secondary"
              onClick={() => void loadLots(accountFilter, true)}
              disabled={loading || refreshing}
            >
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : 'Обновить с FunPay'}
            </button>
          </ToolbarRow>
        </SectionCard>

        {selectedLot && (
          <KpiGrid>
            <KpiCard>
              <div className="text-[13px] font-semibold">Доступно</div>
              <strong className="text-[26px] text-[var(--pf-success)]">{available}</strong>
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
            ) : loadError ? (
              <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
            ) : (
              <div className="grid max-h-[640px] overflow-y-auto">
                {lots.map(lot => {
                  const lotAvailable = getLotAvailableCount(lot);
                  const isActive = selectedLotId === lot.id;
                  return (
                    <button
                      key={lot.id}
                      className={`platform-lot-list-item ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedLotId(lot.id)}
                    >
                      <div className="text-[13px] font-semibold">{lot.title}</div>
                      <div className="mt-1 text-[11px] text-[var(--pf-text-dim)]">
                        {lot.account_username}
                        {lot.category_name ? ` · ${lot.category_name}` : ''}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-2">
                        <span className={`platform-chip !min-h-[20px] !text-[10px] ${
                          lotAvailable < 1
                            ? '!text-[var(--pf-danger)]'
                            : lotAvailable < 10
                              ? '!text-[var(--pf-warning)]'
                              : '!text-[var(--pf-success)]'
                        }`}>
                          {lotAvailable} доступно
                        </span>
                        {lot.is_active === false && <span className="platform-chip !min-h-[20px] !text-[10px] !text-[var(--pf-danger)]">выкл</span>}
                        {lot.auto_delivery_enabled && <span className="platform-chip !min-h-[20px] !text-[10px]">авто</span>}
                      </div>
                    </button>
                  );
                })}

                {lots.length === 0 && (
                  <div className="p-4">
                    <EmptyState
                      icon={SearchX}
                      title="Лоты не найдены"
                    >
                      У данного аккаунта пока нет лотов или они не загрузились.
                    </EmptyState>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <div className="platform-stack">
            {!selectedLot ? (
              <SectionCard>
                <EmptyState
                  icon={MousePointerClick}
                  title="Лот не выбран"
                >
                  Выберите лот из списка слева, чтобы открыть управление его складом и авто-выдачей.
                </EmptyState>
              </SectionCard>
            ) : (
              <>
                <SectionCard>
                  <ToolbarRow className="justify-between">
                    <div>
                      <h2 className="m-0 text-[18px] font-extrabold">{selectedLot.title}</h2>
                      <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">
                        Аккаунт: <strong>{selectedLot.account_username}</strong> · Доступно:{' '}
                        <strong className="text-[var(--pf-success)]">{available}</strong> · Выдано: <strong>{delivered}</strong>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {selectedLot.category_name && <span className="platform-chip">{selectedLot.category_name}</span>}
                        <span className="platform-chip">{getNodeTypeLabel(selectedLot.node_type)}</span>
                        <span className={selectedLot.is_active === false ? 'badge-inactive' : 'badge-active'}>
                          {selectedLot.is_active === false ? 'Неактивен' : 'Активен'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {selectedLot.external_url && (
                        <a
                          href={selectedLot.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="platform-btn-secondary"
                        >
                          Открыть на FunPay
                        </a>
                      )}
                      {selectedLot.edit_url && (
                        <a
                          href={selectedLot.edit_url}
                          target="_blank"
                          rel="noreferrer"
                          className="platform-btn-secondary"
                        >
                          Редактировать
                        </a>
                      )}
                      <button
                        className="platform-btn-secondary"
                        onClick={() => setDetailReloadKey(prev => prev + 1)}
                        disabled={detailsLoading}
                      >
                        {detailsLoading ? <Loader2 size={14} className="animate-spin" /> : 'Обновить карточку'}
                      </button>
                      <button className="platform-btn-secondary" onClick={exportDelivered}>
                        <Download size={14} /> Скачать выданные
                      </button>
                      <button className="platform-btn-secondary" onClick={() => void removeSelectedLot()} disabled={deletingLot}>
                        {deletingLot ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> Удалить лот</>}
                      </button>
                    </div>
                  </ToolbarRow>
                  {detailsLoading && (
                    <div className="mt-3 text-[12px] text-[var(--pf-text-muted)]">
                      Загружаем актуальные данные предложения с FunPay...
                    </div>
                  )}
                  {detailsError && (
                    <div className="platform-alert-warning mt-3 rounded-[10px] px-3 py-2 text-[13px] text-[var(--pf-text)]">
                      {detailsError}
                    </div>
                  )}
                </SectionCard>

                <SectionCard>
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-4">
                      <div>
                        <h3 className="m-0 text-[15px] font-bold">Карточка лота</h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--pf-text-dim)]">Цена</div>
                            <div className="mt-1 text-[16px] font-semibold">{formatMoney(selectedLot.price, selectedLot.currency)}</div>
                          </div>
                          <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--pf-text-dim)]">Наличие в лоте</div>
                            <div className="mt-1 text-[16px] font-semibold">{formatAmount(selectedLot.amount)}</div>
                          </div>
                          <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--pf-text-dim)]">Node</div>
                            <div className="mt-1 text-[16px] font-semibold">{selectedLot.node_id || '—'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
                          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--pf-text-dim)]">Краткое описание</div>
                          <div className="mt-2 text-[13px] leading-6">{selectedLot.title || '—'}</div>
                        </div>
                        <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
                          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--pf-text-dim)]">Подробное описание</div>
                          <div className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[var(--pf-text)]">
                            {selectedLot.description || 'Описание пока не заполнено или FunPay его не вернул.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
                      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--pf-text-dim)]">Параметры предложения</div>
                      {selectedLot.params && selectedLot.params.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {selectedLot.params.map(param => (
                            <div
                              key={`${param.label}-${param.value}`}
                              className="flex items-start justify-between gap-3 rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-2"
                            >
                              <span className="text-[12px] text-[var(--pf-text-muted)]">{param.label}</span>
                              <strong className="text-right text-[13px]">{param.value}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-[13px] text-[var(--pf-text-muted)]">
                          Дополнительные параметры для этого лота не найдены.
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {available === 0 && (
                  <SectionCard className="platform-alert-danger">
                    <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--pf-danger)]">
                      <XCircle size={15} /> Товары закончились. Пополните склад.
                    </div>
                  </SectionCard>
                )}

                {available > 0 && available < 10 && (
                  <SectionCard className="platform-alert-warning">
                    <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--pf-warning)]">
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
                        className={`${addTab === tab ? 'platform-btn-primary' : 'platform-btn-secondary'} min-h-[34px]`}
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
                      className={`platform-file-dropzone mt-3 ${dragOver ? 'dragover' : ''}`}
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
                        <table className="platform-table min-w-[720px]">
                          <thead>
                            <tr>
                              <th className="w-[54px]">#</th>
                              <th>Товар</th>
                              <th>Статус</th>
                              <th className="platform-col-tablet-hide text-right">Дата выдачи</th>
                              <th className="text-right">Действие</th>
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
                                <td className="platform-col-tablet-hide text-right text-[var(--pf-text-muted)]">
                                  {item.delivered_at
                                    ? `${new Date(item.delivered_at).toLocaleDateString('ru-RU')} ${new Date(item.delivered_at).toLocaleTimeString('ru-RU', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}`
                                    : '—'}
                                </td>
                                <td className="text-right">
                                  <button
                                    className="platform-btn-secondary"
                                    onClick={() => void removeItem(idx)}
                                    disabled={item.status !== 'available'}
                                  >
                                    <Trash2 size={14} /> Удалить
                                  </button>
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
                          <div className="mt-2">
                            <button
                              className="platform-btn-secondary"
                              onClick={() => void removeItem(idx)}
                              disabled={item.status !== 'available'}
                            >
                              <Trash2 size={14} /> Удалить
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>

                    {selectedLot.stock_items.length === 0 && (
                      <EmptyState
                        icon={PackageOpen}
                        title="Склад пуст"
                      >
                        Добавьте товары, чтобы они выдавались покупателям автоматически.
                      </EmptyState>
                    )}
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
