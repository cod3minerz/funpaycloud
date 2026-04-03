'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Tag, MoreHorizontal,
  Package, BarChart2, Zap, Puzzle, Wallet, Settings, X,
} from 'lucide-react';

const mainItems = [
  { icon: LayoutDashboard, label: 'Дашборд', path: '/platform/dashboard' },
  { icon: MessageSquare,   label: 'Чаты',    path: '/platform/chats' },
  { icon: ShoppingCart,    label: 'Заказы',  path: '/platform/orders' },
  { icon: Tag,             label: 'Лоты',    path: '/platform/lots' },
];

const moreItems = [
  { icon: Package,  label: 'Склад',         path: '/platform/warehouse' },
  { icon: BarChart2,label: 'Аналитика',     path: '/platform/analytics' },
  { icon: Zap,      label: 'Автоматизация', path: '/platform/automation' },
  { icon: Puzzle,   label: 'Плагины',       path: '/platform/plugins' },
  { icon: Wallet,   label: 'Финансы',       path: '/platform/finances' },
  { icon: Settings, label: 'Настройки',     path: '/platform/settings' },
];

export default function MobileBottomBar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      {/* Bottom bar */}
      <div className="mobile-bottom-bar">
        {mainItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            href={path}
            className={`mobile-bottom-item${pathname === path ? ' active' : ''}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
        <button
          className="mobile-bottom-item"
          onClick={() => setSheetOpen(true)}
          style={{ background: 'none', border: 'none' }}
        >
          <MoreHorizontal size={22} />
          <span>Ещё</span>
        </button>
      </div>

      {/* "More" sheet overlay */}
      {sheetOpen && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 60, backdropFilter: 'blur(2px)',
            }}
            onClick={() => setSheetOpen(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            background: '#0a1428',
            borderTop: '1px solid rgba(0,121,255,0.25)',
            borderRadius: '20px 20px 0 0',
            zIndex: 70,
            padding: '16px 16px 32px',
            animation: 'slideUp 0.25s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>Меню</span>
              <button
                onClick={() => setSheetOpen(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color="#fff" />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {moreItems.map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => { router.push(path); setSheetOpen(false); }}
                  style={{
                    background: 'rgba(0,121,255,0.08)',
                    border: '1px solid rgba(0,121,255,0.15)',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#7DC8FF',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'left',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </>
      )}
    </>
  );
}
