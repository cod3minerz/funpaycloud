import type { Metadata, Viewport } from 'next';
import { Caveat, Inter, JetBrains_Mono, Syne } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { YandexMetrika } from './components/analytics/YandexMetrika';
import './globals.css';

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
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`dark ${syne.variable} ${inter.variable} ${jetbrainsMono.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {children}
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              background: 'var(--pf-surface-overlay)',
              border: '1px solid var(--pf-border-strong)',
              color: 'var(--pf-text)',
            },
          }}
        />
      </body>
    </html>
  );
}
