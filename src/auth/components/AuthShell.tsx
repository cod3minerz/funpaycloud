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
    <div className="landing auth-scope relative min-h-[100dvh] bg-[var(--bg)]">
      <div className="auth-scope-backdrop pointer-events-none absolute inset-0" />
      <div className="auth-scope-pattern pointer-events-none absolute inset-0" />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[560px] items-center justify-center p-4 sm:p-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="auth-panel relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--card)] shadow-[0_28px_60px_-34px_rgba(0,0,0,0.16)]"
      >
        <div className="auth-head px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
          <Link href="/" aria-label="FunPay Cloud" className="mb-5 inline-flex">
            <BrandLogo className="h-8 w-auto" />
          </Link>
          <h1 className="auth-scope-title text-center text-[40px] font-extrabold tracking-tight text-[var(--ink)] sm:text-[44px]">
            {title}
          </h1>
          <p className="auth-scope-subtitle mx-auto mt-3 text-center text-[16px] leading-relaxed text-[var(--ink-2)]">
            {subtitle}
          </p>
        </div>

        <div className="auth-content px-6 pb-6 sm:px-8">
          {children}
        </div>

        <div className="auth-legal border-t border-[var(--line)] px-6 py-4 sm:px-8">
          <p className="text-center text-[13px] leading-relaxed text-[var(--muted)]">
            Продолжая, вы принимаете{" "}
            <a href="/legal/terms-of-service" className="font-semibold text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]">
              Условия
            </a>{" "}
            и{" "}
            <a href="/legal/privacy-policy" className="font-semibold text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]">
              Политику конфиденциальности
            </a>.
          </p>
        </div>
      </motion.section>
      </main>
    </div>
  );
}
