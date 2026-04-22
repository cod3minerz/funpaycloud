'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Lock, LogOut, Ticket } from 'lucide-react';
import Sidebar from '@/platform/layout/Sidebar';
import PlatformTopBar from '@/platform/layout/PlatformTopBar';
import { authApi } from '@/lib/api';
import { logout } from '@/lib/auth';

const SIDEBAR_STORAGE_KEY = 'pf-sidebar-collapsed';
const PLATFORM_THEME_STORAGE_KEY = 'pf-platform-theme';
type PlatformTheme = 'light' | 'dark';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<PlatformTheme>('light');
  const [trialLocked, setTrialLocked] = useState(false);
  const [trialChecked, setTrialChecked] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setSidebarCollapsed(saved === '1');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(PLATFORM_THEME_STORAGE_KEY);
    setTheme(savedTheme === 'dark' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PLATFORM_THEME_STORAGE_KEY, theme);
    document.body.setAttribute('data-platform-theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      document.body.removeAttribute('data-platform-theme');
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const syncSidebar = () => {
      if (media.matches) setMobileSidebarOpen(false);
    };
    syncSidebar();
    media.addEventListener('change', syncSidebar);
    return () => media.removeEventListener('change', syncSidebar);
  }, []);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(profile => {
        if (cancelled) return;
        setTrialLocked(Boolean(profile.trial_expired));
      })
      .catch(() => {
        if (cancelled) return;
        setTrialLocked(false);
      })
      .finally(() => {
        if (!cancelled) setTrialChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const lockAllowedPath =
    pathname === '/platform/subscription' ||
    pathname === '/platform/promo-codes' ||
    pathname === '/platform/settings';

  if (trialChecked && trialLocked && !lockAllowedPath) {
    return (
      <div className="platform-scope flex min-h-[100dvh] items-center justify-center p-4" data-theme={theme}>
        <section className="w-full max-w-[620px] rounded-2xl border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] p-6 shadow-[var(--pf-shadow-soft)]">
          <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--pf-warning-soft)] text-[var(--pf-warning)]">
            <Lock size={20} />
          </div>
          <h1 className="text-center text-2xl font-black text-[var(--pf-text)]">Пробный период завершён</h1>
          <p className="mx-auto mt-3 max-w-[520px] text-center text-sm leading-6 text-[var(--pf-text-muted)]">
            Доступ к рабочим разделам платформы временно ограничен. Чтобы продолжить работу аккаунтов и автоматизации,
            выберите подписку или примените промокод.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link href="/platform/subscription" className="platform-btn-primary inline-flex justify-center gap-1.5">
              <CreditCard size={14} />
              Открыть подписку
            </Link>
            <Link href="/platform/promo-codes" className="platform-btn-secondary inline-flex justify-center gap-1.5">
              <Ticket size={14} />
              Ввести промокод
            </Link>
          </div>
          <button
            type="button"
            className="platform-btn-secondary mt-3 w-full justify-center text-[var(--pf-text-muted)]"
            onClick={() => logout()}
          >
            <LogOut size={14} />
            Выйти из аккаунта
          </button>
        </section>
      </div>
    );
  }

  return (
    <div
      className={`platform-scope platform-shell ${sidebarCollapsed ? 'platform-shell--collapsed' : 'platform-shell--expanded'}`}
      data-theme={theme}
    >
      <Sidebar collapsed={sidebarCollapsed} theme={theme} />

      {mobileSidebarOpen && (
        <button
          type="button"
          className="platform-mobile-overlay platform-mobile-only"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      <Sidebar mobile open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} theme={theme} />

      <div className="platform-main">
        <PlatformTopBar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={() => setSidebarCollapsed(prev => !prev)}
          theme={theme}
          onToggleTheme={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
        />
        <main className="platform-main-scroll">{children}</main>
      </div>
    </div>
  );
}
