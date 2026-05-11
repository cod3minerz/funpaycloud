import Button from './Button';

export default function LandingCTA() {
  return (
    <section className="final">
      <div className="wrap">
        <span className="eyebrow">
          <span className="dot" /> Пока ты читаешь — конкуренты уже автоматизировались
        </span>
        <h2>Твой магазин теряет деньги прямо сейчас</h2>
        <p>Каждый пропущенный заказ, каждая ночь без поднятий, каждый ручной ответ — это слитая выручка. Запусти FunPay Cloud за 10 минут и останови потери.</p>
        <div className="hero-ctas">
          <Button variant="accent" size="lg" href="/auth/register">
            Запустить бесплатно — 7 дней →
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
