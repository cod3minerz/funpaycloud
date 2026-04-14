"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { BrandLogo } from "@/app/components/BrandLogo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030712] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 0% -20%, rgba(59,130,246,0.18), transparent 62%), radial-gradient(860px 520px at 100% 0%, rgba(37,99,235,0.14), transparent 64%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="w-full max-w-[470px] rounded-2xl border border-slate-200/14 bg-[rgba(9,14,25,0.9)] p-5 shadow-[0_26px_70px_rgba(1,5,16,0.5)] sm:p-8"
        >
          <div className="mb-7 flex justify-center">
            <Link href="/" aria-label="FunPay Cloud" className="inline-flex">
              <BrandLogo compact className="h-9" />
            </Link>
          </div>

          <header className="mb-6 text-center sm:mb-7">
            <h1
              className="text-[clamp(28px,4vw,36px)] font-black leading-[1.08] tracking-[-0.02em] text-white"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {title}
            </h1>
            <p
              className="mx-auto mt-3 max-w-[380px] text-[14px] leading-6 text-slate-300 sm:text-[15px]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {subtitle}
            </p>
          </header>

          {children}

          <footer className="mt-6 border-t border-slate-200/10 pt-4 text-center text-[12px] leading-5 text-slate-400">
            Продолжая, вы принимаете{" "}
            <a href="#" className="text-slate-300 hover:text-white">
              условия
            </a>{" "}
            и{" "}
            <a href="#" className="text-slate-300 hover:text-white">
              политику
            </a>
            .
          </footer>
        </motion.section>
      </main>
    </div>
  );
}
