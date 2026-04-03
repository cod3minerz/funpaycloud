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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Input } from '@/app/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { cn } from '@/app/components/ui/utils';
import { p2NavGroups, p2PathLabels } from '@/platform2/layout/config';

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--p2-border)' }}>
        <Link href="/" aria-label="FunPay Cloud" onClick={onNavigate}>
          <BrandLogo compact className="h-8 md:h-8" />
        </Link>
      </div>

      <nav className="py-2">
        {p2NavGroups.map(group => (
          <div key={group.title}>
            <p className="p2-nav-group">{group.title}</p>
            {group.items.map(item => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={cn('p2-nav-item', active && 'active')} onClick={onNavigate}>
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}

export default function Platform2Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    return pathname
      .split('/')
      .filter(Boolean)
      .map(segment => ({ key: segment, label: p2PathLabels[segment] ?? segment }));
  }, [pathname]);

  return (
    <div className="platform2-scope platform2-shell">
      <aside className="p2-sidebar hidden md:block">
        <SidebarNav pathname={pathname} />
      </aside>

      <div className="platform2-main">
        <header className="p2-topbar">
          <div className="px-4 md:px-6 py-3 flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden p2-surface-2 text-[var(--p2-text-muted)]">
                  <Bars3Icon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[290px] p-0 border-r p2-surface" style={{ borderColor: 'var(--p2-border)' }}>
                <SheetHeader className="sr-only">
                  <SheetTitle>Навигация</SheetTitle>
                </SheetHeader>
                <div className="h-full overflow-y-auto p2-scroll">
                  <SidebarNav pathname={pathname} onNavigate={() => setSheetOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:block min-w-0">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, idx) => (
                    <div key={`${crumb.key}-${idx}`} className="inline-flex items-center">
                      {idx > 0 && (
                        <BreadcrumbSeparator>
                          <ChevronRightIcon className="size-3.5" />
                        </BreadcrumbSeparator>
                      )}
                      <BreadcrumbItem>
                        {idx === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="text-[var(--p2-text)]">{crumb.label}</BreadcrumbPage>
                        ) : (
                          <span className="text-[var(--p2-text-dim)] text-sm">{crumb.label}</span>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-md px-3 h-10 min-w-[250px] md:min-w-[320px] p2-surface-2">
                <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
                <Input
                  className="border-0 shadow-none bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:border-0 text-sm p2-input"
                  placeholder="Поиск по заказам, чатам, лотам"
                />
              </div>

              <Button variant="outline" size="icon" className="p2-surface-2 text-[var(--p2-text-muted)]">
                <BellIcon className="size-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 rounded-md px-2 pr-3 inline-flex items-center gap-2 p2-surface-2">
                    <span className="size-8 rounded-full bg-blue-700 text-white inline-flex items-center justify-center text-xs font-bold">K</span>
                    <span className="hidden md:flex flex-col items-start leading-none">
                      <strong className="text-xs">kirill</strong>
                      <span className="text-[11px] text-[var(--p2-text-dim)]">FunPay Cloud</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Профиль</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/platform2/settings">Настройки</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Поддержка</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Выйти</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-4 md:px-6 py-4 md:py-6">{children}</main>
      </div>
    </div>
  );
}
