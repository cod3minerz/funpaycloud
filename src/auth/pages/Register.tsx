"use client";

import { FormEvent, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/auth/components/AuthShell";
import { authApi } from "@/lib/api";
import { readStoredReferralCode, storeReferralCode } from "@/lib/referral";
import { sanitizeInput, validateEmail, validatePassword } from "@/lib/sanitize";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-[16px] text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#8098f9] focus:ring-3 focus:ring-[#465fff]/10 disabled:bg-gray-50 disabled:text-gray-400";

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

function strengthScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  return score;
}

const strengthLabel = ["", "Слабый", "Хороший", "Надёжный"] as const;
const strengthBarColor = ["", "bg-red-400", "bg-yellow-400", "bg-green-500"] as const;

function RegisterForm() {
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
    const fromUrl = (searchParams.get("ref") || "").trim();
    const stored = fromUrl ? storeReferralCode(fromUrl) : readStoredReferralCode();
    setReferralCode(stored);
  }, [searchParams]);

  useEffect(() => {
    const oauthError = (searchParams.get("oauth_error") || "").trim();
    if (!oauthError) return;
    toast.error(oauthError);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("oauth_error");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
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
    <AuthShell title="Регистрация" subtitle="Создайте аккаунт и запустите автоматизацию FunPay.">
      <form onSubmit={handleRegister} className="space-y-4">

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
          <label className="block text-sm font-medium text-gray-700">Пароль</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Минимум 8 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldErrors.password ? errorInputClass : inputClass}
          />
          {fieldErrors.password ? (
            <p className="text-xs text-red-500">{fieldErrors.password}</p>
          ) : (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                      password.length > 0 && score >= i ? strengthBarColor[score] : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              {password.length > 0 && (
                <p className="text-xs text-gray-400">{strengthLabel[score]}</p>
              )}
            </div>
          )}
        </div>

        {/* Подтверждение пароля */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Повторите пароль</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldErrors.confirm ? errorInputClass : inputClass}
          />
          {fieldErrors.confirm && (
            <p className="text-xs text-red-500">{fieldErrors.confirm}</p>
          )}
        </div>

        {/* Промокод */}
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={hasPromo}
              onChange={(e) => setHasPromo(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-[#465fff]"
            />
            <span className="text-sm font-medium text-gray-700">Есть промокод</span>
          </label>
          {hasPromo && (
            <input
              className={inputClass}
              placeholder="Введите промокод"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
          )}
        </div>

        {/* Кнопка */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#465fff] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3a52e0] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner /> : "Создать аккаунт"}
          </button>
        </div>

        {/* Вход */}
        <p className="pt-1 text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link href="/auth/login" className="font-semibold text-[#465fff] hover:opacity-80 transition-opacity">
            Войти
          </Link>
        </p>

      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
