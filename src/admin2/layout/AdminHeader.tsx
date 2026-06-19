"use client";

import { usePathname } from "next/navigation";
import { AdminThemeToggleButton } from "./AdminThemeToggleButton";
import Badge from '@/platform2/components/ui/badge/Badge';

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard":  "Dashboard",
  "/admin/logs":       "Системные логи",
  "/admin/monitoring": "Мониторинг",
  "/admin/runners":    "Runtime воркеры",
  "/admin/proxies":    "Shared прокси",
  "/admin/promocodes": "Промокоды",
  "/admin/users":      "Пользователи",
  "/admin/bans":       "Баны",
};

export function AdminHeader() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h1>
      <div className="flex items-center gap-3">
        <AdminThemeToggleButton />
        <Badge variant="light" color="primary" size="sm">Admin</Badge>
      </div>
    </header>
  );
}
