"use client";

import { usePathname } from "next/navigation";
import { AdminThemeProvider } from "@/admin2/context/ThemeContext";
import { AdminShell } from "@/admin2/layout/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/ops/login") {
    return <>{children}</>;
  }

  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
