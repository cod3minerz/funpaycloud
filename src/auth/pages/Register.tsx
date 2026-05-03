"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/auth/components/AuthShell";
import { authApi } from "@/lib/api";
import { readStoredReferralCode, storeReferralCode } from "@/lib/referral";
import { sanitizeInput, validateEmail, validatePassword } from "@/lib/sanitize";

const fieldClass =
  "auth-input h-12 w-full rounded-xl border border-[var(--line-2)] bg-[var(--bg)] px-4 text-[16px] font-medium text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-all focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

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
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasPromo, setHasPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const score = useMemo(() => strengthScore(password), [password]);

  useEffect(() => {
    const fromUrl = (searchParams.get('ref') || '').trim();
    const stored = fromUrl ? storeReferralCode(fromUrl) : readStoredReferralCode();
    setReferralCode(stored);
  }, [searchParams]);

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
        {
          referral_code: referralCode || undefined,
          promo_code: promoCode ? sanitizeInput(promoCode) : undefined,
        },
      );
      router.push(`/auth/verify?mode=register&email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка регистрации";
      if (message.toLowerCase().includes("почта уже зарегистрирована")) {
        setFieldErrors((prev) => ({ ...prev, email: "Почта уже зарегистрирована. Войдите в аккаунт." }));
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создайте аккаунт и запустите рабочее пространство FunPay Cloud."
    >
      <form onSubmit={handleRegister} className="space-y-5">
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
              <span>Минимум 8 символов, буквы и цифры</span>
              <span className="text-[var(--line-2)]">•</span>
              <span className="text-[var(--ink-2)] font-medium">
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

        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]">
            <input
              type="checkbox"
              checked={hasPromo}
              onChange={(event) => setHasPromo(event.target.checked)}
              className="h-4 w-4 rounded border border-[var(--line-2)] accent-[var(--accent)]"
            />
            <Ticket size={16} />
            Есть промокод
          </label>
          {hasPromo && (
            <div className="animate-in slide-in-from-top-2">
              <input
                className={fieldClass}
                placeholder="Введите код"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="auth-btn-main flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e1116] text-white hover:opacity-90 active:scale-[0.98] transition-all text-[15px] font-bold disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>Создать аккаунт <ArrowRight size={18} /></>
            )}
          </button>

          <button
            type="button"
            className="auth-btn-secondary flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--line-2)] bg-[var(--card)] hover:bg-[var(--bg)] active:scale-[0.98] transition-all text-[15px] font-bold text-[var(--ink)]"
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
