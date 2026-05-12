"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { Modal } from "@/platform2/components/ui/modal";
import Icon from "@/platform2/icons";
import { accountsApi, lotsApi, ApiAccount, ApiLot } from "@/lib/api";

export default function LotsPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [lots, setLots] = useState<ApiLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [raising, setRaising] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ accountId: "", title: "", description: "", price: "", amount: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    accountsApi.list().then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setAccounts(list);
      if (list.length > 0) setForm((f) => ({ ...f, accountId: String(list[0].id) }));
    }).catch(() => {});
  }, []);

  function reload() {
    setLoading(true);
    lotsApi.listAll()
      .then((rows) => setLots(Array.isArray(rows) ? rows : []))
      .catch(() => setLots([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, []);

  const filtered = lots.filter((l) => {
    const matchAccount = accountFilter === "all" || String(l.funpay_account_id) === accountFilter;
    const matchSearch = !search.trim() || l.title.toLowerCase().includes(search.toLowerCase());
    return matchAccount && matchSearch;
  });

  async function raiseLot(accountId: number, lotId: string) {
    setRaising((prev) => new Set(prev).add(lotId));
    try {
      await lotsApi.raiseLot(accountId, lotId);
    } finally {
      setRaising((prev) => { const n = new Set(prev); n.delete(lotId); return n; });
    }
  }

  async function deleteLot(accountId: number, lotId: string) {
    if (!confirm("Удалить лот?")) return;
    setDeleting((prev) => new Set(prev).add(lotId));
    try {
      await lotsApi.delete(accountId, lotId);
      setLots((prev) => prev.filter((l) => l.lot_id !== lotId));
    } finally {
      setDeleting((prev) => { const n = new Set(prev); n.delete(lotId); return n; });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.accountId || !form.title || !form.price) return;
    setCreating(true);
    setCreateError("");
    try {
      await lotsApi.create(form.accountId, {
        node_id: 0,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        amount: Number(form.amount) || 0,
      });
      setCreateModal(false);
      setForm((f) => ({ ...f, title: "", description: "", price: "", amount: "" }));
      reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Лоты</h1>
        <Button variant="primary" onClick={() => setCreateModal(true)}>
          <Icon name="plus" className="mr-2 h-4 w-4" />
          Создать лот
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="list" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по лотам..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Все аккаунты</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lots grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Icon name="box-cube" className="h-12 w-12 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">Лотов не найдено</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lot) => (
            <Card key={lot.id}>
              <CardContent className="flex h-full flex-col p-5">
                {/* Status + account */}
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800">
                    {lot.account_username}
                  </span>
                  <span className={`inline-flex h-2 w-2 rounded-full ${lot.is_active ? "bg-success-500" : "bg-gray-300"}`} />
                </div>

                {/* Title */}
                <p className="font-semibold text-gray-800 dark:text-white line-clamp-2 flex-1">{lot.title}</p>

                {/* Category */}
                <p className="mt-1 text-xs text-gray-400">{lot.category_name}</p>

                {/* Price */}
                <p className="mt-3 text-lg font-bold text-brand-500">
                  {lot.price.toLocaleString("ru-RU")} ₽
                </p>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => raiseLot(lot.funpay_account_id, lot.lot_id)}
                    disabled={raising.has(lot.lot_id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <Icon name="arrow-up" className="h-3.5 w-3.5" />
                    {raising.has(lot.lot_id) ? "..." : "Поднять"}
                  </button>
                  <button
                    onClick={() => deleteLot(lot.funpay_account_id, lot.lot_id)}
                    disabled={deleting.has(lot.lot_id)}
                    className="flex items-center justify-center rounded-xl border border-error-200 px-3 py-2 text-error-500 hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} className="w-full max-w-md p-6">
        <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">Создать лот</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Аккаунт</label>
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Название лота"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Цена (₽)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Количество</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          {createError && <p className="text-sm text-error-500">{createError}</p>}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="primary" type="submit" disabled={creating || !form.title || !form.price}>
              {creating ? "Создание..." : "Создать"}
            </Button>
            <Button variant="outline" type="button" onClick={() => setCreateModal(false)}>Отмена</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
