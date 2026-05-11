'use client';

import { useState } from 'react';

function fmt(n: number) {
  return Math.round(n).toLocaleString('ru-RU');
}

const LITE_PRICE = 149;

export default function LandingCalculator() {
  const [order, setOrder] = useState(400);
  const [perDay, setPerDay] = useState(8);
  const [offline, setOffline] = useState(10);

  const monthlyLoss = order * perDay * (offline / 24) * 30;
  const yearlyLoss = monthlyLoss * 12;
  const daysToROI = Math.ceil(LITE_PRICE / (monthlyLoss / 30));

  return (
    <section className="landing-calc-sec">
      <div className="wrap">
        <div className="landing-calc-eyebrow">Калькулятор потерь</div>
        <h2 className="landing-calc-title">Сколько вы теряете прямо сейчас?</h2>
        <p className="landing-calc-sub">Введите параметры своего магазина — узнайте реальную стоимость ручного управления.</p>

        <div className="landing-calc-grid">
          <div className="landing-calc-inputs">

            <div className="landing-calc-field">
              <div className="landing-calc-field-header">
                <label>Средний чек</label>
                <span className="landing-calc-val">{fmt(order)} ₽</span>
              </div>
              <input
                type="range" min={100} max={3000} step={50}
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
                className="landing-calc-range"
                style={{ '--pct': `${(order - 100) / 2900 * 100}%` } as React.CSSProperties}
              />
              <div className="landing-calc-range-labels"><span>100 ₽</span><span>3 000 ₽</span></div>
            </div>

            <div className="landing-calc-field">
              <div className="landing-calc-field-header">
                <label>Заказов в день</label>
                <span className="landing-calc-val">{perDay}</span>
              </div>
              <input
                type="range" min={1} max={50} step={1}
                value={perDay}
                onChange={e => setPerDay(Number(e.target.value))}
                className="landing-calc-range"
                style={{ '--pct': `${(perDay - 1) / 49 * 100}%` } as React.CSSProperties}
              />
              <div className="landing-calc-range-labels"><span>1</span><span>50</span></div>
            </div>

            <div className="landing-calc-field">
              <div className="landing-calc-field-header">
                <label>Часов офлайн в сутки</label>
                <span className="landing-calc-val">{offline} ч</span>
              </div>
              <input
                type="range" min={1} max={16} step={1}
                value={offline}
                onChange={e => setOffline(Number(e.target.value))}
                className="landing-calc-range"
                style={{ '--pct': `${(offline - 1) / 15 * 100}%` } as React.CSSProperties}
              />
              <div className="landing-calc-range-labels"><span>1 ч</span><span>16 ч</span></div>
            </div>

          </div>

          <div className="landing-calc-result">
            <div className="landing-calc-result-main">
              <span className="landing-calc-result-label">Теряете в месяц</span>
              <span className="landing-calc-result-num">~{fmt(monthlyLoss)} ₽</span>
              <span className="landing-calc-result-year">~{fmt(yearlyLoss)} ₽ в год</span>
            </div>

            <div className="landing-calc-divider" />

            <div className="landing-calc-roi">
              <div className="landing-calc-roi-row">
                <span>Тариф Lite</span>
                <strong>{LITE_PRICE} ₽/мес</strong>
              </div>
              <div className="landing-calc-roi-row landing-calc-roi-row--accent">
                <span>Окупаемость</span>
                <strong>{daysToROI <= 1 ? '&lt; 1 дня' : `${daysToROI} ${daysToROI < 5 ? 'дня' : 'дней'}`}</strong>
              </div>
            </div>

            <a href="/auth/register" className="landing-calc-btn">
              Попробовать бесплатно 7 дней →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
