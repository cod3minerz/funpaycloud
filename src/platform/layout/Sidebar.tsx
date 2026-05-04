'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Crown,
  LifeBuoy,
  X,
} from '@/shared/streamline/icons';
import { BrandLogo } from '@/app/components/BrandLogo';
import { TelegramMark, VkMark } from '@/platform/components/SocialMarks';
import { settingsApi } from '@/lib/api';
import {
  DEFAULT_PLAN_ID,
  PLAN_EVENT_NAME,
  getPlanLabel,
  normalizePlanId,
  readCurrentPlanId,
} from '@/shared/subscriptions';
import { StreamlineNavIcon, type StreamlineNavIconName } from './StreamlineNavIcon';

type SidebarProps = {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  theme?: 'light' | 'dark';
};

type NavItem = {
  icon: StreamlineNavIconName;
  label: string;
  path: string;
  beta?: boolean;
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Операции',
    items: [
      { icon: 'home', label: 'Главная', path: '/platform/dashboard' },
      { icon: 'chats', label: 'Чаты', path: '/platform/chats', beta: true },
      { icon: 'orders', label: 'Заказы', path: '/platform/orders' },
      { icon: 'lots', label: 'Лоты', path: '/platform/lots' },
      { icon: 'warehouse', label: 'Склад', path: '/platform/warehouse' },
    ],
  },
  {
    title: 'Управление',
    items: [
      { icon: 'accounts', label: 'Аккаунты', path: '/platform/accounts' },
      { icon: 'constructor', label: 'Конструктор', path: '/platform/constructor' },
      { icon: 'analytics', label: 'Аналитика', path: '/platform/analytics' },
      { icon: 'ai', label: 'AI-Ассистент', path: '/platform/ai-assistant' },
      { icon: 'ai', label: 'Тест-чат', path: '/platform/test-chat' },
      { icon: 'plugins', label: 'Плагины', path: '/platform/plugins' },
      { icon: 'finances', label: 'Финансы', path: '/platform/finances' },
      { icon: 'referrals', label: 'Реферальная система', path: '/platform/referrals' },
    ],
  },
];

const mobileTopLinks = [
  { label: 'Телеграм канал', href: '#', icon: <TelegramMark size={16} /> },
  { label: 'Группа ВКонтакте', href: '#', icon: <VkMark size={16} /> },
  { label: 'Поддержка', href: '#', icon: <LifeBuoy size={16} /> },
] as const;

export default function Sidebar({
  mobile = false,
  open = false,
  onClose,
  collapsed = false,
  theme = 'light',
}: SidebarProps) {
  const pathname = usePathname();
  const [currentPlanId, setCurrentPlanId] = useState(() => normalizePlanId(DEFAULT_PLAN_ID));

  useEffect(() => {
    if (mobile) return;
    let cancelled = false;

    setCurrentPlanId(readCurrentPlanId());

    settingsApi
      .getSubscription()
      .then(data => {
        if (cancelled) return;
        setCurrentPlanId(normalizePlanId(data.plan));
      })
      .catch(() => {
        // fallback to local plan storage
      });

    const onPlanChanged = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setCurrentPlanId(normalizePlanId(detail ?? readCurrentPlanId()));
    };

    window.addEventListener(PLAN_EVENT_NAME, onPlanChanged as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener(PLAN_EVENT_NAME, onPlanChanged as EventListener);
    };
  }, [mobile]);

  const currentPlanName = useMemo(() => getPlanLabel(currentPlanId), [currentPlanId]);
  const showUpsell = currentPlanId === 'trial' || currentPlanId === 'lite';

  const asideClass = mobile
    ? `platform-sidebar platform-mobile-sidebar ${open ? 'open' : ''}`
    : `platform-sidebar platform-desktop-sidebar${collapsed ? ' collapsed' : ''}`;

  return (
    <aside className={asideClass} aria-label="Навигация платформы">
      <div className="platform-sidebar-logo">
        <div className="platform-sidebar-brand">
          <Link href="/" aria-label="FunPay Cloud" onClick={onClose}>
            {mobile ? (
              <BrandLogo compact darkText={theme === 'dark'} />
            ) : (
              <BrandLogo compact={collapsed} iconOnly={collapsed} darkText={theme === 'dark'} />
            )}
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
            {group.items.map(({ icon, label, path, beta }) => {
              const isActive = pathname === path;
              const isAIItem = path === '/platform/ai-assistant';
              return (
                <Link
                  key={path}
                  href={path}
                  className={`platform-nav-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <StreamlineNavIcon
                    name={icon}
                    active={isActive}
                    size={16}
                    className="platform-nav-streamline-icon"
                  />
                  {!collapsed && (
                    <>
                      <span className={isAIItem ? `platform-ai-nav-label${isActive ? ' active' : ''}` : undefined}>{label}</span>
                      {beta && <span className="platform-nav-beta-badge">Beta</span>}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {mobile && (
          <div className="platform-mobile-links">
            <div className="platform-nav-section">Контакты</div>
            {mobileTopLinks.map(item => {
              return (
                <a key={item.label} href={item.href} className="platform-nav-item" onClick={onClose}>
                  <span className="platform-nav-inline-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        )}
      </nav>

      <div className="platform-sidebar-footer">
        {collapsed ? (
          <Link
            href="/platform/subscription"
            className="platform-nav-item"
            title={showUpsell ? 'Улучшить подписку' : `Текущий план: ${currentPlanName}`}
          >
            <Crown size={16} />
          </Link>
        ) : (
          <div className="platform-subscription-card">
            <div className="platform-subscription-head">
              <Crown size={14} className="text-[var(--pf-accent)]" />
              <span className="text-[var(--pf-accent)]">{showUpsell ? 'Подписка' : `Тариф: ${currentPlanName}`}</span>
            </div>
            <p className="platform-footer-note">
              {showUpsell
                ? `Улучшите план до Pro или Ultra, чтобы открыть больше лимитов, AI и расширенную автоматизацию.`
                : `Ваш тариф активен. Управляйте подпиской и доступными лимитами на отдельной странице.`}
            </p>
            <Link href="/platform/subscription" className={showUpsell ? 'platform-btn-primary' : 'platform-btn-secondary'}>
              {showUpsell ? 'Выбрать тариф' : 'Управлять'}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
