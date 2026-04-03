import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import App from './app/App';
import PlatformLayout from './platform/layout/PlatformLayout';
import Dashboard from './platform/pages/Dashboard';
import Chats from './platform/pages/Chats';
import Orders from './platform/pages/Orders';
import Lots from './platform/pages/Lots';
import Warehouse from './platform/pages/Warehouse';
import Analytics from './platform/pages/Analytics';
import Automation from './platform/pages/Automation';
import Plugins from './platform/pages/Plugins';
import Finances from './platform/pages/Finances';
import Settings from './platform/pages/Settings';

export default function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/platform" element={<PlatformLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chats" element={<Chats />} />
          <Route path="orders" element={<Orders />} />
          <Route path="lots" element={<Lots />} />
          <Route path="warehouse" element={<Warehouse />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="automation" element={<Automation />} />
          <Route path="plugins" element={<Plugins />} />
          <Route path="finances" element={<Finances />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
