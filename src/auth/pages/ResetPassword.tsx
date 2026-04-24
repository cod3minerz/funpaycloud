"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/auth/components/AuthShell";
import { authApi } from "@/lib/api";
import { sanitizeInput, validatePassword } from "@/lib/sanitize";

const fieldClass =
  "auth-input h-12 w-full rounded-xl border border-[var(--line-2)] bg-[var(--bg)] px-4 text-[16px] font-medium text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-all focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

type ResetPasswordPageProps = {
  token?: string;
};

export default function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: { password?: string; confirm?: string } = {};
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) nextErrors.password = passwordCheck.error;
    if (password !== confirmPassword) nextErrors.confirm = "Пароли не совпадают";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!token) {
      toast.error("Токен восстановления недействителен");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, sanitizeInput(password));
      toast.success("Пароль успешно обновлён");
      router.push("/auth/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось обновить пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Новый пароль"
      subtitle="Задайте новый пароль для входа в аккаунт."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-[var(--ink-2)]">Новый пароль</label>
          <input
            className={fieldClass}
            type="password"
            placeholder="Минимум 8 символов"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password && <p className="text-[12px] text-[var(--bad)]">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-[var(--ink-2)]">Подтвердите пароль</label>
          <input
            className={fieldClass}
            type="password"
            placeholder="Повторите новый пароль"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {errors.confirm && <p className="text-[12px] text-[var(--bad)]">{errors.confirm}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="auth-btn-main flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e1116] text-white hover:opacity-90 active:scale-[0.98] transition-all text-[15px] font-bold disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Сохранить пароль <ArrowRight size={18} /></>}
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

