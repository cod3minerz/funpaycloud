import type { Metadata, Viewport } from 'next';
import { Manrope, Syne } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { YandexMetrika } from './components/analytics/YandexMetrika';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-manrope',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-syne',
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
    <html lang="ru" className={`dark ${manrope.variable} ${syne.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{ style: { background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: '#fff' } }}
        />
      </body>
    </html>
  );
}
