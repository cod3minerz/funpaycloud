export function CTASection() {
  return (
    <section className="py-16 px-6 relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div
          className="relative rounded-3xl px-8 py-16 md:py-20 overflow-hidden text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.88) 100%)",
            border: "1px solid rgba(148,163,184,0.24)",
          }}
        >
          {/* Glows */}
          <div
            className="absolute top-0 left-1/3 w-64 h-64 opacity-15 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(96,165,250,0.3) 0%, transparent 70%)",
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{
                background: "rgba(30,41,59,0.8)",
                border: "1px solid rgba(148,163,184,0.24)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span
                className="text-sm font-semibold text-[#A8A8B3]"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                7 дней бесплатно, карта не нужна
              </span>
            </div>

            <h2
              className="text-white mb-5"
              style={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(32px, 6vw, 64px)",
                letterSpacing: "-2px",
                lineHeight: 1.1,
              }}
            >
              Хватит выдавать товары{" "}
              <br className="hidden md:block" />
              <span
                style={{
                  background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #1D4ED8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                руками
              </span>
            </h2>

            <p
              className="max-w-[520px] mx-auto mb-10"
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "18px",
                color: "#A8A8B3",
                lineHeight: 1.7,
              }}
            >
              Дай системе делать рутину. Запусти FunPay Cloud за 10 минут и начни управлять магазином — а не обслуживать его.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/auth/register" className="relative group">
                <span
                  className="relative bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold px-8 py-4 rounded-2xl block text-base hover:opacity-95 transition-opacity border border-blue-200/20"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  ⚡ Создать аккаунт бесплатно
                </span>
              </a>
              <a
                href="#howitworks"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white hover:bg-white/[0.07] transition-all border"
                style={{
                  fontFamily: "Manrope, sans-serif",
                  background: "rgba(15,23,42,0.8)",
                  borderColor: "rgba(148,163,184,0.22)",
                }}
              >
                Смотреть как работает
              </a>
            </div>

            <p
              className="mt-6 text-[#525266] text-sm"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Без технических знаний · Без карты · Настройка 10 минут
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
