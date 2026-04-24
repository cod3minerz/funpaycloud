"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/auth/components/AuthShell";
import { authApi } from "@/lib/api";
import { clearStoredReferralCode } from "@/lib/referral";

function maskEmail(email: string) {
  const normalized = email.trim() || "user@funpay.cloud";
  const [name, domain] = normalized.split("@");
  if (!domain) return normalized;
  const safeName = name.length <= 2 ? `${name[0] || "*"}*` : `${name.slice(0, 2)}***`;
  return `${safeName}@${domain}`;
}

type VerifyCodePageProps = {
  email?: string;
  mode?: string;
};

export default function VerifyCodePage({ email: rawEmail, mode: rawMode }: VerifyCodePageProps) {
  const router = useRouter();
  const email = rawEmail || "user@funpay.cloud";
  const mode = rawMode === "reset" ? "reset" : "register";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(25);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((prev) => Math.max(0, prev - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  function setDigit(index: number, value: string) {
    const number = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = number;
      return next;
    });
    if (number && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (values.length < 1) return;

    setDigits((prev) => {
      const next = [...prev];
      values.forEach((value, index) => {
        next[index] = value;
      });
      return next;
    });

    const focusIndex = Math.min(values.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      toast.error("Введите 6-значный код");
      return;
    }

    setLoading(true);
    try {
      if (mode === "reset") {
        const data = await authApi.verifyResetCode(email, code);
        router.push(`/auth/reset?token=${encodeURIComponent(data.reset_token)}`);
      } else {
        await authApi.verify(email, code);
        clearStoredReferralCode();
        router.push("/platform/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Неверный код");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await authApi.resendCode(email, mode);
      toast.success("Код отправлен повторно");
      setSeconds(25);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось отправить код повторно");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthShell
      title={mode === "reset" ? "Код восстановления" : "Код подтверждения"}
      subtitle={mode === "reset" ? "Введите 6-значный код из письма для сброса пароля." : "Введите 6-значный код, отправленный на вашу почту."}
    >
      <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-5">
        <div className="rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] p-3 text-center text-[13px] text-[var(--ink-2)]">
          Код отправлен на <span className="font-semibold text-[var(--ink)]">{maskEmail(email)}</span>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2.5">
            {digits.map((value, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                value={value}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                maxLength={1}
                inputMode="numeric"
                className="auth-code-input h-12 rounded-xl border border-[var(--line-2)] bg-[var(--card)] text-center text-[20px] font-bold text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-btn-main inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e1116] text-white hover:opacity-90 active:scale-[0.98] transition-all text-[14px] font-bold disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <>{mode === "reset" ? "Продолжить" : "Подтвердить"} <ArrowRight size={15} /></>
          )}
        </button>

        <div className="flex flex-col items-center gap-2 text-[13px]">
          <button
            type="button"
            className="text-[var(--ink-2)] transition hover:text-[var(--ink)] disabled:opacity-50"
            onClick={handleResend}
            disabled={seconds > 0 || resendLoading}
          >
            <span className="inline-flex items-center gap-1.5">
              {resendLoading ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              {seconds > 0 ? `Отправить повторно через ${seconds}с` : "Отправить код повторно"}
            </span>
          </button>
          <Link
            href={mode === "reset" ? "/auth/forgot" : "/auth/register"}
            className="inline-flex items-center gap-1.5 text-[var(--muted)] transition hover:text-[var(--ink-2)]"
          >
            <ArrowLeft size={13} />
            Изменить email
          </Link>
        </div>

        <p className="text-center text-[12px] leading-5 text-[var(--muted)]">
          Если не видите письмо, проверьте папку <span className="font-semibold text-[var(--ink-2)]">Спам</span>.
        </p>
      </form>
    </AuthShell>
  );
}
