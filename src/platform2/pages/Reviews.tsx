"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  accountsApi,
  type ApiAccount,
  type ReviewRatingKey,
  type ReviewSettings,
  type ReviewStatus,
} from "@/lib/api";

const RATING_KEYS: ReviewRatingKey[] = ["5", "4", "3", "2", "1"];

const RATING_META: Record<ReviewRatingKey, { label: string; accent: string; surface: string }> = {
  "5": {
    label: "Отличный отзыв",
    accent: "text-emerald-500",
    surface: "border-emerald-500/15 bg-emerald-500/[0.06]",
  },
  "4": {
    label: "Хороший отзыв",
    accent: "text-blue-500",
    surface: "border-blue-500/15 bg-blue-500/[0.06]",
  },
  "3": {
    label: "Нейтральный",
    accent: "text-amber-500",
    surface: "border-amber-500/15 bg-amber-500/[0.06]",
  },
  "2": {
    label: "Плохой отзыв",
    accent: "text-orange-500",
    surface: "border-orange-500/15 bg-orange-500/[0.06]",
  },
  "1": {
    label: "Критичный отзыв",
    accent: "text-rose-500",
    surface: "border-rose-500/15 bg-rose-500/[0.06]",
  },
};

function emptyReviewSettings(): ReviewSettings {
  return {
    enabled: false,
    replies: {
      "1": { enabled: false, template: "" },
      "2": { enabled: false, template: "" },
      "3": { enabled: false, template: "" },
      "4": { enabled: false, template: "" },
      "5": { enabled: false, template: "" },
    },
  };
}

function normalizeSettings(settings?: Partial<ReviewSettings> | null): ReviewSettings {
  const normalized = emptyReviewSettings();
  normalized.enabled = Boolean(settings?.enabled);
  for (const key of RATING_KEYS) {
    const cfg = settings?.replies?.[key];
    const template = (cfg?.template || "").slice(0, 1000);
    normalized.replies[key] = {
      enabled: Boolean(cfg?.enabled && template.trim()),
      template,
    };
  }
  return normalized;
}

function cloneSettings(settings: ReviewSettings): ReviewSettings {
  return normalizeSettings(JSON.parse(JSON.stringify(settings)) as ReviewSettings);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatScanCountdown(seconds?: number) {
  if (seconds == null || seconds <= 0) return "сейчас";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes <= 0) return `${rest} сек.`;
  if (minutes < 60) return `${minutes} мин. ${rest.toString().padStart(2, "0")} сек.`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ч. ${String(minutes % 60).padStart(2, "0")} мин.`;
}

function proxyReasonText(reason?: string) {
  switch (reason) {
    case "proxy_missing":
      return "Подключите прокси к аккаунту";
    case "proxy_inactive":
      return "Прокси аккаунта неактивен";
    case "proxy_expired":
      return "Прокси аккаунта истёк";
    default:
      return "Прокси готов";
  }
}

function runtimeReasonText(reason?: string) {
  if (!reason) return "Runtime готов";
  return "Runtime временно недоступен";
}

function statusLabel(status: string) {
  switch (status) {
    case "baseline":
      return "baseline";
    case "pending":
      return "ожидает";
    case "replied":
      return "отвечено";
    case "skipped":
      return "пропущено";
    case "failed":
      return "ошибка";
    default:
      return status;
  }
}

function scanStateText(state?: string) {
  switch (state) {
    case "running":
      return "Выполняется";
    case "overdue":
      return "Просрочено";
    case "error":
      return "Ошибка";
    case "due":
      return "Пора проверить";
    case "waiting":
      return "Ожидает";
    default:
      return "Ожидает";
  }
}

function scanStateClass(state?: string) {
  switch (state) {
    case "running":
      return "text-blue-500";
    case "overdue":
    case "error":
      return "text-amber-500";
    case "due":
      return "text-amber-500";
    default:
      return "text-emerald-500";
  }
}

function SwitchButton({
  checked,
  disabled,
  onClick,
  testId,
}: {
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-8 w-14 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
        checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-800"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [saved, setSaved] = useState<ReviewSettings>(emptyReviewSettings);
  const [draft, setDraft] = useState<ReviewSettings>(emptyReviewSettings);
  const [status, setStatus] = useState<ReviewStatus | null>(null);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState<Date | null>(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);
  const [requestingScan, setRequestingScan] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    accountsApi
      .list()
      .then((items) => {
        if (!alive) return;
        setAccounts(items);
        setSelectedAccountId((current) => current ?? items[0]?.id ?? null);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Не удалось загрузить аккаунты");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const refreshStatus = useCallback(async (accountID = selectedAccountId, quiet = false) => {
    if (!accountID) return;
    try {
      if (!quiet) setStatusRefreshing(true);
      const reviewStatus = await accountsApi.getReviewStatus(accountID);
      setStatus(reviewStatus);
      setStatusUpdatedAt(new Date());
    } catch {
      setStatus(null);
    } finally {
      if (!quiet) setStatusRefreshing(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      accountsApi.getReviewSettings(selectedAccountId),
      accountsApi.getReviewStatus(selectedAccountId),
    ])
      .then(([settings, reviewStatus]) => {
        if (!alive) return;
        const normalized = normalizeSettings(settings);
        setSaved(normalized);
        setDraft(cloneSettings(normalized));
        setStatus(reviewStatus);
        setStatusUpdatedAt(new Date());
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Не удалось загрузить настройки отзывов");
        if (alive) setStatus(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId) return;
    const poll = () => {
      void refreshStatus(selectedAccountId, true);
    };
    const interval = window.setInterval(poll, 15000);
    const onFocus = () => poll();
    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [selectedAccountId, refreshStatus]);

  const dirtyByRating = useMemo(() => {
    const result: Record<ReviewRatingKey, boolean> = {
      "1": false,
      "2": false,
      "3": false,
      "4": false,
      "5": false,
    };
    for (const key of RATING_KEYS) {
      result[key] = draft.replies[key].template !== saved.replies[key].template;
    }
    return result;
  }, [draft, saved]);

  const hasDirtyTemplates = RATING_KEYS.some((key) => dirtyByRating[key]);
  const hasEnabledSavedTemplate = RATING_KEYS.some((key) => {
    const cfg = saved.replies[key];
    return cfg.enabled && cfg.template.trim().length > 0;
  });
  const proxyReady = status?.proxy_ready ?? false;
  const runtimeReady = status?.runtime_ready ?? false;
  const globalBlockReason = !proxyReady
    ? proxyReasonText(status?.proxy_reason)
    : !runtimeReady
      ? runtimeReasonText(status?.runtime_reason)
      : "";
  const scanRunning = status?.scan_state === "running";
  const canRequestScan = Boolean(selectedAccountId && saved.enabled && hasEnabledSavedTemplate && proxyReady && !scanRunning);
  const requestScanDisabled = saving || loading || requestingScan || !canRequestScan;
  const baselineCount = status?.counts?.baseline ?? 0;
  const lastScanError = status?.last_scan_error || status?.recent?.find((item) => item.last_error)?.last_error || "";

  async function persist(next: ReviewSettings, successMessage: string) {
    if (!selectedAccountId) return;
    setSaving(true);
    try {
      const normalized = normalizeSettings(await accountsApi.saveReviewSettings(selectedAccountId, next));
      setSaved(normalized);
      setDraft(cloneSettings(normalized));
      await refreshStatus(selectedAccountId, true);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  }

  function buildTemplateSavePayload(): ReviewSettings {
    const next = cloneSettings(saved);
    for (const key of RATING_KEYS) {
      const template = draft.replies[key].template.trim();
      next.replies[key] = {
        enabled: saved.replies[key].enabled && template.length > 0,
        template,
      };
    }
    const hasActive = RATING_KEYS.some((key) => next.replies[key].enabled && next.replies[key].template);
    next.enabled = saved.enabled && hasActive;
    return next;
  }

  function handleTemplateChange(key: ReviewRatingKey, value: string) {
    setDraft((current) => {
      const next = cloneSettings(current);
      next.replies[key] = {
        ...next.replies[key],
        template: value.slice(0, 1000),
      };
      return next;
    });
  }

  async function handleSaveTemplates() {
    await persist(buildTemplateSavePayload(), "Шаблоны сохранены");
  }

  async function handleToggleRating(key: ReviewRatingKey) {
    const next = cloneSettings(saved);
    next.replies[key].enabled = !next.replies[key].enabled;
    const hasActive = RATING_KEYS.some((rating) => next.replies[rating].enabled && next.replies[rating].template.trim());
    if (!hasActive) {
      next.enabled = false;
    }
    await persist(next, next.replies[key].enabled ? "Авто-ответ для оценки включён" : "Авто-ответ для оценки выключен");
  }

  async function handleToggleGlobal() {
    const next = cloneSettings(saved);
    next.enabled = !next.enabled;
    await persist(next, next.enabled ? "Авто-ответы включены" : "Авто-ответы выключены");
  }

  async function handleRequestScan() {
    if (!selectedAccountId) return;
    setRequestingScan(true);
    try {
      const reviewStatus = await accountsApi.requestReviewScan(selectedAccountId);
      setStatus(reviewStatus);
      setStatusUpdatedAt(new Date());
      toast.success("Проверка отзывов поставлена в очередь");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось поставить проверку в очередь");
      await refreshStatus(selectedAccountId, true);
    } finally {
      setRequestingScan(false);
    }
  }

  return (
    <div data-testid="reviews-page" className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            Авто-ответы на отзывы
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Бот отвечает на новые отзывы FunPay в зависимости от оценки.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-72">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Аккаунт</label>
          <select
            value={selectedAccountId ?? ""}
            onChange={(event) => setSelectedAccountId(Number(event.target.value) || null)}
            disabled={loading || accounts.length === 0}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            {accounts.length === 0 ? (
              <option value="">Нет аккаунтов</option>
            ) : (
              accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.username || `Аккаунт #${account.id}`}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <section className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Включить авто-ответы</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {globalBlockReason || "При выключении бот не будет отвечать ни на один отзыв."}
          </p>
        </div>
        <SwitchButton
          checked={saved.enabled}
          disabled={saving || loading || hasDirtyTemplates || !hasEnabledSavedTemplate || !selectedAccountId || !proxyReady}
          onClick={handleToggleGlobal}
          testId="reviews-global-toggle"
        />
      </section>

      <section
        data-testid="reviews-status"
        className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Статус проверки</p>
            <p data-testid="reviews-status-updated" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Обновлено: {formatTime(statusUpdatedAt?.toISOString() || status?.server_time)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="reviews-refresh-status"
              disabled={statusRefreshing || !selectedAccountId}
              onClick={() => selectedAccountId && void refreshStatus(selectedAccountId)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-brand-300 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-200"
            >
              {statusRefreshing ? "Обновление..." : "Обновить"}
            </button>
            <button
              type="button"
              data-testid="reviews-request-scan"
              disabled={requestScanDisabled}
              onClick={handleRequestScan}
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
            >
              {requestingScan ? "Постановка..." : "Проверить сейчас"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Прокси</p>
            <p
              data-testid="reviews-proxy-status"
              className={`mt-1 text-sm font-semibold ${proxyReady ? "text-emerald-500" : "text-amber-500"}`}
            >
              {proxyReasonText(status?.proxy_reason)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Runtime</p>
            <p
              data-testid="reviews-runtime-status"
              className={`mt-1 text-sm font-semibold ${runtimeReady ? "text-emerald-500" : "text-amber-500"}`}
            >
              {runtimeReasonText(status?.runtime_reason)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Состояние</p>
            <p
              data-testid="reviews-scan-state"
              className={`mt-1 text-sm font-semibold ${scanStateClass(status?.scan_state)}`}
            >
              {scanStateText(status?.scan_state)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Следующая проверка</p>
            <p data-testid="reviews-next-scan" className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {formatDateTime(status?.next_scan_at)}
            </p>
            <p data-testid="reviews-next-scan-countdown" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formatScanCountdown(status?.seconds_until_next_scan)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-gray-500 dark:text-gray-400 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Последний scan</p>
            <p data-testid="reviews-last-scan" className="mt-1 font-semibold text-gray-900 dark:text-white">
              {formatDateTime(status?.last_scan_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Baseline</p>
            <p data-testid="reviews-baseline-hint" className="mt-1 font-semibold text-gray-900 dark:text-white">
              {baselineCount > 0 ? `${baselineCount} старых отзывов без автоответа` : "Пока пусто"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Lock до</p>
            <p data-testid="reviews-scan-lock" className="mt-1 font-semibold text-gray-900 dark:text-white">
              {formatDateTime(status?.scan_locked_until)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-gray-500 dark:text-gray-400 sm:grid-cols-5">
          {["baseline", "pending", "replied", "skipped", "failed"].map((key) => (
            <div key={key} className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-400">{statusLabel(key)}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{status?.counts?.[key] ?? 0}</p>
            </div>
          ))}
        </div>

        {lastScanError ? (
          <div
            data-testid="reviews-last-error"
            className="mt-5 rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
          >
            {lastScanError}
          </div>
        ) : null}

        {status?.recent?.length ? (
          <div className="mt-5 space-y-2">
            {status.recent.slice(0, 3).map((item) => (
              <div
                key={`${item.order_id}-${item.updated_at}`}
                className="flex flex-col gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 md:flex-row md:items-center md:justify-between"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  #{item.order_id} · {item.rating}★ · {statusLabel(item.status)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {item.last_error || item.skip_reason || formatDateTime(item.updated_at)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {hasDirtyTemplates ? "Есть несохранённые изменения" : "Шаблоны синхронизированы"}
        </p>
        <button
          type="button"
          data-testid="reviews-save"
          disabled={saving || !hasDirtyTemplates || !selectedAccountId}
          onClick={handleSaveTemplates}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
        >
          {saving ? "Сохранение..." : "Сохранить шаблоны"}
        </button>
      </div>

      <div className="space-y-4">
        {RATING_KEYS.map((key) => {
          const meta = RATING_META[key];
          const draftTemplate = draft.replies[key].template;
          const savedTemplate = saved.replies[key].template.trim();
          const ratingDisabled =
            saving || loading || !selectedAccountId || !savedTemplate || dirtyByRating[key];
          return (
            <section
              key={key}
              className={`rounded-lg border p-5 ${meta.surface}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="whitespace-nowrap text-lg leading-none text-yellow-400">
                      {"★".repeat(Number(key))}
                      <span className="text-gray-300 dark:text-gray-700">{"★".repeat(5 - Number(key))}</span>
                    </span>
                    <span className={`font-semibold ${meta.accent}`}>{meta.label}</span>
                  </div>
                </div>
                <SwitchButton
                  checked={saved.replies[key].enabled}
                  disabled={ratingDisabled}
                  onClick={() => handleToggleRating(key)}
                  testId={`reviews-rating-toggle-${key}`}
                />
              </div>

              <div className="mt-4">
                <textarea
                  data-testid={`reviews-template-${key}`}
                  value={draftTemplate}
                  onChange={(event) => handleTemplateChange(key, event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder={`Текст ответа на отзыв с оценкой ${key}★...`}
                  className="min-h-28 w-full resize-y rounded-lg border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950/40 dark:text-white dark:placeholder:text-gray-600"
                />
                <div className="mt-2 flex justify-end text-sm text-gray-400">
                  {draftTemplate.length} / 1000
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
