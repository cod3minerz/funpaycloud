const proofStrip = [
  { value: "24/7", label: "в облаке" },
  { value: "0.3с", label: "средняя выдача" },
  { value: "30+", label: "интеграций и плагинов" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-28 pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(96,165,250,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full flex flex-col items-center">
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              background: "rgba(59,130,246,0.08)",
              borderColor: "rgba(148,163,184,0.2)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
            <span
              className="text-sm font-semibold text-blue-200"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Облачная платформа FunPay Cloud
            </span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1
            className="text-white mb-0 max-w-5xl"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(36px, 7vw, 78px)",
              lineHeight: 1.06,
              letterSpacing: "-2.2px",
            }}
          >
            Облачная платформа для
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #93C5FD 0%, #60A5FA 45%, #2563EB 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              автоматизации продаж на FunPay
            </span>
          </h1>
        </div>

        <p
          className="text-center max-w-[760px] mb-10"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontWeight: 500,
            fontSize: "clamp(16px, 2vw, 21px)",
            lineHeight: 1.65,
            color: "#A8A8B3",
          }}
        >
          Автоматизируйте заказы, выдачу товаров, ответы клиентам и рутинные действия на площадке.
          FunPay Cloud работает в облаке 24/7 и снимает с вас ручную операционку.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <a href="#pricing" className="relative group">
            <span
              className="relative bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-200/20 text-white font-bold px-8 py-4 rounded-2xl block text-base hover:opacity-95 transition-opacity"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Начать бесплатно
            </span>
          </a>
          <a
            href="#howitworks"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border font-bold text-base text-white hover:bg-white/[0.05] transition-all"
            style={{
              fontFamily: "Manrope, sans-serif",
              background: "rgba(15,23,42,0.75)",
              borderColor: "rgba(148,163,184,0.22)",
            }}
          >
            Как это работает
            <span className="text-lg">→</span>
          </a>
        </div>

        <div
          className="w-full max-w-4xl rounded-2xl overflow-hidden"
          style={{
            background: "rgba(15,23,42,0.76)",
            border: "1px solid rgba(148,163,184,0.22)",
          }}
        >
          <div className="grid md:grid-cols-3">
            {proofStrip.map((item, i) => (
              <div
                key={item.value}
                className={`px-6 py-5 text-center ${i > 0 ? "border-t md:border-t-0 md:border-l" : ""}`}
                style={{ borderColor: "rgba(148,163,184,0.18)" }}
              >
                <div
                  className="text-blue-200 font-black mb-1"
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "clamp(22px, 3vw, 30px)",
                    letterSpacing: "-1px",
                  }}
                >
                  {item.value}
                </div>
                <div
                  className="text-[11px] uppercase tracking-wider"
                  style={{ fontFamily: "Manrope, sans-serif", color: "#64748B", fontWeight: 700 }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
