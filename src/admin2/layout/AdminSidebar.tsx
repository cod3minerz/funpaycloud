"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Squares2X2Icon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  PlayCircleIcon,
  ServerIcon,
  TagIcon,
  UsersIcon,
  NoSymbolIcon,
  ArrowRightOnRectangleIcon,
  BugAntIcon,
  LightBulbIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { clearAdminToken } from "@/lib/auth";
import { adminApi } from "@/lib/api";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const staticNavItems: Omit<NavItem, 'badge'>[] = [
  { href: "/ops/dashboard",  label: "Dashboard",        Icon: Squares2X2Icon },
  { href: "/ops/logs",       label: "Логи",             Icon: DocumentTextIcon },
  { href: "/ops/monitoring", label: "Мониторинг",       Icon: ComputerDesktopIcon },
  { href: "/ops/runners",    label: "Воркеры",          Icon: PlayCircleIcon },
  { href: "/ops/proxies",    label: "Прокси",           Icon: ServerIcon },
  { href: "/ops/promocodes", label: "Промокоды",        Icon: TagIcon },
  { href: "/ops/users",      label: "Пользователи",     Icon: UsersIcon },
  { href: "/ops/bans",       label: "Баны",             Icon: NoSymbolIcon },
  { href: "/ops/orders",    label: "Заказы",           Icon: ShoppingBagIcon },
  { href: "/ops/chats",     label: "Чаты",             Icon: ChatBubbleLeftRightIcon },
];

type AdminSidebarProps = {
  isMobileOpen?: boolean;
  onClose?: () => void;
};

export function AdminSidebar({ isMobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCounts, setUnreadCounts] = useState({ tickets: 0, ideas: 0 });

  useEffect(() => {
    adminApi.feedbackCounts().then(setUnreadCounts).catch(() => {});
  }, [pathname]);

  const navItems: NavItem[] = [
    ...staticNavItems,
    { href: "/ops/tickets", label: "Тикеты", Icon: BugAntIcon,    badge: unreadCounts.tickets },
    { href: "/ops/ideas",   label: "Идеи",   Icon: LightBulbIcon, badge: unreadCounts.ideas },
  ];

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // local cleanup still runs
    } finally {
      clearAdminToken();
      router.push("/ops/login");
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5 dark:border-gray-800">
        <Link href="/ops/dashboard" onClick={onClose}>
          <Image
            src="/branding/logo_full_new.svg"
            alt="FunPay Cloud"
            width={130}
            height={22}
            className="dark:hidden"
          />
          <Image
            src="/branding/logo_full_new_dark.svg"
            alt="FunPay Cloud"
            width={130}
            height={22}
            className="hidden dark:block"
          />
        </Link>
        <span className="rounded-full bg-error-500/10 px-2 py-0.5 text-[10px] font-semibold text-error-600 dark:text-error-400">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        <p className="mb-2 px-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Навигация
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ href, label, Icon, badge }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>{label}</span>
                  {badge != null && badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
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
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </span>
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
