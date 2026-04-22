'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const NAV_LINKS = [
  { href: '/blog', label: 'Статьи' },
  { href: '/blog#categories', label: 'Категории' },
  { href: '/blog#latest', label: 'Последние' },
  { href: '/blog#about', label: 'О блоге' },
];

export function BlogHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setMobileOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2.5">
          <Image
            src="/branding/logo_full_new.svg"
            alt="FunPay Cloud"
            width={1223}
            height={206}
            priority
            className="h-8 w-auto"
          />
          <span className="inline-flex h-6 items-center rounded-md bg-[var(--text-primary)] px-2.5 text-[10px] font-bold tracking-[0.12em] text-white">
            BLOG
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
          >
            Войти
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Начать бесплатно
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(prev => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] lg:hidden"
          aria-label={mobileOpen ? 'Закрыть меню блога' : 'Открыть меню блога'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <button
        type="button"
        aria-label="Закрыть мобильное меню"
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 top-16 z-[58] bg-[color:color-mix(in_srgb,var(--text-primary)_18%,transparent)] transition-opacity lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        className={`fixed inset-x-0 top-16 z-[59] max-h-[calc(100dvh-64px)] overflow-y-auto px-4 pb-4 transition-all duration-200 lg:hidden ${
          mobileOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl rounded-b-2xl border border-t-0 border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--blog-shadow-soft)]">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map(link => (
              <Link
                key={`mobile-${link.href}`}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
            >
              Войти
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setMobileOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Начать бесплатно
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
