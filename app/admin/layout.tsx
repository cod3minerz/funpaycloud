'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Ban, LayoutDashboard, LogOut, Logs, PlayCircle, Users, Network, Ticket } from 'lucide-react';
import { clearAdminToken } from '@/lib/auth';
import { adminApi } from '@/lib/api';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/logs', label: 'Логи', icon: Logs },
  { href: '/admin/runners', label: 'Воркеры', icon: PlayCircle },
  { href: '/admin/proxies', label: 'Прокси', icon: Network },
  { href: '/admin/promocodes', label: 'Промокоды', icon: Ticket },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/bans', label: 'Баны', icon: Ban },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-800 bg-slate-900/80 p-5 md:flex md:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">FunPay Cloud</p>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-blue-500/15 text-blue-300'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={async () => {
              try {
                await adminApi.logout();
              } catch {
                // no-op: local cleanup below still runs
              } finally {
                clearAdminToken();
                router.push('/admin/login');
              }
            }}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 text-sm font-medium text-slate-200 hover:border-red-500/40 hover:text-red-300"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </aside>

        <main className="min-h-screen flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
