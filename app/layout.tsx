import type { Metadata } from 'next';
import { Manrope, Syne } from 'next/font/google';
import { Toaster } from 'sonner';
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
  title: 'FunPay Cloud',
  description: 'Автоматизация продаж на FunPay — облачный SaaS для продавцов',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`dark ${manrope.variable} ${syne.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{ style: { background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: '#fff' } }}
        />
      </body>
    </html>
  );
}
