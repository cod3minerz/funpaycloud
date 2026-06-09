"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import TextArea from "@/platform2/components/form/input/TextArea";
import Input from "@/platform2/components/form/input/InputField";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Badge } from "@/platform2/components/ui/badge";
import { Button } from "@/platform2/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";
import Icon from "@/platform2/icons";
import { warehouseApi, ApiWarehouseLot } from "@/lib/api";

type WarehouseItem = {
  id: string;       // index as string
  value: string;
  status: "available" | "issued";
  issuedAt: string | null;
};

type Lot = {
  id: string;
  apiId: number;
  funpayAccountId: number;
  apiLotId: string;
  name: string;
  account: string;
  autoDelivery: boolean;
  messageTemplate: string;
  externalUrl: string | null;
  items: WarehouseItem[];
};

function mapApiLot(l: ApiWarehouseLot): Lot {
  return {
    id: String(l.id),
    apiId: l.id,
    funpayAccountId: l.funpay_account_id,
    apiLotId: l.lot_id,
    name: l.title,
    account: l.account_username,
    autoDelivery: l.auto_delivery_enabled,
    messageTemplate: l.auto_delivery_template ?? "",
    externalUrl: l.external_url ?? null,
    items: l.stock_items.map((si, idx) => ({
      id: String(idx),
      value: si.value,
      status: si.status === "available" ? "available" : "issued",
      issuedAt: si.delivered_at ?? null,
    })),
  };
}

type AddMode = "single" | "list" | "file";

export default function WarehousePage() {
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [addMode, setAddMode] = useState<AddMode>("single");
  const [newItem, setNewItem] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [lots, setLots] = useState<Lot[]>([]);
  const [template, setTemplate] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadLots = useCallback(async () => {
    const data = await warehouseApi.list().catch(() => [] as ApiWarehouseLot[]);
    const mapped = data.map(mapApiLot);
    setLots(mapped);
    if (mapped.length > 0 && !selectedLotId) setSelectedLotId(mapped[0].id);
  }, [selectedLotId]);

  // Первичная загрузка и при reloadKey
  useEffect(() => {
    loadLots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const lot = lots.find((l) => l.id === selectedLotId) ?? lots[0] ?? {
    id: "", apiId: 0, funpayAccountId: 0, apiLotId: "",
    name: "—", account: "—", autoDelivery: false, messageTemplate: "",
    externalUrl: null, items: [],
  };

  const available = lot.items.filter((i) => i.status === "available").length;
  const issued = lot.items.filter((i) => i.status === "issued").length;
  const totalAvailable = lots.reduce(
    (sum, l) => sum + l.items.filter((i) => i.status === "available").length,
    0
  );

  const currentTemplate = template !== "" ? template : lot.messageTemplate;

  function handleSelectLot(id: string) {
    setSelectedLotId(id);
    setTemplate("");
  }

  // ── Обновить с FunPay ──────────────────────────────────────────────────────
  async function handleRefresh() {
    if (!lot.funpayAccountId || refreshing) return;
    setRefreshing(true);
    try {
      const fresh = await warehouseApi.list(lot.funpayAccountId, { refresh: true });
      const mapped = fresh.map(mapApiLot);
      setLots((prev) => {
        const otherAccounts = prev.filter((l) => l.funpayAccountId !== lot.funpayAccountId);
        return [...otherAccounts, ...mapped];
      });
      toast.success("Склад обновлён с FunPay");
    } catch {
      toast.error("Не удалось обновить данные");
    } finally {
      setRefreshing(false);
    }
  }

  // ── Обновить карточку ──────────────────────────────────────────────────────
  function handleReloadCard() {
    setReloadKey((k) => k + 1);
  }

  // ── Скачать выданные (CSV) ─────────────────────────────────────────────────
  function handleExportDelivered() {
    const rows = lot.items
      .filter((i) => i.status === "issued")
      .map((i) => `"${i.value.replace(/"/g, '""')}","${i.issuedAt ?? ""}"`);
    if (rows.length === 0) return;
    const blob = new Blob(["value,issued_at\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delivered_${lot.apiLotId || lot.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Импорт из файла ────────────────────────────────────────────────────────
  async function handleFileImport(file: File) {
    if (!lot.apiId) return;
    const text = await file.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    try {
      await warehouseApi.addItems(lot.apiId, lines);
      const newItems: WarehouseItem[] = lines.map((val, idx) => ({
        id: String(lot.items.length + idx),
        value: val,
        status: "available",
        issuedAt: null,
      }));
      setLots((prev) =>
        prev.map((l) =>
          l.id === selectedLotId ? { ...l, items: [...l.items, ...newItems] } : l
        )
      );
      toast.success(`Импортировано ${lines.length} товаров`);
    } catch {
      toast.error("Ошибка импорта файла");
    }
  }

  // ── Добавить один товар ────────────────────────────────────────────────────
  async function handleAddItem() {
    if (!newItem.trim() || !lot.apiId) return;
    const value = newItem.trim();
    try {
      await warehouseApi.addItems(lot.apiId, [value]);
      setLots((prev) =>
        prev.map((l) =>
          l.id === selectedLotId
            ? { ...l, items: [...l.items, { id: String(l.items.length), value, status: "available", issuedAt: null }] }
            : l
        )
      );
    } catch {
      toast.error("Не удалось добавить товар");
    }
    setNewItem("");
  }

  // ── Добавить список товаров ────────────────────────────────────────────────
  async function handleAddBulk() {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length || !lot.apiId) return;
    try {
      await warehouseApi.addItems(lot.apiId, lines);
      const newItems: WarehouseItem[] = lines.map((val, idx) => ({
        id: String(lot.items.length + idx),
        value: val,
        status: "available",
        issuedAt: null,
      }));
      setLots((prev) =>
        prev.map((l) =>
          l.id === selectedLotId ? { ...l, items: [...l.items, ...newItems] } : l
        )
      );
      toast.success(`Добавлено ${lines.length} товаров`);
    } catch {
      toast.error("Не удалось добавить товары");
    }
    setBulkText("");
  }

  // ── Удалить товар ─────────────────────────────────────────────────────────
  async function handleDeleteItem(itemId: string) {
    const idx = parseInt(itemId, 10);
    try {
      await warehouseApi.deleteStockItem(lot.funpayAccountId, lot.apiLotId, idx);
      setLots((prev) =>
        prev.map((l) =>
          l.id === selectedLotId
            ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
            : l
        )
      );
    } catch {
      toast.error("Не удалось удалить товар");
    }
  }

  // ── Авто-выдача ────────────────────────────────────────────────────────────
  async function handleToggleAutoDelivery() {
    const next = !lot.autoDelivery;
    try {
      await warehouseApi.updateSettings(lot.apiId, {
        auto_delivery_enabled: next,
        auto_delivery_template: lot.messageTemplate,
      });
      toast.success(next ? "Авто-выдача включена" : "Авто-выдача выключена");
    } catch {
      toast.error("Не удалось изменить настройку");
    }
    setLots((prev) =>
      prev.map((l) => (l.id === selectedLotId ? { ...l, autoDelivery: next } : l))
    );
  }

  async function handleSaveTemplate() {
    try {
      await warehouseApi.updateSettings(lot.apiId, {
        auto_delivery_enabled: lot.autoDelivery,
        auto_delivery_template: currentTemplate,
      });
      toast.success("Шаблон сохранён");
    } catch {
      toast.error("Не удалось сохранить шаблон");
    }
    setLots((prev) =>
      prev.map((l) => (l.id === selectedLotId ? { ...l, messageTemplate: currentTemplate } : l))
    );
    setTemplate("");
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Склад</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:block">
            Лотов на складе:{" "}
            <span className="font-semibold text-gray-800 dark:text-white">{lots.length}</span>
          </span>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Доступно</p>
            <p className="mt-1 text-3xl font-bold text-success-500">{totalAvailable}</p>
            <p className="mt-1 text-xs text-gray-400">Товаров готово к выдаче</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Выдано</p>
            <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white">
              {lots.reduce((s, l) => s + l.items.filter((i) => i.status === "issued").length, 0)}
            </p>
            <p className="mt-1 text-xs text-gray-400">Успешно доставлено</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Авто-выдача</p>
            <p className={`mt-1 text-xl font-bold ${lot.autoDelivery ? "text-success-500" : "text-gray-400"}`}>
              {lot.autoDelivery ? "Включена" : "Выключена"}
            </p>
            <p className="mt-1 text-xs text-gray-400">Текущий режим</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Записей</p>
            <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white">{lot.items.length}</p>
            <p className="mt-1 text-xs text-gray-400">Всего в выбранном лоте</p>
          </CardContent>
        </Card>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">

        {/* LOT LIST */}
        <Card>
          <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-white">Лоты склада</h2>
            <p className="mt-0.5 text-xs text-gray-400">Выберите лот для управления остатками</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {lots.map((l) => {
              const avail = l.items.filter((i) => i.status === "available").length;
              const isSelected = l.id === selectedLotId;
              return (
                <button
                  key={l.id}
                  onClick={() => handleSelectLot(l.id)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isSelected
                      ? "border-l-2 border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-l-2 border-transparent"
                  }`}
                >
                  <p className={`text-sm font-medium leading-snug ${
                    isSelected ? "text-brand-600 dark:text-brand-400" : "text-gray-800 dark:text-white"
                  }`}>
                    {l.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{l.account}</p>
                  <div className="mt-2">
                    <Badge variant={avail > 0 ? "success" : "warning"}>{avail} доступно</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* LOT DETAIL */}
        <div className="space-y-4">

          {/* Lot header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-white">{lot.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Аккаунт:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">{lot.account}</span>
                    <span className="mx-2">·</span>
                    Доступно:{" "}
                    <span className="font-medium text-success-500">{available}</span>
                    <span className="mx-2">·</span>
                    Выдано:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">{issued}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing || !lot.funpayAccountId}
                  >
                    <Icon name="refresh" className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    Обновить с FunPay
                  </Button>

                  {lot.externalUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(lot.externalUrl!, "_blank")}
                    >
                      <Icon name="external-link" className="mr-1.5 h-3.5 w-3.5" />
                      Открыть на FunPay
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={handleReloadCard}>
                    <Icon name="refresh" className="mr-1.5 h-3.5 w-3.5" />
                    Обновить карточку
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportDelivered}
                    disabled={issued === 0}
                  >
                    <Icon name="download" className="mr-1.5 h-3.5 w-3.5" />
                    Скачать выданные
                  </Button>
                </div>
              </div>

              {available === 0 && lot.id && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-error-500/10 px-4 py-3 text-sm text-error-600 dark:text-error-400">
                  <Icon name="alert" className="h-4 w-4 shrink-0" />
                  Товары закончились. Пополните склад.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add items */}
          <Card>
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Добавить товары</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-2">
                {(["single", "list", "file"] as AddMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAddMode(mode)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      addMode === mode
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {mode === "single" ? "По одному" : mode === "list" ? "Списком" : "Файл"}
                  </button>
                ))}
              </div>

              {addMode === "single" && (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    placeholder="Введите товар (ключ, аккаунт и т.д.)"
                    className="flex-1"
                  />
                  <Button variant="primary" onClick={handleAddItem} disabled={!newItem.trim()}>
                    <Icon name="plus" className="mr-1.5 h-4 w-4" />
                    Добавить
                  </Button>
                </div>
              )}

              {addMode === "list" && (
                <div className="space-y-2">
                  <TextArea
                    rows={5}
                    value={bulkText}
                    onChange={(val) => setBulkText(val)}
                    placeholder={"Введите товары построчно:\nтовар1\nтовар2\nтовар3"}
                  />
                  <Button variant="primary" onClick={handleAddBulk} disabled={!bulkText.trim()}>
                    <Icon name="plus" className="mr-1.5 h-4 w-4" />
                    Добавить всё
                  </Button>
                </div>
              )}

              {addMode === "file" && (
                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-8 cursor-pointer transition-colors hover:border-brand-400 hover:bg-brand-50/30 dark:border-gray-700 dark:hover:border-brand-600 dark:hover:bg-brand-900/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="file" className="h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Перетащите .txt / .csv файл или</p>
                  <Button variant="outline" size="sm" className="mt-2 pointer-events-none">
                    Выбрать файл
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileImport(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-delivery */}
          <Card>
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Авто-выдача</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Включить авто-выдачу</p>
                  <p className="text-xs text-gray-400">При новом заказе товар выдаётся автоматически</p>
                </div>
                <button
                  onClick={handleToggleAutoDelivery}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    lot.autoDelivery ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    lot.autoDelivery ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Шаблон сообщения
                </label>
                <TextArea
                  rows={3}
                  value={currentTemplate}
                  onChange={(val) => setTemplate(val)}
                />
              </div>

              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Предпросмотр</p>
                <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                  {currentTemplate.replace("{товар}", "SAMPLE-KEY-1234")}
                </p>
              </div>

              <Button variant="primary" onClick={handleSaveTemplate}>
                <Icon name="check-circle" className="mr-1.5 h-4 w-4" />
                Сохранить настройки
              </Button>
            </CardContent>
          </Card>

          {/* Items table */}
          <Card>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Товары на складе</h3>
              <span className="text-xs text-gray-400">
                {available} доступно · {issued} выдано
              </span>
            </div>
            {lot.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <Icon name="box" className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-white">Склад пуст</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Добавьте товары, чтобы они выдавались покупателям автоматически.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Товар</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Статус</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Дата выдачи</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Действие</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lot.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-5 py-3 text-sm text-gray-400">{idx + 1}</TableCell>
                        <TableCell className="px-5 py-3">
                          <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {item.value}
                          </code>
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <Badge variant={item.status === "available" ? "success" : "secondary"}>
                            {item.status === "available" ? "Доступен" : "Выдан"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-sm text-gray-500">
                          {item.issuedAt ?? "—"}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          {item.status === "available" && (
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-gray-400 hover:text-error-500 transition-colors"
                              title="Удалить товар"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
