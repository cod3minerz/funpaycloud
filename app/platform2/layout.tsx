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

function P2Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="p2-sidebar-head">
        <Link href="/platform2/dashboard" aria-label="FunPay Cloud" onClick={onNavigate}>
          <BrandLogo compact className="h-8" />
        </Link>
      </div>

      <div className="p2-sidebar-body p2-scroll">
        {p2NavGroups.map(group => (
          <section className="p2-nav-group" key={group.title}>
            <p className="p2-nav-title">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn('p2-nav-link', active && 'active')}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export default function Platform2Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openMobile, setOpenMobile] = useState(false);

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
      <div className="p2-layout">
        <aside className="p2-sidebar hidden md:flex">
          <P2Sidebar pathname={pathname} />
        </aside>

        <div className="p2-content">
          <header className="p2-topbar">
            <div className="p2-topbar-inner">
              <div className="inline-flex items-center gap-2 min-w-0">
                <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="p2-icon-btn md:hidden">
                      <Bars3Icon className="size-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[294px] p-0 p2-dialog">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Навигация</SheetTitle>
                    </SheetHeader>
                    <div className="h-full">
                      <P2Sidebar pathname={pathname} onNavigate={() => setOpenMobile(false)} />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="p2-crumbs">
                  {breadcrumbs.map((crumb, idx) => (
                    <div className="inline-flex items-center gap-2" key={`${crumb}-${idx}`}>
                      {idx > 0 ? <ChevronRightIcon className="size-3 text-[var(--p2-text-dim)]" /> : null}
                      <span className="p2-crumb">{crumb}</span>
                    </div>
                  ))}
                </div>
              </div>

              <label className="p2-search">
                <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
                <input placeholder="Поиск по платформе" />
              </label>

              <div className="p2-top-actions">
                <button className="p2-icon-btn" aria-label="Уведомления">
                  <BellIcon className="size-4" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p2-profile-btn">
                      <span className="p2-avatar">K</span>
                      <span className="hidden sm:flex flex-col items-start leading-none">
                        <strong className="text-xs">kirill</strong>
                        <span className="text-[11px] text-[var(--p2-text-dim)]">Owner</span>
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p2-dialog">
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
    </div>
  );
}
