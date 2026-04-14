import type { ReactNode } from 'react';
import Link from 'next/link';
import { BlogHeader } from '../components/blog/BlogHeader';
import { BlogThemeProvider } from '../components/blog/BlogThemeProvider';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <BlogThemeProvider>
      <div className="blog-scope min-h-screen">
        <BlogHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
        <footer className="mt-16 border-t border-[var(--border)]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} FunPay Cloud</p>
            <div className="flex items-center gap-4">
              <Link href="/blog" className="hover:text-[var(--text-primary)]">
                Все статьи
              </Link>
              <Link href="/auth/register" className="hover:text-[var(--text-primary)]">
                Начать бесплатно
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </BlogThemeProvider>
  );
}
