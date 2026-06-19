"use client";

import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { AdminThemeToggleButton } from "./AdminThemeToggleButton";
import Badge from '@/platform2/components/ui/badge/Badge';

const PAGE_TITLES: Record<string, string> = {
  "/ops/dashboard":  "Dashboard",
  "/ops/logs":       "Системные логи",
  "/ops/monitoring": "Мониторинг",
  "/ops/runners":    "Runtime воркеры",
  "/ops/proxies":    "Shared прокси",
  "/ops/promocodes": "Промокоды",
  "/ops/users":      "Пользователи",
  "/ops/bans":       "Баны",
  "/ops/tickets":    "Тикеты",
  "/ops/ideas":      "Идеи",
};

type AdminHeaderProps = {
  onMenuClick?: () => void;
};

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          aria-label="Открыть меню"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <AdminThemeToggleButton />
        <Badge variant="light" color="primary" size="sm">Admin</Badge>
      </div>
    </header>
  );
}
