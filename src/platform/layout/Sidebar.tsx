'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Tag,
  Package,
  BarChart2,
  Zap,
  Puzzle,
  Wallet,
  Settings,
  Users,
  Crown,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/app/components/BrandLogo';

type SidebarProps = {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
};

const navGroups = [
  {
    title: 'Операции',
    items: [
      { icon: LayoutDashboard, label: 'Дашборд', path: '/platform/dashboard' },
      { icon: MessageSquare, label: 'Чаты', path: '/platform/chats' },
      { icon: ShoppingCart, label: 'Заказы', path: '/platform/orders' },
      { icon: Tag, label: 'Лоты', path: '/platform/lots' },
      { icon: Package, label: 'Склад', path: '/platform/warehouse' },
    ],
  },
  {
    title: 'Управление',
    items: [
      { icon: Users, label: 'Аккаунты', path: '/platform/accounts' },
      { icon: BarChart2, label: 'Аналитика', path: '/platform/analytics' },
      { icon: Zap, label: 'Автоматизация', path: '/platform/automation' },
      { icon: Puzzle, label: 'Плагины', path: '/platform/plugins' },
      { icon: Wallet, label: 'Финансы', path: '/platform/finances' },
      { icon: Settings, label: 'Настройки', path: '/platform/settings' },
    ],
  },
];

export default function Sidebar({ mobile = false, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const asideClass = mobile
    ? `platform-sidebar platform-mobile-sidebar ${open ? 'open' : ''}`
    : 'platform-sidebar fixed left-0 top-0 h-screen z-40 hidden md:flex';

  return (
    <aside className={asideClass} aria-label="Навигация платформы">
      <div className="platform-sidebar-logo">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" aria-label="FunPay Cloud" onClick={onClose}>
            <BrandLogo compact />
          </Link>
          {mobile && (
            <button type="button" className="platform-topbar-btn" onClick={onClose} aria-label="Закрыть меню">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <nav style={{ paddingBottom: 10 }}>
        {navGroups.map(group => (
          <div key={group.title}>
            <div className="platform-nav-section">{group.title}</div>
            {group.items.map(({ icon: Icon, label, path }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  href={path}
                  className={`platform-nav-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="platform-sidebar-footer">
        <div className="platform-plan">
          <div className="flex items-center gap-2" style={{ color: 'var(--pf-text)' }}>
            <Crown size={15} color="#fbbf24" />
            <span style={{ fontWeight: 700 }}>План Business</span>
          </div>
          <div style={{ marginTop: 4, color: 'var(--pf-text-muted)' }}>Активен до 01.05.2026</div>
        </div>
      </div>
    </aside>
  );
}
