"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Badge } from "@/platform2/components/ui/badge";
import { Button } from "@/platform2/components/ui/button";
import Select from "@/platform2/components/form/Select";
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
  id: string;       // index as string, used for API deleteStockItem
  value: string;
  status: "available" | "issued";
  issuedAt: string | null;
};

type Lot = {
  id: string;             // String(ApiWarehouseLot.id)
  apiId: number;          // warehouse lot ID for addItems/updateSettings
  funpayAccountId: number; // for deleteStockItem
  apiLotId: string;       // funpay lot_id for deleteStockItem
  name: string;
  account: string;
  autoDelivery: boolean;
  messageTemplate: string;
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
  const [lots, setLots] = useState<Lot[]>([]);
  const [template, setTemplate] = useState<string>("");

  useEffect(() => {
    warehouseApi.list().then((data) => {
      const mapped = data.map(mapApiLot);
      setLots(mapped);
      if (mapped.length > 0 && !selectedLotId) setSelectedLotId(mapped[0].id);
    }).catch(() => {});
  }, []);

  const lot = lots.find((l) => l.id === selectedLotId) ?? lots[0] ?? {
    id: "", apiId: 0, funpayAccountId: 0, apiLotId: "",
    name: "—", account: "—", autoDelivery: false, messageTemplate: "", items: [],
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

  async function handleAddItem() {
    if (!newItem.trim() || !lot) return;
    const value = newItem.trim();
    try {
      await warehouseApi.addItems(lot.apiId, [value]);
      const newItemObj: WarehouseItem = {
        id: String(lot.items.length),
        value,
        status: "available",
        issuedAt: null,
      };
      setLots((prev) =>
        prev.map((l) => (l.id === selectedLotId ? { ...l, items: [...l.items, newItemObj] } : l))
      );
    } catch {
      // ignore
    }
    setNewItem("");
  }

  async function handleDeleteItem(itemId: string) {
    if (!lot) return;
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
      // ignore
    }
  }

  async function handleToggleAutoDelivery() {
    if (!lot) return;
    const next = !lot.autoDelivery;
    try {
      await warehouseApi.updateSettings(lot.apiId, {
        auto_delivery_enabled: next,
        auto_delivery_template: lot.messageTemplate,
      });
    } catch {
      // ignore
    }
    setLots((prev) =>
      prev.map((l) =>
        l.id === selectedLotId ? { ...l, autoDelivery: next } : l
      )
    );
  }

  async function handleSaveTemplate() {
    if (!lot) return;
    try {
      await warehouseApi.updateSettings(lot.apiId, {
        auto_delivery_enabled: lot.autoDelivery,
        auto_delivery_template: currentTemplate,
      });
    } catch {
      // ignore
    }
    setLots((prev) =>
      prev.map((l) =>
        l.id === selectedLotId ? { ...l, messageTemplate: currentTemplate } : l
      )
    );
    setTemplate("");
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Склад</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Лотов на складе:{" "}
            <span className="font-semibold text-gray-800 dark:text-white">{lots.length}</span>
          </span>
          <Select className="w-48">
            <option value="all">Все аккаунты</option>
            <option value="paidinful">PaidInFull</option>
            <option value="tonminerz">tonminerz</option>
          </Select>
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
                  <p
                    className={`text-sm font-medium leading-snug ${
                      isSelected ? "text-brand-600 dark:text-brand-400" : "text-gray-800 dark:text-white"
                    }`}
                  >
                    {l.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{l.account}</p>
                  <div className="mt-2">
                    <Badge variant={avail > 0 ? "success" : "warning"}>
                      {avail} доступно
                    </Badge>
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
              <div className="flex items-start justify-between gap-4">
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
                <Button variant="outline" size="sm">
                  <Icon name="download" className="mr-1.5 h-4 w-4" />
                  Скачать выданные
                </Button>
              </div>

              {available === 0 && (
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
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    placeholder="Введите товар (ключ, аккаунт и т.д.)"
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <Button variant="primary" onClick={handleAddItem}>
                    <Icon name="plus" className="mr-1.5 h-4 w-4" />
                    Добавить
                  </Button>
                </div>
              )}

              {addMode === "list" && (
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    placeholder={"Введите товары построчно:\nтовар1\nтовар2\nтовар3"}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <Button variant="primary">
                    <Icon name="plus" className="mr-1.5 h-4 w-4" />
                    Добавить всё
                  </Button>
                </div>
              )}

              {addMode === "file" && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-8 dark:border-gray-700">
                  <Icon name="file" className="h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Перетащите .txt файл или</p>
                  <Button variant="outline" size="sm" className="mt-2">Выбрать файл</Button>
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
                  <p className="text-xs text-gray-400">При новом заказе товар будет выдан автоматически</p>
                </div>
                <button
                  onClick={handleToggleAutoDelivery}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    lot.autoDelivery ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      lot.autoDelivery ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Шаблон сообщения
                </label>
                <textarea
                  rows={3}
                  value={currentTemplate}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Предпросмотр
                </p>
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
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Товары на складе</h3>
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
