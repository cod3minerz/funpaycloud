"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const sidebarItems = ["Дашборд", "Заказы", "Чаты", "Лоты", "Аналитика"];
const tableRows = [
  { id: "ORD-2048", buyer: "tonminerz", sum: "3 280 ₽", status: "Оплачен" },
  { id: "ORD-2047", buyer: "shop_pro", sum: "1 990 ₽", status: "В работе" },
  { id: "ORD-2046", buyer: "seller_hub", sum: "850 ₽", status: "Выдан" },
];

export function Hero() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
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

        <div className="w-full max-w-[1120px]" style={{ perspective: "1600px" }}>
          <motion.div className="relative" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <motion.div
              className="relative"
              animate={{
                y: [0, isMobile ? -3 : -5, 0],
                rotateX: isMobile ? [9, 8.3, 9] : [12, 11.2, 12],
              }}
              transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d", transformOrigin: "center top" }}
            >
            <div
              className="absolute left-1/2 top-[86%] -translate-x-1/2 w-[86%] h-14 rounded-full blur-3xl"
              style={{ background: "rgba(37,99,235,0.22)" }}
              aria-hidden="true"
            />

            <div
              className="relative rounded-[24px] overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(10,17,30,0.98) 100%)",
                border: "1px solid rgba(148,163,184,0.24)",
                boxShadow: "0 22px 70px rgba(2, 8, 23, 0.55)",
              }}
            >
              <div
                className="h-[52px] flex items-center justify-between px-4 sm:px-5"
                style={{
                  borderBottom: "1px solid rgba(148,163,184,0.2)",
                  background: "rgba(15,23,42,0.78)",
                }}
              >
                <div className="inline-flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span
                    className="ml-1 text-[11px] sm:text-xs text-slate-300"
                    style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}
                  >
                    FunPay Cloud Dashboard
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 sm:gap-3">
                  <span className="h-7 sm:h-8 w-24 sm:w-36 rounded-lg border border-white/10 bg-white/[0.03]" />
                  <span className="h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-blue-400/25 border border-blue-200/25" />
                </div>
              </div>

              <div className="grid grid-cols-[74px_minmax(0,1fr)] sm:grid-cols-[190px_minmax(0,1fr)] min-h-[300px] sm:min-h-[380px]">
                <aside
                  className="p-3 sm:p-4"
                  style={{
                    borderRight: "1px solid rgba(148,163,184,0.18)",
                    background: "rgba(7,13,24,0.55)",
                  }}
                >
                  <div className="space-y-2 sm:space-y-2.5">
                    {sidebarItems.map((item, idx) => (
                      <div
                        key={item}
                        className="h-8 sm:h-9 rounded-xl"
                        style={{
                          background: idx === 0 ? "rgba(96,165,250,0.2)" : "rgba(148,163,184,0.08)",
                          border: idx === 0 ? "1px solid rgba(96,165,250,0.35)" : "1px solid transparent",
                        }}
                      >
                        <div className="h-full px-2 sm:px-3 flex items-center gap-2 sm:gap-3">
                          <span className="h-3.5 w-3.5 rounded bg-white/45 shrink-0" />
                          <span
                            className="hidden sm:block text-xs text-slate-300"
                            style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}
                          >
                            {item}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="p-3 sm:p-5 lg:p-6 grid gap-3 sm:gap-4 bg-[rgba(2,10,20,0.45)]">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {["Выручка", "Активные", "Ожидают"].map((label, idx) => (
                      <div
                        key={label}
                        className="rounded-xl sm:rounded-2xl p-2.5 sm:p-3"
                        style={{
                          background: "rgba(15,23,42,0.7)",
                          border: "1px solid rgba(148,163,184,0.2)",
                        }}
                      >
                        <div
                          className="text-[10px] sm:text-xs text-slate-400"
                          style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}
                        >
                          {label}
                        </div>
                        <div
                          className="mt-1 text-white text-sm sm:text-base"
                          style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800 }}
                        >
                          {idx === 0 ? "128 540 ₽" : idx === 1 ? "19" : "6"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="rounded-xl sm:rounded-2xl p-3 sm:p-4"
                    style={{
                      background: "rgba(15,23,42,0.66)",
                      border: "1px solid rgba(148,163,184,0.2)",
                    }}
                  >
                    <div className="h-24 sm:h-28 flex items-end gap-2 sm:gap-3">
                      {[28, 44, 38, 63, 51, 72, 58].map((h, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-t-lg"
                          style={{
                            height: `${h}%`,
                            background:
                              i === 6
                                ? "linear-gradient(180deg, rgba(96,165,250,0.95), rgba(37,99,235,0.72))"
                                : "rgba(148,163,184,0.35)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-xl sm:rounded-2xl overflow-hidden"
                    style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.64)" }}
                  >
                    <div className="grid grid-cols-4 px-3 sm:px-4 h-9 items-center text-[10px] sm:text-xs text-slate-400 border-b border-white/10">
                      <span>ID</span>
                      <span>Покупатель</span>
                      <span className="text-right">Сумма</span>
                      <span className="text-right">Статус</span>
                    </div>
                    <div className="divide-y divide-white/10">
                      {tableRows.map((row) => (
                        <div key={row.id} className="grid grid-cols-4 px-3 sm:px-4 h-10 sm:h-11 items-center text-[11px] sm:text-xs">
                          <span className="text-slate-300 truncate">{row.id}</span>
                          <span className="text-slate-300 truncate">{row.buyer}</span>
                          <span className="text-right text-slate-200 font-semibold">{row.sum}</span>
                          <span className="text-right">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px]"
                              style={{
                                background: "rgba(96,165,250,0.15)",
                                border: "1px solid rgba(96,165,250,0.28)",
                                color: "#BFDBFE",
                              }}
                            >
                              {row.status}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
