'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, CreditCard, LifeBuoy, LogOut, Moon, PanelLeft, Settings, Sun } from 'lucide-react';
import { settingsApi, type ProfileData } from '@/lib/api';
import { logout } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

type PlatformTopBarProps = {
  onOpenMobileSidebar: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

type NotificationItem = {
  id: string;
  title: string;
  text: string;
  unread: boolean;
  time: string;
};

export default function PlatformTopBar({
  onOpenMobileSidebar,
  sidebarCollapsed,
  onToggleSidebarCollapse,
  theme,
  onToggleTheme,
}: PlatformTopBarProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const notifications = useMemo<NotificationItem[]>(() => [], []);
  const unreadCount = useMemo(() => notifications.filter(item => item.unread).length, [notifications]);

  useEffect(() => {
    let cancelled = false;

    settingsApi
      .getProfile()
      .then(data => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = String(profile?.login ?? '').trim();
  const email = String(profile?.email ?? '').trim();

  const displayName = useMemo(() => {
    return login || (email ? `${email.split('@')[0].slice(0, 5)}...` : '??');
  }, [email, login]);

  const avatarText = useMemo(() => {
    if (login) return login.slice(0, 1).toUpperCase();
    if (email) {
      const localPart = email.split('@')[0] ?? '';
      return (localPart.slice(0, 2) || '??').toUpperCase();
    }
    return '??';
  }, [email, login]);

  const handleSidebarToggle = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      onToggleSidebarCollapse();
      return;
    }
    onOpenMobileSidebar();
  };

  return (
    <header className="platform-topbar-header">
      <div className="flex h-full items-center justify-between gap-3 w-full">
        <button
          type="button"
          onClick={handleSidebarToggle}
          className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] text-[var(--pf-text-muted)] transition-all hover:border-[var(--pf-accent)] hover:text-[var(--pf-accent-2)] hover:bg-[var(--pf-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)]/40"
          aria-label={sidebarCollapsed ? 'Развернуть боковое меню' : 'Свернуть боковое меню'}
          aria-pressed={sidebarCollapsed}
        >
          <PanelLeft size={18} />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] text-[var(--pf-text-muted)] transition-all hover:border-[var(--pf-accent)] hover:text-[var(--pf-accent-2)] hover:bg-[var(--pf-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)]/40"
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Уведомления"
                className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] text-[var(--pf-text-muted)] transition-all hover:border-[var(--pf-accent)] hover:text-[var(--pf-accent-2)] hover:bg-[var(--pf-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)]/40 relative"
              >
                <Bell size={17} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="platform-topbar-dropdown w-[320px] border-[var(--pf-overlay-border)] bg-[var(--pf-surface-overlay)] p-0 text-[var(--pf-text)]"
              onCloseAutoFocus={event => event.preventDefault()}
            >
              <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
                <strong className="text-sm">Уведомления</strong>
                <span className="text-xs text-[var(--pf-text-muted)]">{unreadCount > 0 ? `${unreadCount} новых` : '0 новых'}</span>
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--pf-text-dim)]">Нет новых уведомлений</div>
              ) : (
                <div className="max-h-[320px] overflow-auto py-1">
                  {notifications.map(item => (
                    <div key={item.id} className="border-b border-[var(--pf-border)] px-4 py-3 last:border-0">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <strong className="text-xs text-[var(--pf-text)]">{item.title}</strong>
                        <span className="text-[11px] text-[var(--pf-text-dim)]">{item.time}</span>
                      </div>
                      <p className="text-xs text-[var(--pf-text-dim)]">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Профиль пользователя"
                className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] px-2.5 text-[var(--pf-text)] transition-all hover:border-[var(--pf-accent)] hover:bg-[var(--pf-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)]/40"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--pf-accent) 0%, var(--pf-accent-2) 100%)' }}>
                  {avatarText}
                </span>
                <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">{displayName}</span>
                <ChevronDown size={14} className="hidden text-[var(--pf-text-dim)] sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="platform-topbar-dropdown w-[260px] border-[var(--pf-overlay-border)] bg-[var(--pf-surface-overlay)] text-[var(--pf-text)]"
              onCloseAutoFocus={event => event.preventDefault()}
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="text-sm font-semibold text-[var(--pf-text)]">{displayName}</div>
                <div className="mt-0.5 truncate text-xs text-[var(--pf-text-muted)]">{email || 'email не указан'}</div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-[var(--pf-border)]" />

              <DropdownMenuItem
                className="cursor-pointer text-[var(--pf-text)] focus:bg-[var(--pf-accent-soft)] focus:text-[var(--pf-text)]"
                onSelect={event => {
                  event.preventDefault();
                  router.push('/platform/settings');
                }}
              >
                <Settings size={14} className="mr-2" />
                Настройки
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer text-[var(--pf-text)] focus:bg-[var(--pf-accent-soft)] focus:text-[var(--pf-text)]"
                onSelect={event => {
                  event.preventDefault();
                  router.push('/platform/subscription');
                }}
              >
                <CreditCard size={14} className="mr-2" />
                Подписка
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer text-[var(--pf-text)] focus:bg-[var(--pf-accent-soft)] focus:text-[var(--pf-text)]"
                onSelect={event => {
                  event.preventDefault();
                  window.open('https://t.me/funpaycloud_support', '_blank', 'noopener,noreferrer');
                }}
              >
                <LifeBuoy size={14} className="mr-2" />
                Поддержка
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[var(--pf-border)]" />

              <DropdownMenuItem
                className="cursor-pointer text-red-700 focus:bg-red-500/10 focus:text-red-800"
                onSelect={event => {
                  event.preventDefault();
                  logout();
                }}
              >
                <LogOut size={14} className="mr-2" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
