const steps = [
  {
    number: "01",
    icon: "🔗",
    title: "Подключаешь аккаунт FunPay",
    desc: "Вводишь ключ API или credentials в защищённой форме. Занимает 2 минуты. Данные шифруются и никогда не покидают безопасное хранилище.",
    details: ["Ввод API-ключа", "Проверка соединения", "Привязка аккаунта"],
    color: "text-blue-400",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.2)",
    glow: "rgba(59,130,246,0.15)",
  },
  {
    number: "02",
    icon: "⚙️",
    title: "Настраиваешь автоматику",
    desc: "Загружаешь товары в базу автовыдачи, задаёшь расписание подъёмов, добавляешь шаблоны ответов. Гид и подсказки на каждом шаге.",
    details: ["Загрузка товаров", "Расписание подъёмов", "Шаблоны ответов"],
    color: "text-blue-300",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.2)",
    glow: "rgba(96,165,250,0.15)",
  },
  {
    number: "03",
    icon: "🚀",
    title: "Запускаешь автоматизацию",
    desc: "Один клик — и система начинает работать. Бот уходит в облако и начинает продавать, отвечать и поднимать лоты без твоего участия.",
    details: ["Запуск в облаке", "Первые авто-заказы", "Живой статус бота"],
    color: "text-emerald-400",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
    glow: "rgba(16,185,129,0.15)",
  },
  {
    number: "04",
    icon: "📊",
    title: "Контролируешь из одной панели",
    desc: "Дашборд показывает продажи, аптайм, активные заказы и логи. Telegram-уведомления приходят мгновенно. Ты управляешь магазином как системой.",
    details: ["Живой дашборд", "Telegram-уведомления", "Аналитика и рост"],
    color: "text-blue-300",
    bg: "rgba(37,99,235,0.1)",
    border: "rgba(37,99,235,0.2)",
    glow: "rgba(37,99,235,0.15)",
  },
];

export function HowItWorks() {
  return (
    <section id="howitworks" className="py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div
            className="inline-block mb-4 text-sm font-semibold text-blue-400 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Быстрый старт
          </div>
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "clamp(30px, 5vw, 52px)",
              letterSpacing: "-1.5px",
              lineHeight: 1.15,
            }}
          >
            Запуск за{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              10 минут
            </span>
          </h2>
          <p
            className="max-w-[520px] mx-auto"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "17px",
              color: "#A8A8B3",
              lineHeight: 1.7,
            }}
          >
            Не требует технических знаний. Понятный онбординг с гидом на каждом шаге.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute left-8 top-8 bottom-8 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, rgba(96,165,250,0.3), rgba(37,99,235,0.3))" }}
          />

          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <div key={step.number} className="flex gap-6 items-start group">
                {/* Number circle */}
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 z-10"
                  style={{ background: step.bg, border: `1px solid ${step.border}`, boxShadow: `0 8px 18px ${step.glow}` }}
                >
                  <span
                    className={`text-xl font-black ${step.color}`}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Content card */}
                <div
                  className="flex-1 rounded-2xl p-6 group-hover:border-opacity-50 transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${step.border.replace("0.2", "0.12")}`,
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{step.icon}</span>
                        <h3
                          className="text-white"
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontWeight: 700,
                            fontSize: "20px",
                          }}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <p
                        className="leading-relaxed"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "15px",
                          color: "#A8A8B3",
                          lineHeight: 1.7,
                        }}
                      >
                        {step.desc}
                      </p>
                    </div>

                    {/* Mini checklist */}
                    <div className="flex flex-col gap-2 md:ml-8 md:w-[200px] shrink-0">
                      {step.details.map((d) => (
                        <div key={d} className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: step.bg }}
                          >
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={step.color}
                              />
                            </svg>
                          </div>
                          <span
                            className={`text-sm ${step.color}`}
                            style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}
                          >
                            {d}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p
            className="text-[#525266] text-sm"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Нужна помощь? Наша команда поможет настроить всё за тебя в рамках онбординга.
          </p>
        </div>
      </div>
    </section>
  );
}
