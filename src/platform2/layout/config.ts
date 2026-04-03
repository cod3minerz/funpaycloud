import {
  ArchiveBoxIcon,
  BanknotesIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  HomeIcon,
  PuzzlePieceIcon,
  ShoppingCartIcon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

export type P2Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type P2NavItem = {
  label: string;
  href: string;
  icon: P2Icon;
};

export const p2NavGroups: Array<{ title: string; items: P2NavItem[] }> = [
  {
    title: 'Операции',
    items: [
      { label: 'Дашборд', href: '/platform2/dashboard', icon: HomeIcon },
      { label: 'Чаты', href: '/platform2/chats', icon: ChatBubbleLeftRightIcon },
      { label: 'Заказы', href: '/platform2/orders', icon: ShoppingCartIcon },
      { label: 'Лоты', href: '/platform2/lots', icon: TagIcon },
      { label: 'Склад', href: '/platform2/warehouse', icon: ArchiveBoxIcon },
    ],
  },
  {
    title: 'Управление',
    items: [
      { label: 'Аккаунты', href: '/platform2/accounts', icon: UsersIcon },
      { label: 'Аналитика', href: '/platform2/analytics', icon: ChartBarSquareIcon },
      { label: 'Автоматизация', href: '/platform2/automation', icon: BoltIcon },
      { label: 'Плагины', href: '/platform2/plugins', icon: PuzzlePieceIcon },
      { label: 'Финансы', href: '/platform2/finances', icon: BanknotesIcon },
      { label: 'Настройки', href: '/platform2/settings', icon: Cog6ToothIcon },
    ],
  },
];

export const p2PathLabels: Record<string, string> = {
  platform2: 'Платформа 2.0',
  dashboard: 'Дашборд',
  chats: 'Чаты',
  orders: 'Заказы',
  lots: 'Лоты',
  warehouse: 'Склад',
  accounts: 'Аккаунты',
  analytics: 'Аналитика',
  automation: 'Автоматизация',
  plugins: 'Плагины',
  finances: 'Финансы',
  settings: 'Настройки',
};
