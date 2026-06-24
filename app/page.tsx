import type { Metadata } from 'next';
import LandingActivityMap from '@/components/landing/LandingActivityMap';
import LandingCalculator from '@/components/landing/LandingCalculator';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingComparison from '@/components/landing/LandingComparison';
import LandingEncryption from '@/components/landing/LandingEncryption';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingHero from '@/components/landing/LandingHero';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingMockup from '@/components/landing/LandingMockup';
import LandingNav from '@/components/landing/LandingNav';
import LandingNightStory from '@/components/landing/LandingNightStory';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingProblem from '@/components/landing/LandingProblem';
import LandingUseCases from '@/components/landing/LandingUseCases';
import SmoothScroll from '@/components/landing/SmoothScroll';

export const metadata: Metadata = {
  title: 'FunPay Cloud — Облачная платформа автоматизации продаж на FunPay',
  description:
    'Автоматизируй магазин на FunPay без компьютера. Автоподнятие лотов, AI-ответы, автовыдача товаров. Попробуй бесплатно 7 дней.',
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

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FunPay Cloud',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://funpay.cloud',
    description: 'Облачный сервис автоматизации продаж на FunPay: автоподнятие лотов, автовыдача товаров, AI-автоответы в чатах. Работает без VPS 24/7.',
    inLanguage: 'ru-RU',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'RUB',
      description: 'Бесплатно 7 дней, затем от 990 ₽/мес',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '250',
      bestRating: '5',
      worstRating: '1',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Нужно ли держать компьютер включённым?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Нет. FunPay Cloud работает полностью в облаке на наших серверах. Ты можешь выключить компьютер, уехать в отпуск или просто лечь спать — бот продолжает работать 24/7 без твоего участия.',
        },
      },
      {
        '@type': 'Question',
        name: 'Безопасно ли для моего аккаунта FunPay?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Да. Каждому клиенту выделяется отдельный IPv4-адрес, встроена антибан-логика и соблюдаются лимиты площадки. Тысячи продавцов работают через FunPay Cloud месяцами без блокировок.',
        },
      },
      {
        '@type': 'Question',
        name: 'Сложно ли настроить? Я не технарь',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Нет. Онбординг занимает 10 минут, мы ведём за руку на каждом шаге. Если что-то непонятно — команда поддержки @fpcloud_support поможет настроить всё за тебя в рамках бесплатного онбординга.',
        },
      },
      {
        '@type': 'Question',
        name: 'Что такое AI-автоответчик и как он работает?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Нейросеть понимает контекст диалога, отвечает клиентам как живой человек, обрабатывает типовые вопросы и возражения. Сложные случаи передаёт тебе. Ты задаёшь тон и шаблоны, а ассистент подстраивается.',
        },
      },
      {
        '@type': 'Question',
        name: 'Можно ли управлять несколькими аккаунтами?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Да. На тарифе Pro — до 5 аккаунтов, на Ultra — без ограничений. Единая панель показывает все аккаунты сразу, с общей аналитикой и ролями для команды.',
        },
      },
      {
        '@type': 'Question',
        name: 'Что если у меня вопросы после оплаты?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Приоритетная поддержка в Telegram @fpcloud_support с временем ответа до 15 минут в рабочее время. На тарифе Ultra — персональная поддержка и приоритетные тикеты 24/7.',
        },
      },
      {
        '@type': 'Question',
        name: 'Чем FunPay Cloud лучше других ботов для FunPay?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Облачный запуск вместо ПК, полноценный веб-дашборд, AI-ответы с пониманием контекста, выделенный IPv4, мультиаккаунт и глубокая аналитика — в отличие от desktop-ботов и скриптов.',
        },
      },
      {
        '@type': 'Question',
        name: 'Есть ли пробный период?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Да, 7 дней бесплатно без привязки карты. Полный доступ к функциям тарифа Pro, чтобы ты оценил реальный эффект на своём магазине.',
        },
      },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingNav />
      <LandingHero />
      <LandingNightStory />
      <LandingActivityMap />
      <LandingProblem />
      <LandingMockup />
      <LandingFeatures />
      <LandingComparison />
      <LandingUseCases />
      <LandingCalculator />
      <LandingHowItWorks />
      <LandingEncryption />
      <LandingPricing />
      <LandingFAQ />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
