"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import Select from "@/platform2/components/form/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";
import Icon from "@/platform2/icons";
import { analyticsApi, accountsApi, authApi, AnalyticsData, ApiAccount } from "@/lib/api";
import { normalizePlanId, PLAN_LIMITS } from "@/shared/subscriptions";

type Period = "week" | "month" | "quarter" | "year";

const periodLabels: Record<Period, string> = {
  week: "Неделя",
  month: "Месяц",
  quarter: "Квартал",
  year: "Год",
};

const periodDays: Record<Period, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

const periodApiMap: Record<Period, string> = {
  week: "7d",
  month: "30d",
  quarter: "90d",
  year: "365d",
};

function MiniLineChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (data.length < 2) return <div className="h-28 flex items-center justify-center text-xs text-gray-400">Нет данных</div>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const w = 400;
  const h = 120;
  const pad = 12;
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - pad * 2));
  const ys = data.map((d) => pad + (1 - d.revenue / max) * (h - pad * 2));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${line} L${xs[xs.length - 1]},${h - pad} L${xs[0]},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#465fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#465fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke="#465fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3.5" fill="#465fff" />
      ))}
    </svg>
  );
}

const COLORS = ["#465fff", "#7a5af8", "#38bdf8", "#34d399", "#f59e0b"];

function HBarChart({ data }: { data: { account_id: number; username: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="space-y-4 pt-2">
      {data.map((item, idx) => (
        <div key={item.account_id}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.username}</span>
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              {item.revenue.toLocaleString("ru-RU", { minimumFractionDigits: 0 })} ₽
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${(item.revenue / max) * 100}%`, background: COLORS[idx % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductChart({ data }: { data: { name: string; revenue: number; orders?: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="space-y-3 pt-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-5 text-center text-xs font-bold text-gray-400">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{item.name}</p>
            <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-1.5 rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${(item.revenue / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-white whitespace-nowrap">
            {item.revenue.toLocaleString("ru-RU", { minimumFractionDigits: 0 })} ₽
          </span>
        </div>
      ))}
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; orders: number }[] }) {
  const max = Math.max(...data.map((d) => d.orders), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 pt-2">
      {data.map((item) => (
        <div key={item.hour} className="flex flex-1 flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
            <div
              className="w-full rounded-t-sm bg-brand-500/70 transition-all duration-500 min-h-[3px]"
              style={{ height: `${Math.max((item.orders / max) * 80, 3)}px` }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{item.hour}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [accountId, setAccountId] = useState<string>("all");
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [maxDays, setMaxDays] = useState<number>(7);

  useEffect(() => {
    accountsApi.list().then(setAccounts).catch(() => {});
    authApi.me().then((me) => {
      const plan = normalizePlanId(me.plan);
      const limits = plan === "trial" ? PLAN_LIMITS.trial
        : plan === "lite" ? PLAN_LIMITS.lite
        : plan === "pro" ? PLAN_LIMITS.pro
        : PLAN_LIMITS.ultra;
      const days = limits.analytics_days === Infinity ? 365 : limits.analytics_days;
      setMaxDays(days);
      // clamp current period if needed
      setPeriod((p) => (periodDays[p] <= days ? p : "week"));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params: { period: string; account_id?: number | string } = {
      period: periodApiMap[period],
    };
    if (accountId !== "all") params.account_id = accountId;
    analyticsApi.get(params).then(setData).catch(() => {});
  }, [period, accountId]);

  const diffClass = (v: number) =>
    v >= 0 ? "text-success-600" : "text-error-500";
  const diffSign = (v: number) => (v >= 0 ? "+" : "");

  const revenue = data?.revenue ?? 0;
  const ordersCount = data?.orders_count ?? 0;
  const avgCheck = data?.avg_check ?? 0;
  const conversion = data?.conversion ?? 0;
  const chartData = data?.chart ?? [];
  const topProducts = data?.top_products ?? [];
  const hourlyData = data?.hourly ?? [];
  const topBuyers = data?.top_buyers ?? [];
  const byAccounts = data?.by_accounts ?? [];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Аналитика</h1>
        <div className="flex flex-wrap items-center gap-2">
          {accounts.length > 0 && (
            <>
              <Select value={accountId} onChange={setAccountId}>
                <option value="all">Все аккаунты</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.username ?? `#${a.id}`}</option>
                ))}
              </Select>
            </>
          )}
          <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
            {(Object.keys(periodLabels) as Period[]).map((p) => {
              const locked = periodDays[p] > maxDays;
              return (
                <button
                  key={p}
                  onClick={() => !locked && setPeriod(p)}
                  title={locked ? `Доступно начиная с тарифа ${periodDays[p] <= 30 ? "Pro" : "Ultra"}` : undefined}
                  className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    locked
                      ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                      : period === p
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {periodLabels[p]}
                  {locked && (
                    <span className="ml-1 text-[9px] font-bold uppercase text-gray-300 dark:text-gray-600">
                      {periodDays[p] <= 30 ? "Pro+" : "Ultra"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="border-t-2 border-brand-500 pt-4">
              <p className="text-sm text-gray-500">Выручка</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                {revenue.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
              </h3>
              <p className="mt-1 text-xs font-medium text-gray-400">за период</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="border-t-2 border-brand-500 pt-4">
              <p className="text-sm text-gray-500">Заказов</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{ordersCount}</h3>
              <p className="mt-1 text-xs font-medium text-gray-400">за период</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="border-t-2 border-brand-500 pt-4">
              <p className="text-sm text-gray-500">Средний чек</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                {avgCheck.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
              </h3>
              <p className="mt-1 text-xs font-medium text-gray-400">за период</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="border-t-2 border-brand-500 pt-4">
              <p className="text-sm text-gray-500">Конверсия</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{conversion}%</h3>
              <p className="mt-1 text-xs font-medium text-gray-400">за период</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Динамика выручки</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-2">
            <MiniLineChart data={chartData} />
            {chartData.length > 0 && (() => {
              const fmt = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
              const first = chartData[0];
              const last = chartData[chartData.length - 1];
              const mid = chartData[Math.floor(chartData.length / 2)];
              return (
                <div className="mt-2 flex justify-between px-3 text-xs text-gray-400">
                  <span>{fmt(first.date)}</span>
                  {chartData.length > 4 && <span>{fmt(mid.date)}</span>}
                  <span>{fmt(last.date)}</span>
                </div>
              );
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>По аккаунтам</CardTitle>
          </CardHeader>
          <CardContent>
            {byAccounts.length > 0 ? (
              <HBarChart data={byAccounts} />
            ) : (
              <div className="flex h-28 items-center justify-center text-sm text-gray-400">Нет данных</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Топ товаров</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ProductChart data={topProducts} />
            ) : (
              <div className="flex h-28 items-center justify-center text-sm text-gray-400">Нет данных</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Активность по часам</CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyData.length > 0 ? (
              <>
                <HourlyChart data={hourlyData} />
                <p className="mt-2 text-center text-xs text-gray-400">Час дня (0–23)</p>
              </>
            ) : (
              <div className="flex h-28 items-center justify-center text-sm text-gray-400">Нет данных</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BUYER TABLE */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle>Покупатели</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Покупатель</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Заказов</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Выручка</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Последний заказ</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topBuyers.map((buyer) => (
                  <TableRow key={buyer.username}>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">
                          {buyer.username[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-white">{buyer.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{buyer.orders}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">
                        {buyer.revenue.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(buyer.last_order).toLocaleDateString("ru-RU")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {topBuyers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-gray-400">
                      Нет данных за период
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
