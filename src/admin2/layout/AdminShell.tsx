"use client";

import { useAdminTheme } from "../context/ThemeContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAdminTheme();

  return (
    <div
      data-admin="true"
      data-p2="true"
      className={theme === "dark" ? "dark bg-gray-950" : "bg-gray-50"}
    >
      <AdminSidebar />
      <div className="ml-[260px] min-h-screen">
        <AdminHeader />
        <main className="mx-auto max-w-7xl p-6">{children}</main>
      </div>
    </div>
  );
}
