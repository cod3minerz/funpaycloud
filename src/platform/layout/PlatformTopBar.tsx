'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, Menu, Search, Zap } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState(accounts[0]?.id ?? '');

  const activeAccount = accounts.find(acc => acc.id === activeAccountId) ?? accounts[0];

  const breadcrumbs = useMemo(() => {
    return pathname
      .split('/')
      .filter(Boolean)
      .map(part => ({
        raw: part,
        label: PATH_LABELS[part] ?? part,
      }));
  }, [pathname]);

  return (
    <header className="platform-topbar">
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
            {idx > 0 && <span style={{ color: 'var(--pf-text-dim)' }}>/</span>}
            <span
              style={{
                color: idx === breadcrumbs.length - 1 ? 'var(--pf-text)' : 'var(--pf-text-muted)',
                fontWeight: idx === breadcrumbs.length - 1 ? 700 : 600,
                fontSize: 13,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="platform-search ml-auto md:ml-4">
        <Search size={15} color="var(--pf-text-dim)" />
        <input placeholder="Поиск по заказам, чатам, аккаунтам..." aria-label="Глобальный поиск" />
      </div>

      <button type="button" className="platform-topbar-btn hidden sm:inline-flex" aria-label="Уведомления">
        <Bell size={16} />
      </button>

      <button type="button" className="platform-topbar-btn hidden lg:inline-flex" aria-label="Быстрые действия">
        <Zap size={16} />
      </button>

      <div className="relative">
        <button
          type="button"
          className="platform-avatar-btn"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Меню аккаунта"
        >
          <span className="platform-avatar">{activeAccount?.avatar ?? 'U'}</span>
          <span className="hidden sm:block" style={{ lineHeight: 1.1, textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>{activeAccount?.username ?? 'Пользователь'}</span>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--pf-text-muted)' }}>FunPay Cloud</span>
          </span>
          <ChevronDown size={14} color="var(--pf-text-muted)" />
        </button>

        {menuOpen && (
          <div className="platform-dropdown">
            <div style={{ padding: '8px 10px 6px', color: 'var(--pf-text-dim)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
              АКТИВНЫЙ АККАУНТ
            </div>
            {accounts.map(account => (
              <button
                key={account.id}
                type="button"
                className="platform-dropdown-item"
                onClick={() => {
                  setActiveAccountId(account.id);
                  setMenuOpen(false);
                }}
              >
                <span className="platform-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                  {account.avatar}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{account.username}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--pf-text-muted)' }}>
                    {account.balance.toLocaleString('ru-RU')} ₽
                  </span>
                </span>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: account.online ? 'var(--pf-success)' : 'var(--pf-text-dim)',
                    flexShrink: 0,
                  }}
                />
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--pf-border)', margin: '6px 4px' }} />
            <button type="button" className="platform-dropdown-item" onClick={() => setMenuOpen(false)}>
              Выйти из аккаунта
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
