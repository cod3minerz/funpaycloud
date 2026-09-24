'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Moon, Sun } from '@/shared/streamline/icons';
import { IconButton } from './components';

export type PublicTheme = 'light' | 'dark';
const STORAGE_KEY = 'fpc-public-theme';
const PublicThemeContext = createContext<{ theme: PublicTheme; setTheme: (theme: PublicTheme) => void } | null>(null);

export function PublicThemeScript() {
  const source = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.dataset.publicThemePreference=t}}catch(e){}})()`;
  return <script dangerouslySetInnerHTML={{ __html: source }} />;
}

export function PublicThemeRoot({ defaultTheme, children, className }: { defaultTheme: PublicTheme; children: ReactNode; className?: string }) {
  const [theme, setTheme] = useState<PublicTheme>(defaultTheme);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.publicThemePreference = theme;
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <PublicThemeContext.Provider value={value}><div data-public-ui data-default-theme={defaultTheme} data-theme={theme} className={className}>{children}</div></PublicThemeContext.Provider>;
}

export function ThemeToggle() {
  const context = useContext(PublicThemeContext);
  const theme = context?.theme ?? 'dark';

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    context?.setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.dataset.publicThemePreference = next;
  };

  return <IconButton label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'} onClick={toggle}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</IconButton>;
}
