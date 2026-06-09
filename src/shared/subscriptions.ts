export type SubscriptionFeature = {
  text: string;
  available: boolean;
};

// ─── Plan hard limits (single source of truth) ────────────────────────────────
export const PLAN_LIMITS = {
  trial: {
    accounts: 1,
    analytics_days: 7,
    scenarios: 1,
    nodes_per_scenario: 50,
    ai_messages_per_month: 0,
    ai_nodes: false,
  },
  lite: {
    accounts: 1,
    analytics_days: 7,
    scenarios: 1,
    nodes_per_scenario: 100,
    ai_messages_per_month: 0,
    ai_nodes: false,
  },
  pro: {
    accounts: 5,
    analytics_days: 30,
    scenarios: 5,
    nodes_per_scenario: 300,
    ai_messages_per_month: 500,
    ai_nodes: true,
  },
  ultra: {
    accounts: Infinity,
    analytics_days: Infinity,
    scenarios: 20,
    nodes_per_scenario: Infinity,
    ai_messages_per_month: Infinity,
    ai_nodes: true,
  },
} as const;

export type CanonicalPlanId = 'trial' | 'lite' | 'pro' | 'ultra';
export type LegacyPlanId = 'free' | 'start' | 'team';
export type PaidPlanId = 'lite' | 'pro' | 'ultra';

export type SubscriptionPlan = {
  id: PaidPlanId;
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

export const PLAN_LABELS: Record<CanonicalPlanId, string> = {
  trial: 'Триал',
  lite: 'Lite',
  pro: 'Pro',
  ultra: 'Ultra',
};

export function normalizePlanId(plan?: string | null): CanonicalPlanId {
  const value = String(plan ?? '').trim().toLowerCase();

  switch (value) {
    case 'trial':
      return 'trial';
    case 'lite':
      return 'lite';
    case 'pro':
      return 'pro';
    case 'ultra':
      return 'ultra';
    case 'free':
      return 'trial';
    case 'start':
      return 'lite';
    case 'team':
      return 'ultra';
    default:
      return 'pro';
  }
}

export function getPlanLabel(plan?: string | null): string {
  return PLAN_LABELS[normalizePlanId(plan)];
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'lite',
    name: 'Lite',
    tagline: 'Для старта',
    priceMonthly: 149,
    priceYearly: 119,
    color: 'text-blue-300',
    border: 'rgba(110,139,255,0.22)',
    bg: 'rgba(110,139,255,0.06)',
    glow: 'rgba(110,139,255,0.1)',
    highlight: false,
    cta: 'Выбрать Lite',
    ctaStyle: 'border',
    features: [
      { text: '1 аккаунт FunPay', available: true },
      { text: 'Автоподнятие лотов', available: true },
      { text: 'Автовыдача товаров', available: true },
      { text: 'Аналитика 7 дней', available: true },
      { text: 'Конструктор сценариев (1 сцен.)', available: true },
      { text: 'Плагины', available: false },
      { text: 'AI автоответы', available: false },
      { text: 'AI-узлы в конструкторе', available: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Лучший выбор',
    priceMonthly: 299,
    priceYearly: 239,
    color: 'text-white',
    border: 'rgba(110,139,255,0.36)',
    bg: 'transparent',
    glow: 'rgba(110,139,255,0.22)',
    highlight: true,
    cta: 'Перейти на Pro',
    ctaStyle: 'gradient',
    features: [
      { text: '5 аккаунтов FunPay', available: true },
      { text: 'Автоподнятие лотов', available: true },
      { text: 'Автовыдача товаров', available: true },
      { text: 'Аналитика 30 дней + CSV', available: true },
      { text: 'Конструктор (5 сценариев)', available: true },
      { text: 'AI-узлы в конструкторе', available: true },
      { text: 'Базовые плагины (20+)', available: true },
      { text: 'AI ответы 500 msg/мес', available: true },
      { text: 'Приоритет @fpcloud_support', available: true },
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    tagline: 'Для масштаба',
    priceMonthly: 599,
    priceYearly: 479,
    color: 'text-purple-300',
    border: 'rgba(167,139,250,0.3)',
    bg: 'rgba(124,58,237,0.08)',
    glow: 'rgba(124,58,237,0.14)',
    highlight: false,
    cta: 'Перейти на Ultra',
    ctaStyle: 'border-blue',
    features: [
      { text: 'Безлимит аккаунтов', available: true },
      { text: 'Всё из Pro', available: true },
      { text: 'Аналитика без ограничений', available: true },
      { text: 'Конструктор (20 сценариев)', available: true },
      { text: 'AI-узлы без ограничений', available: true },
      { text: 'VIP плагины', available: true },
      { text: 'AI ответы без лимита', available: true },
      { text: 'Персональная поддержка @fpcloud_support', available: true },
    ],
  },
];

export const DEFAULT_PLAN_ID: PaidPlanId = 'pro';
export const PLAN_STORAGE_KEY = 'pf-current-plan';
export const PLAN_EVENT_NAME = 'pf-plan-changed';

export function readCurrentPlanId(): PaidPlanId {
  if (typeof window === 'undefined') return DEFAULT_PLAN_ID;
  const saved = window.localStorage.getItem(PLAN_STORAGE_KEY);
  const normalized = normalizePlanId(saved);
  if (normalized === 'trial') return 'lite';
  return normalized;
}

export function writeCurrentPlanId(planId: PaidPlanId) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PLAN_STORAGE_KEY, planId);
  window.dispatchEvent(new CustomEvent(PLAN_EVENT_NAME, { detail: planId }));
}
