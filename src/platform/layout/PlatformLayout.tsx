import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomBar from './MobileBottomBar';
import '../../styles/platform.css';

export default function PlatformLayout() {
  return (
    <div
      className="platform-scope"
      style={{ minHeight: '100vh', background: '#050C1C', color: '#fff', display: 'flex', position: 'relative' }}
    >
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <main
        className="md:ml-[240px] pb-20 md:pb-0"
        style={{ flex: 1, minWidth: 0, overflowY: 'auto', height: '100vh' }}
      >
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileBottomBar />
      </div>
    </div>
  );
}
