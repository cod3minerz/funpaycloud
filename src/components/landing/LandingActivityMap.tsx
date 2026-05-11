'use client';

import { useEffect, useRef, useState } from 'react';

const ACTIVITY = [62, 48, 35, 22, 15, 12, 18, 28, 42, 58, 72, 82, 86, 78, 74, 76, 80, 88, 94, 98, 100, 96, 88, 75];
const OFFLINE_HOURS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);

const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;

export default function LandingActivityMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const peak = ACTIVITY.indexOf(100);
  const nightTotal = [22, 23, 0, 1, 2, 3, 4, 5].reduce((s, h) => s + ACTIVITY[h], 0);
  const allTotal = ACTIVITY.reduce((s, v) => s + v, 0);
  const nightPct = Math.round(nightTotal / allTotal * 100);

  return (
    <section className="landing-map-sec" ref={ref}>
      <div className="wrap">
        <div className="landing-map-head">
          <div>
            <div className="landing-map-eyebrow">Активность покупателей</div>
            <h2 className="landing-map-title">Деньги приходят ночью.<br />Ты в это время спишь.</h2>
            <p className="landing-map-sub">
              Каждый <strong>{nightPct}%</strong> заказов FunPay приходится на ночные часы,
              когда большинство продавцов офлайн.
            </p>
          </div>
          <div className="landing-map-stats">
            <div className="landing-map-stat">
              <span className="landing-map-stat-num">{nightPct}%</span>
              <span className="landing-map-stat-label">заказов ночью</span>
            </div>
            <div className="landing-map-stat">
              <span className="landing-map-stat-num">{fmt(peak)}</span>
              <span className="landing-map-stat-label">пик активности</span>
            </div>
            <div className="landing-map-stat">
              <span className="landing-map-stat-num">9 ч</span>
              <span className="landing-map-stat-label">типичный офлайн</span>
            </div>
          </div>
        </div>

        <div className="landing-map-chart">
          <div className="landing-map-offline-zone" />
          <div className="landing-map-bars">
            {ACTIVITY.map((val, h) => {
              const isOffline = OFFLINE_HOURS.has(h);
              const isPeak = h === peak || h === peak - 1 || h === peak + 1;
              return (
                <div key={h} className="landing-map-bar-col">
                  <div className="landing-map-bar-wrap">
                    {isPeak && !isOffline && (
                      <div className="landing-map-peak-label">пик</div>
                    )}
                    <div
                      className={`landing-map-bar ${isOffline ? 'offline' : ''} ${isPeak ? 'peak' : ''}`}
                      style={{ height: visible ? `${val}%` : '0%', transitionDelay: `${h * 25}ms` }}
                    />
                  </div>
                  <span className="landing-map-hour">{h % 3 === 0 ? fmt(h) : ''}</span>
                </div>
              );
            })}
          </div>
          <div className="landing-map-legend">
            <span className="landing-map-legend-item landing-map-legend-item--offline">
              <i /> Типичное время офлайн
            </span>
            <span className="landing-map-legend-item landing-map-legend-item--active">
              <i /> Активность покупателей
            </span>
            <span className="landing-map-legend-item landing-map-legend-item--peak">
              <i /> Пик
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
