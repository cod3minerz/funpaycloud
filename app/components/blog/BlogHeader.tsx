'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { href: '/blog', label: 'Статьи' },
  { href: '/blog#categories', label: 'Категории' },
  { href: '/blog#about', label: 'О блоге' },
];

function BlogLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-[150px] rounded bg-[var(--bg-card)]" />;
  }

  const dark = resolvedTheme !== 'light';

  return (
    <Image
      src={dark ? '/logo-light.svg' : '/logo-dark.svg'}
      alt="FunPay Cloud"
      width={150}
      height={32}
      className="h-8 w-auto"
      priority
    />
  );
}

export function BlogHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/blog" className="inline-flex min-h-11 items-center">
          <BlogLogo />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] lg:hidden"
            aria-label="Открыть меню"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-[var(--bg)] px-6 py-6 lg:hidden">
          <div className="mb-10 flex items-center justify-between">
            <BlogLogo />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)]"
              aria-label="Закрыть меню"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/auth/register"
            onClick={() => setMobileOpen(false)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Начать бесплатно
          </Link>
        </div>
      )}
    </header>
  );
}
