import React from "react";
import Link from "next/link";

export default function SidebarWidget() {
  return (
    <div className="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Тариф</p>
        <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-500">Pro</span>
      </div>
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Аккаунты</span>
          <span className="font-medium text-gray-800 dark:text-white">1 / 5</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-full w-1/5 rounded-full bg-brand-500" />
        </div>
      </div>
      <Link
        href="/platform/subscription"
        className="flex w-full items-center justify-center rounded-lg bg-brand-500 py-2.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
      >
        Управление тарифом
      </Link>
    </div>
  );
}
