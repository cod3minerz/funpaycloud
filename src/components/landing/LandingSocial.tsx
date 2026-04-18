const testimonials = [
  {
    text: '«Освободил вечера. Серьёзно — раньше вечером всегда был у ноутбука. Теперь ужинаю с семьёй, а бот делает своё дело.»',
    avatar: 'В',
    name: 'Виктор М.',
    role: 'Продавец ключей Steam',
    mark: '₽180 000/мес',
  },
  {
    text: '«Боялся банов при автоматизации. Прошло 8 месяцев — ни единой проблемы. IPv4 и антибан-логика реально работают.»',
    avatar: 'А',
    name: 'Антон Г.',
    role: 'Продавец аккаунтов Valorant',
    mark: '₽95 000/мес',
  },
  {
    text: '«80 лотов поднимала 2 часа в день. Теперь это делает FunPay Cloud по расписанию. Начала наконец думать о развитии, а не о рутине.»',
    avatar: 'И',
    name: 'Ирина К.',
    role: 'Магазин цифровых товаров',
    mark: '₽320 000/мес',
  },
  {
    text: '«Пропущенные продажи ушли. Раньше каждое утро видел 5-6 неотвеченных заказов. Сейчас дашборд показывает — все обработаны автоматически.»',
    avatar: 'Д',
    name: 'Дмитрий Л.',
    role: 'Продавец программ',
    mark: '₽58 000/мес',
  },
  {
    text: '«Наконец-то чувствуется контроль. Вижу все аккаунты, все продажи, все статусы в одном месте. Это реально сильный продукт.»',
    avatar: 'М',
    name: 'Максим Т.',
    role: 'Аренда аккаунтов',
    mark: '₽75 000/мес',
  },
  {
    text: '«Масштабировал бизнес ×3 без головной боли. Теперь управляем тремя людьми и пятью аккаунтами из одной панели. Не нарастил кол-во проблем — нарастил прибыль.»',
    avatar: 'А',
    name: 'Алексей В.',
    role: 'Команда 3 продавца',
    mark: '₽550 000/мес',
  },
];

const stats = [
  { value: '2 400+', label: 'активных продавцов' },
  { value: '₽48M+', label: 'обработано продаж' },
  { value: '4.9 / 5', label: 'средняя оценка' },
  { value: '99.9%', label: 'аптайм платформы' },
];

export default function LandingSocial() {
  return (
    <section>
      <div className="wrap">
        <div className="sec-eyebrow">Реальные результаты</div>
        <h2 className="sec-title">Продавцы уже переключились</h2>
        <p className="sec-sub">
          Реальные истории от продавцов, которые перестали работать на свой магазин и начали управлять им.
        </p>

        <div className="testis">
          {testimonials.map((item, index) => (
            <div key={index} className="testi">
              <div className="q">{item.text}</div>
              <div className="by">
                <div className="av">{item.avatar}</div>
                <div>
                  <div className="n">{item.name}</div>
                  <div className="r">{item.role}</div>
                </div>
                <div className="mark">{item.mark}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="stats-row">
          {stats.map((item) => (
            <div key={item.label} className="stat">
              <div className="v">{item.value}</div>
              <div className="l">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
