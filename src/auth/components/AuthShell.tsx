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

      <main className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-[560px] place-items-center px-3 py-[max(4px,env(safe-area-inset-top))] sm:px-4 sm:py-1">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="auth-panel relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--card)] shadow-[0_20px_44px_-30px_rgba(0,0,0,0.14)]"
        >
          <div className="auth-head px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <Link href="/" aria-label="FunPay Cloud" className="mb-4 inline-flex items-center">
              <BrandLogo className="h-7 w-auto sm:h-8" />
            </Link>
            <h1 className="auth-scope-title text-[42px] font-extrabold tracking-tight text-[var(--ink)] sm:text-[46px]">
              {title}
            </h1>
            <p className="auth-scope-subtitle mt-3 text-[16px] leading-relaxed text-[var(--ink-2)]">
              {subtitle}
            </p>
          </div>

          <div className="auth-content px-5 pb-5 sm:px-6 sm:pb-6">
            {children}
          </div>

          <div className="auth-legal border-t border-[var(--line)] px-5 py-3 sm:px-6 sm:py-3.5">
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
