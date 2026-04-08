'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, Settings, Wallet } from 'lucide-react';
import { accounts } from '@/platform/data/demoData';
import { SupportTeamMark, TelegramMark, VkMark } from '@/platform/components/SocialMarks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

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
  'proxy-market': 'Прокси-маркет',
  referrals: 'Реферальная система',
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
  const router = useRouter();
  const pathname = usePathname();
  const profile = accounts[0];
  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? 'FC';
  const balance = profile?.balance ?? 0;

  const breadcrumbs = useMemo(() => {
    return pathname
      .split('/')
      .filter(Boolean)
      .map(part => ({ raw: part, label: PATH_LABELS[part] ?? part }));
  }, [pathname]);

  const notifications = useMemo(
    () => [
      { id: 'nf-1', title: 'Новый заказ', text: 'Поступил заказ ORD-1012 на 390 ₽', time: '2 мин назад', unread: true },
      { id: 'nf-2', title: 'Реферальное начисление', text: 'Начислено 897 ₽ по RF-3888', time: '11 мин назад', unread: true },
      { id: 'nf-3', title: 'Системное', text: 'Плановое обновление модулей завершено', time: 'Сегодня, 10:20', unread: false },
    ],
    [],
  );
  const unreadCount = notifications.filter(item => item.unread).length;

  const topLinks = [
    { label: 'Телеграм канал', href: '#', icon: <TelegramMark size={15} /> },
    { label: 'Группа ВКонтакте', href: '#', icon: <VkMark size={15} /> },
    { label: 'Поддержка', href: '#', icon: <SupportTeamMark size={15} /> },
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
          className="platform-topbar-btn platform-sidebar-toggle platform-sidebar-toggle-btn"
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
          return (
            <a key={item.label} href={item.href} className="platform-topbar-link">
              <span className="platform-topbar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="platform-topbar-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="platform-topbar-plain-btn platform-notify-trigger" aria-label="Уведомления">
              <Bell size={15} />
              {unreadCount > 0 && <span className="platform-notify-badge">{Math.min(unreadCount, 9)}</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="platform-topbar-dropdown w-[320px] p-0"
            onCloseAutoFocus={event => event.preventDefault()}
          >
            <div className="platform-topbar-dropdown-head">
              <strong>Уведомления</strong>
              <span>{unreadCount > 0 ? `${unreadCount} новых` : 'Все прочитаны'}</span>
            </div>
            <div className="platform-topbar-dropdown-scroll">
              {notifications.map(item => (
                <div key={item.id} className={`platform-notify-item${item.unread ? ' unread' : ''}`}>
                  <div className="platform-notify-item-head">
                    <strong>{item.title}</strong>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="platform-profile-plain" aria-label="Профиль пользователя">
              <span className="platform-avatar">{initials}</span>
              <strong className="hidden sm:block text-[13px] font-semibold">{profile?.username ?? 'user'}</strong>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="platform-topbar-dropdown w-[246px]"
            onCloseAutoFocus={event => event.preventDefault()}
          >
            <DropdownMenuLabel className="platform-account-dropdown-head">
              <span className="platform-account-name">{profile?.username ?? 'user'}</span>
              <span className="platform-account-meta">Баланс: {balance.toLocaleString('ru-RU')} ₽</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="platform-account-dropdown-sep" />
            <DropdownMenuItem className="platform-account-dropdown-item" onSelect={() => router.push('/platform/finances')}>
              <Wallet size={14} />
              Баланс и выплаты
            </DropdownMenuItem>
            <DropdownMenuItem className="platform-account-dropdown-item" onSelect={() => router.push('/platform/settings')}>
              <Settings size={14} />
              Настройки профиля
            </DropdownMenuItem>
            <DropdownMenuSeparator className="platform-account-dropdown-sep" />
            <DropdownMenuItem className="platform-account-dropdown-item danger" onSelect={() => router.push('/')}>
              <LogOut size={14} />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
