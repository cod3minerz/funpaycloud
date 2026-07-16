"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import {
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { authApi, billingApi, SubscriptionPaymentHistoryItem } from "@/lib/api";
import { normalizePlanId, PLAN_LIMITS } from "@/shared/subscriptions";

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
      "Конструктор сценариев (1 сцен.)",
    ],
    missing: ["Плагины", "AI автоответы", "AI-узлы в конструкторе"],
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
      "Конструктор (5 сценариев)",
      "AI-узлы в конструкторе",
      "Базовые плагины (20+)",
      "AI ответы 500 msg/мес",
      "Приоритет @fpcloud_support",
    ],
    missing: [],
    cta: "Выбрать Pro",
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
      "Конструктор (20 сценариев)",
      "AI-узлы без ограничений",
      "VIP плагины",
      "AI ответы без лимита",
      "Персональная поддержка @fpcloud_support",
    ],
    missing: [],
    cta: "Перейти на Ultra",
    color: "violet",
  },
];

const comparisonRows = [
  { label: "Аккаунты", lite: "1", pro: "5", ultra: "Безлимит" },
  { label: "Аналитика", lite: "7 дней", pro: "30 дней + CSV", ultra: "Без ограничений" },
  { label: "Конструктор", lite: "1 сценарий", pro: "5 сценариев", ultra: "20 сценариев" },
  { label: "Узлов в сценарии", lite: "до 100", pro: "до 300", ultra: "Без лимита" },
  { label: "AI-узлы", lite: "—", pro: "✓", ultra: "✓ без лимита" },
  { label: "AI сообщения", lite: "—", pro: "500 / мес", ultra: "Без лимита" },
  { label: "Плагины", lite: "—", pro: "Базовые (20+)", ultra: "VIP + эксклюзив" },
  { label: "Поддержка", lite: "—", pro: "Приоритет @fpcloud_support", ultra: "Персональная 24/7" },
];

// Circular progress ring
function RingProgress({ percent, expired }: { percent: number; expired?: boolean }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  const color = expired ? "#ef4444" : "#465fff";
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="-rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" className="dark:[stroke:#374151]" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        {expired ? (
          <p className="text-[9px] font-semibold text-red-500 leading-tight">истекла</p>
        ) : (
          <>
            <p className="text-base font-bold text-gray-900 dark:text-white leading-none">{percent}%</p>
            <p className="text-[9px] text-gray-400 leading-tight">остаток</p>
          </>
        )}
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
  const searchParams = useSearchParams();
  const [annual, setAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [expiryStr, setExpiryStr] = useState("—");
  const [periodPercent, setPeriodPercent] = useState(90);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  async function refreshProfile() {
    try {
      const me = await authApi.me();
      const plan = (me.plan ?? "").toLowerCase();
      if (plan) setCurrentPlan(plan);

      const expired = Boolean(
        me.subscription_expired ||
        me.trial_expired ||
        me.status_code === "subscription_expired" ||
        me.status_code === "trial_expired"
      );
      setIsExpired(expired);
      setIsTrial(plan === "trial");

      const left = me.subscription_days_left ?? 0;
      setDaysLeft(expired ? 0 : left);

      const expiresAt = me.subscription_expires_at ?? me.trial_expires_at;
      if (expiresAt) {
        setExpiryStr(new Date(expiresAt).toLocaleDateString("ru-RU", {
          day: "numeric", month: "long", year: "numeric",
        }));
      }

      if (expired) {
        setPeriodPercent(0);
      } else if (expiresAt) {
        const total = plan === "trial" ? 7 : annual ? 365 : 30;
        setPeriodPercent(Math.max(0, Math.min(100, Math.round((left / total) * 100))));
      }
    } catch {
      // profile refresh is best-effort here
    }
  }

  useEffect(() => {
    const planFromQuery = searchParams.get("plan");
    if (planFromQuery && ["lite", "pro", "ultra"].includes(planFromQuery)) {
      setSelectedPlan(planFromQuery);
    }
    const periodFromQuery = searchParams.get("period");
    if (periodFromQuery === "year") {
      setAnnual(true);
    }
    refreshProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const paymentResult = searchParams.get("subscriptionPayment");
    const paymentId = searchParams.get("paymentId");
    if (!paymentResult || !paymentId) return;

    // T-Bank may redirect back before payment reaches CONFIRMED status.
    // Poll up to 8 times with 2.5s delay to wait for AUTHORIZED → CONFIRMED.
    let cancelled = false;
    async function verifyPayment() {
      if (paymentResult === "failed") {
        toast.error("Платеж не прошел");
        return;
      }
      const maxAttempts = 8;
      const delay = 2500;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelled) return;
        try {
          const status = await billingApi.getCheckoutStatus(paymentId);
          if (cancelled) return;
          if (status.status === "paid") {
            toast.success("Подписка оплачена и активирована!");
            await refreshProfile();
            return;
          }
          if (status.status === "failed") {
            toast.error("Платеж не прошел");
            return;
          }
          // pending — ждём перед следующей попыткой
          if (attempt < maxAttempts - 1) {
            await new Promise<void>((r) => setTimeout(r, delay));
          }
        } catch {
          if (cancelled) return;
          if (attempt < maxAttempts - 1) {
            await new Promise<void>((r) => setTimeout(r, delay));
          }
        }
      }
      if (!cancelled) {
        toast.info("Платеж обрабатывается. Статус обновится автоматически.");
      }
    }
    verifyPayment();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleChoosePlan(planId: string, allowCurrent = false, welcomeOffer = false) {
    if (planId === currentPlan && !allowCurrent) return;
    setPurchasing(planId);
    try {
      const resp = await billingApi.createSubscriptionPayment({
        plan: planId as "lite" | "pro" | "ultra",
        period_days: welcomeOffer ? 30 : (annual ? 365 : 30),
        welcome_offer: welcomeOffer || undefined,
      });
      window.location.assign(resp.checkout_url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось создать платеж");
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
      <Card className={isExpired ? "border-red-200 dark:border-red-900/40" : ""}>
        <CardContent className="p-6">
          {isExpired && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Подписка истекла. Продлите её, чтобы возобновить работу автоматизации.
            </div>
          )}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <RingProgress percent={periodPercent} expired={isExpired} />
              <div>
                <div className="flex items-center gap-2">
                  <span className={`flex h-2 w-2 rounded-full ${isExpired ? "bg-red-500" : "bg-success-500"}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    isExpired ? "text-red-600 dark:text-red-400" : "text-success-600"
                  }`}>
                    {isExpired ? "Подписка истекла" : isTrial ? "Пробный период" : "Активная подписка"}
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  Тариф{" "}
                  <span className={isExpired ? "text-red-500" : "text-brand-500"}>
                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </span>
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {isExpired
                    ? `Истекла ${expiryStr}`
                    : `Действует до ${expiryStr} · Осталось `}
                  {!isExpired && (
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{daysLeft ?? "—"} дн.</span>
                  )}
                </p>
              </div>
            </div>
            <div className="shrink-0">
              {isTrial ? (
                <Button
                  variant="primary"
                  className="whitespace-nowrap"
                  onClick={() => document.getElementById("plans-grid")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Выбрать тариф
                </Button>
              ) : (
                <Button
                  variant={isExpired ? "primary" : "outline"}
                  className="whitespace-nowrap"
                  onClick={() => handleChoosePlan(currentPlan, true)}
                  disabled={purchasing === currentPlan}
                >
                  {isExpired ? "Возобновить подписку" : annual ? "Продлить на год" : "Продлить на месяц"}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:grid-cols-4">
            {(() => {
              const limits = PLAN_LIMITS[normalizePlanId(currentPlan)];
              return [
                { label: "Аккаунты", value: limits.accounts === Infinity ? "Безлимит" : String(limits.accounts) },
                { label: "Аналитика", value: limits.analytics_days === Infinity ? "Без лимита" : `${limits.analytics_days} дней` },
                { label: "Сценарии", value: limits.scenarios === Infinity ? "Безлимит" : String(limits.scenarios) },
                { label: "AI сообщений", value: limits.ai_messages_per_month === Infinity ? "Без лимита" : limits.ai_messages_per_month === 0 ? "—" : `${limits.ai_messages_per_month} / мес` },
              ];
            })().map(({ label, value }) => (
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
      <div id="plans-grid" className="grid gap-4 sm:grid-cols-3">
        {plansWithCurrent.map((plan) => {
          const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
                plan.current || selectedPlan === plan.id
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
