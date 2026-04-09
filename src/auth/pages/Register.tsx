"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AtSign, KeyRound, Ticket, UserRound } from "lucide-react";
import { AuthShell } from "@/auth/components/AuthShell";

const fieldClass =
  "h-12 w-full rounded-xl border border-slate-200/12 bg-[rgba(15,23,42,0.76)] px-4 text-[14px] text-white placeholder:text-slate-500 outline-none transition focus:border-blue-300/45 focus:ring-2 focus:ring-blue-400/25";

function strengthScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  return score;
}

export default function RegisterPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasPromo, setHasPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const score = useMemo(() => strengthScore(password), [password]);

  function handleRegister(event: FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim() || "user@funpay.cloud";
    router.push(`/auth/verify?mode=register&email=${encodeURIComponent(nextEmail)}`);
  }

  return (
    <AuthShell
      title="Создать аккаунт"
      subtitle="Запустите личное рабочее пространство FunPay Cloud и начните автоматизацию продаж."
      sideLabel="Auth / Register"
      sideTitle="Быстрый старт без сложного онбординга"
      sideText="Регистрация занимает пару минут: создайте аккаунт, подтвердите email-код и переходите к платформе."
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-slate-300">Никнейм</label>
          <div className="relative">
            <UserRound
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Например, seller_cloud"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-slate-300">Email</label>
          <div className="relative">
            <AtSign
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="email"
              className={`${fieldClass} pl-9`}
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-slate-300">Пароль</label>
          <div className="relative">
            <KeyRound
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="password"
              className={`${fieldClass} pl-9`}
              placeholder="Минимум 8 символов"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="grid gap-1 text-[12px] text-slate-400">
            <div className="inline-flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${password.length >= 8 ? "bg-emerald-400" : "bg-slate-500"}`}
              />
              Минимум 8 символов
            </div>
            <div className="inline-flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  /[a-zA-Z]/.test(password) && /\d/.test(password) ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
              Желательно сочетать буквы и цифры
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="text-slate-500">Сила пароля:</span>
              <span className="font-semibold text-slate-300">
                {score === 0 ? "Слабый" : score === 1 ? "Базовый" : score === 2 ? "Хороший" : "Надежный"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-slate-300">Подтверждение пароля</label>
          <input
            type="password"
            className={fieldClass}
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        <div className="rounded-xl border border-slate-200/12 bg-[rgba(15,23,42,0.62)] p-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-200 hover:text-white"
            onClick={() => setHasPromo((prev) => !prev)}
          >
            <Ticket size={14} />
            {hasPromo ? "Скрыть промокод" : "У меня есть промокод"}
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

        <button type="submit" className="platform-btn-primary h-12 w-full rounded-xl text-[14px] font-bold">
          Создать аккаунт <ArrowRight size={15} />
        </button>

        <p className="pt-1 text-center text-[13px] text-slate-400">
          Уже есть аккаунт?{" "}
          <Link href="/auth/login" className="font-semibold text-blue-300 hover:text-blue-200">
            Войти
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
