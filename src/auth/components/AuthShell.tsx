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
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(860px 520px at 0% -30%, rgba(58,47,224,0.08), transparent 62%), radial-gradient(820px 520px at 100% 0%, rgba(58,47,224,0.06), transparent 64%)",
        }}
      />

      <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-[max(14px,env(safe-area-inset-top))] sm:px-6 sm:py-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="scrollbar-hide w-full max-w-[520px] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-[0_30px_60px_-28px_rgba(14,17,22,.18)] max-h-[calc(100dvh-28px)] sm:max-h-[calc(100dvh-48px)]"
        >
          <div className="px-6 pt-6 sm:px-9 sm:pt-8">
            <div className="mb-5 flex justify-center sm:mb-6">
              <Link href="/" aria-label="FunPay Cloud" className="inline-flex">
                <BrandLogo className="h-8 w-auto" />
              </Link>
            </div>

            <header className="mb-6 text-center sm:mb-7">
              <h1
                className="text-[clamp(28px,4vw,36px)] font-black leading-[1.08] tracking-[-0.02em] text-[var(--ink)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {title}
              </h1>
              <p
                className="mx-auto mt-3 max-w-[380px] text-[14px] leading-6 text-[var(--ink-2)] sm:text-[15px]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {subtitle}
              </p>
            </header>
          </div>

          <div className="px-6 pb-5 sm:px-9 sm:pb-6">{children}</div>

          <footer className="border-t border-[var(--line)] px-6 pb-4 pt-4 text-center text-[12px] leading-5 text-[var(--muted)] sm:px-9 sm:pb-5">
            Продолжая, вы принимаете{" "}
            <a href="/legal/terms-of-service" className="font-semibold text-[var(--accent)] hover:opacity-90">
              условия
            </a>{" "}
            и{" "}
            <a href="/legal/privacy-policy" className="font-semibold text-[var(--accent)] hover:opacity-90">
              политику
            </a>
            .
          </footer>
        </motion.section>
      </main>
    </div>
  );
}
