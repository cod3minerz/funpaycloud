'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

export function BlogThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-blog-theme"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      themes={['light', 'dark']}
    >
      {children}
    </ThemeProvider>
  );
}
