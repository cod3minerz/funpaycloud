import { useState } from "react";
import { Check } from "lucide-react";

const plans = [
  {
    id: "solo",
    name: "Старт",
    tagline: "Для первого шага",
    priceMonthly: 199,
    priceYearly: 159,
    color: "text-blue-400",
    border: "rgba(59,130,246,0.2)",
    bg: "rgba(59,130,246,0.05)",
    glow: "rgba(59,130,246,0.1)",
    highlight: false,
    cta: "Начать бесплатно",
    ctaStyle: "border",
    features: [
      { text: "1 аккаунт FunPay", available: true },
      { text: "Автовыдача товаров", available: true },
      { text: "Автоподнятие лотов", available: true },
      { text: "Базовые шаблоны ответов", available: true },
      { text: "Облако 24/7", available: true },
      { text: "IPv4 защита", available: true },
      { text: "Telegram-уведомления", available: true },
      { text: "AI-автоответчик", available: false },
      { text: "Аналитика и отчёты", available: false },
      { text: "Мультиаккаунт", available: false },
      { text: "Приоритетная поддержка", available: false },
    ],
  },
  {
    id: "pro",
    name: "Профи",
    tagline: "Лучший выбор",
    priceMonthly: 349,
    priceYearly: 279,
    color: "text-white",
    border: "rgba(96,165,250,0.4)",
    bg: "transparent",
    glow: "rgba(96,165,250,0.2)",
    highlight: true,
    cta: "Выбрать Профи",
    ctaStyle: "gradient",
    features: [
      { text: "3 аккаунта FunPay", available: true },
      { text: "Автовыдача товаров", available: true },
      { text: "Умное автоподнятие", available: true },
      { text: "AI-автоответчик (GPT-4o)", available: true },
      { text: "Облако 24/7", available: true },
      { text: "IPv4 защита", available: true },
      { text: "Telegram-управление", available: true },
      { text: "Полная аналитика", available: true },
      { text: "Плагины (30+)", available: true },
      { text: "Экспорт отчётов", available: true },
      { text: "Приоритетная поддержка", available: false },
    ],
  },
  {
    id: "scale",
    name: "Командный",
    tagline: "Для масштаба",
    priceMonthly: 499,
    priceYearly: 399,
    color: "text-blue-300",
    border: "rgba(37,99,235,0.25)",
    bg: "rgba(37,99,235,0.05)",
    glow: "rgba(37,99,235,0.12)",
    highlight: false,
    cta: "Масштабировать",
    ctaStyle: "border-blue",
    features: [
      { text: "До 10 аккаунтов FunPay", available: true },
      { text: "Автовыдача товаров", available: true },
      { text: "Умное автоподнятие", available: true },
      { text: "AI-автоответчик (GPT-4o)", available: true },
      { text: "Облако 24/7", available: true },
      { text: "IPv4 защита", available: true },
      { text: "Telegram-управление", available: true },
      { text: "Расширенная аналитика", available: true },
      { text: "Все плагины + VIP", available: true },
      { text: "Мультиаккаунт-дашборд", available: true },
      { text: "Приоритетная поддержка 24/7", available: true },
    ],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <div
            className="inline-block mb-4 text-sm font-semibold text-blue-400 uppercase tracking-widest"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Прозрачные тарифы
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
            Только доступ к системе —{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              без процентов с продаж
            </span>
          </h2>
          <p
            className="max-w-[520px] mx-auto mb-8"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "17px",
              color: "#A8A8B3",
              lineHeight: 1.7,
            }}
          >
            Фиксированная оплата за возможности. Зарабатываешь больше — платишь столько же.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-semibold ${!isYearly ? "text-white" : "text-[#525266]"}`}
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Ежемесячно
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-12 h-6 rounded-full transition-all duration-200 ${isYearly ? "bg-gradient-to-r from-blue-400 to-blue-500" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isYearly ? "translate-x-7" : "translate-x-1"}`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${isYearly ? "text-white" : "text-[#525266]"}`}
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Ежегодно
              </span>
              <span
                className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(59,130,246,0.1)", fontFamily: "Manrope, sans-serif" }}
              >
                −20%
              </span>
            </div>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-7 flex flex-col ${plan.highlight ? "scale-[1.02] md:scale-105" : ""}`}
              style={{
                background: plan.highlight
                  ? "linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(59,130,246,0.12) 50%, rgba(37,99,235,0.08) 100%)"
                  : plan.bg,
                border: `1px solid ${plan.border}`,
                boxShadow: plan.highlight
                  ? `0 18px 42px ${plan.glow}, 0 0 0 1px rgba(96,165,250,0.2)`
                  : `0 10px 24px ${plan.glow}`,
              }}
            >
              {/* Best choice badge */}
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div
                    className="px-4 py-1.5 rounded-full text-xs font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                      boxShadow: "0 8px 18px rgba(96,165,250,0.5)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    ✦ Лучший выбор
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div
                  className={`text-sm font-semibold mb-1 ${plan.color}`}
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {plan.tagline}
                </div>
                <div
                  className="text-white font-bold mb-4"
                  style={{ fontFamily: "Manrope, sans-serif", fontSize: "24px" }}
                >
                  {plan.name}
                </div>
                <div className="flex items-end gap-2">
                  <span
                    className="text-white font-black"
                    style={{ fontFamily: "Manrope, sans-serif", fontSize: "42px", letterSpacing: "-2px" }}
                  >
                    {isYearly ? plan.priceYearly : plan.priceMonthly}₽
                  </span>
                  <span
                    className="text-[#525266] text-sm mb-2"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    / мес
                  </span>
                </div>
                {isYearly && (
                  <div
                    className="text-[#525266] text-sm line-through"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {plan.priceMonthly}₽/мес
                  </div>
                )}
              </div>

              {/* CTA */}
              <a
                href="#"
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-center mb-7 block transition-all duration-200 ${
                  plan.ctaStyle === "gradient"
                    ? "text-[#050608] hover:opacity-90"
                    : plan.ctaStyle === "border-blue"
                    ? "text-blue-300 hover:bg-blue-300/5"
                    : "text-white hover:bg-white/5"
                }`}
                style={
                  plan.ctaStyle === "gradient"
                    ? {
                        background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                        fontFamily: "Manrope, sans-serif",
                        boxShadow: "0 10px 24px rgba(96,165,250,0.3)",
                      }
                    : {
                        border: `1px solid ${plan.border}`,
                        fontFamily: "Manrope, sans-serif",
                      }
                }
              >
                {plan.cta}
              </a>

              {/* Divider */}
              <div className="w-full h-px mb-6" style={{ background: `${plan.border}` }} />

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${f.available ? "bg-emerald-400/10" : "bg-white/[0.04]"}`}
                    >
                      {f.available ? (
                        <Check size={9} className="text-emerald-400" />
                      ) : (
                        <div className="w-1.5 h-0.5 rounded-full bg-[#525266]" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${f.available ? "text-[#A8A8B3]" : "text-[#525266]"}`}
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Reassurances */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🔒", text: "Без скрытых комиссий" },
            { icon: "💳", text: "Оплата только за доступ" },
            { icon: "⚡", text: "Подключение за 10 минут" },
            { icon: "🎯", text: "Отмена в любой момент" },
          ].map((r) => (
            <div
              key={r.text}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-lg">{r.icon}</span>
              <span
                className="text-sm text-[#A8A8B3]"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {r.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
