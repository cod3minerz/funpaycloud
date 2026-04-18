import Button from './Button';

const rows = [
  ['Интерфейс управления', 'Telegram-бот или устаревший сайт', 'Полноценный веб-дашборд + Telegram'],
  ['Место работы', 'На твоём ПК — выключил ПК, бот встал', 'Облако 24/7, независимо от твоего устройства'],
  ['Ответы клиентам', 'Шаблоны с ключевыми словами', 'AI (GPT-4o) с пониманием контекста'],
  ['Аналитика', 'Счётчик заказов, не более', 'Выручка, конверсия, лоты, периоды, экспорт'],
  ['Масштабирование', 'Один аккаунт, один поток', 'Мультиаккаунт, сценарии, команды'],
  ['Защита от банов', 'Нет или общий IP', 'Выделенный IPv4, антибан-логика'],
  ['Онбординг', 'Инструкция в 30 шагов', 'Подключение за 10 минут с гидом'],
  ['Поддержка', 'Базовая, медленная', 'Быстрая, с приоритетными тикетами'],
];

export default function LandingComparison() {
  return (
    <section>
      <div className="wrap">
        <div className="sec-eyebrow">Почему FunPay Cloud</div>
        <h2 className="sec-title">Продавцы перерастают обычных ботов</h2>
        <p className="sec-sub">Когда магазин растёт, старые решения становятся тормозом. FunPay Cloud — это следующий уровень.</p>

        <div className="ctable">
          <table>
            <thead>
              <tr>
                <th>Критерий</th>
                <th>Обычные боты</th>
                <th className="cloud">FunPay Cloud</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([crit, plain, cloud]) => (
                <tr key={crit}>
                  <td className="crit">{crit}</td>
                  <td className="plain">{plain}</td>
                  <td className="cloud">{cloud}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ctable-cta">
          <Button variant="accent" size="lg" href="/auth/register">
            Попробовать FunPay Cloud бесплатно →
          </Button>
        </div>
      </div>
    </section>
  );
}
