"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/auth/components/AuthShell";
import { authApi } from "@/lib/api";
import { sanitizeInput, validateEmail } from "@/lib/sanitize";

const fieldClass =
  "auth-input h-12 w-full rounded-xl border border-[var(--line-2)] bg-[var(--card)] px-4 text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

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
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

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
      await authApi.login(
        sanitizeInput(email),
        sanitizeInput(password),
      );
      router.push("/platform/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Вход"
      subtitle="Войдите в аккаунт, чтобы продолжить работу в FunPay Cloud."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-[var(--ink-2)]">Email</label>
          <input
            className={fieldClass}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {fieldErrors.email && (
            <p className="text-[12px] text-[var(--bad)]">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-[var(--ink-2)]">Пароль</label>
          <input
            className={fieldClass}
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldErrors.password && (
            <p className="text-[12px] text-[var(--bad)]">{fieldErrors.password}</p>
          )}
        </div>

        <div className="auth-actions space-y-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary auth-btn-main h-12 w-full justify-center rounded-xl text-[14px] font-bold disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <>Войти <ArrowRight size={15} /></>}
          </button>

          <button
            type="button"
            className="btn btn-outline auth-btn-secondary h-12 w-full justify-center rounded-xl text-[14px] font-semibold"
          >
            <GoogleMark />
            Войти через Google
          </button>
        </div>

        <p className="pt-1 text-center text-[13px] leading-6 text-[var(--muted)]">
          Нет аккаунта?{" "}
          <Link href="/auth/register" className="font-semibold text-[var(--accent)] hover:opacity-90">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
