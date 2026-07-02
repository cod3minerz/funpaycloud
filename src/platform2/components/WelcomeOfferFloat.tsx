"use client";

import { useEffect, useState, useCallback } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { billingApi, type WelcomeOffer } from "@/lib/api";

type Plan = "lite" | "pro" | "ultra";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function timeLeft(expiresAt: string): { h: number; m: number; s: number; expired: boolean } {
  const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  if (diff === 0) return { h: 0, m: 0, s: 0, expired: true };
  return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60, expired: false };
}

export function WelcomeOfferFloat() {
  const [offer, setOffer] = useState<WelcomeOffer | null>(null);
  const [tick, setTick] = useState<{ h: number; m: number; s: number; expired: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [purchasing, setPurchasing] = useState<Plan | null>(null);

  useEffect(() => {
    billingApi.getWelcomeOffer()
      .then((data) => {
        if (data.active && data.expires_at) setOffer(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!offer?.expires_at) return;
    const update = () => {
      const t = timeLeft(offer.expires_at!);
      setTick(t);
      if (t.expired) setDismissed(true);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [offer]);

  const handleActivate = useCallback(async (plan: Plan) => {
    if (purchasing) return;
    setPurchasing(plan);
    try {
      const resp = await billingApi.createSubscriptionPayment({
        plan,
        period_days: 30,
        welcome_offer: true,
      });
      window.location.assign(resp.checkout_url);
    } catch {
      setPurchasing(null);
    }
  }, [purchasing]);

  if (!offer || !offer.active || dismissed || !tick) return null;

  const pro = offer.prices.pro;
  const savings = (pro.original - pro.discount) * 12;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl border border-amber-200 bg-white shadow-xl ring-1 ring-amber-100 dark:border-amber-700/40 dark:bg-gray-900 dark:ring-amber-800/20 animate-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🔥</span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Спецпредложение
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Закрыть"
          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Price */}
      <div className="px-4 pt-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{pro.discount} ₽</span>
          <span className="text-sm text-gray-400 line-through">{pro.original} ₽</span>
          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            −{Math.round((1 - pro.discount / pro.original) * 100)}%
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          Pro на 1 мес · экономишь{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">{savings} ₽/год</span>
        </p>
      </div>

      {/* Countdown */}
      <div className="px-4 pt-3">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-400">
          Истекает через
        </p>
        <div className="flex items-center gap-1">
          {[
            { value: tick.h, label: "ч" },
            { value: tick.m, label: "м" },
            { value: tick.s, label: "с" },
          ].map(({ value, label }, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-sm font-bold text-amber-400 dark:text-amber-500">:</span>}
              <div className="flex min-w-[38px] flex-col items-center rounded-lg bg-amber-50 px-2 py-1.5 dark:bg-amber-950/30">
                <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white leading-none">
                  {pad(value)}
                </span>
                <span className="mt-0.5 text-[9px] text-gray-400">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 pt-3">
        <button
          onClick={() => handleActivate("pro")}
          disabled={!!purchasing}
          className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
        >
          {purchasing === "pro" ? "…" : `Активировать за ${pro.discount} ₽`}
        </button>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
          <button
            onClick={() => handleActivate("lite")}
            disabled={!!purchasing}
            className="transition-colors hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
          >
            Lite {offer.prices.lite.discount} ₽
          </button>
          <span className="text-gray-200 dark:text-gray-700">·</span>
          <button
            onClick={() => handleActivate("ultra")}
            disabled={!!purchasing}
            className="transition-colors hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
          >
            Ultra {offer.prices.ultra.discount} ₽
          </button>
        </div>
      </div>
    </div>
  );
}
