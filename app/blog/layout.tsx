import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogHeader } from '../components/blog/BlogHeader';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="blog-scope min-h-screen">
      <BlogHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">{children}</main>

      <footer className="mt-14 border-t border-[var(--line)] bg-[var(--bg-secondary)]/70">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <Link href="/" className="inline-flex min-h-11 items-center">
              <Image
                src="/branding/logo_full_new.svg"
                alt="FunPay Cloud"
                width={1223}
                height={206}
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
              Практический блог про автоматизацию продаж на FunPay: кейсы, инструкции и рабочие подходы без воды.
            </p>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              FunPay Cloud не аффилирован с FunPay и не является официальным инструментом FunPay.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Разделы</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <Link href="/blog" className="transition-colors hover:text-[var(--text-primary)]">
                Все статьи
              </Link>
              <Link href="/blog#categories" className="transition-colors hover:text-[var(--text-primary)]">
                Категории
              </Link>
              <Link href="/blog#latest" className="transition-colors hover:text-[var(--text-primary)]">
                Последние публикации
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Платформа</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <Link href="/auth/login" className="transition-colors hover:text-[var(--text-primary)]">
                Войти
              </Link>
              <Link href="/auth/register" className="transition-colors hover:text-[var(--text-primary)]">
                Начать бесплатно
              </Link>
              <Link href="/" className="transition-colors hover:text-[var(--text-primary)]">
                Главная
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--line)]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} FunPay Cloud. Все права защищены.</p>
            <p className="font-mono">status: blog operational</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
