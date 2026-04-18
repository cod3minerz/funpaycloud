import Button from './Button';

export default function LandingHero() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">
          <span className="dot" /> Облачная платформа FunPay Cloud
        </span>

        <h1 className="hero-title">
          Облачная платформа для
          <br />
          автоматизации продаж на <em>FunPay</em>
        </h1>

        <p className="hero-sub">
          Автоматизируйте заказы, выдачу товаров, ответы клиентам и рутинные действия на площадке. FunPay Cloud
          работает в облаке 24/7 и снимает с вас ручную операционку.
        </p>

        <div className="hero-ctas">
          <Button variant="accent" size="lg" href="/auth/register">
            Начать бесплатно →
          </Button>
          <Button variant="outline" size="lg" href="#how">
            Как это работает
          </Button>
        </div>

        <div className="hero-note">
          <span>
            <span className="tick">✓</span> Без карты
          </span>
          <span>
            <span className="tick">✓</span> 7 дней бесплатно
          </span>
          <span>
            <span className="tick">✓</span> Подключение за 10 минут
          </span>
        </div>
      </div>
    </header>
  );
}
