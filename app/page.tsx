import type { Metadata } from 'next';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingComparison from '@/components/landing/LandingComparison';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingHero from '@/components/landing/LandingHero';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingMockup from '@/components/landing/LandingMockup';
import LandingNav from '@/components/landing/LandingNav';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingProblem from '@/components/landing/LandingProblem';
import LandingSocial from '@/components/landing/LandingSocial';
import LandingUseCases from '@/components/landing/LandingUseCases';

export const metadata: Metadata = {
  title: 'FunPay Cloud — Облачная платформа автоматизации продаж на FunPay',
  description:
    'Автоматизируй магазин на FunPay без компьютера. Автоподнятие лотов, AI-ответы, автовыдача товаров. Попробуй бесплатно 14 дней.',
  keywords: ['funpay автоматизация', 'автоподнятие лотов funpay', 'бот funpay облако'],
  openGraph: {
    title: 'FunPay Cloud',
    description: 'Облачная автоматизация для продавцов FunPay',
    url: 'https://funpay.cloud',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="landing">
      <LandingNav />
      <LandingHero />
      <LandingMockup />
      <LandingProblem />
      <LandingFeatures />
      <LandingComparison />
      <LandingUseCases />
      <LandingHowItWorks />
      <LandingSocial />
      <LandingPricing />
      <LandingFAQ />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
