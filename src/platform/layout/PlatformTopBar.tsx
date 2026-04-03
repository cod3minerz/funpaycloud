'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search, Settings2 } from 'lucide-react';
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
};

export default function PlatformTopBar({ onOpenMobileSidebar }: PlatformTopBarProps) {
  const pathname = usePathname();
  const profile = accounts[0];

  const breadcrumbs = useMemo(() => {
    return pathname
      .split('/')
      .filter(Boolean)
      .map(part => ({ raw: part, label: PATH_LABELS[part] ?? part }));
  }, [pathname]);

  return (
    <header className="platform-topbar">
      <div className="platform-breadcrumbs min-w-0">
        <button
          type="button"
          className="platform-topbar-btn md:hidden"
          onClick={onOpenMobileSidebar}
          aria-label="Открыть меню"
        >
          <Menu size={18} />
        </button>

        <div className="hidden md:flex items-center gap-2 min-w-0">
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

      <label className="platform-search">
        <Search size={14} color="var(--pf-text-dim)" />
        <input placeholder="Поиск по заказам, чатам, товарам..." aria-label="Глобальный поиск" />
      </label>

      <div className="platform-topbar-right">
        <button type="button" className="platform-topbar-btn hidden sm:inline-flex" aria-label="Уведомления">
          <Bell size={15} />
        </button>

        <button type="button" className="platform-topbar-btn hidden lg:inline-flex" aria-label="Настройки вида">
          <Settings2 size={15} />
        </button>

        <div className="platform-profile" aria-label="Профиль пользователя">
          <span className="platform-avatar">{profile?.avatar ?? 'U'}</span>
          <span className="platform-profile-meta hidden sm:flex">
            <strong>{profile?.username ?? 'user'}</strong>
            <span>FunPay Cloud</span>
          </span>
        </div>
      </div>
    </header>
  );
}
