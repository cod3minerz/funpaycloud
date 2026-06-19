"use client";

import { useState } from "react";
import { useAdminTheme } from "../context/ThemeContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAdminTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      data-admin="true"
      data-p2="true"
      className={theme === "dark" ? "dark bg-gray-950" : "bg-gray-50"}
    >
      <AdminSidebar
        isMobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="ml-0 min-h-screen transition-[margin-left] duration-300 ease-in-out md:ml-[260px]">
        <AdminHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
