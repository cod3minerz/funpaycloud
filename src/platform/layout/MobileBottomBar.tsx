'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Users,
  MoreHorizontal,
  Tag,
  Package,
  BarChart2,
  Zap,
  Puzzle,
  Wallet,
  Settings,
  X,
} from 'lucide-react';

const mainItems = [
  { icon: LayoutDashboard, label: 'Даш', path: '/platform/dashboard' },
  { icon: MessageSquare, label: 'Чаты', path: '/platform/chats' },
  { icon: ShoppingCart, label: 'Заказы', path: '/platform/orders' },
  { icon: Users, label: 'Акк.', path: '/platform/accounts' },
];

const moreItems = [
  { icon: Tag, label: 'Лоты', path: '/platform/lots' },
  { icon: Package, label: 'Склад', path: '/platform/warehouse' },
  { icon: BarChart2, label: 'Аналитика', path: '/platform/analytics' },
  { icon: Zap, label: 'Автоматизация', path: '/platform/automation' },
  { icon: Puzzle, label: 'Плагины', path: '/platform/plugins' },
  { icon: Wallet, label: 'Финансы', path: '/platform/finances' },
  { icon: Settings, label: 'Настройки', path: '/platform/settings' },
];

export default function MobileBottomBar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <div className="mobile-bottom-bar">
        {mainItems.map(({ icon: Icon, label, path }) => (
          <Link key={path} href={path} className={`mobile-bottom-item${pathname === path ? ' active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
        <button className="mobile-bottom-item" onClick={() => setSheetOpen(true)} aria-label="Открыть дополнительное меню">
          <MoreHorizontal size={18} />
          <span>Ещё</span>
        </button>
      </div>

      {sheetOpen && (
        <>
          <button className="platform-mobile-overlay" onClick={() => setSheetOpen(false)} aria-label="Закрыть" />
          <div className="mobile-sheet">
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontWeight: 700, fontSize: 16 }}>Разделы</span>
              <button className="platform-topbar-btn" onClick={() => setSheetOpen(false)} aria-label="Закрыть меню">
                <X size={16} />
              </button>
            </div>
            <div className="mobile-sheet-grid">
              {moreItems.map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  className="mobile-sheet-item"
                  onClick={() => {
                    router.push(path);
                    setSheetOpen(false);
                  }}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
