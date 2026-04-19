'use client';

import { useState } from 'react';
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
      { text: 'Автоподнятие лотов' },
      { text: 'Автовыдача товаров' },
      { text: 'Аналитика 7 дней' },
      { text: '2 правила автоматизации' },
      { text: 'Плагины', off: true },
      { text: 'AI автоответы', off: true },
      { text: 'Приоритетная поддержка', off: true },
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
      { text: 'Автоподнятие лотов' },
      { text: 'Автовыдача товаров' },
      { text: 'Аналитика 30 дней + CSV' },
      { text: '10 правил автоматизации' },
      { text: 'Базовые плагины (20+)' },
      { text: 'AI ответы 500 msg/мес' },
      { text: 'Приоритетная поддержка' },
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
      { text: 'Безлимит автоматизации' },
      { text: 'VIP плагины' },
      { text: 'AI ответы без лимита' },
      { text: 'Персональный менеджер' },
      { text: 'API доступ' },
    ],
    variant: 'light',
    cta: 'Перейти на Ultra',
  },
];

export default function LandingPricing() {
  const [mode, setMode] = useState<'m' | 'y'>('m');

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

        <div className="plans">
          {plans.map((plan) => (
            <div key={plan.title} className={`plan ${plan.variant === 'pro' ? 'pro' : ''}`}>
              {(() => {
                const oldPrice = mode === 'm' ? plan.oldMonthly : Math.round(plan.oldMonthly * 0.8);
                const currentPrice = mode === 'm' ? plan.monthly : plan.yearly;

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
                      href="/auth/register"
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
