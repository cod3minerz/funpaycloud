const comparisonRows = [
  {
    id: "01",
    manual: { icon: "😴", text: "Ночью пропускаешь заказы, пока спишь" },
    system: { icon: "🟢", text: "Заказ обработан в 3 ночи — автоматически" },
  },
  {
    id: "02",
    manual: { icon: "⏰", text: "Сидишь у ПК ради одной выдачи товара" },
    system: { icon: "⚡", text: "Товар выдан за 0.3 секунды, ты спал" },
  },
  {
    id: "03",
    manual: { icon: "📉", text: "Лот падает вниз — конкурент уже выше" },
    system: { icon: "🚀", text: "Лот поднят точно по расписанию, всегда в топе" },
  },
  {
    id: "04",
    manual: { icon: "💬", text: "Одно и то же в чате по 50 раз в день" },
    system: { icon: "🤖", text: "Автоответчик закрывает типовые вопросы" },
  },
  {
    id: "05",
    manual: { icon: "😵", text: "Хаос при росте: не успеваешь за всем" },
    system: { icon: "🧩", text: "Масштабирование без найма помощника" },
  },
  {
    id: "06",
    manual: { icon: "❓", text: "Не знаешь, что реально приносит деньги" },
    system: { icon: "📊", text: "Аналитика показывает, что продаётся лучше" },
  },
];

export function PainPoints() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <div
            className="inline-block mb-4 text-sm font-semibold text-blue-300 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Узнаёшь себя?
          </div>
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "clamp(32px, 5vw, 52px)",
              letterSpacing: "-1.5px",
              lineHeight: 1.15,
            }}
          >
            Ручной режим убивает{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #60A5FA, #1D4ED8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              твой бизнес
            </span>
          </h2>
          <p
            className="max-w-[640px] mx-auto"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "17px",
              color: "#A8A8B3",
              lineHeight: 1.7,
            }}
          >
            Каждый пропущенный заказ, каждое упавшее лото, каждый ночной чат — это деньги, которые уходят к конкуренту, пока ты пытаешься всё успеть сам.
          </p>
        </div>

        <div
          className="max-w-6xl mx-auto rounded-2xl overflow-hidden"
          style={{
            background: "rgba(15,23,42,0.78)",
            border: "1px solid rgba(148,163,184,0.22)",
          }}
        >
          <div className="hidden md:grid md:grid-cols-2">
            <div
              className="px-6 py-4 flex items-center gap-3 border-r"
              style={{ borderColor: "rgba(148,163,184,0.2)" }}
            >
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-200"
                style={{ background: "rgba(30,41,59,0.9)", fontFamily: "var(--font-sans)" }}
              >
                😤 Ручной режим
              </span>
            </div>
            <div className="px-6 py-4 flex items-center gap-3">
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-bold text-blue-200"
                style={{ background: "rgba(59,130,246,0.2)", fontFamily: "var(--font-sans)" }}
              >
                ✅ Системный режим
              </span>
              <span
                className="text-xs font-bold text-blue-200 flex items-center gap-1"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                FunPay Cloud
              </span>
            </div>
          </div>

          <div className="md:hidden px-5 py-4 border-b" style={{ borderColor: "rgba(148,163,184,0.2)" }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-200"
                style={{ background: "rgba(30,41,59,0.9)", fontFamily: "var(--font-sans)" }}
              >
                😤 Ручной режим
              </span>
              <span className="text-slate-500 text-xs">vs</span>
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-bold text-blue-200"
                style={{ background: "rgba(59,130,246,0.2)", fontFamily: "var(--font-sans)" }}
              >
                ✅ Системный режим · FunPay Cloud
              </span>
            </div>
          </div>

          {comparisonRows.map((row, idx) => (
            <div
              key={row.id}
              className={`grid md:grid-cols-2 ${idx > 0 ? "border-t" : ""}`}
              style={{ borderColor: "rgba(148,163,184,0.16)" }}
            >
              <div
                className="px-5 md:px-6 py-4 md:py-4 md:border-r"
                style={{ borderColor: "rgba(148,163,184,0.16)" }}
              >
                <div className="grid grid-cols-[34px_22px_1fr] gap-3 items-start">
                  <span
                    className="text-[11px] font-bold text-slate-400 mt-1"
                    style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.08em" }}
                  >
                    {row.id}
                  </span>
                  <span className="text-lg leading-none mt-0.5">{row.manual.icon}</span>
                  <span
                    className="text-sm text-[#A8A8B3] leading-relaxed"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {row.manual.text}
                  </span>
                </div>
              </div>
              <div
                className="px-5 md:px-6 py-4 md:py-4 border-t md:border-t-0"
                style={{ borderColor: "rgba(96,165,250,0.2)" }}
              >
                <div className="grid grid-cols-[34px_22px_1fr] gap-3 items-start">
                  <span
                    className="text-[11px] font-bold text-blue-300/80 mt-1"
                    style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.08em" }}
                  >
                    {row.id}
                  </span>
                  <span className="text-lg leading-none mt-0.5">{row.system.icon}</span>
                  <span
                    className="text-sm text-[#D1D5DB] leading-relaxed"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {row.system.text}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="grid md:grid-cols-2 border-t" style={{ borderColor: "rgba(148,163,184,0.18)" }}>
            <div
              className="px-5 md:px-6 py-4 md:py-5 md:border-r"
              style={{ borderColor: "rgba(148,163,184,0.16)" }}
            >
              <div className="text-slate-200 font-bold text-sm mb-1" style={{ fontFamily: "var(--font-sans)" }}>
                Итог: постоянное дежурство
              </div>
              <div className="text-[#A8A8B3] text-sm" style={{ fontFamily: "var(--font-sans)" }}>
                Ты работаешь как служащий своего же магазина. Без отдыха, без роста, без масштаба.
              </div>
            </div>
            <div className="px-5 md:px-6 py-4 md:py-5 border-t md:border-t-0" style={{ borderColor: "rgba(96,165,250,0.2)" }}>
              <div className="text-blue-200 font-bold text-sm mb-1" style={{ fontFamily: "var(--font-sans)" }}>
                Итог: магазин работает сам
              </div>
              <div className="text-[#BFDBFE] text-sm" style={{ fontFamily: "var(--font-sans)" }}>
                Ты думаешь о стратегии и росте, пока система делает всю рутину без остановок.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="mb-4 text-sm text-slate-400" style={{ fontFamily: "var(--font-sans)" }}>
            Перейдите от ручного режима к системе за 10 минут
          </p>
          <a
            href="/auth/register"
            className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold text-sm px-7 py-3 rounded-xl border border-blue-200/20 hover:opacity-95 transition-opacity"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Начать бесплатно
          </a>
        </div>
      </div>
    </section>
  );
}
