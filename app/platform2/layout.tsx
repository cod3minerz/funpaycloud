'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Bars3Icon,
  BellIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { BrandLogo } from '@/app/components/BrandLogo';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { cn } from '@/app/components/ui/utils';
import { p2NavGroups, p2PathLabels } from '@/platform2/layout/config';

function SidebarMenu({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="p2-logo-wrap">
        <Link href="/platform2/dashboard" aria-label="FunPay Cloud" onClick={onNavigate}>
          <BrandLogo compact className="h-8" />
        </Link>
      </div>

      {p2NavGroups.map(group => (
        <div className="p2-nav-section" key={group.title}>
          <p className="p2-nav-group">{group.title}</p>
          {group.items.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('p2-nav-item', active && 'active')}
                onClick={onNavigate}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

export default function Platform2Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const breadcrumbs = useMemo(
    () =>
      pathname
        .split('/')
        .filter(Boolean)
        .map(segment => p2PathLabels[segment] ?? segment),
    [pathname],
  );

  return (
    <div className="platform2-scope platform2-shell">
      <aside className="p2-sidebar hidden md:block p2-scroll">
        <SidebarMenu pathname={pathname} />
      </aside>

      <div className="platform2-main">
        <header className="p2-topbar">
          <div className="p2-topbar-inner">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="p2-icon-btn md:hidden">
                  <Bars3Icon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[290px] p-0 p2-surface border-r-[var(--p2-border-soft)]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Навигация</SheetTitle>
                </SheetHeader>
                <div className="h-full p2-scroll overflow-y-auto">
                  <SidebarMenu pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center gap-2 min-w-0">
              {breadcrumbs.map((crumb, idx) => (
                <div className="inline-flex items-center gap-2 min-w-0" key={`${crumb}-${idx}`}>
                  {idx > 0 && <ChevronRightIcon className="size-3.5 text-[var(--p2-text-dim)] shrink-0" />}
                  <span className={cn('p2-breadcrumb truncate', idx === breadcrumbs.length - 1 && 'text-[var(--p2-text)]')}>
                    {crumb}
                  </span>
                </div>
              ))}
            </div>

            <label className="p2-search hidden sm:flex">
              <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
              <input placeholder="Search or type command..." />
            </label>

            <div className="p2-top-actions">
              <button className="p2-icon-btn" aria-label="Notifications">
                <BellIcon className="size-4" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p2-profile">
                    <span className="p2-avatar">K</span>
                    <span className="hidden md:flex flex-col items-start leading-none">
                      <strong className="text-xs">kirill</strong>
                      <span className="text-[11px] text-[var(--p2-text-dim)]">FunPay Cloud</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p2-surface border-[var(--p2-border-soft)] text-[var(--p2-text)]">
                  <DropdownMenuLabel className="text-[var(--p2-text)]">Профиль</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--p2-border-soft)]" />
                  <DropdownMenuItem asChild>
                    <Link href="/platform2/settings">Настройки</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Поддержка</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[var(--p2-border-soft)]" />
                  <DropdownMenuItem>Выйти</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p2-main">{children}</main>
      </div>
    </div>
  );
}
