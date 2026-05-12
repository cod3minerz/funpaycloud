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
import Pagination from "@/platform2/components/tables/Pagination";
import Icon from "@/platform2/icons";
import { ordersApi, accountsApi, ApiOrder, ApiAccount } from "@/lib/api";

type OrderStatus = "completed" | "pending" | "cancelled";

function apiStatusToLocal(status: number): OrderStatus {
  if (status === 2) return "completed";
  if (status === 0) return "pending";
  return "cancelled";
}

const statusLabel: Record<OrderStatus, string> = {
  completed: "Завершён",
  pending: "В ожидании",
  cancelled: "Отменён",
};

const statusVariant: Record<OrderStatus, "success" | "warning" | "danger"> = {
  completed: "success",
  pending: "warning",
  cancelled: "danger",
};

const LIMIT = 20;

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [delivering, setDelivering] = useState<number | null>(null);

  useEffect(() => {
    accountsApi.list().then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    const params: Parameters<typeof ordersApi.list>[0] = { page, limit: LIMIT };
    if (selectedAccount !== "all") params.account_id = selectedAccount;
    ordersApi.list(params).then((resp) => {
      setOrders(resp.orders);
      setTotal(resp.total);
    }).catch(() => {});
  }, [page, selectedAccount]);

  async function handleDeliver(id: number) {
    setDelivering(id);
    try {
      await ordersApi.deliver(id);
      // Refresh
      const params: Parameters<typeof ordersApi.list>[0] = { page, limit: LIMIT };
      if (selectedAccount !== "all") params.account_id = selectedAccount;
      const resp = await ordersApi.list(params);
      setOrders(resp.orders);
      setTotal(resp.total);
    } catch {
      // ignore
    } finally {
      setDelivering(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Заказы</h1>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Все заказы</CardTitle>
            <div className="flex gap-2">
              <InputField placeholder="Поиск по заказам" className="w-64" />
              <Select value={selectedAccount} onChange={(value) => { setSelectedAccount(value); setPage(1); }}>
                <option value="all">Все аккаунты</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.username ?? `#${a.id}`}</option>
                ))}
              </Select>
              <Select>
                <option value="all">Все статусы</option>
                <option value="completed">Завершён</option>
                <option value="pending">В ожидании</option>
                <option value="cancelled">Отменён</option>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="box" className="h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">
                Заказы не найдены
              </h3>
              <p className="mt-2 text-sm text-gray-500">По текущим фильтрам нет подходящих заказов.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">FunPay ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Покупатель</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Описание</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Аккаунт</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Сумма</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Статус</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Выдача</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Дата</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Действие</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const localStatus = apiStatusToLocal(order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-gray-500">#{order.id}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{order.funpay_order_id}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">{order.buyer_username}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 max-w-[200px]">
                          <span className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{order.description}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-sm text-gray-500">{order.funpay_account_id}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {order.price.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="ml-1 text-xs text-gray-400">₽</span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <Badge variant={statusVariant[localStatus]}>
                            {statusLabel[localStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{order.delivered_at ?? "—"}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString("ru-RU")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {localStatus === "pending" ? (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={delivering === order.id}
                              onClick={() => handleDeliver(order.id)}
                            >
                              {delivering === order.id ? "…" : "Выдать"}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">Детали</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Показано <span className="font-medium text-gray-800 dark:text-white">
                {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)}
              </span> из{" "}
              <span className="font-medium text-gray-800 dark:text-white">{total}</span>
            </p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </Card>

    </div>
  );
}
