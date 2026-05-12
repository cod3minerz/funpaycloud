"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import { accountsApi, warehouseApi, ApiAccount, ApiWarehouseLot } from "@/lib/api";

type AddMode = "single" | "list";

export default function WarehousePage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [lots, setLots] = useState<ApiWarehouseLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const [addMode, setAddMode] = useState<AddMode>("single");
  const [newItem, setNewItem] = useState("");
  const [listText, setListText] = useState("");
  const [addingItems, setAddingItems] = useState(false);

  const [savingSettings, setSavingSettings] = useState(false);
  const [templateDraft, setTemplateDraft] = useState("");
  const [autoDeliveryDraft, setAutoDeliveryDraft] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);

  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);

  useEffect(() => {
    accountsApi.list().then((rows) => {
      setAccounts(Array.isArray(rows) ? rows : []);
    }).catch(() => {});
  }, []);

  const loadLots = useCallback(async (accountId?: string) => {
    setLoading(true);
    try {
      const data = await warehouseApi.list(accountId !== "all" ? accountId : undefined);
      const list = Array.isArray(data) ? data : [];
      setLots(list);
      if (list.length > 0) setSelectedLotId((prev) => prev ?? list[0].id);
    } catch {
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLots(accountFilter);
  }, [accountFilter, loadLots]);

  const selectedLot = lots.find((l) => l.id === selectedLotId) ?? null;

  useEffect(() => {
    if (selectedLot) {
      setAutoDeliveryDraft(selectedLot.auto_delivery_enabled);
      setTemplateDraft(selectedLot.auto_delivery_template ?? "");
      setSettingsDirty(false);
    }
  }, [selectedLotId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddItems() {
    if (!selectedLot) return;
    const items = addMode === "single"
      ? [newItem.trim()].filter(Boolean)
      : listText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) return;

    setAddingItems(true);
    try {
      await warehouseApi.addItems(selectedLot.id, items);
      setNewItem("");
      setListText("");
      await loadLots(accountFilter);
    } catch {
      // ignore
    } finally {
      setAddingItems(false);
    }
  }

  async function handleDeleteItem(itemIndex: number) {
    if (!selectedLot) return;
    setDeletingIdx(itemIndex);
    try {
      await warehouseApi.deleteStockItem(selectedLot.funpay_account_id, selectedLot.lot_id, itemIndex);
      setLots((prev) => prev.map((l) =>
        l.id === selectedLot.id
          ? { ...l, stock_items: l.stock_items.filter((_, i) => i !== itemIndex) }
          : l
      ));
    } catch {
      // ignore
    } finally {
      setDeletingIdx(null);
    }
  }

  async function handleSaveSettings() {
    if (!selectedLot) return;
    setSavingSettings(true);
    try {
      await warehouseApi.updateStockByLotID(
        selectedLot.funpay_account_id,
        selectedLot.lot_id,
        { auto_delivery_enabled: autoDeliveryDraft, auto_delivery_template: templateDraft }
      );
      setLots((prev) => prev.map((l) =>
        l.id === selectedLot.id
          ? { ...l, auto_delivery_enabled: autoDeliveryDraft, auto_delivery_template: templateDraft }
          : l
      ));
      setSettingsDirty(false);
    } catch {
      // ignore
    } finally {
      setSavingSettings(false);
    }
  }

  const availableCount = selectedLot?.stock_items.filter((i) => i.status === "available").length ?? 0;
  const issuedCount = selectedLot?.stock_items.filter((i) => i.status === "delivered").length ?? 0;
  const totalAvailable = lots.reduce((s, l) => s + l.stock_items.filter((i) => i.status === "available").length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Склад</h1>
        <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-600">
          {totalAvailable} товаров доступно
        </span>
      </div>

      {/* Account filter */}
      <Card>
        <CardContent className="p-4">
          <select
            value={accountFilter}
            onChange={(e) => { setAccountFilter(e.target.value); setSelectedLotId(null); }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Все аккаунты</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : lots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Icon name="box-cube" className="h-12 w-12 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">Лотов не найдено</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Lot list */}
          <div className="space-y-2">
            {lots.map((lot) => {
              const avail = lot.stock_items.filter((i) => i.status === "available").length;
              return (
                <button
                  key={lot.id}
                  onClick={() => setSelectedLotId(lot.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    selectedLotId === lot.id
                      ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <p className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-white">{lot.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{lot.account_username}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      avail > 0 ? "bg-success-500/10 text-success-600" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                    }`}>
                      {avail} шт.
                    </span>
                  </div>
                  {lot.auto_delivery_enabled && (
                    <span className="mt-1.5 inline-block rounded-full bg-brand-500/10 px-2 py-0.5 text-xs text-brand-600">
                      Автовыдача
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Lot detail */}
          {selectedLot && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">Доступно</p>
                    <p className="mt-1 text-2xl font-bold text-success-600">{availableCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">Выдано</p>
                    <p className="mt-1 text-2xl font-bold text-gray-400">{issuedCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">Всего</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{selectedLot.stock_items.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Add items */}
              <Card>
                <CardContent className="p-5">
                  <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Добавить товар</p>
                  <div className="mb-3 flex gap-2">
                    {(["single", "list"] as AddMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setAddMode(m)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          addMode === m
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {m === "single" ? "Один" : "Список"}
                      </button>
                    ))}
                  </div>
                  {addMode === "single" ? (
                    <div className="flex gap-2">
                      <input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddItems(); }}
                        placeholder="Значение товара"
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                      <Button variant="primary" onClick={handleAddItems} disabled={addingItems || !newItem.trim()}>
                        {addingItems ? "..." : "Добавить"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={listText}
                        onChange={(e) => setListText(e.target.value)}
                        placeholder={"Один товар — одна строка\nтовар1\nтовар2\nтовар3"}
                        rows={5}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                      <Button variant="primary" onClick={handleAddItems} disabled={addingItems || !listText.trim()}>
                        {addingItems ? "Добавление..." : `Добавить ${listText.split("\n").filter(Boolean).length} товаров`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Auto-delivery settings */}
              <Card>
                <CardContent className="space-y-4 p-5">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Настройки автовыдачи</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Автовыдача</p>
                      <p className="text-xs text-gray-400">Товар выдаётся автоматически после оплаты</p>
                    </div>
                    <button
                      onClick={() => { setAutoDeliveryDraft((v) => !v); setSettingsDirty(true); }}
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                        autoDeliveryDraft ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        autoDeliveryDraft ? "translate-x-5" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                  {autoDeliveryDraft && (
                    <div>
                      <p className="mb-1.5 text-xs text-gray-500">
                        {'Шаблон сообщения (используйте {товар} для подстановки)'}
                      </p>
                      <textarea
                        value={templateDraft}
                        onChange={(e) => { setTemplateDraft(e.target.value); setSettingsDirty(true); }}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  )}
                  {settingsDirty && (
                    <Button variant="primary" onClick={handleSaveSettings} disabled={savingSettings}>
                      {savingSettings ? "Сохранение..." : "Сохранить"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Items list */}
              <Card>
                <CardContent className="p-0">
                  {selectedLot.stock_items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Icon name="box-cube" className="h-10 w-10 text-gray-200" />
                      <p className="mt-3 text-sm text-gray-400">Товаров нет — добавьте выше</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedLot.stock_items.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-sm text-gray-800 dark:text-white">{item.value}</p>
                            {item.delivered_at && (
                              <p className="text-xs text-gray-400">
                                Выдан: {new Date(item.delivered_at).toLocaleDateString("ru-RU")}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.status === "available"
                                ? "bg-success-500/10 text-success-600"
                                : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                            }`}>
                              {item.status === "available" ? "Доступен" : "Выдан"}
                            </span>
                            {item.status === "available" && (
                              <button
                                onClick={() => handleDeleteItem(idx)}
                                disabled={deletingIdx === idx}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"
                              >
                                <Icon name="trash" className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
