"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { Badge } from "@/platform2/components/ui/badge";
import InputField from "@/platform2/components/form/InputField";
import Select from "@/platform2/components/form/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";
import { Modal } from "@/platform2/components/ui/modal";
import { Dropdown } from "@/platform2/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/platform2/components/ui/dropdown/DropdownItem";
import Icon from "@/platform2/icons";
import { lotsApi, accountsApi, ApiLot, ApiAccount } from "@/lib/api";

type CreateLotForm = {
  account: string;
  category: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
};

const emptyForm: CreateLotForm = { account: "", category: "", name: "", description: "", price: "", quantity: "0" };

export default function LotsPage() {
  const [lots, setLots] = useState<ApiLot[]>([]);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateLotForm>(emptyForm);
  const [raising, setRaising] = useState<string | null>(null);

  useEffect(() => {
    lotsApi.listAll().then(setLots).catch(() => {});
    accountsApi.list().then(setAccounts).catch(() => {});
  }, []);

  async function handleCreateSubmit() {
    if (!form.name.trim() || !form.account) return;
    try {
      await lotsApi.create(form.account, {
        node_id: 0,
        title: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        amount: parseInt(form.quantity) || 0,
      });
      const updated = await lotsApi.listAll();
      setLots(updated);
    } catch {
      // ignore
    }
    setForm(emptyForm);
    setShowCreateModal(false);
  }

  function toggleDropdown(id: string) {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  }

  async function handleRaise(lot: ApiLot) {
    setRaising(lot.id);
    setOpenDropdownId(null);
    try {
      await lotsApi.raiseLot(lot.funpay_account_id, lot.lot_id);
    } catch {
      // ignore
    } finally {
      setRaising(null);
    }
  }

  async function handleDelete(lot: ApiLot) {
    setOpenDropdownId(null);
    try {
      await lotsApi.delete(lot.funpay_account_id, lot.lot_id);
      setLots((prev) => prev.filter((l) => l.id !== lot.id));
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Лоты</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Icon name="plus" className="mr-2 h-4 w-4" />
          Создать лот
        </Button>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Все лоты</CardTitle>
            <div className="flex gap-2">
              <InputField placeholder="Поиск по лотам" className="w-64" />
              <Select>
                <option value="all">Все аккаунты</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.username ?? `#${a.id}`}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="box-cube" className="h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">
                Лоты не найдены
              </h3>
              <p className="mt-2 text-sm text-gray-500">По текущим фильтрам нет подходящих лотов.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Лот</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Категория</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Аккаунт</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Цена</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Кол-во</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Статус</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Действия</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.id}>

                      {/* LOT NAME */}
                      <TableCell className="px-5 py-4 max-w-[260px]">
                        <p className="font-medium text-gray-800 dark:text-white leading-snug line-clamp-2">
                          {lot.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{lot.description ?? ""}</p>
                        <p className="mt-0.5 text-xs text-gray-300">ID: {lot.lot_id}</p>
                      </TableCell>

                      {/* CATEGORY */}
                      <TableCell className="px-5 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{lot.category_name}</span>
                      </TableCell>

                      {/* ACCOUNT */}
                      <TableCell className="px-5 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{lot.account_username}</span>
                      </TableCell>

                      {/* PRICE */}
                      <TableCell className="px-5 py-4">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                          {lot.price.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">₽</span>
                      </TableCell>

                      {/* QUANTITY */}
                      <TableCell className="px-5 py-4">
                        <span className={`text-sm font-medium ${(lot.amount ?? 0) > 0 ? "text-success-500" : "text-gray-400"}`}>
                          {lot.amount ?? 0}
                        </span>
                      </TableCell>

                      {/* STATUS */}
                      <TableCell className="px-5 py-4">
                        <Badge variant={lot.is_active ? "success" : "secondary"}>
                          {lot.is_active ? "Активен" : "Выключен"}
                        </Badge>
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={raising === lot.id}
                            onClick={() => handleRaise(lot)}
                          >
                            <Icon name="arrow-up" className="mr-1.5 h-3.5 w-3.5" />
                            {raising === lot.id ? "…" : "Поднять"}
                          </Button>

                          <div className="relative">
                            <button
                              className="dropdown-toggle flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
                              onClick={() => toggleDropdown(lot.id)}
                            >
                              <Icon name="horizontal-dots" className="h-4 w-4" />
                            </button>

                            <Dropdown
                              isOpen={openDropdownId === lot.id}
                              onClose={() => setOpenDropdownId(null)}
                              className="w-44 py-1"
                            >
                              <DropdownItem
                                onItemClick={() => setOpenDropdownId(null)}
                                baseClassName="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                <Icon name="pencil" className="h-4 w-4 text-gray-400" />
                                Редактировать
                              </DropdownItem>
                              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                              <DropdownItem
                                onItemClick={() => handleDelete(lot)}
                                baseClassName="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                              >
                                <Icon name="trash" className="h-4 w-4" />
                                Удалить
                              </DropdownItem>
                            </Dropdown>
                          </div>
                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE LOT MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setForm(emptyForm); }}
        className="w-full max-w-lg p-8"
      >
        <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Создать лот</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Аккаунт</label>
            <select
              value={form.account}
              onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Выберите аккаунт</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.username ?? `#${a.id}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Категория</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Abyss of Dungeons / Аккаунты"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder=""
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Цена</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Количество</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="primary" onClick={handleCreateSubmit} disabled={!form.name.trim() || !form.account}>
            Создать
          </Button>
          <Button variant="outline" onClick={() => { setShowCreateModal(false); setForm(emptyForm); }}>
            Отмена
          </Button>
        </div>
      </Modal>
    </div>
  );
}
