import type { Metadata, Viewport } from 'next';
import { Caveat, Geist, Inter, JetBrains_Mono, Outfit, Roboto_Flex, Syne } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from '@/app/components/ui/sonner';
import { YandexMetrika } from './components/analytics/YandexMetrika';
import { PublicThemeScript } from '@/design-system';
import { PUBLIC_THEME_COLORS } from '@/design-system/meta';
import './globals.css';
import '@/design-system/styles.css';
import '@/public/public.css';
import '@/public/blog/blog.css';
import '@/public/auth/auth.css';
import '@/public/legal/legal.css';
import '@/public/seo/seo.css';
import '@/public/system/system.css';

const geist = Geist({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-geist',
});

const syne = Syne({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-syne',
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const caveat = Caveat({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-caveat',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const robotoFlex = Roboto_Flex({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-roboto-flex',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://funpay.cloud'),
  title: 'FunPay Cloud',
  description: 'Автоматизация продаж на FunPay — облачный SaaS для продавцов',
  verification: {
    yandex: '4967786c9a60a988',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16' },
      { url: '/favicon-32x32.png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: PUBLIC_THEME_COLORS.dark },
    { media: '(prefers-color-scheme: light)', color: PUBLIC_THEME_COLORS.light },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`dark ${geist.variable} ${syne.variable} ${inter.variable} ${jetbrainsMono.variable} ${caveat.variable} ${outfit.variable} ${robotoFlex.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <PublicThemeScript />
        {children}
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
