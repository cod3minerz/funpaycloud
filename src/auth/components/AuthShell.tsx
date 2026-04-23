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
    <div className="landing auth-scope relative min-h-[100dvh] overflow-x-hidden bg-[var(--bg)] text-[var(--ink)]">
      <div className="auth-scope-backdrop pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--bg)] to-[var(--bg-2)]" />

      <main className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex justify-center sm:mb-8">
          <Link href="/" aria-label="FunPay Cloud" className="inline-flex drop-shadow-sm transition-transform hover:scale-105">
            <BrandLogo className="h-8 sm:h-9 w-auto" />
          </Link>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="auth-panel w-full max-w-[440px] rounded-[24px] bg-[var(--card)] shadow-[0_12px_48px_rgba(0,0,0,0.06)] ring-1 ring-[var(--line)]/50 p-6 sm:p-8"
        >
          <header className="mb-6 text-center">
            <h1 className="auth-scope-title text-[26px] font-extrabold tracking-tight text-[var(--ink)] sm:text-[30px]">
              {title}
            </h1>
            <p className="auth-scope-subtitle mx-auto mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
              {subtitle}
            </p>
          </header>

          <div className="auth-content mb-6">
            {children}
          </div>

          <div className="border-t border-[var(--line)]/50 pt-5">
            <p className="text-center text-[12px] leading-relaxed text-[var(--muted)]">
              Продолжая, вы принимаете{" "}
              <a href="/legal/terms-of-service" className="font-semibold text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]">
                Условия
              </a>{" "}
              и{" "}
              <a href="/legal/privacy-policy" className="font-semibold text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]">
                Политику конфиденциальности
              </a>
              .
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
