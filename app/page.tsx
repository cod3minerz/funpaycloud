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
import SmoothScroll from '@/components/landing/SmoothScroll';

export const metadata: Metadata = {
  title: 'FunPay Cloud — Облачная платформа автоматизации продаж на FunPay',
  description:
    'Автоматизируй магазин на FunPay без компьютера. Автоподнятие лотов, AI-ответы, автовыдача товаров. Попробуй бесплатно 14 дней.',
  keywords: ['funpay автоматизация', 'автоподнятие лотов funpay', 'бот funpay облако'],
  alternates: {
    canonical: 'https://funpay.cloud',
  },
  openGraph: {
    title: 'FunPay Cloud',
    description: 'Облачная автоматизация для продавцов FunPay',
    url: 'https://funpay.cloud',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FunPay Cloud',
    description: 'Облачная автоматизация для продавцов FunPay',
    images: ['https://funpay.cloud/og-image.png'],
  },
};

export default function HomePage() {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FunPay Cloud',
    url: 'https://funpay.cloud',
    logo: 'https://funpay.cloud/android-chrome-512x512.png',
    email: 'legal@funpay.cloud',
  };

  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FunPay Cloud',
    url: 'https://funpay.cloud',
    inLanguage: 'ru-RU',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://funpay.cloud/blog?query={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="landing">
      <SmoothScroll />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
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
