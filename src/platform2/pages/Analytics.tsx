"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import Icon from "@/platform2/icons";
import { accountsApi, analyticsApi, AnalyticsData, ApiAccount } from "@/lib/api";

const PERIODS = [
  { label: "Сегодня", value: "today" },
  { label: "7 дней", value: "7d" },
  { label: "30 дней", value: "30d" },
  { label: "Всё время", value: "all" },
];

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
            <Icon name={icon} className="h-6 w-6 text-brand-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [accountId, setAccountId] = useState("all");

  useEffect(() => {
    accountsApi.list().then((rows) => setAccounts(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Parameters<typeof analyticsApi.get>[0] = { period };
    if (accountId !== "all") params.account_id = accountId;

    analyticsApi.get(params)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [period, accountId]);

  const fmt = (n: number) => n.toLocaleString("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Аналитика</h1>
        <div className="flex gap-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Все аккаунты</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
          </select>
          <div className="flex rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  period === p.value
                    ? "bg-brand-500 text-white"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Выручка" value={fmt(data.revenue)} icon="dollar-line" />
            <StatCard title="Заказов" value={String(data.orders_count)} icon="list" />
            <StatCard title="Средний чек" value={fmt(data.avg_check)} icon="chart-bar" />
            <StatCard title="Конверсия" value={`${(data.conversion * 100).toFixed(1)}%`} icon="bolt" />
          </div>

          {data.top_products.length > 0 && (
            <Card>
              <CardHeader className="px-6 py-4"><CardTitle className="text-base">Топ товаров</CardTitle></CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3">
                  {data.top_products.slice(0, 10).map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500">{i + 1}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{p.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.top_buyers.length > 0 && (
            <Card>
              <CardHeader className="px-6 py-4"><CardTitle className="text-base">Топ покупателей</CardTitle></CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3">
                  {data.top_buyers.slice(0, 10).map((b, i) => (
                    <div key={b.username} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-500/10 text-xs font-bold text-success-600">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{b.username}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(b.revenue)}</p>
                        <p className="text-xs text-gray-400">{b.orders} заказов</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.by_accounts.length > 1 && (
            <Card>
              <CardHeader className="px-6 py-4"><CardTitle className="text-base">По аккаунтам</CardTitle></CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3">
                  {data.by_accounts.map((acc) => (
                    <div key={acc.account_id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{acc.username}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(acc.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Icon name="chart-bar" className="h-12 w-12 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">Нет данных за выбранный период</p>
        </div>
      )}
    </div>
  );
}
