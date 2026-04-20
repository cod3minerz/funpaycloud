"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/auth/components/AuthShell";
import { authApi } from "@/lib/api";
import { sanitizeInput, validateEmail, validatePassword } from "@/lib/sanitize";

const fieldClass =
  "h-11 w-full rounded-xl border border-[var(--line-2)] bg-[var(--bg)] px-4 text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] sm:h-12";

function strengthScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  return score;
}

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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasPromo, setHasPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const score = useMemo(() => strengthScore(password), [password]);

  function validate(): boolean {
    const errors: { email?: string; password?: string; confirm?: string } = {};
    if (!validateEmail(email)) errors.email = "Введите корректный email";
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) errors.password = pwdCheck.error;
    if (password !== confirmPassword) errors.confirm = "Пароли не совпадают";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.register(
        sanitizeInput(email),
        sanitizeInput(password),
        promoCode ? sanitizeInput(promoCode) : undefined,
      );
      router.push(`/auth/verify?mode=register&email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создайте аккаунт и запустите рабочее пространство FunPay Cloud."
    >
      <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-[var(--ink-2)]">Email</label>
          <input
            type="email"
            className={fieldClass}
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
            type="password"
            className={fieldClass}
            placeholder="Минимум 8 символов"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldErrors.password ? (
            <p className="text-[12px] text-[var(--bad)]">{fieldErrors.password}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
              <span>Минимум 8 символов</span>
              <span className="text-[var(--line-2)]">•</span>
              <span>Буквы и цифры</span>
              <span className="text-[var(--line-2)]">•</span>
              <span className="text-[var(--ink-2)]">
                {score === 0 ? "Слабый" : score === 1 ? "Базовый" : score === 2 ? "Хороший" : "Надежный"}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-[var(--ink-2)]">Подтверждение пароля</label>
          <input
            type="password"
            className={fieldClass}
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {fieldErrors.confirm && (
            <p className="text-[12px] text-[var(--bad)]">{fieldErrors.confirm}</p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] p-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]"
            onClick={() => setHasPromo((prev) => !prev)}
          >
            <Ticket size={14} />
            {hasPromo ? "Скрыть промокод" : "Есть промокод"}
          </button>
          {hasPromo && (
            <input
              className={`${fieldClass} mt-3`}
              placeholder="Введите промокод"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
            />
          )}
        </div>

        <div className="space-y-2.5 pt-0.5">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary h-12 w-full justify-center rounded-xl text-[14px] font-bold disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>Создать аккаунт <ArrowRight size={15} /></>
            )}
          </button>

          <button
            type="button"
            className="btn btn-outline h-12 w-full justify-center rounded-xl text-[14px] font-semibold"
          >
            <GoogleMark />
            Зарегистрироваться с Google
          </button>
        </div>

        <p className="text-center text-[13px] leading-6 text-[var(--muted)]">
          Уже есть аккаунт?{" "}
          <Link href="/auth/login" className="font-semibold text-[var(--accent)] hover:opacity-90">
            Войти
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
