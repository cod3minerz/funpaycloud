"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/auth/components/AuthShell";

const fieldClass =
  "h-12 w-full rounded-xl border border-slate-200/12 bg-[rgba(15,23,42,0.72)] px-4 text-[14px] text-white placeholder:text-slate-500 outline-none transition focus:border-blue-300/45 focus:ring-2 focus:ring-blue-400/25";

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.25-.95 2.31-2.02 3.02l3.27 2.53c1.9-1.75 3-4.32 3-7.36 0-.7-.06-1.37-.17-2.02H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.27-2.53c-.9.61-2.05.97-3.36.97-2.58 0-4.76-1.74-5.54-4.08H3.1v2.57A10 10 0 0 0 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.46 13.92A6 6 0 0 1 6.13 12c0-.67.12-1.31.33-1.92V7.51H3.1A10 10 0 0 0 2 12c0 1.62.39 3.16 1.1 4.49l3.36-2.57z"
      />
      <path
        fill="#FBBC05"
        d="M12 6c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.96 2.98 14.7 2 12 2a10 10 0 0 0-8.9 5.51l3.36 2.57C7.24 7.74 9.42 6 12 6z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function goVerify() {
    const nextEmail = email.trim() || "user@funpay.cloud";
    router.push(`/auth/verify?mode=login&email=${encodeURIComponent(nextEmail)}`);
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    goVerify();
  }

  return (
    <AuthShell
      title="Вход"
      subtitle="Войдите в аккаунт, чтобы продолжить работу в FunPay Cloud."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-slate-300">Email</label>
          <input
            className={fieldClass}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[13px] font-semibold text-slate-300">Пароль</label>
            <a href="#" className="text-[12px] text-blue-300 hover:text-blue-200">
              Забыли пароль?
            </a>
          </div>
          <input
            className={fieldClass}
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button type="submit" className="platform-btn-primary h-12 w-full rounded-xl text-[14px] font-bold">
          Войти <ArrowRight size={15} />
        </button>

        <button
          type="button"
          onClick={goVerify}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/16 bg-[rgba(15,23,42,0.72)] text-[14px] font-semibold text-slate-200 transition hover:bg-slate-700/30"
        >
          <GoogleMark />
          Войти через Google
        </button>

        <p className="pt-1 text-center text-[13px] text-slate-400">
          Нет аккаунта?{" "}
          <Link href="/auth/register" className="font-semibold text-blue-300 hover:text-blue-200">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
