"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { BarChart3, CheckCircle2, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/app/components/BrandLogo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  sideLabel: string;
  sideTitle: string;
  sideText: string;
};

const sideStats = [
  { label: "Стабильность", value: "99.98%" },
  { label: "Средняя выдача", value: "0.3с" },
  { label: "Онбординг", value: "10 мин" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  sideLabel,
  sideTitle,
  sideText,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030712] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 500px at 10% -20%, rgba(59,130,246,0.18), transparent 65%), radial-gradient(900px 540px at 100% 10%, rgba(37,99,235,0.14), transparent 64%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <Link href="/" className="inline-flex">
          <BrandLogo compact className="h-8 md:h-9" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/15 bg-[rgba(9,14,25,0.86)] shadow-[0_30px_80px_rgba(2,6,18,0.45)]"
        >
          <div className="grid min-h-[640px] grid-cols-1 md:grid-cols-[minmax(0,470px)_minmax(0,1fr)]">
            <section className="flex flex-col border-r border-transparent p-5 sm:p-8 md:border-slate-200/10 md:p-10">
              <div className="max-w-[380px]">
                <h1
                  className="m-0 text-[clamp(28px,4vw,42px)] font-black leading-[1.06] tracking-[-0.02em] text-white"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {title}
                </h1>
                <p
                  className="mt-3 text-[14px] leading-7 text-slate-300 sm:text-[15px]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {subtitle}
                </p>
              </div>

              <div className="mt-7 w-full max-w-[380px]">{children}</div>

              <div className="mt-auto hidden max-w-[380px] pt-6 text-[12px] text-slate-400 sm:block">
                Продолжая, вы принимаете{" "}
                <a href="#" className="text-slate-300 hover:text-white">
                  условия использования
                </a>{" "}
                и{" "}
                <a href="#" className="text-slate-300 hover:text-white">
                  политику конфиденциальности
                </a>
                .
              </div>
            </section>

            <aside className="relative hidden min-h-full overflow-hidden md:block">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 110% at 0% 0%, rgba(80,140,255,0.24), transparent 52%), radial-gradient(90% 90% at 100% 100%, rgba(37,99,235,0.22), transparent 57%), linear-gradient(180deg, rgba(10,16,31,0.96) 0%, rgba(6,10,20,0.94) 100%)",
                }}
              />

              <div className="relative z-10 grid h-full content-between p-8">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-blue-400/10 px-3 py-1 text-[11px] font-semibold text-blue-200">
                    <Sparkles size={12} />
                    {sideLabel}
                  </span>
                  <h2 className="mt-4 text-[31px] font-black leading-tight tracking-[-0.02em] text-white">{sideTitle}</h2>
                  <p className="mt-3 max-w-[520px] text-[14px] leading-7 text-slate-300">{sideText}</p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2.5">
                    {sideStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-slate-200/10 bg-[rgba(15,23,42,0.72)] p-3"
                      >
                        <div className="text-[11px] text-slate-400">{stat.label}</div>
                        <div className="mt-1 text-[15px] font-bold text-slate-100">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2.5 rounded-2xl border border-slate-200/10 bg-[rgba(9,15,28,0.65)] p-3.5">
                    <div className="inline-flex items-center gap-2 text-[12px] text-slate-300">
                      <BarChart3 size={13} />
                      Контроль заказов и чатов в одном интерфейсе
                    </div>
                    <div className="inline-flex items-center gap-2 text-[12px] text-slate-300">
                      <MessageSquare size={13} />
                      Реакция на запросы покупателей без ручной рутины
                    </div>
                    <div className="inline-flex items-center gap-2 text-[12px] text-slate-300">
                      <ShieldCheck size={13} />
                      Защита аккаунтов и операций в облачной среде
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200/18 bg-[rgba(59,130,246,0.12)] p-3.5">
                    <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-blue-100">
                      <CheckCircle2 size={13} />
                      Production-ready workspace
                    </div>
                    <p className="mt-1 text-[12px] leading-6 text-blue-100/85">
                      Авторизация, мониторинг, автоматизация и работа с аккаунтами внутри единой платформы.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
