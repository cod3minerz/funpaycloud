"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Ban,
  LayoutDashboard,
  LogOut,
  Logs,
  MonitorSmartphone,
  Network,
  PlayCircle,
  Ticket,
  Users,
} from "lucide-react";
import { clearAdminToken } from "@/lib/auth";
import { adminApi } from "@/lib/api";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard",      Icon: LayoutDashboard },
  { href: "/admin/logs",      label: "Логи",           Icon: Logs },
  { href: "/admin/monitoring",label: "Мониторинг",     Icon: MonitorSmartphone },
  { href: "/admin/runners",   label: "Воркеры",        Icon: PlayCircle },
  { href: "/admin/proxies",   label: "Прокси",         Icon: Network },
  { href: "/admin/promocodes",label: "Промокоды",      Icon: Ticket },
  { href: "/admin/users",     label: "Пользователи",   Icon: Users },
  { href: "/admin/bans",      label: "Баны",           Icon: Ban },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // local cleanup still runs
    } finally {
      clearAdminToken();
      router.push("/admin/login");
    }
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5 dark:border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-500">
          <Activity size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">FunPay Cloud</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        <p className="mb-2 px-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Навигация
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                    <Icon size={16} />
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <button
          type="button"
          onClick={handleLogout}
          className="menu-item menu-item-inactive group w-full text-left"
        >
          <span className="menu-item-icon-inactive">
            <LogOut size={16} />
          </span>
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
