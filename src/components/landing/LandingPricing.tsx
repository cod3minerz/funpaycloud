'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import Button from './Button';

type Plan = {
  eyebrow: string;
  title: string;
  oldMonthly: number;
  monthly: number;
  yearly: number;
  items: Array<{ text: string; off?: boolean }>;
  variant: 'light' | 'pro';
  cta: string;
};

const plans: Plan[] = [
  {
    eyebrow: 'Для старта',
    title: 'Lite',
    oldMonthly: 299,
    monthly: 149,
    yearly: 119,
    items: [
      { text: '1 аккаунт FunPay' },
      { text: 'Автовыдача товаров' },
      { text: 'Аналитика 7 дней' },
      { text: 'Конструктор сценариев (1 сцен.)' },
      { text: 'Плагины', off: true },
      { text: 'AI автоответы', off: true },
      { text: 'AI-узлы в конструкторе', off: true },
    ],
    variant: 'light',
    cta: 'Выбрать Lite',
  },
  {
    eyebrow: 'Популярный',
    title: 'Pro',
    oldMonthly: 599,
    monthly: 299,
    yearly: 239,
    items: [
      { text: '5 аккаунтов FunPay' },
      { text: 'Автовыдача товаров' },
      { text: 'Аналитика 30 дней + CSV' },
      { text: 'Конструктор (5 сценариев)' },
      { text: 'AI-узлы в конструкторе' },
      { text: 'Базовые плагины (20+)' },
      { text: 'AI ответы 500 msg/мес' },
      { text: 'Приоритет @fpcloud_support' },
    ],
    variant: 'pro',
    cta: 'Перейти на Pro',
  },
  {
    eyebrow: 'Для масштаба',
    title: 'Ultra',
    oldMonthly: 1499,
    monthly: 599,
    yearly: 479,
    items: [
      { text: 'Безлимит аккаунтов' },
      { text: 'Всё из Pro' },
      { text: 'Аналитика без ограничений' },
      { text: 'Конструктор (20 сценариев)' },
      { text: 'AI-узлы без ограничений' },
      { text: 'VIP плагины' },
      { text: 'AI ответы без лимита' },
      { text: 'Персональная поддержка @fpcloud_support' },
    ],
    variant: 'light',
    cta: 'Перейти на Ultra',
  },
];

export default function LandingPricing() {
  const [mode, setMode] = useState<'m' | 'y'>('m');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi.me()
      .then(() => {
        if (!cancelled) setLoggedIn(true);
      })
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="pricing">
      <div className="wrap">
        <div className="sec-eyebrow">Прозрачные тарифы</div>
        <h2 className="sec-title">Только доступ к системе — без процентов с продаж</h2>
        <p className="sec-sub">Фиксированная оплата за возможности. Зарабатываешь больше — платишь столько же.</p>

        <div className="price-toggle" role="tablist" aria-label="Период оплаты">
          <button className={mode === 'm' ? 'on' : ''} onClick={() => setMode('m')}>
            Ежемесячно
          </button>
          <button className={mode === 'y' ? 'on' : ''} onClick={() => setMode('y')}>
            Ежегодно <span className="disc">−20%</span>
          </button>
        </div>

        <div className="pricing-one-order">
          <span className="pricing-one-order-icon">💡</span>
          <span>Один пропущенный заказ в среднем стоит <strong>~400 ₽</strong>. Тариф Lite — <strong>149 ₽/мес</strong>. Нужна одна продажа, чтобы сервис окупился. Остальное — чистая прибыль.</span>
        </div>

        <div className="plans">
          {plans.map((plan) => (
            <div key={plan.title} className={`plan ${plan.variant === 'pro' ? 'pro' : ''}`}>
              {(() => {
                const oldPrice = mode === 'm' ? plan.oldMonthly : Math.round(plan.oldMonthly * 0.8);
                const currentPrice = mode === 'm' ? plan.monthly : plan.yearly;
                const planId = plan.title.toLowerCase();
                const period = mode === 'y' ? 'year' : 'month';
                const ctaHref = loggedIn
                  ? `/platform/subscription?plan=${planId}&period=${period}`
                  : `/auth/register?plan=${planId}&period=${period}`;

                return (
                  <>
                    {plan.variant === 'pro' ? <div className="badge-best">Лучший выбор</div> : null}
                    <div>
                      <span className="plan-eyebrow">{plan.eyebrow}</span>
                      <h3 className="plan-title">{plan.title}</h3>
                    </div>

                    <div className="price-old">
                      {oldPrice.toLocaleString('ru-RU')}₽
                    </div>
                    <div className="price-val">
                      <span className="amt">{currentPrice.toLocaleString('ru-RU')}</span>₽ <span className="per">/ мес</span>
                    </div>

                    <ul>
                      {plan.items.map((item) => (
                        <li key={item.text} className={item.off ? 'off' : ''}>
                          {item.text}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.variant === 'pro' ? 'accent' : 'outline'}
                      size="lg"
                      href={ctaHref}
                      className="plan-cta"
                    >
                      {plan.cta}
                    </Button>
                  </>
                );
              })()}
            </div>
          ))}
        </div>

        <div className="trust-row">
          <span>Без скрытых комиссий</span>
          <span>Оплата только за доступ</span>
          <span>Подключение за 10 минут</span>
          <span>Отмена в любой момент</span>
        </div>
      </div>
    </section>
  );
}
