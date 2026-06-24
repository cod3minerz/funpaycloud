"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/auth/components/AuthShell";
import { authApi } from "@/lib/api";
import { sanitizeInput, validateEmail } from "@/lib/sanitize";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-[16px] text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-50 disabled:text-gray-400";

const errorInputClass =
  "h-11 w-full rounded-lg border border-red-400 bg-white px-4 py-2.5 text-[16px] text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-red-400 focus:ring-3 focus:ring-red-400/10 disabled:bg-gray-50";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error");
    if (oauthError) {
      toast.error(oauthError);
      params.delete("oauth_error");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
  }, []);

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!validateEmail(email)) errors.email = "Введите корректный email";
    if (!password.trim()) errors.password = "Введите пароль";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.login(sanitizeInput(email), sanitizeInput(password));
      router.push("/platform/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Вход" subtitle="Войдите в аккаунт, чтобы продолжить работу.">
      <form onSubmit={handleLogin} className="space-y-4">

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldErrors.email ? errorInputClass : inputClass}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        {/* Пароль */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <Link
              href="/auth/forgot"
              className="text-sm font-medium text-[#465fff] hover:opacity-80 transition-opacity"
            >
              Забыли пароль?
            </Link>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldErrors.password ? errorInputClass : inputClass}
          />
          {fieldErrors.password && (
            <p className="text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Кнопка */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#465fff] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3a52e0] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner /> : "Войти"}
          </button>
        </div>

        {/* Регистрация */}
        <p className="pt-1 text-center text-sm text-gray-500">
          Нет аккаунта?{" "}
          <Link href="/auth/register" className="font-semibold text-[#465fff] hover:opacity-80 transition-opacity">
            Зарегистрироваться
          </Link>
        </p>

      </form>
    </AuthShell>
  );
}
