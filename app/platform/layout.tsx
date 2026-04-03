'use client';

import Sidebar from '@/platform/layout/Sidebar';
import MobileBottomBar from '@/platform/layout/MobileBottomBar';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="platform-scope"
      style={{ minHeight: '100vh', background: '#050C1C', color: '#fff', display: 'flex', position: 'relative' }}
    >
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        className="md:ml-[240px] pb-20 md:pb-0"
        style={{ flex: 1, minWidth: 0, overflowY: 'auto', height: '100vh' }}
      >
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileBottomBar />
      </div>
    </div>
  );
}
