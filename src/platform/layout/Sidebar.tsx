'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CircleDollarSign,
  Crown,
  Home,
  LifeBuoy,
  MessageSquare,
  ShoppingCart,
  Tag,
  Package,
  BarChart2,
  Sparkles,
  Puzzle,
  Wallet,
  Users,
  Server,
  X,
} from 'lucide-react';
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
      { icon: Home, label: 'Главная', path: '/platform/dashboard' },
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
      { icon: AISidebarIcon, label: 'AI-Ассистент', path: '/platform/ai-assistant' },
      { icon: Puzzle, label: 'Плагины', path: '/platform/plugins' },
      { icon: Wallet, label: 'Финансы', path: '/platform/finances' },
      { icon: CircleDollarSign, label: 'Реферальная система', path: '/platform/referrals' },
    ],
  },
  {
    title: 'Маркет',
    items: [{ icon: Server, label: 'Прокси в аренду', path: '/platform/proxy-market' }],
  },
];

const mobileTopLinks = [
  { label: 'Телеграм канал', href: '#', icon: <TelegramMark size={16} /> },
  { label: 'Группа ВКонтакте', href: '#', icon: <VkMark size={16} /> },
  { label: 'Поддержка', href: '#', icon: <LifeBuoy size={16} /> },
] as const;

function AISidebarIcon({ size = 16 }: { size?: number }) {
  const gradientID = `ai-gradient-${useId().replace(/:/g, '')}`;
  return (
    <span className="inline-flex items-center justify-center" style={{ width: size, height: size }} aria-hidden>
      <svg width="0" height="0" focusable="false" aria-hidden>
        <defs>
          <linearGradient id={gradientID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <Sparkles
        size={18}
        style={{
          stroke: `url(#${gradientID})`,
        }}
      />
    </span>
  );
}

export default function Sidebar({
  mobile = false,
  open = false,
  onClose,
  collapsed = false,
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
      <div className="platform-sidebar-logo" style={{ background: 'linear-gradient(180deg, rgba(85,118,255,0.04) 0%, transparent 100%)' }}>
        <div className="platform-sidebar-brand">
          <Link href="/" aria-label="FunPay Cloud" onClick={onClose}>
            {mobile ? (
              <BrandLogo compact className="h-[27px] max-w-[166px]" />
            ) : (
              <BrandLogo
                compact={collapsed}
                iconOnly={collapsed}
                className={collapsed ? 'h-5 max-w-[30px]' : 'h-[27px] max-w-[168px]'}
              />
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
            {group.items.map(({ icon: Icon, label, path }) => {
              const isActive = pathname === path;
              const isReferral = path === '/platform/referrals';
              const isAIItem = path === '/platform/ai-assistant';
              return (
                <Link
                  key={path}
                  href={path}
                  className={`platform-nav-item${isActive ? ' active' : ''}${isReferral ? ' platform-nav-item-referrals' : ''}`}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={16} />
                  {!collapsed && (
                    <span
                      className={
                        isReferral
                          ? 'platform-referrals-nav-label'
                          : !isAIItem
                            ? undefined
                            : ''
                      }
                      style={
                        isAIItem
                          ? {
                              background: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)',
                              backgroundSize: '200% auto',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              animation: 'shimmer 3s linear infinite',
                            }
                          : undefined
                      }
                    >
                      {label}
                    </span>
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
              <Crown size={14} style={{ color: 'var(--pf-accent)' }} />
              <span style={{ color: 'var(--pf-accent)' }}>{showUpsell ? 'Подписка' : `Тариф: ${currentPlanName}`}</span>
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
