export type SubscriptionFeature = {
  text: string;
  available: boolean;
};

export type SubscriptionPlan = {
  id: 'start' | 'pro' | 'team';
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  color: string;
  border: string;
  bg: string;
  glow: string;
  highlight: boolean;
  cta: string;
  ctaStyle: 'border' | 'gradient' | 'border-blue';
  features: SubscriptionFeature[];
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'start',
    name: 'Старт',
    tagline: 'Для первого шага',
    priceMonthly: 199,
    priceYearly: 159,
    color: 'text-blue-400',
    border: 'rgba(59,130,246,0.2)',
    bg: 'rgba(59,130,246,0.05)',
    glow: 'rgba(59,130,246,0.1)',
    highlight: false,
    cta: 'Начать бесплатно',
    ctaStyle: 'border',
    features: [
      { text: '1 аккаунт FunPay', available: true },
      { text: 'Автовыдача товаров', available: true },
      { text: 'Автоподнятие лотов', available: true },
      { text: 'Базовые шаблоны ответов', available: true },
      { text: 'Облако 24/7', available: true },
      { text: 'IPv4 защита', available: true },
      { text: 'Telegram-уведомления', available: true },
      { text: 'AI-автоответчик', available: false },
      { text: 'Аналитика и отчёты', available: false },
      { text: 'Мультиаккаунт', available: false },
      { text: 'Приоритетная поддержка', available: false },
    ],
  },
  {
    id: 'pro',
    name: 'Профи',
    tagline: 'Лучший выбор',
    priceMonthly: 349,
    priceYearly: 279,
    color: 'text-white',
    border: 'rgba(96,165,250,0.4)',
    bg: 'transparent',
    glow: 'rgba(96,165,250,0.2)',
    highlight: true,
    cta: 'Выбрать Профи',
    ctaStyle: 'gradient',
    features: [
      { text: '3 аккаунта FunPay', available: true },
      { text: 'Автовыдача товаров', available: true },
      { text: 'Умное автоподнятие', available: true },
      { text: 'AI-автоответчик (GPT-4o)', available: true },
      { text: 'Облако 24/7', available: true },
      { text: 'IPv4 защита', available: true },
      { text: 'Telegram-управление', available: true },
      { text: 'Полная аналитика', available: true },
      { text: 'Плагины (30+)', available: true },
      { text: 'Экспорт отчётов', available: true },
      { text: 'Приоритетная поддержка', available: false },
    ],
  },
  {
    id: 'team',
    name: 'Командный',
    tagline: 'Для масштаба',
    priceMonthly: 499,
    priceYearly: 399,
    color: 'text-blue-300',
    border: 'rgba(37,99,235,0.25)',
    bg: 'rgba(37,99,235,0.05)',
    glow: 'rgba(37,99,235,0.12)',
    highlight: false,
    cta: 'Масштабировать',
    ctaStyle: 'border-blue',
    features: [
      { text: 'До 10 аккаунтов FunPay', available: true },
      { text: 'Автовыдача товаров', available: true },
      { text: 'Умное автоподнятие', available: true },
      { text: 'AI-автоответчик (GPT-4o)', available: true },
      { text: 'Облако 24/7', available: true },
      { text: 'IPv4 защита', available: true },
      { text: 'Telegram-управление', available: true },
      { text: 'Расширенная аналитика', available: true },
      { text: 'Все плагины + VIP', available: true },
      { text: 'Мультиаккаунт-дашборд', available: true },
      { text: 'Приоритетная поддержка 24/7', available: true },
    ],
  },
];

export const DEFAULT_PLAN_ID: SubscriptionPlan['id'] = 'pro';
export const PLAN_STORAGE_KEY = 'pf-current-plan';
export const PLAN_EVENT_NAME = 'pf-plan-changed';

export function readCurrentPlanId() {
  if (typeof window === 'undefined') return DEFAULT_PLAN_ID;
  const saved = window.localStorage.getItem(PLAN_STORAGE_KEY) as SubscriptionPlan['id'] | null;
  return saved ?? DEFAULT_PLAN_ID;
}

export function writeCurrentPlanId(planId: SubscriptionPlan['id']) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PLAN_STORAGE_KEY, planId);
  window.dispatchEvent(new CustomEvent(PLAN_EVENT_NAME, { detail: planId }));
}

