import { X, Check } from "lucide-react";

const comparisons = [
  {
    feature: "Интерфейс управления",
    old: "Telegram-бот или устаревший сайт",
    new: "Полноценный веб-дашборд + Telegram",
  },
  {
    feature: "Место работы",
    old: "На твоём ПК — выключил ПК, бот встал",
    new: "Облако 24/7, независимо от твоего устройства",
  },
  {
    feature: "Ответы клиентам",
    old: "Шаблоны с ключевыми словами",
    new: "AI (GPT-4o) с пониманием контекста",
  },
  {
    feature: "Аналитика",
    old: "Счётчик заказов, не более",
    new: "Выручка, конверсия, лоты, периоды, экспорт",
  },
  {
    feature: "Масштабирование",
    old: "Один аккаунт, один поток",
    new: "Мультиаккаунт, сценарии, команды",
  },
  {
    feature: "Защита от банов",
    old: "Нет или общий IP",
    new: "Выделенный IPv4, антибан-логика",
  },
  {
    feature: "Онбординг",
    old: "Инструкция в 30 шагов",
    new: "Подключение за 10 минут с гидом",
  },
  {
    feature: "Поддержка",
    old: "Базовая, медленная",
    new: "Быстрая, с приоритетными тикетами",
  },
];

export function WhyUs() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div
            className="inline-block mb-4 text-sm font-semibold text-blue-300 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Почему FunPay Cloud
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
            Продавцы перерастают{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              обычных ботов
            </span>
          </h2>
          <p
            className="max-w-[560px] mx-auto"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "17px",
              color: "#A8A8B3",
              lineHeight: 1.7,
            }}
          >
            Когда магазин растёт, старые решения становятся тормозом. FunPay Cloud — это следующий уровень.
          </p>
        </div>

        {/* Comparison table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-3 gap-0"
            style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="px-6 py-4">
              <span
                className="text-[#525266] text-sm font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Критерий
              </span>
            </div>
            <div className="px-6 py-4 border-l border-white/[0.07]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <span
                  className="text-[#A8A8B3] text-sm font-semibold"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Обычные боты
                </span>
              </div>
            </div>
            <div
              className="px-6 py-4 border-l border-white/[0.07]"
              style={{ background: "rgba(59,130,246,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span
                  className="font-bold text-sm"
                  style={{
                    fontFamily: "var(--font-sans)",
                    background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  FunPay Cloud
                </span>
              </div>
            </div>
          </div>

          {/* Table rows */}
          {comparisons.map((row, i) => (
            <div
              key={row.feature}
              className="grid grid-cols-3 gap-0 hover:bg-white/[0.015] transition-colors"
              style={{
                borderBottom:
                  i < comparisons.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <div className="px-6 py-4">
                <span
                  className="text-white text-sm font-medium"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {row.feature}
                </span>
              </div>
              <div className="px-6 py-4 border-l border-white/[0.05] flex items-start gap-2">
                <X size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span
                  className="text-[#A8A8B3] text-sm"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {row.old}
                </span>
              </div>
              <div
                className="px-6 py-4 border-l border-white/[0.05] flex items-start gap-2"
                style={{ background: "rgba(59,130,246,0.03)" }}
              >
                <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span
                  className="text-[#D1D5DB] text-sm"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {row.new}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <a href="/auth/register" className="relative inline-block group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/40 to-blue-500/40 rounded-xl blur-[2px] group-hover:blur-[3px] transition-all" />
            <span
              className="relative inline-block bg-gradient-to-r from-blue-400 to-blue-500 text-[#050608] font-bold px-8 py-3.5 rounded-xl text-sm"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Попробовать FunPay Cloud бесплатно →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
