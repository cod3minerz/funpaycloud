import type { BlogPostSummary } from './blog-types';

const lotRaiserMarketingEnabled = false;

export type BlogCtaTopic = 'raise' | 'delivery' | 'ai' | 'comparison' | 'automation';

export interface BlogCtaConfig {
  topic: BlogCtaTopic;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

const CTA_CONFIGS: Record<BlogCtaTopic, BlogCtaConfig> = {
  raise: { topic: 'raise', title: 'Готовим новую версию FunPay Cloud', description: 'Сейчас мы переписываем ядро сервиса. О запуске сообщим отдельно.', actionHref: '/', actionLabel: 'Статус обновления' },
  delivery: { topic: 'delivery', title: 'Готовим новую версию FunPay Cloud', description: 'Сейчас мы переписываем ядро сервиса. О запуске сообщим отдельно.', actionHref: '/', actionLabel: 'Статус обновления' },
  ai: { topic: 'ai', title: 'Готовим новую версию FunPay Cloud', description: 'Сейчас мы переписываем ядро сервиса. О запуске сообщим отдельно.', actionHref: '/', actionLabel: 'Статус обновления' },
  comparison: { topic: 'comparison', title: 'Готовим новую версию FunPay Cloud', description: 'Сейчас мы переписываем ядро сервиса. О запуске сообщим отдельно.', actionHref: '/', actionLabel: 'Статус обновления' },
  automation: { topic: 'automation', title: 'Готовим новую версию FunPay Cloud', description: 'Сейчас мы переписываем ядро сервиса. О запуске сообщим отдельно.', actionHref: '/', actionLabel: 'Статус обновления' },
};

const TOPIC_RULES: Array<{ topic: BlogCtaTopic; keywords: string[] }> = [
  {
    topic: 'delivery',
    keywords: ['автовыда', 'склад', 'выдач', 'ключ', 'товар'],
  },
  ...(lotRaiserMarketingEnabled
    ? [{ topic: 'raise' as const, keywords: ['автоподня', 'подняти', 'лот'] }]
    : []),
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
