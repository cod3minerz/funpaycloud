"use client";
import { useState, useMemo } from "react";
import { settingsApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState("");

  const passwordStrength = useMemo<"" | "weak" | "medium" | "strong">(() => {
    if (!newPwd) return "";
    if (newPwd.length < 8) return "weak";
    const score = [/[a-zA-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(newPwd)).length;
    return score >= 3 ? "strong" : score >= 2 ? "medium" : "weak";
  }, [newPwd]);

  const strengthColor = passwordStrength === "strong" ? "bg-success-500" : passwordStrength === "medium" ? "bg-yellow-500" : "bg-error-500";
  const strengthLabel = passwordStrength === "strong" ? "Надёжный" : passwordStrength === "medium" ? "Средний" : "Слабый";
  const strengthWidth = passwordStrength === "strong" ? "w-full" : passwordStrength === "medium" ? "w-2/3" : "w-1/3";

  async function handleSavePassword() {
    if (!currentPwd || !newPwd) return;
    setPwdError("");
    try {
      await settingsApi.updatePassword({ old_password: currentPwd, new_password: newPwd });
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 2500);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  const canSave = newPwd.length >= 8 && newPwd === confirmPwd && currentPwd.length > 0;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h1>

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-error-500/10">
              <LockClosedIcon className="h-5 w-5 text-error-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Безопасность</p>
              <p className="text-xs text-gray-400">Управление паролем аккаунта</p>
            </div>
          </div>

          <div className="space-y-4">
            <PasswordField label="Текущий пароль" value={currentPwd} onChange={setCurrentPwd} />
            <PasswordField
              label="Новый пароль"
              value={newPwd}
              onChange={setNewPwd}
              placeholder="Введите новый пароль"
              hint="Минимум 8 символов"
            />
            {newPwd.length > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Надёжность пароля</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength === "strong" ? "text-success-600" :
                    passwordStrength === "medium" ? "text-yellow-600" : "text-error-500"
                  }`}>{strengthLabel}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className={`h-1.5 rounded-full transition-all ${strengthColor} ${strengthWidth}`} />
                </div>
              </div>
            )}
            <PasswordField
              label="Повторите новый пароль"
              value={confirmPwd}
              onChange={setConfirmPwd}
              placeholder="Повторите пароль"
            />
          </div>

          <div className="mt-5">
            {pwdError && <p className="mb-3 text-sm text-error-500">{pwdError}</p>}
            <Button
              variant="primary"
              className="w-full"
              disabled={!canSave}
              onClick={handleSavePassword}
            >
              {pwdSaved ? "Пароль сохранён ✓" : "Сменить пароль"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
