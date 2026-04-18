import Button from './Button';

export default function LandingCTA() {
  return (
    <section className="final">
      <div className="wrap">
        <span className="eyebrow">
          <span className="dot" /> 7 дней бесплатно, карта не нужна
        </span>
        <h2>Хватит выдавать товары руками</h2>
        <p>Дай системе делать рутину. Запусти FunPay Cloud за 10 минут и начни управлять магазином — а не обслуживать его.</p>
        <div className="hero-ctas">
          <Button variant="accent" size="lg" href="/auth/register">
            Создать аккаунт бесплатно →
          </Button>
          <Button variant="outline" size="lg" href="#how">
            Смотреть как работает
          </Button>
        </div>
        <div className="trust">Без технических знаний · Без карты · Настройка 10 минут</div>
      </div>
    </section>
  );
}
