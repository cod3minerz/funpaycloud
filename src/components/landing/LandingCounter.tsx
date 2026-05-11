'use client';

import { useEffect, useState } from 'react';

export default function LandingCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    setCount(Math.floor(600 + h * 38 + Math.random() * 80));
    const t = setInterval(() => {
      setCount(p => p + Math.floor(Math.random() * 3) + 1);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landing-counter">
      <div className="landing-counter-glow" />
      <div className="wrap landing-counter-inner">
        <div className="landing-counter-pulse-dot" />
        <span className="landing-counter-pre">Продавцы без автоматизации уже пропустили</span>
        <span className="landing-counter-num">{count.toLocaleString('ru-RU')}</span>
        <span className="landing-counter-post">заказов сегодня</span>
      </div>
    </div>
  );
}
