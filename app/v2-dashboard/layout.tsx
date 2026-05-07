'use client';

import Header from '@/components/tailwind-admin/layout/header/Header';
import Sidebar from '@/components/tailwind-admin/layout/sidebar/Sidebar';
import '@/styles/tailwind-admin/globals.css';

export default function V2DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="body-wrapper w-full bg-background">
        <Header />
        <div className="container mx-auto px-6 py-30">
          {children}
        </div>
      </div>
    </div>
  );
}
