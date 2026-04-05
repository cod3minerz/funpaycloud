'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, ChevronLeft, ChevronRight, Cloud, Menu, Search } from 'lucide-react';
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
  const initials = profile?.username?.slice(0, 1).toUpperCase() ?? 'U';

  const avatarGradient = useMemo(() => {
    const source = profile?.username ?? 'cloud-user';
    let hash = 0;
    for (let i = 0; i < source.length; i += 1) hash = (hash << 5) - hash + source.charCodeAt(i);
    const hue = Math.abs(hash) % 360;
    return `linear-gradient(135deg, hsl(${hue} 78% 44%), hsl(${(hue + 35) % 360} 78% 38%))`;
  }, [profile?.username]);

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
        <input
          type="search"
          autoComplete="off"
          placeholder="Поиск по заказам, чатам, товарам..."
          aria-label="Глобальный поиск"
        />
      </label>

      <div className="platform-topbar-right">
        <button type="button" className="platform-topbar-btn hidden sm:inline-flex" aria-label="Уведомления">
          <Bell size={15} />
        </button>

        <div className="platform-profile" aria-label="Профиль пользователя">
          <span className="platform-avatar" style={{ background: avatarGradient }}>
            {profile?.avatar && profile.avatar.length > 1 ? initials : <Cloud size={14} />}
          </span>
          <strong className="hidden sm:block text-[12px] font-semibold">{profile?.username ?? 'user'}</strong>
        </div>
      </div>
    </header>
  );
}
