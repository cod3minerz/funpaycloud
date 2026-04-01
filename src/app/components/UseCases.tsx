const cases = [
  {
    emoji: "🎮",
    tag: "Цифровые товары",
    title: "Продавец ключей и активаций",
    story:
      "Виктор продаёт ключи Steam, Windows и Office. Раньше отвечал на каждый заказ вручную. Теперь FunPay Cloud выдаёт ключ за 0.3 сек автоматически, а он узнаёт о заказе уже по факту выплаты.",
    result: "+340% заказов в месяц",
    resultColor: "text-blue-300",
    stats: [
      { label: "Автовыдач", value: "99%" },
      { label: "Время выдачи", value: "0.3с" },
    ],
    gradient: "from-blue-500/10 to-blue-500/5",
    border: "rgba(59,130,246,0.2)",
    glow: "rgba(59,130,246,0.1)",
  },
  {
    emoji: "🏆",
    tag: "Игровые аккаунты",
    title: "Продавец аккаунтов Valorant",
    story:
      "Антон продаёт прокачанные аккаунты. Боялся, что автоматизация навредит аккаунту. Благодаря выделенному IPv4 и антибан-логике — работает без проблем уже 8 месяцев.",
    result: "0 банов за 8 месяцев",
    resultColor: "text-blue-300",
    stats: [
      { label: "Аптайм", value: "99.9%" },
      { label: "Защита", value: "IPv4" },
    ],
    gradient: "from-blue-500/10 to-indigo-500/5",
    border: "rgba(37,99,235,0.2)",
    glow: "rgba(37,99,235,0.1)",
  },
  {
    emoji: "🌙",
    tag: "Ночные продажи",
    title: "Продавец без ночных дежурств",
    story:
      "Дмитрий работает днём в офисе. Раньше просыпался, чтобы отвечать на заказы. Теперь спит спокойно: FunPay Cloud отвечает, выдаёт и поднимает лоты всю ночь без его участия.",
    result: "Освободил 4 часа в день",
    resultColor: "text-blue-300",
    stats: [
      { label: "Ночных заказов", value: "37%" },
      { label: "Обработано", value: "100%" },
    ],
    gradient: "from-blue-500/10 to-indigo-500/5",
    border: "rgba(59,130,246,0.2)",
    glow: "rgba(59,130,246,0.1)",
  },
  {
    emoji: "🏪",
    tag: "Большой магазин",
    title: "Магазин с 80+ лотами",
    story:
      "Ирина ведёт магазин с разными категориями товаров. Ручное поднятие 80 лотов занимало 2 часа в день. Теперь расписание настроено раз — и всё работает автоматически.",
    result: "Экономия 60 часов в месяц",
    resultColor: "text-blue-300",
    stats: [
      { label: "Лотов", value: "80+" },
      { label: "Подъёмов/день", value: "240" },
    ],
    gradient: "from-blue-500/10 to-blue-600/5",
    border: "rgba(96,165,250,0.2)",
    glow: "rgba(96,165,250,0.1)",
  },
  {
    emoji: "📦",
    tag: "Аренда",
    title: "Продавец аренды аккаунтов",
    story:
      "Максим сдаёт аккаунты в аренду. Раньше вручную продлевал, напоминал, отвечал на вопросы. FunPay Cloud автоматизировал все сценарии и даже напоминания о продлении.",
    result: "+65% продлений аренды",
    resultColor: "text-blue-300",
    stats: [
      { label: "Сценариев", value: "12" },
      { label: "AI-ответов", value: "85%" },
    ],
    gradient: "from-blue-500/10 to-blue-600/5",
    border: "rgba(59,130,246,0.2)",
    glow: "rgba(59,130,246,0.1)",
  },
  {
    emoji: "👥",
    tag: "Команда",
    title: "Команда с несколькими аккаунтами",
    story:
      "Алексей управляет командой из 3 человек с 5 аккаунтами. Единая панель FunPay Cloud даёт полный контроль: кто что продаёт, сколько зарабатывает, где нужна помощь.",
    result: "×3 масштаб без хаоса",
    resultColor: "text-blue-400",
    stats: [
      { label: "Аккаунтов", value: "5" },
      { label: "Единый дашборд", value: "✓" },
    ],
    gradient: "from-blue-500/10 to-indigo-500/5",
    border: "rgba(99,102,241,0.2)",
    glow: "rgba(99,102,241,0.1)",
  },
];

export function UseCases() {
  return (
    <section id="usecases" className="py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(96,165,250,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div
            className="inline-block mb-4 text-sm font-semibold text-blue-300 uppercase tracking-widest"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Кто использует
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
            Сценарии роста{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #60A5FA, #1D4ED8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              реальных продавцов
            </span>
          </h2>
          <p
            className="max-w-[560px] mx-auto"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "17px",
              color: "#A8A8B3",
              lineHeight: 1.7,
            }}
          >
            FunPay Cloud подходит для разных типов продавцов — от новичков с первым магазином до опытных команд с десятками аккаунтов.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c) => (
            <div
              key={c.title}
              className={`relative rounded-2xl p-6 bg-gradient-to-br ${c.gradient} group hover:scale-[1.02] transition-all duration-300 cursor-default`}
              style={{ border: `1px solid ${c.border}`, boxShadow: `0 10px 24px ${c.glow}` }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{c.emoji}</span>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full text-[#A8A8B3]"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  {c.tag}
                </span>
              </div>

              <h3
                className="text-white mb-3"
                style={{
                  fontFamily: "Manrope, sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  lineHeight: 1.3,
                }}
              >
                {c.title}
              </h3>
              <p
                className="mb-5 leading-relaxed"
                style={{
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "13px",
                  color: "#A8A8B3",
                  lineHeight: 1.7,
                }}
              >
                {c.story}
              </p>

              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: `1px solid ${c.border}` }}
              >
                <div
                  className={`font-bold text-sm ${c.resultColor}`}
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {c.result}
                </div>
                <div className="flex gap-4">
                  {c.stats.map((s) => (
                    <div key={s.label} className="text-right">
                      <div
                        className="text-white font-bold text-sm"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {s.value}
                      </div>
                      <div
                        className="text-[#525266] text-[10px]"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
