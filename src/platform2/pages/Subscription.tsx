"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import {
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { authApi, billingApi, SubscriptionPaymentHistoryItem } from "@/lib/api";

const plans = [
  {
    id: "lite",
    name: "Lite",
    monthlyPrice: 149,
    yearlyPrice: 119,
    tagline: "Для старта",
    features: [
      "1 аккаунт FunPay",
      "Автоподнятие лотов",
      "Автовыдача товаров",
      "Аналитика 7 дней",
      "2 правила автоматизации",
    ],
    missing: ["Плагины", "AI автоответы", "Поддержка @funpay_cloud"],
    cta: "Выбрать Lite",
    color: "gray",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 299,
    yearlyPrice: 239,
    tagline: "Лучший выбор",
    popular: true,
    features: [
      "5 аккаунтов FunPay",
      "Автоподнятие лотов",
      "Автовыдача товаров",
      "Аналитика 30 дней + CSV",
      "10 правил автоматизации",
      "Базовые плагины (20+)",
      "AI ответы 500 msg/мес",
      "Приоритет @funpay_cloud",
    ],
    missing: [],
    cta: "Текущий тариф",
    color: "brand",
  },
  {
    id: "ultra",
    name: "Ultra",
    monthlyPrice: 599,
    yearlyPrice: 479,
    tagline: "Для масштаба",
    features: [
      "Безлимит аккаунтов",
      "Всё из Pro",
      "Аналитика без ограничений",
      "Безлимит автоматизации",
      "VIP плагины",
      "AI ответы без лимита",
      "Персональная поддержка @funpay_cloud",
      "API доступ",
    ],
    missing: [],
    cta: "Перейти на Ultra",
    color: "violet",
  },
];

const comparisonRows = [
  { label: "Аккаунты", lite: "1", pro: "5", ultra: "Безлимит" },
  { label: "Аналитика", lite: "7 дней", pro: "30 дней + CSV", ultra: "Без ограничений" },
  { label: "Автоматизация", lite: "2 правила", pro: "10 правил", ultra: "Без ограничений" },
  { label: "Шаблоны сообщений", lite: "3", pro: "15", ultra: "Без ограничений" },
  { label: "AI ответы", lite: "—", pro: "500 / мес", ultra: "Без лимита" },
  { label: "Плагины", lite: "—", pro: "Базовые", ultra: "VIP + эксклюзив" },
  { label: "Поддержка", lite: "@funpay_cloud", pro: "Приоритет @funpay_cloud", ultra: "@funpay_cloud 24/7" },
];

// Circular progress ring
function RingProgress({ percent }: { percent: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="-rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="#465fff" strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-base font-bold text-gray-900 dark:text-white leading-none">{percent}%</p>
        <p className="text-[9px] text-gray-400 leading-tight">остаток</p>
      </div>
    </div>
  );
}

// Toggle switch
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SubscriptionPage() {
  const [annual, setAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("pro");
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [expiryStr, setExpiryStr] = useState("—");
  const [periodPercent, setPeriodPercent] = useState(90);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    authApi.me().then((me) => {
      if (me.plan) setCurrentPlan(me.plan.toLowerCase());
      if (me.subscription_days_left != null) setDaysLeft(me.subscription_days_left);
      if (me.subscription_expires_at) {
        setExpiryStr(new Date(me.subscription_expires_at).toLocaleDateString("ru-RU", {
          day: "numeric", month: "long", year: "numeric",
        }));
        const total = 30;
        const left = me.subscription_days_left ?? 0;
        setPeriodPercent(Math.round((left / total) * 100));
      }
    }).catch(() => {});
  }, []);

  async function handleChoosePlan(planId: string) {
    if (planId === currentPlan) return;
    setPurchasing(planId);
    try {
      const resp = await billingApi.createSubscriptionPayment({
        plan: planId as "lite" | "pro" | "ultra",
        period_days: 30,
      });
      window.open(resp.checkout_url, "_blank");
    } catch {
      // ignore
    } finally {
      setPurchasing(null);
    }
  }

  const plansWithCurrent = plans.map((p) => ({
    ...p,
    current: p.id === currentPlan,
    cta: p.id === currentPlan ? "Текущий тариф" : p.cta,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Подписка</h1>

      {/* Active plan banner */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <RingProgress percent={periodPercent} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-success-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-success-600">
                    Активная подписка
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  Тариф <span className="text-brand-500">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span>
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Действует до {expiryStr} · Осталось{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{daysLeft ?? "—"} дн.</span>
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Button
                variant="outline"
                className="whitespace-nowrap"
                onClick={() => handleChoosePlan(currentPlan)}
                disabled={purchasing === currentPlan}
              >
                Продлить на месяц
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:grid-cols-4">
            {[
              { label: "Аккаунты", value: "1 / 5" },
              { label: "Аналитика", value: "30 дней" },
              { label: "Плагины", value: "Базовые" },
              { label: "AI сообщений", value: "500 / мес" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Period toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
          Ежемесячно
        </span>
        <Toggle checked={annual} onChange={() => setAnnual((v) => !v)} />
        <span className={`text-sm font-medium ${annual ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
          Ежегодно
        </span>
        {annual && (
          <span className="rounded-full bg-success-500/10 px-2 py-0.5 text-xs font-semibold text-success-600">
            −20%
          </span>
        )}
      </div>

      {/* Plans grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {plansWithCurrent.map((plan) => {
          const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
                plan.current
                  ? "border-brand-500 shadow-[0_0_0_1px_#465fff] dark:border-brand-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-brand-500 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                    Популярный
                  </span>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{plan.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{price}</span>
                  <span className="mb-1 text-sm text-gray-400">₽/мес</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">{plan.tagline}</p>
              </div>

              <div className="my-5 h-px bg-gray-100 dark:bg-gray-800" />

              <ul className="flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircleIcon className={`mt-0.5 h-4 w-4 shrink-0 ${plan.current ? "text-brand-500" : plan.id === "ultra" ? "text-violet-500" : "text-success-500"}`} />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300 dark:text-gray-600">
                    <XMarkIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <button
                  disabled={plan.current || purchasing === plan.id}
                  onClick={() => handleChoosePlan(plan.id)}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.current
                      ? "cursor-default bg-brand-50 text-brand-400 dark:bg-brand-500/10"
                      : plan.id === "ultra"
                      ? "bg-violet-500 text-white hover:bg-violet-600"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {purchasing === plan.id ? "…" : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <Card>
        <button
          onClick={() => setShowComparison((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span>{showComparison ? "Скрыть" : "Показать"} подробное сравнение</span>
          {showComparison ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>

        {showComparison && (
          <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-1/3">
                    Функция
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Lite
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Pro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-violet-500">
                    Ultra
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-gray-50 last:border-0 dark:border-gray-800 ${
                      i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/20"
                    }`}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{row.lite}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-800 dark:text-white">{row.pro}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{row.ultra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
