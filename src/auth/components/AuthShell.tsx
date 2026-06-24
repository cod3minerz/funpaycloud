"use client";

import Link from "next/link";
import { BrandLogo } from "@/app/components/BrandLogo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[420px]">

        {/* Лого */}
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="FunPay Cloud">
            <BrandLogo className="h-8 w-auto" />
          </Link>
        </div>

        {/* Карточка */}
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-theme-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          {children}
        </div>

        {/* Юридика */}
        <p className="mt-5 text-center text-xs text-gray-400">
          Продолжая, вы принимаете{" "}
          <a href="/legal/terms" className="font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2">
            Условия использования
          </a>{" "}
          и{" "}
          <a href="/legal/privacy" className="font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2">
            Политику конфиденциальности
          </a>.
        </p>
      </div>
    </div>
  );
}
