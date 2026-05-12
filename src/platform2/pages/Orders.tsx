"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { Badge } from "@/platform2/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";
import Icon from "@/platform2/icons";
import { accountsApi, ordersApi, ApiAccount, ApiOrder } from "@/lib/api";

const STATUS_LABEL: Record<number, string> = { 0: "Оплачен", 1: "Выполнен", 2: "Возврат" };
const STATUS_CLS: Record<number, string> = {
  0: "bg-warning-500/10 text-warning-600 dark:text-warning-400",
  1: "bg-success-500/10 text-success-600 dark:text-success-400",
  2: "bg-error-500/10 text-error-500",
};

const PAGE_SIZE = 20;

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("ru-RU")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function OrdersPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | 0 | 1 | 2>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [delivering, setDelivering] = useState<Set<number>>(new Set());

  useEffect(() => {
    accountsApi.list().then((rows) => setAccounts(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Parameters<typeof ordersApi.list>[0] = { page, limit: PAGE_SIZE };
    if (accountFilter !== "all") params.account_id = accountFilter;
    if (statusFilter !== "all") params.status = statusFilter;

    ordersApi.list(params)
      .then((data) => {
        if (cancelled) return;
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotal(Number(data.total || 0));
      })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, accountFilter, statusFilter]);

  const filtered = search.trim()
    ? orders.filter((o) =>
        o.buyer_username.toLowerCase().includes(search.toLowerCase()) ||
        o.description.toLowerCase().includes(search.toLowerCase()) ||
        o.funpay_order_id.includes(search)
      )
    : orders;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleDeliver(id: number) {
    setDelivering((prev) => new Set(prev).add(id));
    try {
      await ordersApi.deliver(id);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 1, delivered_at: new Date().toISOString(), delivered_via: "manual" } : o))
      );
    } finally {
      setDelivering((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Заказы</h1>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="list" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Поиск по заказам..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <select
              value={accountFilter}
              onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Все аккаунты</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.username}</option>
              ))}
            </select>

            <select
              value={String(statusFilter)}
              onChange={(e) => { setStatusFilter(e.target.value === "all" ? "all" : (Number(e.target.value) as 0 | 1 | 2)); setPage(1); }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Все статусы</option>
              <option value="0">Оплачен</option>
              <option value="1">Выполнен</option>
              <option value="2">Возврат</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-base">
            {loading ? "Загрузка..." : `${total} заказов`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="list" className="h-12 w-12 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">Заказы не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Покупатель</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Товар</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Выдача</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                    <th className="px-4 py-3" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="px-4 py-3 text-xs font-mono text-gray-500">{order.funpay_order_id}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">{order.buyer_username}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{order.description}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white">
                        {order.price.toLocaleString("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLS[order.status] ?? ""}`}>
                          {STATUS_LABEL[order.status] ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-400">
                        {order.delivered_at
                          ? `${fmt(order.delivered_at)} (${order.delivered_via === "manual" ? "вручную" : "авто"})`
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-400">{fmt(order.created_at)}</TableCell>
                      <TableCell className="px-4 py-3">
                        {order.status === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeliver(order.id)}
                            disabled={delivering.has(order.id)}
                            className="text-xs"
                          >
                            {delivering.has(order.id) ? "..." : "Выдать"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Страница {page} из {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                ←
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
