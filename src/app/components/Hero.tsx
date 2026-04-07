"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

const sidebarItems = ["Дашборд", "Заказы", "Чаты", "Лоты", "Склад", "Аналитика", "Автоматизация"];
const metricCards = [
  { label: "Оборот за 24ч", value: "128 540 ₽", delta: "+18.4%" },
  { label: "Новые заказы", value: "94", delta: "+12" },
  { label: "Активные чаты", value: "31", delta: "7 ждут ответ" },
  { label: "Аптайм сервиса", value: "99.98%", delta: "Стабильно" },
];
const tableRows = [
  { id: "ORD-2048", buyer: "tonminerz", sum: "3 280 ₽", status: "Оплачен" },
  { id: "ORD-2047", buyer: "shop_pro", sum: "1 990 ₽", status: "В работе" },
  { id: "ORD-2046", buyer: "seller_hub", sum: "850 ₽", status: "Выдан" },
  { id: "ORD-2045", buyer: "nova_store", sum: "4 700 ₽", status: "Новый" },
];
const dialogRows = [
  { name: "dropx_hub", message: "Нужна повторная выдача", time: "2м", unread: true },
  { name: "pro_seller", message: "Оплата прошла, проверишь?", time: "8м", unread: true },
  { name: "black_cat", message: "Спасибо, всё получил", time: "21м", unread: false },
];
const activityRows = [
  { label: "Автовыдача", value: "37 заказов", state: "ok" },
  { label: "Поднятие лотов", value: "16 запусков", state: "ok" },
  { label: "Проблемные заказы", value: "2 требуют внимания", state: "warn" },
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

        <div className="w-full max-w-[1180px] px-1 sm:px-3 lg:px-0" style={{ perspective: "1380px" }}>
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <motion.div
              className="relative mx-auto w-[clamp(17.8rem,92vw,22rem)] sm:w-[min(100%,52rem)] lg:w-full"
              animate={{
                y: [0, isMobile ? -6 : -10, 0],
                scale: isMobile ? [0.985, 1, 0.985] : [0.958, 0.973, 0.958],
                rotateX: isMobile ? [13.2, 11.8, 13.2] : [22.8, 20.2, 22.8],
                rotateY: isMobile ? [-1.3, -0.7, -1.3] : [-2.2, -1.4, -2.2],
                boxShadow: [
                  "0 34px 84px rgba(2, 8, 23, 0.58)",
                  "0 62px 128px rgba(2, 8, 23, 0.76)",
                  "0 34px 84px rgba(2, 8, 23, 0.58)",
                ],
              }}
              transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d", transformOrigin: "center top" }}
            >
              <motion.div
                className="absolute left-1/2 top-[86%] -translate-x-1/2 w-[88%] h-20 rounded-full blur-3xl"
                animate={{ opacity: [0.32, 0.58, 0.32], scaleX: [0.93, 1.06, 0.93], y: [0, 3, 0] }}
                transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: "rgba(37,99,235,0.33)" }}
                aria-hidden="true"
              />

              <div
                className="relative rounded-[28px] overflow-hidden aspect-[11/13] sm:aspect-[16/12] lg:aspect-[16/10]"
                style={{
                  background: "linear-gradient(180deg, rgba(10,15,28,0.98) 0%, rgba(6,10,20,0.98) 100%)",
                  border: "1px solid rgba(148,163,184,0.28)",
                }}
              >
                <div
                  className="h-[56px] sm:h-[60px] flex items-center justify-between px-4 sm:px-6"
                  style={{
                    borderBottom: "1px solid rgba(148,163,184,0.2)",
                    background: "rgba(11,17,31,0.88)",
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
                      FunPay Cloud · Platform Dashboard
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 sm:gap-3">
                    <span className="h-8 sm:h-9 w-20 sm:w-36 rounded-lg border border-white/10 bg-white/[0.03]" />
                    <span className="h-8 sm:h-9 w-8 sm:w-9 rounded-full bg-blue-400/25 border border-blue-200/25" />
                  </div>
                </div>

                <div className="grid grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[214px_minmax(0,1fr)] h-[calc(100%-56px)] sm:h-[calc(100%-60px)]">
                  <aside
                    className="p-3 sm:p-4 lg:p-5"
                    style={{
                      borderRight: "1px solid rgba(148,163,184,0.2)",
                      background: "rgba(7,12,24,0.82)",
                    }}
                  >
                    <div className="mb-4 hidden sm:flex items-center gap-2">
                      <span className="h-8 w-8 rounded-xl bg-blue-500/25 border border-blue-300/30" />
                      <span className="text-sm text-slate-200 font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>
                        Операционный центр
                      </span>
                    </div>
                    <div className="space-y-2 sm:space-y-2.5">
                      {sidebarItems.map((item, idx) => (
                        <div
                          key={item}
                          className="h-9 sm:h-10 rounded-xl"
                          style={{
                            background: idx === 0 ? "rgba(59,130,246,0.22)" : "rgba(148,163,184,0.06)",
                            border: idx === 0 ? "1px solid rgba(96,165,250,0.4)" : "1px solid transparent",
                          }}
                        >
                          <div className="h-full px-2 sm:px-3.5 flex items-center gap-2.5 sm:gap-3">
                            <span className="h-3.5 w-3.5 rounded bg-white/45 shrink-0" />
                            <span
                              className="hidden sm:block text-xs text-slate-300 truncate"
                              style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}
                            >
                              {item}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden sm:block mt-6 p-3 rounded-xl border border-blue-200/20 bg-blue-500/10">
                      <div className="text-[11px] text-blue-200 font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>
                        Статус системы
                      </div>
                      <div className="mt-1 text-xs text-slate-300">Все сервисы работают стабильно</div>
                    </div>
                  </aside>

                  <div className="p-3 sm:p-5 lg:p-6 flex flex-col gap-3 sm:gap-4 lg:gap-5 bg-[rgba(2,9,18,0.76)] overflow-hidden">
                    <div
                      className="rounded-2xl p-3 sm:p-4 flex items-center justify-between"
                      style={{ border: "1px solid rgba(148,163,184,0.18)", background: "rgba(15,23,42,0.58)" }}
                    >
                      <div>
                        <div className="text-[11px] sm:text-xs text-slate-400">Operational overview</div>
                        <div className="text-sm sm:text-base text-slate-100 font-semibold">
                          Контроль заказов, чатов и лотов в одном экране
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="h-7 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-xs text-slate-300 inline-flex items-center">
                          Сегодня
                        </span>
                        <span className="h-7 px-3 rounded-lg border border-blue-300/30 bg-blue-500/20 text-xs text-blue-200 inline-flex items-center">
                          Live
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
                      {metricCards.map((card) => (
                        <div
                          key={card.label}
                          className="rounded-xl sm:rounded-2xl p-3 sm:p-4"
                          style={{
                            background: "rgba(15,23,42,0.7)",
                            border: "1px solid rgba(148,163,184,0.2)",
                          }}
                        >
                          <div
                            className="text-[10px] sm:text-xs text-slate-400"
                            style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}
                          >
                            {card.label}
                          </div>
                          <div
                            className="mt-1.5 text-white text-sm sm:text-base lg:text-lg"
                            style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800 }}
                          >
                            {card.value}
                          </div>
                          <div className="mt-1 text-[10px] sm:text-xs text-blue-200">{card.delta}</div>
                        </div>
                      ))}
                    </div>

                    <div className="sm:hidden grid grid-cols-2 gap-2.5">
                      <div
                        className="col-span-2 rounded-xl p-2.5"
                        style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.68)" }}
                      >
                        <div className="text-[10px] text-slate-300 mb-1.5">Выручка и выдача</div>
                        <div className="h-20 rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.9),rgba(8,13,24,0.78))]" />
                      </div>
                      <div
                        className="rounded-xl p-2.5"
                        style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.66)" }}
                      >
                        <div className="text-[10px] text-slate-300">Заказы</div>
                        <div className="mt-1 text-xs text-blue-100 font-semibold">94 активных</div>
                        <div className="text-[10px] text-slate-400 mt-1">6 требуют внимания</div>
                      </div>
                      <div
                        className="rounded-xl p-2.5"
                        style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.66)" }}
                      >
                        <div className="text-[10px] text-slate-300">Чаты</div>
                        <div className="mt-1 text-xs text-blue-100 font-semibold">31 открыто</div>
                        <div className="text-[10px] text-slate-400 mt-1">7 ждут ответа</div>
                      </div>
                    </div>

                    <div className="hidden sm:grid lg:grid-cols-[minmax(0,1fr)_280px] gap-3 sm:gap-4">
                      <div className="space-y-3 sm:space-y-4">
                        <div
                          className="rounded-2xl p-3 sm:p-4"
                          style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.68)" }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs sm:text-sm text-slate-200 font-semibold">Выручка и выдача за 7 дней</span>
                            <span className="text-[10px] sm:text-xs text-slate-400">обновлено 2 мин назад</span>
                          </div>
                          <div
                            className="h-36 sm:h-40 rounded-xl border border-white/10 p-2 sm:p-3"
                            style={{
                              background:
                                "linear-gradient(180deg, rgba(10,15,28,0.9), rgba(8,13,24,0.78))",
                            }}
                          >
                            <svg viewBox="0 0 620 220" className="w-full h-full">
                              <defs>
                                <linearGradient id="lineA" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
                                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.35" />
                                </linearGradient>
                                <linearGradient id="lineB" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.8" />
                                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.24" />
                                </linearGradient>
                              </defs>
                              <polyline
                                fill="none"
                                stroke="url(#lineA)"
                                strokeWidth="6"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                points="20,170 105,150 190,156 275,108 360,118 445,86 530,98 600,68"
                              />
                              <polyline
                                fill="none"
                                stroke="url(#lineB)"
                                strokeWidth="5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                points="20,184 105,166 190,146 275,152 360,130 445,138 530,120 600,104"
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-[minmax(0,1fr)_260px] gap-3 sm:gap-4">
                          <div
                            className="rounded-2xl overflow-hidden"
                            style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.64)" }}
                          >
                            <div className="grid grid-cols-4 px-3 sm:px-4 h-10 items-center text-[10px] sm:text-xs text-slate-400 border-b border-white/10">
                              <span>Заказ</span>
                              <span>Покупатель</span>
                              <span className="text-right">Сумма</span>
                              <span className="text-right">Статус</span>
                            </div>
                            <div className="divide-y divide-white/10">
                              {tableRows.map((row) => (
                                <div
                                  key={row.id}
                                  className="grid grid-cols-4 px-3 sm:px-4 h-11 sm:h-12 items-center text-[11px] sm:text-xs"
                                >
                                  <span className="text-slate-300 truncate">{row.id}</span>
                                  <span className="text-slate-300 truncate">{row.buyer}</span>
                                  <span className="text-right text-slate-100 font-semibold">{row.sum}</span>
                                  <span className="text-right">
                                    <span
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px]"
                                      style={{
                                        background:
                                          row.status === "Новый"
                                            ? "rgba(251,191,36,0.14)"
                                            : "rgba(96,165,250,0.15)",
                                        border:
                                          row.status === "Новый"
                                            ? "1px solid rgba(251,191,36,0.32)"
                                            : "1px solid rgba(96,165,250,0.28)",
                                        color: row.status === "Новый" ? "#FDE68A" : "#BFDBFE",
                                      }}
                                    >
                                      {row.status}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div
                            className="rounded-2xl p-3 sm:p-4"
                            style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.66)" }}
                          >
                            <div className="text-xs sm:text-sm text-slate-200 font-semibold">Недавние диалоги</div>
                            <div className="mt-3 space-y-2.5">
                              {dialogRows.map((row) => (
                                <div key={row.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-100 font-semibold">{row.name}</span>
                                    <span className="text-slate-500">{row.time}</span>
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-400 truncate">{row.message}</div>
                                  {row.unread ? <div className="mt-1 text-[10px] text-blue-200">Требует ответа</div> : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div
                          className="rounded-2xl p-3 sm:p-4"
                          style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.66)" }}
                        >
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            Статус системы: в норме
                          </div>
                          <div className="mt-2 text-[11px] text-slate-400">
                            API, очередь выдачи и модуль автоответов работают стабильно
                          </div>
                        </div>

                        <div
                          className="rounded-2xl p-3 sm:p-4"
                          style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.66)" }}
                        >
                          <div className="text-xs sm:text-sm text-slate-200 font-semibold">Операционный блок</div>
                          <div className="mt-3 space-y-2.5">
                            {activityRows.map((row) => (
                              <div key={row.label} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-300">{row.label}</span>
                                <span className={row.state === "warn" ? "text-amber-200" : "text-blue-200"}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          className="rounded-2xl p-3 sm:p-4"
                          style={{ border: "1px solid rgba(148,163,184,0.2)", background: "rgba(15,23,42,0.66)" }}
                        >
                          <div className="text-xs sm:text-sm text-slate-200 font-semibold">Быстрые действия</div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <span className="h-9 rounded-lg border border-blue-300/25 bg-blue-500/14 text-[11px] text-blue-100 inline-flex items-center justify-center">
                              Поднять лоты
                            </span>
                            <span className="h-9 rounded-lg border border-white/10 bg-white/[0.02] text-[11px] text-slate-300 inline-flex items-center justify-center">
                              Проверить чаты
                            </span>
                          </div>
                        </div>
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
