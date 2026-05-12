"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import Icon from "@/platform2/icons";
import { financesApi, FinancesData } from "@/lib/api";

const TX_TYPE: Record<string, string> = {
  sale: "Продажа",
  refund: "Возврат",
  fee: "Комиссия",
};

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU");
}

export default function FinancesPage() {
  const [data, setData] = useState<FinancesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financesApi.get({ limit: 100 })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Финансы</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Общая выручка", value: fmt(data.total_revenue), icon: "dollar-line" },
              { label: "Заказов", value: String(data.total_orders), icon: "list" },
              { label: "Аккаунтов", value: String(data.accounts_count), icon: "group" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{s.label}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                      <Icon name={s.icon} className="h-6 w-6 text-brand-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Transactions */}
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">Транзакции</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Icon name="dollar-line" className="h-12 w-12 text-gray-200" />
                  <p className="mt-3 text-sm text-gray-400">Транзакций нет</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{tx.description}</p>
                        <p className="text-xs text-gray-400">{tx.account_username} · {fmtDate(tx.date)}</p>
                      </div>
                      <span className={`text-sm font-semibold ${tx.amount >= 0 ? "text-success-600" : "text-error-500"}`}>
                        {tx.amount >= 0 ? "+" : ""}{fmt(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Icon name="dollar-line" className="h-12 w-12 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">Не удалось загрузить данные</p>
        </div>
      )}
    </div>
  );
}
