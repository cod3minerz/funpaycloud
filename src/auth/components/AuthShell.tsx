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
      <div className="auth-scope-backdrop pointer-events-none absolute inset-0" />

      <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] sm:px-6 sm:pb-6 sm:pt-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="auth-panel w-full max-w-[460px]"
        >
          <div className="auth-panel-body px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-6">
            <div className="mb-4 flex justify-center">
              <Link href="/" aria-label="FunPay Cloud" className="inline-flex">
                <BrandLogo className="h-8 w-auto" />
              </Link>
            </div>

            <header className="mb-5 text-center">
              <h1 className="auth-scope-title text-[clamp(34px,4vw,40px)] font-black leading-[1.05] tracking-[-0.02em] text-[var(--ink)]">
                {title}
              </h1>
              <p className="auth-scope-subtitle mx-auto mt-2.5 max-w-[390px] text-[14px] leading-6 text-[var(--ink-2)] sm:text-[15px]">
                {subtitle}
              </p>
            </header>

            <div className="auth-content">{children}</div>
          </div>
        </motion.section>

        <p className="auth-legal-note mt-3 w-full max-w-[460px] px-4 text-center text-[12px] leading-5 text-[var(--muted)] sm:px-6">
          Продолжая, вы принимаете{" "}
          <a href="/legal/terms-of-service" className="font-semibold text-[var(--accent)] hover:opacity-90">
            условия
          </a>{" "}
          и{" "}
          <a href="/legal/privacy-policy" className="font-semibold text-[var(--accent)] hover:opacity-90">
            политику
          </a>
          .
        </p>
      </main>
    </div>
  );
}
