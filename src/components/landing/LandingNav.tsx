'use client';

import Image from 'next/image';
import type { MouseEvent } from 'react';
import Button from './Button';

const links = [
  { href: '#features', label: 'Возможности' },
  { href: '#pricing', label: 'Тарифы' },
  { href: '#cases', label: 'Кейсы' },
  { href: '#how', label: 'Как работает' },
  { href: '/blog', label: 'Блог' },
];

export default function LandingNav() {
  const onAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) {
      return;
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    event.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <nav className="nav">
      <div className="wrap nav-row">
        <a className="logo" href="/">
          <Image
            src="/branding/logo_full_new.svg"
            alt="FunPay Cloud"
            width={1223}
            height={206}
            priority
            className="landing-logo-full"
          />
          <Image
            src="/branding/logo_short_new.svg"
            alt="FunPay Cloud"
            width={245}
            height={167}
            priority
            className="landing-logo-short"
          />
        </a>

        <div className="nav-links">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => onAnchorClick(event, link.href)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-cta">
          <Button variant="ghost" href="/auth/login">
            Войти
          </Button>
          <Button variant="primary" href="/auth/register">
            Начать бесплатно
          </Button>
        </div>
      </div>
    </nav>
  );
}
