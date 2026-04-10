import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'FunPay Cloud',
  description: 'Автоматизация продаж на FunPay — облачный SaaS для продавцов',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body>
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
