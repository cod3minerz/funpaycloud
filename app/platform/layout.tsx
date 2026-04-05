'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/platform/layout/Sidebar';
import PlatformTopBar from '@/platform/layout/PlatformTopBar';

const SIDEBAR_STORAGE_KEY = 'pf-sidebar-collapsed';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setSidebarCollapsed(saved === '1');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const syncSidebar = () => {
      if (media.matches) setMobileSidebarOpen(false);
    };
    syncSidebar();
    media.addEventListener('change', syncSidebar);
    return () => media.removeEventListener('change', syncSidebar);
  }, []);

  return (
    <div
      className="platform-scope platform-shell"
      style={{ ['--pf-sidebar-width' as string]: `${sidebarCollapsed ? 84 : 252}px` }}
    >
      <Sidebar collapsed={sidebarCollapsed} />

      {mobileSidebarOpen && (
        <button
          type="button"
          className="platform-mobile-overlay platform-mobile-only"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      <Sidebar mobile open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="platform-main">
        <PlatformTopBar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={() => setSidebarCollapsed(prev => !prev)}
        />
        <main className="platform-main-scroll">{children}</main>
      </div>
    </div>
  );
}
