"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authApi } from "@/lib/api";
import { logout } from "@/lib/auth";
import { Modal } from "@/platform2/components/ui/modal";

/** Routes that remain accessible even when subscription is locked */
const LOCK_ALLOWED: string[] = [
  "/platform/subscription",
  "/platform/promo-codes",
  "/platform/dashboard",
];

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

function SubscriptionWarningBanner({
  daysLeft,
  expiresAt,
  isTrial,
  onClose,
}: {
  daysLeft: number;
  expiresAt: string | null;
  isTrial: boolean;
  onClose: () => void;
}) {
  const dateStr = expiresAt
    ? ` (до ${new Date(expiresAt).toLocaleDateString("ru-RU")})`
    : "";

  const isUrgent = daysLeft <= 3;
  const borderColor = isTrial && !isUrgent
    ? "border-violet-200 dark:border-violet-900/40"
    : "border-red-200 dark:border-red-900/40";
  const bgColor = isTrial && !isUrgent
    ? "bg-violet-50 dark:bg-violet-900/10"
    : "bg-red-50 dark:bg-red-900/20";
  const textColor = isTrial && !isUrgent
    ? "text-violet-700 dark:text-violet-400"
    : "text-red-700 dark:text-red-400";
  const btnColor = isTrial && !isUrgent
    ? "bg-violet-600 hover:bg-violet-700"
    : "bg-red-500 hover:bg-red-600";

  const message = isTrial
    ? `🚀 Пробный период: осталось ${daysLeft} ${pluralDays(daysLeft)}${dateStr}. После окончания AI-ответы и плагины будут недоступны.`
    : `⚠️ Осталось ${daysLeft} ${pluralDays(daysLeft)} доступа${dateStr}. Продлите подписку, чтобы не остановить автоматизацию.`;

  const btnLabel = isTrial ? "Перейти на Pro" : "Продлить";

  return (
    <div className={`relative flex items-center justify-between gap-3 border-b ${borderColor} ${bgColor} px-4 py-2.5 text-sm ${textColor} sm:px-6`}>
      <p className="font-medium">{message}</p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/platform/subscription"
          className={`whitespace-nowrap rounded-md ${btnColor} px-3 py-1 text-xs font-semibold text-white transition-colors`}
        >
          {btnLabel}
        </Link>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className={`flex h-6 w-6 items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function SubscriptionExpiredModal() {
  return (
    <Modal
      isOpen={true}
      onClose={() => {}} /* non-closeable — subscription must be renewed */
      showCloseButton={false}
      className="max-w-[560px] p-8"
    >
      {/* Icon */}
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-red-500"
        >
          <path
            d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <h2 className="mb-3 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Подписка истекла
      </h2>
      <p className="mb-6 text-center text-sm leading-6 text-gray-500 dark:text-gray-400">
        Доступ к рабочим разделам платформы ограничен. Продлите подписку, чтобы
        снова включить автоматизацию, чаты, аналитику и управление аккаунтами.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/platform/subscription"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Продлить подписку
        </Link>
        <Link
          href="/platform/promo-codes"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ввести промокод
        </Link>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={() => logout()}
        className="mt-3 w-full rounded-xl px-5 py-2.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        Выйти из аккаунта
      </button>

      {/* Support link */}
      <a
        href="https://t.me/fpcloud_support"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center text-xs text-gray-400 hover:text-gray-500"
      >
        Нужна помощь? Написать @fpcloud_support
      </a>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main guard component
// ─────────────────────────────────────────────────────────────────────

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [checked, setChecked] = useState(false);
  const [locked, setLocked] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("sub_banner_dismissed") === "1") setBannerDismissed(true);
    } catch {}
  }, []);

  function dismissBanner() {
    setBannerDismissed(true);
    try { sessionStorage.setItem("sub_banner_dismissed", "1"); } catch {}
  }

  useEffect(() => {
    let cancelled = false;

    authApi
      .me()
      .then((profile) => {
        if (cancelled) return;
        const isLocked = Boolean(
          profile.subscription_expired ||
          profile.trial_expired ||
          profile.status_code === "subscription_expired" ||
          profile.status_code === "trial_expired"
        );
        setLocked(isLocked);
        setIsTrial(profile.plan === "trial");

        if (
          typeof profile.subscription_days_left === "number" &&
          Number.isFinite(profile.subscription_days_left)
        ) {
          setDaysLeft(Math.max(0, Math.ceil(profile.subscription_days_left)));
        } else if (profile.trial_expires_at) {
          const diff = new Date(profile.trial_expires_at).getTime() - Date.now();
          setDaysLeft(Math.max(0, Math.ceil(diff / 86400000)));
        } else {
          setDaysLeft(null);
        }

        setExpiresAt(
          profile.subscription_expires_at ?? profile.trial_expires_at ?? null
        );
      })
      .catch(() => {
        if (cancelled) return;
        setDaysLeft(null);
        setExpiresAt(null);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isAllowedPath = LOCK_ALLOWED.some((p) => pathname.startsWith(p));

  // Trial-баннер: показываем всё время пока идёт trial (не только последние 3 дня)
  const showBanner =
    checked &&
    !locked &&
    typeof daysLeft === "number" &&
    daysLeft >= 1 &&
    (isTrial || daysLeft <= 3) &&
    !bannerDismissed;

  const showModal = checked && locked && !isAllowedPath;

  return (
    <>
      {showBanner && (
        <SubscriptionWarningBanner
          daysLeft={daysLeft!}
          expiresAt={expiresAt}
          isTrial={isTrial}
          onClose={dismissBanner}
        />
      )}
      {children}
      {showModal && <SubscriptionExpiredModal />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function pluralDays(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "день";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "дня";
  return "дней";
}
