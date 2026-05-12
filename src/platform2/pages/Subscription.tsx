"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import { authApi, billingApi, AuthMeData, SubscriptionPaymentHistoryItem } from "@/lib/api";

const PLANS = [
  {
    id: "lite" as const,
    name: "Lite",
    price: "299 ₽/мес",
    features: ["1 аккаунт", "Автоподнятие", "Базовые уведомления"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "599 ₽/мес",
    features: ["3 аккаунта", "AI-ассистент", "Автовыдача", "Аналитика"],
    popular: true,
  },
  {
    id: "ultra" as const,
    name: "Ultra",
    price: "999 ₽/мес",
    features: ["10 аккаунтов", "Все функции Pro", "Приоритетная поддержка", "API доступ"],
  },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидание",
  paid: "Оплачен",
  failed: "Ошибка",
  refunded: "Возврат",
  canceled: "Отменён",
};
const STATUS_CLS: Record<string, string> = {
  paid: "bg-success-500/10 text-success-600",
  failed: "bg-error-500/10 text-error-500",
  pending: "bg-warning-500/10 text-warning-600",
  refunded: "bg-gray-100 text-gray-500",
  canceled: "bg-gray-100 text-gray-500",
};

export default function SubscriptionPage() {
  const [profile, setProfile] = useState<AuthMeData | null>(null);
  const [history, setHistory] = useState<SubscriptionPaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      authApi.me(),
      billingApi.listSubscriptionHistory(20),
    ])
      .then(([p, h]) => {
        setProfile(p);
        setHistory(Array.isArray(h.items) ? h.items : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscribe(plan: "lite" | "pro" | "ultra") {
    setPaying(plan);
    try {
      const res = await billingApi.createSubscriptionPayment({ plan, period_days: 30 });
      if (res.checkout_url) window.open(res.checkout_url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка создания платежа");
    } finally {
      setPaying(null);
    }
  }

  const daysLeft = typeof profile?.subscription_days_left === "number"
    ? Math.max(0, Math.ceil(profile.subscription_days_left))
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Подписка</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Current plan */}
          {profile && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Текущий тариф</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {profile.plan || "—"}
                    </p>
                    {daysLeft !== null && (
                      <p className="mt-1 text-sm text-gray-400">
                        {daysLeft > 0 ? `Осталось ${daysLeft} дн.` : "Истёк"}
                      </p>
                    )}
                    {profile.subscription_expires_at && (
                      <p className="text-xs text-gray-400">
                        до {new Date(profile.subscription_expires_at).toLocaleDateString("ru-RU")}
                      </p>
                    )}
                  </div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    profile.subscription_expired ? "bg-error-500/10" : "bg-success-500/10"
                  }`}>
                    <Icon
                      name={profile.subscription_expired ? "error" : "check-circle"}
                      className={`h-7 w-7 ${profile.subscription_expired ? "text-error-500" : "text-success-500"}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plans */}
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <Card key={plan.id} className={plan.popular ? "ring-2 ring-brand-500" : ""}>
                <CardContent className="flex h-full flex-col p-6">
                  {plan.popular && (
                    <span className="mb-3 inline-block rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-500">
                      Популярный
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-brand-500">{plan.price}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Icon name="check-line" className="h-4 w-4 text-success-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "primary" : "outline"}
                    className="mt-5 w-full justify-center"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={paying !== null}
                  >
                    {paying === plan.id ? "Перенаправление..." : "Оплатить"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* History */}
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">История платежей</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Icon name="dollar-line" className="h-12 w-12 text-gray-200" />
                  <p className="mt-3 text-sm text-gray-400">Платежей пока нет</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-6 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                          {item.plan} — {item.period_days} дн.
                        </p>
                        <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString("ru-RU")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLS[item.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.amount.toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
