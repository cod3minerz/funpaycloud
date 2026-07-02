"use client";

import { useEffect, useState, useCallback } from "react";
import { billingApi, type WelcomeOffer } from "@/lib/api";

type Plan = "lite" | "pro" | "ultra";

interface Props {
  onActivate: (plan: Plan, welcomeOffer: boolean) => void;
  purchasing: string | null;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function timeLeft(expiresAt: string): { h: number; m: number; s: number; expired: boolean } {
  const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  if (diff === 0) return { h: 0, m: 0, s: 0, expired: true };
  return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60, expired: false };
}

export function WelcomeOfferBanner({ onActivate, purchasing }: Props) {
  const [offer, setOffer] = useState<WelcomeOffer | null>(null);
  const [tick, setTick] = useState<{ h: number; m: number; s: number; expired: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);

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

  const handleActivate = useCallback((plan: Plan) => {
    onActivate(plan, true);
  }, [onActivate]);

  if (!offer || !offer.active || dismissed || !tick) return null;

  const pro = offer.prices.pro;
  const savings = (pro.original - pro.discount) * 12;

  return (
    <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-700/50 dark:from-amber-950/30 dark:to-orange-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔥</span>
        <span className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Специальное предложение — только для тебя
        </span>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: price + savings */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{pro.discount} ₽</span>
            <span className="text-base text-gray-500 line-through">{pro.original} ₽</span>
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              −{Math.round((1 - pro.discount / pro.original) * 100)}%
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            Pro на 1 месяц · Экономишь <span className="font-semibold text-gray-800 dark:text-gray-200">{savings} ₽/год</span>
          </p>
        </div>

        {/* Center: countdown */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
            Предложение истекает через
          </p>
          <div className="flex items-center gap-1.5">
            {[
              { value: tick.h, label: "ч" },
              { value: tick.m, label: "м" },
              { value: tick.s, label: "с" },
            ].map(({ value, label }, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-xl font-bold text-amber-400 dark:text-amber-500">:</span>}
                <div className="flex min-w-[52px] flex-col items-center rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-amber-200 dark:bg-gray-900 dark:ring-amber-700/40">
                  <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                    {pad(value)}
                  </span>
                  <span className="text-[10px] text-gray-400">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleActivate("pro")}
            disabled={purchasing === "pro"}
            className="whitespace-nowrap rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-60"
          >
            {purchasing === "pro" ? "…" : `Активировать Pro за ${pro.discount} ₽`}
          </button>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
            <button
              onClick={() => handleActivate("lite")}
              disabled={!!purchasing}
              className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Lite за {offer.prices.lite.discount} ₽
            </button>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <button
              onClick={() => handleActivate("ultra")}
              disabled={!!purchasing}
              className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Ultra за {offer.prices.ultra.discount} ₽
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
