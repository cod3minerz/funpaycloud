'use client';

import { useState } from 'react';
import Sidebar from '@/platform/layout/Sidebar';
import MobileBottomBar from '@/platform/layout/MobileBottomBar';
import PlatformTopBar from '@/platform/layout/PlatformTopBar';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="platform-scope platform-shell">
      <Sidebar />

      {mobileSidebarOpen && <button className="platform-mobile-overlay md:hidden" onClick={() => setMobileSidebarOpen(false)} aria-label="Закрыть меню" />}

      <Sidebar mobile open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="platform-main md:ml-[252px]">
        <PlatformTopBar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="platform-main-scroll">{children}</main>
      </div>

      <div className="md:hidden">
        <MobileBottomBar />
      </div>
    </div>
  );
}
