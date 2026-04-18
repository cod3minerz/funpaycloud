'use client';

import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import Button from './Button';

const links = [
  { href: '#features', label: 'Возможности' },
  { href: '#pricing', label: 'Тарифы' },
  { href: '#cases', label: 'Кейсы' },
  { href: '#how', label: 'Как работает' },
  { href: '/blog', label: 'Блог' },
];

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const onAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    closeMenu();

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

        <button
          type="button"
          className="nav-burger"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <button
        type="button"
        aria-label="Закрыть мобильное меню"
        className={`nav-mobile-overlay ${menuOpen ? 'open' : ''}`}
        onClick={closeMenu}
      />

      <div className={`nav-mobile-panel ${menuOpen ? 'open' : ''}`}>
        <div className="wrap nav-mobile-panel-inner">
          <div className="nav-mobile-links">
            {links.map((link) => (
              <a
                key={`mobile-${link.href}`}
                href={link.href}
                onClick={(event) => onAnchorClick(event, link.href)}
                className="nav-mobile-link"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="nav-mobile-cta">
            <a href="/auth/login" className="btn btn-outline btn-lg" onClick={closeMenu}>
              Войти
            </a>
            <a href="/auth/register" className="btn btn-primary btn-lg" onClick={closeMenu}>
              Начать бесплатно
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
