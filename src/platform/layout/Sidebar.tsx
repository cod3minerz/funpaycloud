'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Crown,
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
  X,
} from 'lucide-react';
import { BrandLogo } from '@/app/components/BrandLogo';
import {
  DEFAULT_PLAN_ID,
  PLAN_EVENT_NAME,
  readCurrentPlanId,
  subscriptionPlans,
} from '@/shared/subscriptions';

type SidebarProps = {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
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

export default function Sidebar({
  mobile = false,
  open = false,
  onClose,
  collapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [currentPlanId, setCurrentPlanId] = useState(DEFAULT_PLAN_ID);

  useEffect(() => {
    if (mobile) return;
    setCurrentPlanId(readCurrentPlanId());

    const onPlanChanged = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setCurrentPlanId((detail as typeof DEFAULT_PLAN_ID) ?? readCurrentPlanId());
    };

    window.addEventListener(PLAN_EVENT_NAME, onPlanChanged as EventListener);
    return () => window.removeEventListener(PLAN_EVENT_NAME, onPlanChanged as EventListener);
  }, [mobile]);

  const currentPlan = useMemo(
    () => subscriptionPlans.find(plan => plan.id === currentPlanId) ?? subscriptionPlans[1],
    [currentPlanId],
  );
  const proPlan = subscriptionPlans.find(plan => plan.id === 'pro') ?? subscriptionPlans[1];
  const showUpsell = currentPlan.id !== 'pro';

  const asideClass = mobile
    ? `platform-sidebar platform-mobile-sidebar ${open ? 'open' : ''}`
    : `platform-sidebar platform-desktop-sidebar${collapsed ? ' collapsed' : ''}`;

  return (
    <aside className={asideClass} aria-label="Навигация платформы">
      <div className="platform-sidebar-logo">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" aria-label="FunPay Cloud" onClick={onClose}>
            {mobile ? <BrandLogo compact /> : <BrandLogo compact={collapsed} iconOnly={collapsed} />}
          </Link>
          {mobile && (
            <button type="button" className="platform-topbar-btn" onClick={onClose} aria-label="Закрыть меню">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <nav className="platform-nav-wrap">
        {navGroups.map(group => (
          <div key={group.title}>
            {!collapsed && <div className="platform-nav-section">{group.title}</div>}
            {group.items.map(({ icon: Icon, label, path }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  href={path}
                  className={`platform-nav-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={16} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="platform-sidebar-footer">
        {collapsed ? (
          <Link
            href="/platform/settings"
            className="platform-nav-item"
            title={showUpsell ? `Оформить ${proPlan.name}` : `Текущий план: ${currentPlan.name}`}
          >
            <Crown size={16} />
          </Link>
        ) : (
          <div className="platform-subscription-card">
            <div className="platform-subscription-head">
              <Crown size={14} />
              <span>{showUpsell ? 'Cloud Pro' : `Тариф: ${currentPlan.name}`}</span>
            </div>
            <p className="platform-footer-note">
              {showUpsell
                ? `Переход на ${proPlan.name} откроет AI-автоответчик, аналитику и приоритетные сценарии поддержки.`
                : `Ваш тариф активен. Управляйте подпиской и доступными лимитами из настроек.`}
            </p>
            <Link href="/platform/settings" className={showUpsell ? 'platform-btn-primary' : 'platform-btn-secondary'}>
              {showUpsell ? `Оформить ${proPlan.name}` : 'Управлять'}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
