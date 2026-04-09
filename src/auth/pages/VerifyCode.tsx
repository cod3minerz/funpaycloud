"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { AuthShell } from "@/auth/components/AuthShell";

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
  const mode = rawMode || "register";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(25);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(""), [digits]);

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

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    router.push("/platform/dashboard");
  }

  return (
    <AuthShell
      title="Подтверждение email"
      subtitle="Введите 6-значный код, который отправлен на вашу почту. Это финальный шаг перед входом в платформу."
      sideLabel="Auth / Verification"
      sideTitle={mode === "login" ? "Подтверждение входа" : "Подтверждение регистрации"}
      sideText="Код действует ограниченное время и нужен для безопасного доступа к рабочему пространству."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-slate-200/12 bg-[rgba(15,23,42,0.7)] p-3 text-[13px] text-slate-300">
          Код отправлен на <span className="font-semibold text-slate-100">{maskEmail(email)}</span>
        </div>

        <div className="space-y-2" onPaste={handlePaste}>
          <label className="text-[13px] font-semibold text-slate-300">6-значный код</label>
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
                className="h-12 rounded-xl border border-slate-200/12 bg-[rgba(15,23,42,0.78)] text-center text-lg font-bold text-white outline-none transition focus:border-blue-300/45 focus:ring-2 focus:ring-blue-400/25"
              />
            ))}
          </div>
          <p className="text-[12px] text-slate-400">Для теста можно ввести любой код.</p>
        </div>

        <button type="submit" className="platform-btn-primary h-12 w-full rounded-xl text-[14px] font-bold">
          Подтвердить <ArrowRight size={15} />
        </button>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/14 bg-[rgba(15,23,42,0.64)] text-[13px] font-semibold text-slate-300 transition hover:text-white disabled:opacity-50"
            onClick={() => setSeconds(25)}
            disabled={seconds > 0}
          >
            <RotateCcw size={14} />
            {seconds > 0 ? `Повтор через ${seconds}с` : "Отправить код повторно"}
          </button>
          <Link
            href={mode === "login" ? "/auth/login" : "/auth/register"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/14 bg-[rgba(15,23,42,0.64)] text-[13px] font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Изменить email
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
