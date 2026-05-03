"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/auth/components/AuthShell";
import { authApi } from "@/lib/api";
import { sanitizeInput, validateEmail } from "@/lib/sanitize";

const fieldClass =
  "auth-input h-12 w-full rounded-xl border border-[var(--line-2)] bg-[var(--bg)] px-4 text-[16px] font-medium text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-all focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = sanitizeInput(email).toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      setError("Введите корректный email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(normalizedEmail);
      toast.success("Код восстановления отправлен");
      router.push(`/auth/verify?mode=reset&email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Восстановление"
      subtitle="Введите email аккаунта. Мы отправим код для сброса пароля."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-[var(--ink-2)]">Email</label>
          <input
            className={fieldClass}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error && <p className="text-[12px] text-[var(--bad)]">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-btn-main flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e1116] text-white hover:opacity-90 active:scale-[0.98] transition-all text-[15px] font-bold disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Отправить код <ArrowRight size={18} /></>}
        </button>

        <p className="text-center text-[13px] leading-6 text-[var(--muted)]">
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent)] hover:opacity-90">
            <ArrowLeft size={14} />
            Вернуться ко входу
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

