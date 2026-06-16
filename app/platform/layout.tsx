"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { SidebarProvider, useSidebar } from "@/platform2/context/SidebarContext";
import { ThemeProvider, useTheme } from "@/platform2/context/ThemeContext";
import AppHeader from "@/platform2/layout/AppHeader";
import AppSidebar from "@/platform2/layout/AppSidebar";
import Backdrop from "@/platform2/layout/Backdrop";
import { SubscriptionGuard } from "@/platform2/layout/SubscriptionGuard";

function Shell({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { theme } = useTheme();

  // Hovered collapsed sidebar uses the same width as pinned expanded state,
  // so the content margin follows it instead of letting the sidebar cover the page.
  const isSidebarWide = isExpanded || isHovered;
  const sidebarWidth = isSidebarWide ? "290px" : "90px";

  return (
    <div
      data-p2="true"
      style={{ "--p2-sidebar-width": sidebarWidth } as CSSProperties & Record<string, string>}
      className={`${theme === "dark" ? "dark bg-gray-950" : "bg-gray-50"} min-h-screen xl:flex`}
    >
      <AppSidebar />
      <Backdrop />
      <div
        className="min-w-0 flex-1 transition-[margin-left] duration-300 ease-in-out [backface-visibility:hidden] lg:ml-[var(--p2-sidebar-width)]"
      >
        <AppHeader />
        <SubscriptionGuard>
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            {children}
          </div>
        </SubscriptionGuard>
      </div>
    </div>
  );
}

export default function Platform2Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authApi.me()
      .then(() => setReady(true))
      .catch(() => router.replace("/auth/login"));
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Shell>{children}</Shell>
      </SidebarProvider>
    </ThemeProvider>
  );
}
