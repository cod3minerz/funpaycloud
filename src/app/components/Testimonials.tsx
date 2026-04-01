const reviews = [
  {
    avatar: "В",
    name: "Виктор М.",
    role: "Продавец ключей Steam",
    revenue: "₽180 000/мес",
    text: "Освободил вечера. Серьёзно — раньше вечером всегда был у ноутбука. Теперь ужинаю с семьёй, а бот делает своё дело.",
    rating: 5,
    color: "from-blue-500 to-blue-500",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.15)",
  },
  {
    avatar: "А",
    name: "Антон Г.",
    role: "Продавец аккаунтов Valorant",
    revenue: "₽95 000/мес",
    text: "Боялся банов при автоматизации. Прошло 8 месяцев — ни единой проблемы. IPv4 и антибан-логика реально работают.",
    rating: 5,
    color: "from-blue-500 to-indigo-500",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.15)",
  },
  {
    avatar: "И",
    name: "Ирина К.",
    role: "Магазин цифровых товаров",
    revenue: "₽320 000/мес",
    text: "80 лотов поднимала 2 часа в день. Теперь это делает FunPay Cloud по расписанию. Начала наконец думать о развитии, а не о рутине.",
    rating: 5,
    color: "from-blue-500 to-blue-600",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.15)",
  },
  {
    avatar: "Д",
    name: "Дмитрий Л.",
    role: "Продавец программ",
    revenue: "₽58 000/мес",
    text: "Пропущенные продажи ушли. Раньше каждое утро видел 5-6 неотвеченных заказов. Сейчас дашборд показывает — все обработаны автоматически.",
    rating: 5,
    color: "from-blue-500 to-indigo-500",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.15)",
  },
  {
    avatar: "М",
    name: "Максим Т.",
    role: "Аренда аккаунтов",
    revenue: "₽75 000/мес",
    text: "Наконец-то чувствуется контроль. Вижу все аккаунты, все продажи, все статусы в одном месте. Это реально сильный продукт.",
    rating: 5,
    color: "from-blue-500 to-blue-500",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.15)",
  },
  {
    avatar: "А",
    name: "Алексей В.",
    role: "Команда 3 продавца",
    revenue: "₽550 000/мес",
    text: "Масштабировал бизнес ×3 без головной боли. Теперь управляем тремя людьми и пятью аккаунтами из одной панели. Не нарастил кол-во проблем — нарастил прибыль.",
    rating: 5,
    color: "from-blue-500 to-indigo-500",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.15)",
  },
];

export function Testimonials() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(96,165,250,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div
            className="inline-block mb-4 text-sm font-semibold text-blue-300 uppercase tracking-widest"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Реальные результаты
          </div>
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(30px, 5vw, 52px)",
              letterSpacing: "-1.5px",
              lineHeight: 1.15,
            }}
          >
            Продавцы уже{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #60A5FA, #3B82F6, #1D4ED8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              переключились
            </span>
          </h2>
          <p
            className="max-w-[520px] mx-auto"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "17px",
              color: "#A8A8B3",
              lineHeight: 1.7,
            }}
          >
            Реальные истории от продавцов, которые перестали работать на свой магазин и начали управлять им.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl p-6 flex flex-col gap-4 hover:scale-[1.015] transition-transform duration-300"
              style={{ background: r.bg, border: `1px solid ${r.border}` }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 1L8.79 5.26L13.5 5.64L10.25 8.47L11.27 13.1L7 10.54L2.73 13.1L3.75 8.47L0.5 5.64L5.21 5.26L7 1Z"
                      fill="#FBBF24"
                    />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p
                className="flex-1 leading-relaxed italic"
                style={{ fontFamily: "Manrope, sans-serif", fontSize: "14px", color: "#D1D5DB", lineHeight: 1.7 }}
              >
                «{r.text}»
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${r.border}` }}>
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center shrink-0`}
                >
                  <span
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {r.avatar}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-white font-semibold text-sm"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {r.name}
                  </div>
                  <div
                    className="text-[#525266] text-xs truncate"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {r.role}
                  </div>
                </div>
                <div
                  className="text-right shrink-0"
                >
                  <div
                    className="text-blue-300 font-bold text-sm"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {r.revenue}
                  </div>
                  <div
                    className="text-[#525266] text-xs"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    в месяц
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust numbers */}
        <div
          className="mt-16 rounded-2xl px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {[
            { value: "2 400+", label: "Активных продавцов", color: "text-white" },
            { value: "₽48M+", label: "Обработано продаж", color: "text-blue-300" },
            { value: "4.9 / 5", label: "Средняя оценка", color: "text-blue-300" },
            { value: "99.9%", label: "Аптайм платформы", color: "text-blue-300" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div
                className={`font-black mb-1 ${s.color}`}
                style={{ fontFamily: "Manrope, sans-serif", fontSize: "clamp(22px, 4vw, 36px)", letterSpacing: "-1px" }}
              >
                {s.value}
              </div>
              <div
                className="text-[#525266] text-sm"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
