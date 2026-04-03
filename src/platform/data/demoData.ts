export type Account = {
  id: string;
  username: string;
  avatar: string;
  balance: number;
  lotsCount: number;
  online: boolean;
  rating: number;
  sales: number;
  verified: boolean;
};

export type OrderStatus = 'paid' | 'completed' | 'refund' | 'dispute';

export type Order = {
  id: string;
  accountId: string;
  buyer: string;
  buyerAvatar: string;
  lot: string;
  category: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  description: string;
};

export type ChatMessage = {
  id: string;
  fromUser: boolean;
  text: string;
  time: string;
  read: boolean;
};

export type Chat = {
  id: string;
  accountId: string;
  buyer: string;
  buyerAvatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  orderId?: string;
  messages: ChatMessage[];
};

export type LotStatus = 'active' | 'inactive';

export type Lot = {
  id: string;
  accountId: string;
  title: string;
  category: string;
  categoryIcon: string;
  price: number;
  status: LotStatus;
  salesMonth: number;
  description: string;
  autoDelivery: string;
};

export type WarehouseItem = {
  id: string;
  value: string;
  status: 'available' | 'delivered';
  deliveredAt?: string;
};

export type WarehouseLot = {
  lotId: string;
  lotTitle: string;
  accountId: string;
  items: WarehouseItem[];
  autoDeliveryEnabled: boolean;
  messageTemplate: string;
};

export type SalesPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  date: string;
  type: 'sale' | 'withdrawal' | 'refund' | 'fee';
  description: string;
  amount: number;
};

export type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  triggerLabel: string;
  condition?: string;
  action: string;
  actionLabel: string;
  actionText?: string;
};

export type Plugin = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  price: number | 'free';
  installed: boolean;
  rating: number;
  reviews: number;
};

export type TopBuyer = {
  username: string;
  avatar: string;
  orders: number;
  total: number;
  lastOrder: string;
};

export const accounts: Account[] = [
  {
    id: 'acc1',
    username: 'tonminerz',
    avatar: 'T',
    balance: 4820,
    lotsCount: 12,
    online: true,
    rating: 4.9,
    sales: 347,
    verified: true,
  },
  {
    id: 'acc2',
    username: 'shop_pro',
    avatar: 'S',
    balance: 11340,
    lotsCount: 28,
    online: false,
    rating: 4.7,
    sales: 892,
    verified: true,
  },
];

export const orders: Order[] = [
  { id: 'ORD-1001', accountId: 'acc1', buyer: 'dmitry_k', buyerAvatar: 'D', lot: 'Minecraft Java Edition ключ', category: 'Игры', amount: 450, status: 'completed', createdAt: '2026-04-02T10:23:00', description: 'Ключ активации Minecraft Java Edition' },
  { id: 'ORD-1002', accountId: 'acc2', buyer: 'anna_shop', buyerAvatar: 'A', lot: '1000 подписчиков Instagram', category: 'SMM', amount: 890, status: 'paid', createdAt: '2026-04-02T09:15:00', description: 'Накрутка подписчиков Instagram' },
  { id: 'ORD-1003', accountId: 'acc1', buyer: 'maxim_99', buyerAvatar: 'M', lot: 'Steam Wallet 500₽', category: 'Игры', amount: 520, status: 'completed', createdAt: '2026-04-02T08:44:00', description: 'Пополнение Steam кошелька' },
  { id: 'ORD-1004', accountId: 'acc2', buyer: 'olga_v', buyerAvatar: 'O', lot: 'Spotify Premium 1 месяц', category: 'Музыка', amount: 199, status: 'refund', createdAt: '2026-04-01T22:30:00', description: 'Подписка Spotify Premium' },
  { id: 'ORD-1005', accountId: 'acc2', buyer: 'sergei_m', buyerAvatar: 'S', lot: 'ChatGPT Plus аккаунт', category: 'AI', amount: 1200, status: 'dispute', createdAt: '2026-04-01T20:10:00', description: 'Аккаунт ChatGPT Plus' },
  { id: 'ORD-1006', accountId: 'acc1', buyer: 'ivan_pro', buyerAvatar: 'I', lot: 'Roblox 1000 Robux', category: 'Игры', amount: 350, status: 'completed', createdAt: '2026-04-01T18:05:00', description: 'Робаксы Roblox' },
  { id: 'ORD-1007', accountId: 'acc2', buyer: 'kate_seller', buyerAvatar: 'K', lot: '500 лайков ВКонтакте', category: 'SMM', amount: 150, status: 'completed', createdAt: '2026-04-01T16:22:00', description: 'Лайки ВКонтакте' },
  { id: 'ORD-1008', accountId: 'acc1', buyer: 'peter_gamer', buyerAvatar: 'P', lot: 'CS2 Prime аккаунт', category: 'Игры', amount: 780, status: 'paid', createdAt: '2026-04-01T14:55:00', description: 'Аккаунт CS2 с Prime статусом' },
  { id: 'ORD-1009', accountId: 'acc2', buyer: 'nata_b', buyerAvatar: 'N', lot: 'Netflix Premium 1 месяц', category: 'Стриминг', amount: 599, status: 'completed', createdAt: '2026-04-01T12:40:00', description: 'Netflix Premium подписка' },
  { id: 'ORD-1010', accountId: 'acc1', buyer: 'alex_buy', buyerAvatar: 'A', lot: 'GTA V ключ Steam', category: 'Игры', amount: 650, status: 'completed', createdAt: '2026-04-01T10:15:00', description: 'Ключ GTA V для Steam' },
  { id: 'ORD-1011', accountId: 'acc2', buyer: 'roman_t', buyerAvatar: 'R', lot: 'Яндекс Плюс 3 месяца', category: 'Сервисы', amount: 449, status: 'completed', createdAt: '2026-03-31T22:10:00', description: 'Подписка Яндекс Плюс' },
  { id: 'ORD-1012', accountId: 'acc1', buyer: 'vera_shop', buyerAvatar: 'V', lot: 'Warframe платина 1000', category: 'Игры', amount: 390, status: 'paid', createdAt: '2026-03-31T20:05:00', description: 'Платина Warframe' },
];

export const chats: Chat[] = [
  {
    id: 'chat1',
    accountId: 'acc1',
    buyer: 'dmitry_k',
    buyerAvatar: 'D',
    lastMessage: 'Спасибо, всё получил!',
    lastTime: '10:23',
    unread: 0,
    orderId: 'ORD-1001',
    messages: [
      { id: 'm1', fromUser: false, text: 'Здравствуйте, когда будет выдан товар?', time: '10:15', read: true },
      { id: 'm2', fromUser: true, text: 'Добрый день! Товар уже выдан в заказе, проверьте пожалуйста.', time: '10:18', read: true },
      { id: 'm3', fromUser: false, text: 'Спасибо, всё получил!', time: '10:23', read: true },
    ],
  },
  {
    id: 'chat2',
    accountId: 'acc2',
    buyer: 'anna_shop',
    buyerAvatar: 'A',
    lastMessage: 'Когда начнётся накрутка?',
    lastTime: '09:15',
    unread: 2,
    orderId: 'ORD-1002',
    messages: [
      { id: 'm1', fromUser: false, text: 'Добрый день! Оплатила заказ, когда начнётся накрутка?', time: '09:10', read: true },
      { id: 'm2', fromUser: false, text: 'Когда начнётся накрутка?', time: '09:15', read: false },
    ],
  },
  {
    id: 'chat3',
    accountId: 'acc1',
    buyer: 'maxim_99',
    buyerAvatar: 'M',
    lastMessage: 'Привет, есть ли скидки при покупке нескольких ключей?',
    lastTime: 'Вчера',
    unread: 1,
    messages: [
      { id: 'm1', fromUser: false, text: 'Привет, есть ли скидки при покупке нескольких ключей?', time: 'Вчера', read: false },
    ],
  },
  {
    id: 'chat4',
    accountId: 'acc2',
    buyer: 'peter_gamer',
    buyerAvatar: 'P',
    lastMessage: 'Аккаунт работает, спасибо!',
    lastTime: 'Вчера',
    unread: 0,
    orderId: 'ORD-1008',
    messages: [
      { id: 'm1', fromUser: false, text: 'Получил аккаунт, проверяю...', time: 'Вчера 14:50', read: true },
      { id: 'm2', fromUser: true, text: 'Хорошо, если будут вопросы — пишите!', time: 'Вчера 14:52', read: true },
      { id: 'm3', fromUser: false, text: 'Аккаунт работает, спасибо!', time: 'Вчера 15:10', read: true },
    ],
  },
  {
    id: 'chat5',
    accountId: 'acc2',
    buyer: 'sergei_m',
    buyerAvatar: 'S',
    lastMessage: 'Открываю спор, аккаунт не работает',
    lastTime: 'Вчера',
    unread: 3,
    orderId: 'ORD-1005',
    messages: [
      { id: 'm1', fromUser: false, text: 'Аккаунт который вы продали не работает!', time: 'Вчера 20:00', read: true },
      { id: 'm2', fromUser: true, text: 'Извините за неудобства, уточните проблему пожалуйста.', time: 'Вчера 20:05', read: true },
      { id: 'm3', fromUser: false, text: 'Пароль не подходит уже несколько раз пробовал', time: 'Вчера 20:08', read: false },
      { id: 'm4', fromUser: false, text: 'Открываю спор, аккаунт не работает', time: 'Вчера 20:10', read: false },
    ],
  },
];

export const lots: Lot[] = [
  { id: 'lot1', accountId: 'acc1', title: 'Minecraft Java Edition ключ', category: 'Игры', categoryIcon: '🎮', price: 450, status: 'active', salesMonth: 23, description: 'Лицензионный ключ Minecraft Java Edition', autoDelivery: 'KEY-{random}' },
  { id: 'lot2', accountId: 'acc1', title: 'Steam Wallet 500₽', category: 'Игры', categoryIcon: '🎮', price: 520, status: 'active', salesMonth: 18, description: 'Пополнение кошелька Steam на 500 рублей', autoDelivery: '' },
  { id: 'lot3', accountId: 'acc1', title: 'Roblox 1000 Robux', category: 'Игры', categoryIcon: '🎮', price: 350, status: 'active', salesMonth: 31, description: '1000 Robux для игры Roblox', autoDelivery: '' },
  { id: 'lot4', accountId: 'acc1', title: 'CS2 Prime аккаунт', category: 'Игры', categoryIcon: '🎮', price: 780, status: 'inactive', salesMonth: 5, description: 'Аккаунт CS2 с Prime статусом', autoDelivery: '' },
  { id: 'lot5', accountId: 'acc2', title: '1000 подписчиков Instagram', category: 'SMM', categoryIcon: '📱', price: 890, status: 'active', salesMonth: 45, description: '1000 живых подписчиков Instagram', autoDelivery: '' },
  { id: 'lot6', accountId: 'acc2', title: '500 лайков ВКонтакте', category: 'SMM', categoryIcon: '📱', price: 150, status: 'active', salesMonth: 67, description: '500 лайков на пост ВКонтакте', autoDelivery: '' },
  { id: 'lot7', accountId: 'acc2', title: 'Spotify Premium 1 месяц', category: 'Музыка', categoryIcon: '🎵', price: 199, status: 'active', salesMonth: 89, description: 'Месяц Spotify Premium', autoDelivery: 'login:password' },
  { id: 'lot8', accountId: 'acc2', title: 'Netflix Premium 1 месяц', category: 'Стриминг', categoryIcon: '🎬', price: 599, status: 'active', salesMonth: 34, description: 'Месяц Netflix Premium', autoDelivery: 'login:password' },
  { id: 'lot9', accountId: 'acc2', title: 'ChatGPT Plus аккаунт', category: 'AI', categoryIcon: '🤖', price: 1200, status: 'active', salesMonth: 12, description: 'Аккаунт ChatGPT Plus', autoDelivery: '' },
  { id: 'lot10', accountId: 'acc2', title: 'Яндекс Плюс 3 месяца', category: 'Сервисы', categoryIcon: '⭐', price: 449, status: 'active', salesMonth: 28, description: '3 месяца Яндекс Плюс подписки', autoDelivery: '' },
  { id: 'lot11', accountId: 'acc2', title: 'GTA V ключ Steam', category: 'Игры', categoryIcon: '🎮', price: 650, status: 'active', salesMonth: 19, description: 'Ключ GTA V для Steam', autoDelivery: '' },
  { id: 'lot12', accountId: 'acc2', title: 'Warframe платина 1000', category: 'Игры', categoryIcon: '🎮', price: 390, status: 'inactive', salesMonth: 8, description: '1000 платины в Warframe', autoDelivery: '' },
];

export const warehouseLots: WarehouseLot[] = [
  {
    lotId: 'lot1',
    lotTitle: 'Minecraft Java Edition ключ',
    accountId: 'acc1',
    autoDeliveryEnabled: true,
    messageTemplate: 'Ваш товар: {товар}\nСпасибо за покупку, {имя_покупателя}!\nЗаказ #{номер_заказа}',
    items: [
      { id: 'wi1', value: 'MCRAFT-JAVA-ABCD-1234', status: 'available' },
      { id: 'wi2', value: 'MCRAFT-JAVA-EFGH-5678', status: 'available' },
      { id: 'wi3', value: 'MCRAFT-JAVA-IJKL-9012', status: 'available' },
      { id: 'wi4', value: 'MCRAFT-JAVA-MNOP-3456', status: 'delivered', deliveredAt: '2026-04-02T10:23:00' },
      { id: 'wi5', value: 'MCRAFT-JAVA-QRST-7890', status: 'delivered', deliveredAt: '2026-04-01T15:10:00' },
    ],
  },
  {
    lotId: 'lot7',
    lotTitle: 'Spotify Premium 1 месяц',
    accountId: 'acc2',
    autoDeliveryEnabled: true,
    messageTemplate: 'Ваш Spotify аккаунт: {товар}\nЗаказ #{номер_заказа}',
    items: [
      { id: 'si1', value: 'spotify_user1@mail.com:Pass123', status: 'available' },
      { id: 'si2', value: 'spotify_user2@mail.com:Pass456', status: 'available' },
      { id: 'si3', value: 'spotify_user3@mail.com:Pass789', status: 'delivered', deliveredAt: '2026-04-01T22:30:00' },
    ],
  },
  {
    lotId: 'lot8',
    lotTitle: 'Netflix Premium 1 месяц',
    accountId: 'acc2',
    autoDeliveryEnabled: true,
    messageTemplate: 'Netflix: {товар}\nПриятного просмотра, {имя_покупателя}!',
    items: [
      { id: 'ni1', value: 'netflix1@example.com:NetPass1', status: 'available' },
      { id: 'ni2', value: 'netflix2@example.com:NetPass2', status: 'delivered', deliveredAt: '2026-04-01T12:40:00' },
    ],
  },
];

function generateSalesData(): SalesPoint[] {
  const data: SalesPoint[] = [];
  const now = new Date('2026-04-02');
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const month = d.getMonth();
    const base = 3000 + Math.sin(i / 10) * 1000;
    const revenue = Math.round(base + Math.random() * 2000);
    const ordersCount = Math.round(revenue / 400 + Math.random() * 5);
    data.push({
      date: d.toISOString().slice(0, 10),
      revenue,
      orders: ordersCount,
    });
  }
  return data;
}

export const salesData: SalesPoint[] = generateSalesData();

export const transactions: Transaction[] = [
  { id: 'tx1', accountId: 'acc1', date: '2026-04-02T10:23:00', type: 'sale', description: 'Продажа: Minecraft Java Edition ключ', amount: 450 },
  { id: 'tx2', accountId: 'acc2', date: '2026-04-02T09:15:00', type: 'sale', description: 'Продажа: 1000 подписчиков Instagram', amount: 890 },
  { id: 'tx3', accountId: 'acc1', date: '2026-04-02T08:44:00', type: 'sale', description: 'Продажа: Steam Wallet 500₽', amount: 520 },
  { id: 'tx4', accountId: 'acc2', date: '2026-04-01T22:30:00', type: 'refund', description: 'Возврат: Spotify Premium 1 месяц', amount: -199 },
  { id: 'tx5', accountId: 'acc2', date: '2026-04-01T20:10:00', type: 'fee', description: 'Комиссия FunPay', amount: -120 },
  { id: 'tx6', accountId: 'acc1', date: '2026-04-01T18:05:00', type: 'sale', description: 'Продажа: Roblox 1000 Robux', amount: 350 },
  { id: 'tx7', accountId: 'acc2', date: '2026-04-01T16:22:00', type: 'sale', description: 'Продажа: 500 лайков ВКонтакте', amount: 150 },
  { id: 'tx8', accountId: 'acc2', date: '2026-04-01T14:55:00', type: 'withdrawal', description: 'Вывод на карту **** 4521', amount: -5000 },
  { id: 'tx9', accountId: 'acc2', date: '2026-04-01T12:40:00', type: 'sale', description: 'Продажа: Netflix Premium 1 месяц', amount: 599 },
  { id: 'tx10', accountId: 'acc1', date: '2026-04-01T10:15:00', type: 'sale', description: 'Продажа: GTA V ключ Steam', amount: 650 },
  { id: 'tx11', accountId: 'acc2', date: '2026-03-31T22:10:00', type: 'sale', description: 'Продажа: Яндекс Плюс 3 месяца', amount: 449 },
  { id: 'tx12', accountId: 'acc1', date: '2026-03-31T20:05:00', type: 'fee', description: 'Комиссия FunPay', amount: -65 },
  { id: 'tx13', accountId: 'acc2', date: '2026-03-30T15:00:00', type: 'withdrawal', description: 'Вывод на карту **** 4521', amount: -3000 },
  { id: 'tx14', accountId: 'acc1', date: '2026-03-30T12:00:00', type: 'sale', description: 'Продажа: CS2 Prime аккаунт', amount: 780 },
  { id: 'tx15', accountId: 'acc2', date: '2026-03-29T18:00:00', type: 'sale', description: 'Продажа: ChatGPT Plus аккаунт', amount: 1200 },
];

export const automationRules: AutomationRule[] = [
  {
    id: 'rule1',
    name: 'Приветствие новому покупателю',
    enabled: true,
    trigger: 'new_message_first',
    triggerLabel: 'Покупатель написал впервые',
    action: 'send_message',
    actionLabel: 'Отправить сообщение',
    actionText: 'Здравствуйте! Спасибо за обращение. Я отвечу вам в ближайшее время.',
  },
  {
    id: 'rule2',
    name: 'Автовыдача товара',
    enabled: true,
    trigger: 'order_paid',
    triggerLabel: 'Новый оплаченный заказ',
    action: 'deliver_item',
    actionLabel: 'Выдать товар автоматически',
  },
  {
    id: 'rule3',
    name: 'Уведомление о малом остатке',
    enabled: false,
    trigger: 'low_stock',
    triggerLabel: 'Остаток товара < 5',
    condition: 'Количество товаров на складе меньше 5',
    action: 'notify_telegram',
    actionLabel: 'Уведомить в Telegram',
    actionText: '⚠️ Внимание! Остаток товара заканчивается.',
  },
  {
    id: 'rule4',
    name: 'Благодарность после заказа',
    enabled: true,
    trigger: 'order_completed',
    triggerLabel: 'Заказ выполнен',
    action: 'send_message',
    actionLabel: 'Отправить сообщение',
    actionText: 'Спасибо за покупку! Буду рад видеть вас снова. Оставьте отзыв, пожалуйста!',
  },
];

export const plugins: Plugin[] = [
  {
    id: 'plug1',
    name: 'AutoDeliver Pro',
    description: 'Автоматическая выдача товаров сразу после оплаты. Поддержка ключей, аккаунтов и любых цифровых товаров.',
    icon: '⚡',
    category: 'Автоматизация',
    price: 'free',
    installed: true,
    rating: 4.8,
    reviews: 234,
  },
  {
    id: 'plug2',
    name: 'Telegram Notify',
    description: 'Мгновенные уведомления в Telegram о новых заказах, сообщениях и важных событиях платформы.',
    icon: '📱',
    category: 'Интеграции',
    price: 'free',
    installed: true,
    rating: 4.9,
    reviews: 567,
  },
  {
    id: 'plug3',
    name: 'AI Responder',
    description: 'Искусственный интеллект отвечает на вопросы покупателей 24/7. Обучается на ваших товарах и FAQ.',
    icon: '🤖',
    category: 'Автоматизация',
    price: 299,
    installed: false,
    rating: 4.6,
    reviews: 89,
  },
  {
    id: 'plug4',
    name: 'Game Keys Manager',
    description: 'Специализированный менеджер игровых ключей с валидацией, категоризацией и массовым импортом.',
    icon: '🎮',
    category: 'Игровые товары',
    price: 199,
    installed: false,
    rating: 4.7,
    reviews: 156,
  },
  {
    id: 'plug5',
    name: 'SMM Tools',
    description: 'Инструменты для продавцов SMM услуг: трекинг выполнения заданий, автоматические отчёты.',
    icon: '📊',
    category: 'SMM',
    price: 399,
    installed: false,
    rating: 4.4,
    reviews: 43,
  },
  {
    id: 'plug6',
    name: 'Finance Tracker',
    description: 'Расширенная аналитика финансов: P&L отчёты, налоговые расчёты, экспорт для бухгалтерии.',
    icon: '💰',
    category: 'Финансы',
    price: 499,
    installed: false,
    rating: 4.5,
    reviews: 78,
  },
  {
    id: 'plug7',
    name: 'Promo Boost',
    description: 'Автоматическое поднятие лотов по расписанию. Умный алгоритм выбирает лучшее время для поднятия.',
    icon: '🚀',
    category: 'Автоматизация',
    price: 249,
    installed: false,
    rating: 4.3,
    reviews: 112,
  },
  {
    id: 'plug8',
    name: 'Review Manager',
    description: 'Управление отзывами: мониторинг, автоответы, шаблоны для работы с негативными отзывами.',
    icon: '⭐',
    category: 'Автоматизация',
    price: 'free',
    installed: false,
    rating: 4.2,
    reviews: 67,
  },
];

export const topBuyers: TopBuyer[] = [
  { username: 'maxim_99', avatar: 'M', orders: 24, total: 12480, lastOrder: '2026-04-02' },
  { username: 'anna_shop', avatar: 'A', orders: 18, total: 16020, lastOrder: '2026-04-02' },
  { username: 'peter_gamer', avatar: 'P', orders: 15, total: 11700, lastOrder: '2026-04-01' },
  { username: 'kate_seller', avatar: 'K', orders: 12, total: 1800, lastOrder: '2026-04-01' },
  { username: 'ivan_pro', avatar: 'I', orders: 10, total: 3500, lastOrder: '2026-04-01' },
  { username: 'nata_b', avatar: 'N', orders: 9, total: 5391, lastOrder: '2026-04-01' },
  { username: 'roman_t', avatar: 'R', orders: 7, total: 3143, lastOrder: '2026-03-31' },
  { username: 'vera_shop', avatar: 'V', orders: 6, total: 2340, lastOrder: '2026-03-31' },
];
