"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    router.push("/platform/dashboard");
  }

  return (
    <AuthShell
      title="Код подтверждения"
      subtitle="Введите 6-значный код, отправленный на вашу почту."
    >
      <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-5">
        <div className="rounded-xl border border-slate-200/12 bg-[rgba(15,23,42,0.65)] p-3 text-center text-[13px] text-slate-300">
          Код отправлен на <span className="font-semibold text-slate-100">{maskEmail(email)}</span>
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
                className="h-12 rounded-xl border border-slate-200/12 bg-[rgba(15,23,42,0.78)] text-center text-[20px] font-bold text-white outline-none transition focus:border-blue-300/45 focus:ring-2 focus:ring-blue-400/25"
              />
            ))}
          </div>
          <p className="text-center text-[12px] text-slate-400">Для теста подходит любой код.</p>
        </div>

        <button type="submit" className="platform-btn-primary h-12 w-full rounded-xl text-[14px] font-bold">
          Подтвердить <ArrowRight size={15} />
        </button>

        <div className="flex flex-col items-center gap-2 text-[13px]">
          <button
            type="button"
            className="text-slate-300 transition hover:text-white disabled:opacity-50"
            onClick={() => setSeconds(25)}
            disabled={seconds > 0}
          >
            <span className="inline-flex items-center gap-1.5">
              <RotateCcw size={13} />
              {seconds > 0 ? `Отправить повторно через ${seconds}с` : "Отправить код повторно"}
            </span>
          </button>
          <Link
            href={mode === "login" ? "/auth/login" : "/auth/register"}
            className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-slate-200"
          >
            <ArrowLeft size={13} />
            Изменить email
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
