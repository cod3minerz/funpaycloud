"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import Select from "@/platform2/components/form/Select";
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
import {
  financesApi,
  billingApi,
  accountsApi,
  FinancesData,
  SubscriptionPaymentHistoryItem,
  ApiAccount,
} from "@/lib/api";

// ── Простой SVG-баркчарт (без внешних зависимостей) ─────────────────────────
function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const H = 120;
  const barW = 24;
  const gap = 8;
  const W = data.length * (barW + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H + 24} style={{ display: "block", minWidth: "100%" }}>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / max) * H);
          const x = i * (barW + gap);
          const y = H - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                className="fill-brand-500/80"
              />
              <text
                x={x + barW / 2}
                y={H + 16}
                textAnchor="middle"
                fontSize="9"
                className="fill-gray-400"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function txTypeLabel(type: string): string {
  const map: Record<string, string> = {
    sale: "Продажа",
    refund: "Возврат",
    withdrawal: "Вывод",
    deposit: "Пополнение",
    bonus: "Бонус",
    fee: "Комиссия",
    promo: "Промокод",
  };
  return map[type] ?? type;
}

function subStatusBadge(status: string) {
  if (status === "paid") return <Badge variant="success">Оплачено</Badge>;
  if (status === "pending") return <Badge variant="warning">Ожидание</Badge>;
  if (status === "failed") return <Badge variant="error">Ошибка</Badge>;
  if (status === "refunded") return <Badge variant="secondary">Возврат</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "subscriptions">("transactions");
  const [financesData, setFinancesData] = useState<FinancesData | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPaymentHistoryItem[]>([]);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [filterAccount, setFilterAccount] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [subsLoaded, setSubsLoaded] = useState(false);

  // Загружаем финансы (с учётом фильтра аккаунта)
  useEffect(() => {
    const params: { account_id?: string; limit: number } = { limit: 100 };
    if (filterAccount) params.account_id = filterAccount;
    financesApi.get(params).then(setFinancesData).catch(() => {});
  }, [filterAccount]);

  // Загружаем аккаунты для фильтра
  useEffect(() => {
    accountsApi.list().then(setAccounts).catch(() => {});
  }, []);

  // Загружаем подписки при переключении вкладки
  useEffect(() => {
    if (activeTab === "subscriptions" && !subsLoaded) {
      billingApi.listSubscriptionHistory(50)
        .then((r) => { setSubscriptions(r.items || []); setSubsLoaded(true); })
        .catch(() => {});
    }
  }, [activeTab, subsLoaded]);

  const allTransactions = financesData?.transactions ?? [];

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => !filterType || tx.type === filterType);
  }, [allTransactions, filterType]);

  const stats = {
    totalRevenue: financesData?.total_revenue ?? 0,
    orders: financesData?.total_orders ?? 0,
    operations: filteredTransactions.length,
    withdrawals: filteredTransactions.filter((t) => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0),
  };

  // Строим данные для чарта: группировка по дате (последние 14 дней)
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of allTransactions) {
      const label = new Date(tx.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
      map.set(label, (map.get(label) ?? 0) + Math.max(0, tx.amount));
    }
    return Array.from(map.entries())
      .slice(-14)
      .map(([label, value]) => ({ label, value }));
  }, [allTransactions]);

  // Уникальные типы транзакций для фильтра
  const txTypes = useMemo(() => {
    const set = new Set(allTransactions.map((t) => t.type));
    return Array.from(set);
  }, [allTransactions]);

  function exportCsv() {
    const rows = filteredTransactions.map(
      (tx) => `"${tx.id}","${tx.type}","${tx.amount}","${tx.date}","${tx.account_username}","${tx.description}"`
    );
    const csv = "id,type,amount,date,account,description\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">

      {/* ЗАГОЛОВОК */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Финансы</h1>
        <Select value={filterAccount} onChange={setFilterAccount} className="sm:w-44">
          <option value="">Все аккаунты</option>
          {accounts.map((a) => (
            <option key={a.id} value={String(a.id)}>{a.username ?? `#${a.id}`}</option>
          ))}
        </Select>
      </div>

      {/* 4 КАРТОЧКИ */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Общая выручка</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                  {stats.totalRevenue.toLocaleString("ru-RU")} ₽
                </h3>
                <p className="mt-1 text-xs text-gray-400">По всем аккаунтам</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
                <Icon name="dollar-line" className="h-6 w-6 text-brand-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Заказов</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                  {stats.orders}
                </h3>
                <p className="mt-1 text-xs text-gray-400">Всего оплаченных</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-500/10">
                <Icon name="box" className="h-6 w-6 text-warning-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Выводы</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                  {stats.withdrawals.toLocaleString("ru-RU")} ₽
                </h3>
                <p className="mt-1 text-xs text-gray-400">По текущим фильтрам</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-500/10">
                <Icon name="arrow-up" className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Операций</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                  {stats.operations}
                </h3>
                <p className="mt-1 text-xs text-gray-400">С учётом фильтров</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-500/10">
                <Icon name="list" className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ЧАРТ */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle>Поступления по дням</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <MiniBarChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* ТАБЛИЦА */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("transactions")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "transactions"
                    ? "bg-brand-500 text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Транзакции
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "subscriptions"
                    ? "bg-brand-500 text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Подписки
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "transactions" && txTypes.length > 0 && (
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Все типы</option>
                  {txTypes.map((t) => (
                    <option key={t} value={t}>{txTypeLabel(t)}</option>
                  ))}
                </select>
              )}
              {activeTab === "transactions" && (
                <Button variant="outline" onClick={exportCsv} disabled={filteredTransactions.length === 0}>
                  <Icon name="download" className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {/* ТРАНЗАКЦИИ */}
          {activeTab === "transactions" && (
            <>
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Icon name="docs" className="h-16 w-16 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">
                    Нет операций по текущим фильтрам
                  </h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Дата</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Тип</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Описание</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Аккаунт</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Сумма</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="px-5 py-4 text-sm text-gray-500">
                            {new Date(tx.date).toLocaleDateString("ru-RU")}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <Badge variant="secondary">{txTypeLabel(tx.type)}</Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {tx.description}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm text-gray-500">
                            {tx.account_username}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <span className={`text-sm font-semibold ${tx.amount >= 0 ? "text-success-500" : "text-error-500"}`}>
                              {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString("ru-RU")} ₽
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

          {/* ПОДПИСКИ */}
          {activeTab === "subscriptions" && (
            <>
              {subscriptions.length === 0 && !subsLoaded && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                </div>
              )}
              {subscriptions.length === 0 && subsLoaded && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Icon name="docs" className="h-16 w-16 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">
                    История подписок пуста
                  </h3>
                </div>
              )}
              {subscriptions.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Дата</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Тариф</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Период</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Провайдер</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Сумма</TableCell>
                        <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Статус</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="px-5 py-4 text-sm text-gray-500">
                            {new Date(sub.created_at).toLocaleDateString("ru-RU")}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <Badge variant="secondary">{sub.plan.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {sub.period_days} дн.
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm text-gray-500">
                            {sub.provider}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <span className="text-sm font-semibold text-gray-800 dark:text-white">
                              {sub.amount.toLocaleString("ru-RU")} {sub.currency.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            {subStatusBadge(sub.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

        </CardContent>
      </Card>

    </div>
  );
}
