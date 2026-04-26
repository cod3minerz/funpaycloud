'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle, CreditCard, KeyRound, Lock, LogOut, Ticket } from 'lucide-react';
import Sidebar from '@/platform/layout/Sidebar';
import PlatformTopBar from '@/platform/layout/PlatformTopBar';
import { accountsApi, authApi } from '@/lib/api';
import { logout } from '@/lib/auth';

const SIDEBAR_STORAGE_KEY = 'pf-sidebar-collapsed';
const PLATFORM_THEME_STORAGE_KEY = 'pf-platform-theme';
type PlatformTheme = 'light' | 'dark';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<PlatformTheme>('light');
  const [accessChecked, setAccessChecked] = useState(false);
  const [subscriptionLocked, setSubscriptionLocked] = useState(false);
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState<number | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [accountsCount, setAccountsCount] = useState(0);
  const [firstGoldenKey, setFirstGoldenKey] = useState('');
  const [creatingFirstAccount, setCreatingFirstAccount] = useState(false);
  const [firstAccountError, setFirstAccountError] = useState('');

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
        setSubscriptionLocked(Boolean(profile.subscription_expired || profile.trial_expired));
        if (typeof profile.subscription_days_left === 'number' && Number.isFinite(profile.subscription_days_left)) {
          setSubscriptionDaysLeft(Math.max(0, Math.round(profile.subscription_days_left)));
        } else {
          setSubscriptionDaysLeft(null);
        }
        setSubscriptionExpiresAt(profile.subscription_expires_at ?? profile.trial_expires_at ?? null);
        setAccountsCount(typeof profile.accounts_count === 'number' ? Math.max(0, profile.accounts_count) : 0);
      })
      .catch(() => {
        if (cancelled) return;
        setSubscriptionLocked(false);
        setSubscriptionDaysLeft(null);
        setSubscriptionExpiresAt(null);
        setAccountsCount(0);
      })
      .finally(() => {
        if (!cancelled) setAccessChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const lockAllowedPath =
    pathname === '/platform/subscription' ||
    pathname === '/platform/promo-codes' ||
    pathname === '/platform/settings';

  const zeroAccountLocked = accessChecked && !subscriptionLocked && accountsCount === 0;
  const showRenewBanner =
    accessChecked &&
    !subscriptionLocked &&
    typeof subscriptionDaysLeft === 'number' &&
    subscriptionDaysLeft > 0 &&
    subscriptionDaysLeft <= 3;

  async function handleCreateFirstAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const goldenKey = firstGoldenKey.trim();
    if (!goldenKey) {
      setFirstAccountError('Введите golden key, чтобы добавить аккаунт.');
      return;
    }

    setCreatingFirstAccount(true);
    setFirstAccountError('');
    try {
      await accountsApi.add(goldenKey);
      setAccountsCount(1);
      setFirstGoldenKey('');
      router.push('/platform/accounts');
    } catch (error) {
      setFirstAccountError(error instanceof Error ? error.message : 'Не удалось добавить аккаунт.');
    } finally {
      setCreatingFirstAccount(false);
    }
  }

  if (accessChecked && subscriptionLocked && !lockAllowedPath) {
    return (
      <div className="platform-scope flex min-h-[100dvh] items-center justify-center p-4" data-theme={theme}>
        <section className="w-full max-w-[680px] rounded-2xl border border-red-500/35 bg-[var(--pf-surface)] p-6 shadow-[0_0_0_1px_rgba(239,68,68,0.15),0_28px_80px_rgba(239,68,68,0.12)]">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <AlertTriangle size={22} />
          </div>
          <h1 className="text-center text-2xl font-black text-[var(--pf-text)]">Ваша подписка истекла</h1>
          <p className="mx-auto mt-3 max-w-[520px] text-center text-sm leading-6 text-[var(--pf-text-muted)]">
            Доступ к рабочим разделам платформы ограничен. Продлите подписку, чтобы снова включить автоматизацию,
            чаты, аналитику и управление аккаунтами.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link href="/platform/subscription" className="platform-btn-primary inline-flex justify-center gap-1.5">
              <CreditCard size={14} />
              Продлить подписку
            </Link>
            <Link href="/platform/promo-codes" className="platform-btn-secondary inline-flex justify-center gap-1.5">
              <Ticket size={14} />
              Выбрать тариф / промокод
            </Link>
          </div>
          <a
            href="https://t.me/funpaycloud_support"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full justify-center text-xs text-[var(--pf-text-soft)] hover:text-[var(--pf-text-muted)]"
          >
            Нужна помощь? Написать в поддержку
          </a>
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
    <div className="relative">
      <div
        className={`platform-scope platform-shell ${sidebarCollapsed ? 'platform-shell--collapsed' : 'platform-shell--expanded'} ${zeroAccountLocked ? 'pointer-events-none select-none blur-[2px] sm:blur-[3px]' : ''}`}
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
          {showRenewBanner ? (
            <div className="border-b border-red-500/35 bg-red-500/12 px-4 py-2.5 text-[13px] text-red-700 sm:px-6">
              <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  Осталось {subscriptionDaysLeft} дн. доступа
                  {subscriptionExpiresAt ? ` (до ${new Date(subscriptionExpiresAt).toLocaleDateString('ru-RU')})` : ''}.
                  Продлите подписку, чтобы не остановить автоматизацию.
                </p>
                <Link href="/platform/subscription" className="platform-btn-primary h-8 px-3 text-xs">
                  Продлить
                </Link>
              </div>
            </div>
          ) : null}
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

      {zeroAccountLocked ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
          <section className="w-full max-w-[560px] rounded-2xl border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] p-5 shadow-[var(--pf-shadow-soft)] sm:p-6">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]">
              <KeyRound size={20} />
            </div>
            <h2 className="text-2xl font-black text-[var(--pf-text)]">Добавьте первый аккаунт FunPay</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--pf-text-muted)]">
              Пока не подключён ни один аккаунт, рабочие разделы платформы недоступны. Вставьте golden key, и мы
              сразу активируем ваш первый аккаунт.
            </p>

            <form className="mt-5 space-y-3" onSubmit={handleCreateFirstAccount}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--pf-text-dim)]">
                Golden key
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Вставьте golden key из FunPay"
                  value={firstGoldenKey}
                  onChange={event => setFirstGoldenKey(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 text-sm text-[var(--pf-text)] outline-none transition-all placeholder:text-[var(--pf-text-soft)] focus:border-[var(--pf-accent-soft-strong)]"
                />
              </label>

              {firstAccountError ? (
                <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-600">{firstAccountError}</p>
              ) : null}

              <button type="submit" disabled={creatingFirstAccount} className="platform-btn-primary w-full justify-center">
                {creatingFirstAccount ? 'Подключаем аккаунт...' : 'Добавить первый аккаунт'}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
