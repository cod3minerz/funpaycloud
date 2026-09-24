import type { Metadata } from 'next';
import { MaintenancePage } from '@/public/maintenance/MaintenancePage';

export const metadata: Metadata = {
  title: 'FunPay Cloud v2.0 скоро',
  description:
    'Переписываем ядро FunPay Cloud и готовим запуск новой версии. Скоро расскажем подробности.',
  alternates: {
    canonical: 'https://funpay.cloud',
  },
  openGraph: {
    title: 'FunPay Cloud v2.0 скоро',
    description:
      'Переписываем ядро FunPay Cloud и готовим запуск новой версии.',
    url: 'https://funpay.cloud',
    type: 'website',
  },
};

export default function HomePage() {
  return <MaintenancePage />;
}
