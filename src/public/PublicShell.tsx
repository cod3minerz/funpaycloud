'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Button, Container, IconButton, Inline, PublicThemeRoot, Stack, Text, ThemeToggle } from '@/design-system';
import { Menu, X } from '@/shared/streamline/icons';
import { VariantExportButton } from './variants';

const navigation = [
  { href: '/#capabilities', label: 'Возможности' },
  { href: '/#workflow', label: 'Как работает' },
  { href: '/#pricing', label: 'Тарифы' },
  { href: '/blog', label: 'Блог' },
];

const blogNavigation = [
  { href: '/', label: 'Обновление' },
  { href: '/blog', label: 'Блог' },
];

export function BrandLogo() {
  return <Link href="/" className="public-brand" aria-label="FunPay Cloud"><Image src="/branding/logo_full_new_dark.svg" alt="FunPay Cloud" width={715} height={113} className="public-brand__dark" priority /><Image src="/branding/logo_full_new.svg" alt="" width={715} height={113} className="public-brand__light" priority /></Link>;
}

export function PublicHeader({ compact = false, showThemeToggle = false, blog = false }: { compact?: boolean; showThemeToggle?: boolean; blog?: boolean }) {
  const [open, setOpen] = useState(false);
  const items = blog ? blogNavigation : navigation;

  return (
    <header className="public-header">
      <Container className="public-header__row">
        <BrandLogo />
        <nav className="public-nav" aria-label="Основная навигация">
          {items.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <Inline gap={2} className="public-header__actions">
          {showThemeToggle ? <ThemeToggle /> : null}
          {blog ? <Button href="https://t.me/funpay_cloud" size="sm">Наш канал</Button> : <>
            {!compact ? <Button href="/auth/login" variant="ghost" size="sm">Войти</Button> : null}
            <Button href="/auth/register" size="sm">Начать бесплатно</Button>
          </>}
        </Inline>
        <IconButton label={open ? 'Закрыть меню' : 'Открыть меню'} className="public-menu-button" onClick={() => setOpen(value => !value)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </IconButton>
      </Container>
      {open ? (
        <Container className="public-mobile-menu">
          <Stack gap={3}>
            {items.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
            {showThemeToggle ? <ThemeToggle /> : null}
            {blog ? <Button href="https://t.me/funpay_cloud">Наш канал</Button> : <>
              <Button href="/auth/login" variant="outline">Войти</Button>
              <Button href="/auth/register">Начать бесплатно</Button>
            </>}
          </Stack>
        </Container>
      ) : null}
    </header>
  );
}

export function PublicFooter({ blog = false }: { blog?: boolean }) {
  const productLinks: Array<[string, string]> = blog
    ? [['Главная', '/'], ['Блог', '/blog']]
    : [['Возможности', '/#capabilities'], ['Тарифы', '/#pricing'], ['Блог', '/blog'], ['Статус', '/status']];
  const companyLinks: Array<[string, string]> = blog
    ? [['Поддержка', 'https://t.me/fpcloud_support'], ['Telegram канал', 'https://t.me/funpay_cloud']]
    : [['О компании', '/about'], ['Поддержка', 'https://t.me/fpcloud_support'], ['Telegram канал', 'https://t.me/funpay_cloud']];
  const legalLinks: Array<[string, string]> = [
    ['Условия использования', '/legal/terms'],
    ['Политика конфиденциальности', '/legal/privacy'],
    ['Cookies', '/legal/cookie-policy'],
  ];

  return (
    <footer className="public-footer">
      <Container>
        <div className="public-footer__grid">
          <Stack gap={4}>
            <BrandLogo />
            <Text size="sm">
              {blog
                ? 'FunPay Cloud готовит новую версию сервиса. Следите за новостями о запуске.'
                : 'Облачная автоматизация для продавцов FunPay. Аккаунты, продажи и поддержка клиентов в одном рабочем контуре.'}
            </Text>
            <Inline gap={2}><ThemeToggle /><VariantExportButton /></Inline>
          </Stack>
          <FooterColumn title={blog ? 'Навигация' : 'Продукт'} links={productLinks} />
          <FooterColumn title={blog ? 'Связаться' : 'Компания'} links={companyLinks} />
          {blog ? null : <FooterColumn title="Документы" links={legalLinks} />}
        </div>
        <div className="public-footer__bottom">
          <Text size="sm" tone="muted">© 2026 FunPay Cloud. Все права защищены.</Text>
          <Text size="sm" tone="muted">{blog ? 'Блог обновляется командой продукта' : 'Сервис работает 24/7'}</Text>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return <Stack gap={3}><strong className="public-footer__title">{title}</strong>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</Stack>;
}

export function PublicPageRoot({ defaultTheme, children, className }: { defaultTheme: 'light' | 'dark'; children: ReactNode; className?: string }) {
  return <PublicThemeRoot defaultTheme={defaultTheme} className={className}>{children}</PublicThemeRoot>;
}
