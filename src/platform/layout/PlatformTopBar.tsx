'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, ChevronLeft, ChevronRight, LifeBuoy, Menu, Radio, Send } from 'lucide-react';
import { accounts } from '@/platform/data/demoData';

const PATH_LABELS: Record<string, string> = {
  platform: 'Платформа',
  dashboard: 'Дашборд',
  chats: 'Чаты',
  orders: 'Заказы',
  lots: 'Лоты',
  warehouse: 'Склад',
  analytics: 'Аналитика',
  automation: 'Автоматизация',
  plugins: 'Плагины',
  finances: 'Финансы',
  settings: 'Настройки',
  accounts: 'Аккаунты',
};

type PlatformTopBarProps = {
  onOpenMobileSidebar: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
};

export default function PlatformTopBar({
  onOpenMobileSidebar,
  sidebarCollapsed,
  onToggleSidebarCollapse,
}: PlatformTopBarProps) {
  const pathname = usePathname();
  const profile = accounts[0];
  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? 'FC';

  const breadcrumbs = useMemo(() => {
    return pathname
      .split('/')
      .filter(Boolean)
      .map(part => ({ raw: part, label: PATH_LABELS[part] ?? part }));
  }, [pathname]);

  const topLinks = [
    { label: 'Наш Телеграм', href: '#', icon: Send },
    { label: 'Наш канал', href: '#', icon: Radio },
    { label: 'Поддержка', href: '#', icon: LifeBuoy },
  ] as const;

  return (
    <header className="platform-topbar">
      <div className="platform-breadcrumbs min-w-0">
        <button
          type="button"
          className="platform-topbar-btn platform-mobile-only"
          onClick={onOpenMobileSidebar}
          aria-label="Открыть меню"
        >
          <Menu size={18} />
        </button>

        <button
          type="button"
          className="platform-topbar-btn platform-sidebar-toggle"
          onClick={onToggleSidebarCollapse}
          aria-label={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          aria-pressed={sidebarCollapsed}
        >
          {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        <div className="platform-breadcrumbs-list hidden md:flex items-center gap-2 min-w-0">
          {breadcrumbs.map((item, idx) => (
            <div key={`${item.raw}-${idx}`} className="flex items-center gap-2 min-w-0">
              {idx > 0 && <span className="platform-breadcrumb-item">/</span>}
              <span className={`platform-breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <nav className="platform-topbar-links" aria-label="Быстрые ссылки">
        {topLinks.map(item => {
          const Icon = item.icon;
          return (
            <a key={item.label} href={item.href} className="platform-topbar-link">
              <Icon size={14} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="platform-topbar-right">
        <button type="button" className="platform-topbar-plain-btn hidden sm:inline-flex" aria-label="Уведомления">
          <Bell size={15} />
        </button>

        <button type="button" className="platform-profile-plain" aria-label="Профиль пользователя">
          <span className="platform-avatar">{initials}</span>
          <strong className="hidden sm:block text-[12px] font-semibold">{profile?.username ?? 'user'}</strong>
        </button>
      </div>
    </header>
  );
}
