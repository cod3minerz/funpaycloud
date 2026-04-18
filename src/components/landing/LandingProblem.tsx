import Button from './Button';

export default function LandingProblem() {
  return (
    <section id="problem">
      <div className="wrap">
        <div className="sec-eyebrow">Узнаёшь себя?</div>
        <h2 className="sec-title">Ручной режим убивает твой бизнес</h2>
        <p className="sec-sub">
          Каждый пропущенный заказ, каждое упавшее лото, каждый ночной чат — это деньги, которые уходят к
          конкуренту, пока ты пытаешься всё успеть сам.
        </p>

        <div className="cmp">
          <div className="cmp-col">
            <h4>Ручной режим</h4>
            <ul>
              <li>
                <span className="ic x">✕</span>Ночью пропускаешь заказы, пока спишь
              </li>
              <li>
                <span className="ic x">✕</span>Сидишь у ПК ради одной выдачи товара
              </li>
              <li>
                <span className="ic x">✕</span>Лот падает вниз — конкурент уже выше
              </li>
              <li>
                <span className="ic x">✕</span>Одно и то же в чате по 50 раз в день
              </li>
              <li>
                <span className="ic x">✕</span>Хаос при росте: не успеваешь за всем
              </li>
              <li>
                <span className="ic x">✕</span>Не знаешь, что реально приносит деньги
              </li>
            </ul>
            <div className="cmp-foot">
              <div className="ft-title">Итог: постоянное дежурство</div>
              <div className="ft-sub">Ты работаешь как служащий своего же магазина. Без отдыха, без роста, без масштаба.</div>
            </div>
          </div>

          <div className="cmp-col sys">
            <h4>Системный режим FunPay Cloud</h4>
            <ul>
              <li>
                <span className="ic v">✓</span>Заказ обработан в 3 ночи — автоматически
              </li>
              <li>
                <span className="ic v">✓</span>Товар выдан за 0.3 секунды, ты спал
              </li>
              <li>
                <span className="ic v">✓</span>Лот поднят точно по расписанию, всегда в топе
              </li>
              <li>
                <span className="ic v">✓</span>Автоответчик закрывает типовые вопросы
              </li>
              <li>
                <span className="ic v">✓</span>Масштабирование без найма помощника
              </li>
              <li>
                <span className="ic v">✓</span>Аналитика показывает, что продаётся лучше
              </li>
            </ul>
            <div className="cmp-foot">
              <div className="ft-title">Итог: магазин работает сам</div>
              <div className="ft-sub">Ты думаешь о стратегии и росте, пока система делает всю рутину без остановок.</div>
            </div>
          </div>
        </div>

        <div className="cmp-cta">
          <div className="txt">Перейдите от ручного режима к системе за 10 минут</div>
          <Button variant="accent" size="lg" href="/auth/register">
            Начать бесплатно →
          </Button>
        </div>
      </div>
    </section>
  );
}
