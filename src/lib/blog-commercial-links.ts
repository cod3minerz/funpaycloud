import type { BlogPostSummary } from './blog-types';

export type CommercialLink = {
  href: string;
  label: string;
  description: string;
};

const LINK_CATALOG: Array<{
  keywords: string[];
  link: CommercialLink;
}> = [
  {
    keywords: ['автоподнятие', 'поднятие', 'лоты', 'видимость'],
    link: {
      href: '/auto-raise-lots-funpay',
      label: 'Автоподнятие лотов',
      description: 'Запустите безопасный подъем лотов по расписанию 24/7.',
    },
  },
  {
    keywords: ['автовыдача', 'выдача', 'товар', 'склад', 'ключ'],
    link: {
      href: '/auto-delivery-funpay',
      label: 'Автовыдача товаров',
      description: 'Автоматически выдавайте товар сразу после оплаты заказа.',
    },
  },
  {
    keywords: ['автоответ', 'чат', 'ai', 'ассистент', 'сообщени'],
    link: {
      href: '/funpay-auto-reply',
      label: 'AI-автоответы',
      description: 'Ускорьте обработку чатов с настраиваемым AI-ассистентом.',
    },
  },
  {
    keywords: ['плагин', 'интеграц'],
    link: {
      href: '/funpay-plugins',
      label: 'Плагины FunPay',
      description: 'Расширяйте автоматизацию под свою нишу и рабочие процессы.',
    },
  },
  {
    keywords: ['cardinal', 'аналог', 'сравнени', 'vps', 'desktop', 'облако'],
    link: {
      href: '/funpay-cardinal-alternative',
      label: 'Альтернатива Cardinal',
      description: 'Сравните облачную модель с self-hosted подходом и выберите лучшее.',
    },
  },
  {
    keywords: ['автоматизац', 'продаж', 'заказ'],
    link: {
      href: '/funpay-automation',
      label: 'Автоматизация FunPay',
      description: 'Соберите единый процесс: лоты, заказы, чаты и склад в одном сервисе.',
    },
  },
  {
    keywords: ['бот', 'funpay', 'продав'],
    link: {
      href: '/funpay-bot',
      label: 'Облачный бот FunPay',
      description: 'Полноценная облачная платформа без VPS, прокси и сложной настройки.',
    },
  },
];

function normalizeText(value: string): string {
  return value.toLowerCase();
}

export function getCommercialLinksForPost(post: BlogPostSummary, limit = 3): CommercialLink[] {
  const haystack = normalizeText([post.title, post.description, post.tags.join(' ')].join(' '));
  const scored: Array<{ link: CommercialLink; score: number }> = [];

  for (const item of LINK_CATALOG) {
    const score = item.keywords.reduce((acc, keyword) => (haystack.includes(keyword) ? acc + 1 : acc), 0);
    if (score > 0) {
      scored.push({ link: item.link, score });
    }
  }

  const unique = new Map<string, CommercialLink>();
  scored
    .sort((a, b) => b.score - a.score)
    .forEach(({ link }) => unique.set(link.href, link));

  if (unique.size === 0) {
    unique.set('/funpay-automation', {
      href: '/funpay-automation',
      label: 'Автоматизация FunPay',
      description: 'Посмотрите, как собрать стабильную автоматизацию магазина в облаке.',
    });
    unique.set('/funpay-bot', {
      href: '/funpay-bot',
      label: 'Облачный бот FunPay',
      description: 'Запустите облачного бота без серверной рутины.',
    });
  }

  return [...unique.values()].slice(0, limit);
}

