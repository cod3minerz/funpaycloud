'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/platform2/context/SidebarContext';
import { ThemeProvider } from '@/platform2/context/ThemeContext';
import AppSidebar from '@/platform2/layout/AppSidebar';
import AppHeader from '@/platform2/layout/AppHeader';
import Backdrop from '@/platform2/layout/Backdrop';
import { authApi } from '@/lib/api';

function Platform2Shell({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? 'ml-0'
    : isExpanded || isHovered
    ? 'lg:ml-[290px]'
    : 'lg:ml-[90px]';

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <Backdrop />
      <div className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Platform2Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then(() => setChecked(true))
      .catch(() => {
        router.replace('/auth/login');
      });
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Platform2Shell>{children}</Platform2Shell>
      </SidebarProvider>
    </ThemeProvider>
  );
}
