import type { BlogPostSummary } from './blog-types';

export type BlogCtaTopic = 'raise' | 'delivery' | 'ai' | 'comparison' | 'automation';

export interface BlogCtaConfig {
  topic: BlogCtaTopic;
  title: string;
  description: string;
  featureHref: string;
  featureLabel: string;
  registerHref: string;
  registerLabel: string;
}

const CTA_CONFIGS: Record<BlogCtaTopic, BlogCtaConfig> = {
  raise: {
    topic: 'raise',
    title: 'Запустите автоподнятие лотов без VPS',
    description: 'Поднимайте лоты по расписанию 24/7 и держите выдачу в топе без ручной рутины.',
    featureHref: '/auto-raise-lots-funpay',
    featureLabel: 'Открыть автоподнятие',
    registerHref: '/auth/register',
    registerLabel: 'Начать бесплатно',
  },
  delivery: {
    topic: 'delivery',
    title: 'Включите автовыдачу за 10 минут',
    description: 'Выдавайте цифровые товары сразу после оплаты, без ночных ручных отправок и простоев.',
    featureHref: '/auto-delivery-funpay',
    featureLabel: 'Открыть автовыдачу',
    registerHref: '/auth/register',
    registerLabel: 'Начать бесплатно',
  },
  ai: {
    topic: 'ai',
    title: 'Подключите AI-автоответы под продажи',
    description: 'Сократите время ответа в чате и не теряйте покупателей в пиковые и ночные часы.',
    featureHref: '/funpay-auto-reply',
    featureLabel: 'Открыть AI-автоответы',
    registerHref: '/auth/register',
    registerLabel: 'Начать бесплатно',
  },
  comparison: {
    topic: 'comparison',
    title: 'Сравните SaaS и self-hosted на практике',
    description: 'Выберите модель автоматизации по рискам, стоимости владения и скорости масштабирования.',
    featureHref: '/funpay-cardinal-alternative',
    featureLabel: 'Смотреть сравнение',
    registerHref: '/auth/register',
    registerLabel: 'Попробовать облако бесплатно',
  },
  automation: {
    topic: 'automation',
    title: 'Соберите полный контур автоматизации FunPay',
    description: 'Лоты, склад, чаты и заказы в одном облачном сервисе — без серверной инфраструктуры.',
    featureHref: '/funpay-automation',
    featureLabel: 'Открыть автоматизацию',
    registerHref: '/auth/register',
    registerLabel: 'Начать бесплатно',
  },
};

const TOPIC_RULES: Array<{ topic: BlogCtaTopic; keywords: string[] }> = [
  {
    topic: 'delivery',
    keywords: ['автовыда', 'склад', 'выдач', 'ключ', 'товар'],
  },
  {
    topic: 'raise',
    keywords: ['автоподня', 'подняти', 'лот'],
  },
  {
    topic: 'ai',
    keywords: ['ai', 'автоответ', 'чат', 'сообщени'],
  },
  {
    topic: 'comparison',
    keywords: ['cardinal', 'self-hosted', 'saas', 'vps', 'сравнен', 'desktop', 'облачн'],
  },
  {
    topic: 'automation',
    keywords: ['автоматизац', 'операцион', 'roi', 'выручк'],
  },
];

export function getCtaConfig(topic: BlogCtaTopic): BlogCtaConfig {
  return CTA_CONFIGS[topic];
}

export function getTopicForPost(post: BlogPostSummary): BlogCtaTopic {
  const haystack = `${post.title} ${post.description} ${post.category} ${post.tags.join(' ')}`.toLowerCase();

  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some(keyword => haystack.includes(keyword))) {
      return rule.topic;
    }
  }

  return 'automation';
}

export function getCtaConfigForPost(post: BlogPostSummary): BlogCtaConfig {
  return getCtaConfig(getTopicForPost(post));
}
