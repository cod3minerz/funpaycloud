"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Switch from "@/platform2/components/form/switch/Switch";
import TextArea from "@/platform2/components/form/input/TextArea";
import { accountsApi, settingsApi, reviewsApi, type ReviewSettings, type ApiAccount } from "@/lib/api";

const MAX_TEMPLATE_LENGTH = 1000;

const STAR_CONFIG = [
  { stars: 5, label: "Отличный отзыв", accent: "border-l-green-500",  bg: "bg-green-50 dark:bg-green-900/10",  text: "text-green-700 dark:text-green-400"  },
  { stars: 4, label: "Хороший отзыв",  accent: "border-l-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/10",    text: "text-blue-700 dark:text-blue-400"    },
  { stars: 3, label: "Нейтральный",    accent: "border-l-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/10",text: "text-yellow-700 dark:text-yellow-500" },
  { stars: 2, label: "Плохой отзыв",   accent: "border-l-orange-500", bg: "bg-orange-50 dark:bg-orange-900/10",text: "text-orange-700 dark:text-orange-400" },
  { stars: 1, label: "Ужасный отзыв",  accent: "border-l-red-500",    bg: "bg-red-50 dark:bg-red-900/10",      text: "text-red-700 dark:text-red-400"      },
] as const;

function StarRow({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < count ? "text-yellow-400" : "text-gray-200 dark:text-gray-700"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function emptySettings(): ReviewSettings {
  const replies: ReviewSettings["replies"] = {};
  for (let i = 1; i <= 5; i++) {
    replies[String(i)] = { enabled: false, template: "" };
  }
  return { enabled: false, replies };
}

export default function ReviewsPage() {
  const router = useRouter();

  const [accessChecked, setAccessChecked] = useState(false);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [settings, setSettings] = useState<ReviewSettings>(emptySettings());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Admin gate
  useEffect(() => {
    settingsApi.getProfile().then((p) => {
      if (!p.is_admin) {
        router.replace("/platform/dashboard");
      } else {
        setAccessChecked(true);
      }
    }).catch(() => router.replace("/platform/dashboard"));
  }, [router]);

  // Load accounts
  useEffect(() => {
    if (!accessChecked) return;
    accountsApi.list().then((list) => {
      setAccounts(list);
      if (list.length > 0) setSelectedAccount(list[0].id);
    }).catch(() => {});
  }, [accessChecked]);

  // Load settings when account changes
  useEffect(() => {
    if (!selectedAccount) return;
    setSettingsLoaded(false);
    reviewsApi.getSettings(selectedAccount).then((data) => {
      const merged = emptySettings();
      merged.enabled = Boolean(data?.enabled);
      for (let i = 1; i <= 5; i++) {
        const key = String(i);
        if (data?.replies?.[key]) {
          merged.replies[key] = {
            enabled: Boolean(data.replies[key].enabled),
            template: data.replies[key].template ?? "",
          };
        }
      }
      setSettings(merged);
    }).catch(() => {
      setSettings(emptySettings());
    }).finally(() => setSettingsLoaded(true));
  }, [selectedAccount]);

  function setGlobalEnabled(val: boolean) {
    setSettings((s) => ({ ...s, enabled: val }));
  }

  function setReplyEnabled(star: number, val: boolean) {
    setSettings((s) => ({
      ...s,
      replies: { ...s.replies, [String(star)]: { ...s.replies[String(star)], enabled: val } },
    }));
  }

  function setTemplate(star: number, val: string) {
    if (val.length > MAX_TEMPLATE_LENGTH) return;
    setSettings((s) => ({
      ...s,
      replies: { ...s.replies, [String(star)]: { ...s.replies[String(star)], template: val } },
    }));
  }

  async function handleSave() {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      await reviewsApi.saveSettings(selectedAccount, settings);
      toast.success("Настройки сохранены");
    } catch {
      toast.error("Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  }

  if (!accessChecked) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Авто-ответы на отзывы</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Бот автоматически ответит на отзыв покупателя на FunPay в зависимости от оценки.
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          DEV
        </span>
      </div>

      {/* Account selector */}
      {accounts.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Аккаунт FunPay
            </label>
            <select
              value={selectedAccount ?? ""}
              onChange={(e) => setSelectedAccount(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.username || `Аккаунт #${acc.id}`}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Global toggle */}
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Включить авто-ответы</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              При выключении бот не будет отвечать ни на один отзыв
            </p>
          </div>
          {settingsLoaded && (
            <Switch
              key={`global-${selectedAccount}-${settings.enabled}`}
              label=""
              defaultChecked={settings.enabled}
              onChange={setGlobalEnabled}
            />
          )}
        </CardContent>
      </Card>

      {/* Per-star cards */}
      {settingsLoaded && (
        <div className="space-y-3">
          {STAR_CONFIG.map(({ stars, label, accent, bg, text }) => {
            const key = String(stars);
            const reply = settings.replies[key] ?? { enabled: false, template: "" };
            const charCount = reply.template.length;
            const isDisabled = !settings.enabled;

            return (
              <Card key={stars} className={`border-l-4 ${accent} ${isDisabled ? "opacity-60" : ""}`}>
                <CardContent className={`p-5 ${bg} rounded-r-xl`}>
                  {/* Star header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRow count={stars} />
                      <span className={`text-sm font-semibold ${text}`}>{label}</span>
                    </div>
                    <Switch
                      key={`star-${selectedAccount}-${stars}-${reply.enabled}`}
                      label=""
                      defaultChecked={reply.enabled}
                      disabled={isDisabled}
                      onChange={(val) => setReplyEnabled(stars, val)}
                    />
                  </div>

                  {/* Template */}
                  <TextArea
                    placeholder={`Текст ответа на отзыв с оценкой ${stars}★...`}
                    rows={3}
                    value={reply.template}
                    disabled={isDisabled || !reply.enabled}
                    onChange={(val) => setTemplate(stars, val)}
                  />
                  <div className="mt-1.5 text-right text-xs text-gray-400">
                    {charCount} / {MAX_TEMPLATE_LENGTH}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Loading skeleton */}
      {!settingsLoaded && selectedAccount && (
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((s) => (
            <div key={s} className="h-36 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          ))}
        </div>
      )}

      {/* Save button */}
      {settingsLoaded && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            disabled={saving || !selectedAccount}
            onClick={handleSave}
          >
            {saving ? "Сохранение…" : "Сохранить настройки"}
          </Button>
        </div>
      )}
    </div>
  );
}
