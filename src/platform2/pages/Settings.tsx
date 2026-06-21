"use client";
import { useState, useEffect, useMemo } from "react";
import { settingsApi, type NotificationSettings, type TelegramAuthPayload, type TelegramLinkData, type WeeklyReportStatus } from "@/lib/api";
import { toast } from "sonner";
import { logout } from "@/lib/auth";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { Modal } from "@/platform2/components/ui/modal";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  ShoppingBagIcon,
  ChatBubbleLeftIcon,
  ArrowRightEndOnRectangleIcon,
  DocumentChartBarIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth: (
          options: { bot_id: number; request_access?: string; lang?: string },
          callback: (user: TelegramAuthPayload | false) => void,
        ) => void;
      };
    };
  }
}

let telegramLoginScriptPromise: Promise<void> | null = null;

function isTelegramLoginReady() {
  return typeof window !== "undefined" && typeof window.Telegram?.Login?.auth === "function";
}

function loadTelegramLoginScript(): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }
  if (isTelegramLoginReady()) {
    return Promise.resolve();
  }
  if (telegramLoginScriptPromise) {
    return telegramLoginScriptPromise;
  }

  telegramLoginScriptPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (isTelegramLoginReady()) {
        resolve();
      } else {
        telegramLoginScriptPromise = null;
        reject(new Error("Не удалось инициализировать Telegram вход"));
      }
    };

    const fail = () => {
      telegramLoginScriptPromise = null;
      reject(new Error("Не удалось загрузить Telegram Login"));
    };

    const existing = document.getElementById("telegram-login-script") as HTMLScriptElement | null;
    if (existing) {
      window.setTimeout(finish, 0);
      return;
    }

    const script = document.createElement("script");
    script.id = "telegram-login-script";
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.onload = finish;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return telegramLoginScriptPromise;
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
  testId,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={ariaLabel}
      aria-pressed={checked}
      data-testid={testId}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

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

const notifItems = [
  {
    key: "newOrder",
    icon: ShoppingBagIcon,
    label: "Новый заказ",
    desc: "При получении нового заказа",
  },
  {
    key: "newMessage",
    icon: ChatBubbleLeftIcon,
    label: "Новое сообщение",
    desc: "При входящем сообщении в чате",
  },
  {
    key: "login",
    icon: ArrowRightEndOnRectangleIcon,
    label: "Вход в аккаунт",
    desc: "При авторизации на платформе",
  },
  {
    key: "weeklyReport",
    icon: DocumentChartBarIcon,
    label: "Недельный отчёт",
    desc: "Статистика продаж за неделю",
  },
  {
    key: "subscriptionExpiry",
    icon: BellAlertIcon,
    label: "Подписка истекает",
    desc: "За 3 дня до окончания",
  },
];

type NotifKey = "all" | "newOrder" | "newMessage" | "login" | "weeklyReport" | "subscriptionExpiry";

const DEFAULT_WEEKLY_REPORT_DAY = 5;
const DEFAULT_WEEKLY_REPORT_TIME = "10:00";
const regularNotificationKeys: NotifKey[] = ["newOrder", "newMessage", "login", "subscriptionExpiry"];
const notificationKeys: NotifKey[] = [...regularNotificationKeys, "weeklyReport"];

const weeklyReportDays = [
  { value: 1, label: "Понедельник" },
  { value: 2, label: "Вторник" },
  { value: 3, label: "Среда" },
  { value: 4, label: "Четверг" },
  { value: 5, label: "Пятница" },
  { value: 6, label: "Суббота" },
  { value: 7, label: "Воскресенье" },
];

function formatWeeklyReportDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function truncateWeeklyReportError(value: string) {
  const clean = value.trim();
  if (!clean) return "не удалось отправить отчёт";
  return clean.length > 90 ? `${clean.slice(0, 87)}...` : clean;
}

export default function SettingsPage() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState("");

  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("");
  const [telegramLink, setTelegramLink] = useState<TelegramLinkData | null>(null);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(true);
  const [telegramConfigError, setTelegramConfigError] = useState("");
  const [telegramLoginError, setTelegramLoginError] = useState("");
  const [telegramScriptLoading, setTelegramScriptLoading] = useState(false);
  const [telegramScriptReady, setTelegramScriptReady] = useState(false);
  const [telegramAuthStarting, setTelegramAuthStarting] = useState(false);
  const [telegramLinking, setTelegramLinking] = useState(false);
  const [unlinkingTelegram, setUnlinkingTelegram] = useState(false);

  // Load profile for Telegram status
  useEffect(() => {
    let cancelled = false;

    settingsApi.getProfile().then((p) => {
      if (cancelled) return;
      setTelegramLinked(Boolean(p.telegram_linked || p.telegram_id));
      setTelegramUsername(p.telegram_username ?? p.telegram ?? "");
    }).catch(() => {});

    settingsApi.getTelegramLink().then((link) => {
      if (cancelled) return;
      setTelegramLink(link);
      setTelegramConfigError("");
    }).catch((err) => {
      if (cancelled) return;
      setTelegramLink(null);
      setTelegramConfigError(err instanceof Error ? err.message : "Telegram временно недоступен");
    }).finally(() => {
      if (!cancelled) setTelegramLinkLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const telegramLoginAvailable = Boolean(telegramLink?.available && telegramLink?.bot_id && telegramLink?.bot_username);
  const telegramTemporarilyUnavailable = !telegramLinked && !telegramLinkLoading && !telegramLoginAvailable;
  const telegramUsernameLabel = telegramUsername ? (telegramUsername.startsWith("@") ? telegramUsername : `@${telegramUsername}`) : "";

  useEffect(() => {
    let cancelled = false;

    if (!telegramLoginAvailable) {
      setTelegramScriptReady(false);
      setTelegramScriptLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setTelegramScriptLoading(true);
    setTelegramLoginError("");

    loadTelegramLoginScript()
      .then(() => {
        if (!cancelled) setTelegramScriptReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setTelegramScriptReady(false);
        setTelegramLoginError(err instanceof Error ? err.message : "Не удалось загрузить Telegram вход");
      })
      .finally(() => {
        if (!cancelled) setTelegramScriptLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [telegramLoginAvailable]);

  async function refreshTelegramState() {
    const [profile, link] = await Promise.all([
      settingsApi.getProfile(),
      settingsApi.getTelegramLink(),
    ]);

    setTelegramLinked(Boolean(profile.telegram_linked || profile.telegram_id));
    setTelegramUsername(profile.telegram_username ?? profile.telegram ?? "");
    setTelegramLink(link);
    setTelegramConfigError("");
  }

  async function handleTelegramAuth(payload: TelegramAuthPayload) {
    if (telegramLinking) return;

    setTelegramLinking(true);
    try {
      await settingsApi.linkTelegram(payload);
      await refreshTelegramState();
      refreshWeeklyReportStatus();
      toast.success("Telegram аккаунт привязан");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось привязать Telegram аккаунт");
    } finally {
      setTelegramLinking(false);
    }
  }

  function handleTelegramLoginStart() {
    if (!telegramLink?.bot_id) {
      toast.error("Telegram вход сейчас недоступен");
      return;
    }
    if (!telegramScriptReady) {
      toast.info("Подготавливаем вход через Telegram, попробуйте ещё раз через секунду");
      return;
    }

    const login = window.Telegram?.Login;
    if (typeof login?.auth !== "function") {
      const message = "Не удалось инициализировать Telegram вход";
      setTelegramLoginError(message);
      toast.error(message);
      return;
    }

    setTelegramAuthStarting(true);
    setTelegramLoginError("");

    try {
      login.auth(
        {
          bot_id: telegramLink.bot_id,
          request_access: "write",
          lang: "ru",
        },
        (user) => {
          setTelegramAuthStarting(false);
          if (!user) {
            toast.info("Вход через Telegram отменён");
            return;
          }
          void handleTelegramAuth(user);
        },
      );
    } catch (err) {
      setTelegramAuthStarting(false);
      const message = err instanceof Error ? err.message : "Не удалось открыть Telegram вход";
      setTelegramLoginError(message);
      toast.error(message);
    }
  }

  async function handleUnlinkTelegram() {
    setUnlinkingTelegram(true);
    try {
      await settingsApi.unlinkTelegram();
      setTelegramLinked(false);
      setTelegramUsername("");
      setWeeklyReportStatus(null);
      refreshWeeklyReportStatus();
      toast.success("Telegram отвязан");
    } catch {
      toast.error("Не удалось отвязать Telegram");
    } finally {
      setUnlinkingTelegram(false);
    }
  }

  // Password strength
  const passwordStrength = useMemo<"" | "weak" | "medium" | "strong">(() => {
    if (!newPwd) return "";
    if (newPwd.length < 8) return "weak";
    const score = [/[a-zA-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(newPwd)).length;
    return score >= 3 ? "strong" : score >= 2 ? "medium" : "weak";
  }, [newPwd]);

  const strengthColor = passwordStrength === "strong" ? "bg-success-500" : passwordStrength === "medium" ? "bg-yellow-500" : "bg-error-500";
  const strengthLabel = passwordStrength === "strong" ? "Надёжный" : passwordStrength === "medium" ? "Средний" : "Слабый";
  const strengthWidth = passwordStrength === "strong" ? "w-full" : passwordStrength === "medium" ? "w-2/3" : "w-1/3";

  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    all: false,
    newOrder: false,
    newMessage: false,
    login: false,
    weeklyReport: false,
    subscriptionExpiry: false,
  });
  const [weeklyReportDay, setWeeklyReportDay] = useState(DEFAULT_WEEKLY_REPORT_DAY);
  const [weeklyReportTime, setWeeklyReportTime] = useState(DEFAULT_WEEKLY_REPORT_TIME);
  const [weeklyReportModalOpen, setWeeklyReportModalOpen] = useState(false);
  const [draftWeeklyReportDay, setDraftWeeklyReportDay] = useState(DEFAULT_WEEKLY_REPORT_DAY);
  const [draftWeeklyReportTime, setDraftWeeklyReportTime] = useState(DEFAULT_WEEKLY_REPORT_TIME);
  const [weeklyReportStatus, setWeeklyReportStatus] = useState<WeeklyReportStatus | null>(null);

  function refreshWeeklyReportStatus() {
    settingsApi.getWeeklyReportStatus()
      .then(setWeeklyReportStatus)
      .catch(() => setWeeklyReportStatus(null));
  }

  function hasAnyNotificationEnabled(state: Record<NotifKey, boolean>) {
    return notificationKeys.some((key) => state[key]);
  }

  function areRegularNotificationsEnabled(state: Record<NotifKey, boolean>) {
    return regularNotificationKeys.every((key) => state[key]);
  }

  function withDerivedMasterState(state: Record<NotifKey, boolean>) {
    return {
      ...state,
      all: areRegularNotificationsEnabled(state),
    };
  }

  function buildNotificationPayload(
    state: Record<NotifKey, boolean>,
    day = weeklyReportDay,
    time = weeklyReportTime,
  ): NotificationSettings {
    return {
      enabled: hasAnyNotificationEnabled(state),
      new_order: state.newOrder,
      new_message: state.newMessage,
      login: state.login,
      weekly_report: state.weeklyReport,
      subscription: state.subscriptionExpiry,
      weekly_report_day: day,
      weekly_report_time: time,
    };
  }

  function weeklyReportDescription(defaultDescription: string) {
    if (!notifs.weeklyReport) return defaultDescription;

    const dayLabel = weeklyReportDays.find((day) => day.value === weeklyReportDay)?.label ?? "Пятница";
    const base = `${dayLabel}, ${weeklyReportTime}`;
    const lastRun = weeklyReportStatus?.last_run;
    if (lastRun?.status === "failed") {
      return `Ошибка отправки: ${truncateWeeklyReportError(lastRun.last_error)}`;
    }

    const nextDate = formatWeeklyReportDate(
      weeklyReportStatus?.next_scheduled_for_local || weeklyReportStatus?.next_scheduled_for,
    );
    return nextDate ? `${base}. Следующий отчёт: ${nextDate}` : base;
  }

  // Load notifications from API
  useEffect(() => {
    settingsApi.getNotifications().then((n: NotificationSettings) => {
      const day = n.weekly_report_day || DEFAULT_WEEKLY_REPORT_DAY;
      const time = n.weekly_report_time || DEFAULT_WEEKLY_REPORT_TIME;
      setNotifs(withDerivedMasterState({
        all: false,
        newOrder: n.new_order ?? false,
        newMessage: n.new_message ?? false,
        login: n.login ?? false,
        weeklyReport: n.weekly_report ?? false,
        subscriptionExpiry: n.subscription ?? false,
      }));
      setWeeklyReportDay(day);
      setWeeklyReportTime(time);
      setDraftWeeklyReportDay(day);
      setDraftWeeklyReportTime(time);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    refreshWeeklyReportStatus();
  }, []);

  function toggleNotif(key: NotifKey) {
    if (key === "all") {
      const next = !notifs.all;
      const updated = {
        ...notifs,
        all: next,
        newOrder: next,
        newMessage: next,
        login: next,
        subscriptionExpiry: next,
      };
      setNotifs(updated);
      settingsApi.updateNotifications(buildNotificationPayload(updated))
        .then(() => refreshWeeklyReportStatus())
        .catch(() => {});
    } else {
      if (key === "weeklyReport" && !notifs.weeklyReport) {
        setDraftWeeklyReportDay(weeklyReportDay);
        setDraftWeeklyReportTime(weeklyReportTime);
        setWeeklyReportModalOpen(true);
        return;
      }
      setNotifs((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        const result = withDerivedMasterState(updated);
        settingsApi.updateNotifications(buildNotificationPayload(result))
          .then(() => refreshWeeklyReportStatus())
          .catch(() => {});
        return result;
      });
    }
  }

  function closeWeeklyReportModal() {
    setWeeklyReportModalOpen(false);
    setDraftWeeklyReportDay(weeklyReportDay);
    setDraftWeeklyReportTime(weeklyReportTime);
  }

  function saveWeeklyReportSchedule() {
    if (!draftWeeklyReportTime) {
      toast.error("Выберите время отчёта");
      return;
    }
    const updated = withDerivedMasterState({ ...notifs, weeklyReport: true });
    setWeeklyReportDay(draftWeeklyReportDay);
    setWeeklyReportTime(draftWeeklyReportTime);
    setNotifs(updated);
    setWeeklyReportModalOpen(false);
    settingsApi.updateNotifications(buildNotificationPayload(updated, draftWeeklyReportDay, draftWeeklyReportTime)).then(() => {
      refreshWeeklyReportStatus();
    }).catch((err) => {
      setNotifs(notifs);
      setWeeklyReportDay(weeklyReportDay);
      setWeeklyReportTime(weeklyReportTime);
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить расписание отчёта");
    });
  }

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

      {/* Security */}
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
            <PasswordField
              label="Текущий пароль"
              value={currentPwd}
              onChange={setCurrentPwd}
            />
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

      {/* Telegram notifications */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10">
              <PaperAirplaneIcon className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Telegram уведомления</p>
              <p className="text-xs text-gray-400">Получайте важные события в Telegram</p>
            </div>
          </div>

          {/* Linked account */}
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
              <PaperAirplaneIcon className="h-5 w-5 text-brand-500" />
            </div>
            <div className="flex-1">
              {telegramLinked ? (
                <>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Telegram привязан</p>
                  <p className="text-xs text-gray-400">Уведомления будут приходить в ваш Telegram.</p>
                  {telegramUsernameLabel && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                      <span className="text-xs font-medium text-success-600">{telegramUsernameLabel}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Telegram не привязан</p>
                  <p className="text-xs text-gray-400">Привяжите Telegram для получения уведомлений.</p>
                  {telegramTemporarilyUnavailable && (
                    <p className="mt-1 text-xs text-error-500">
                      {telegramConfigError || "Подключение Telegram временно недоступно."}
                    </p>
                  )}
                  {telegramLoginError && !telegramTemporarilyUnavailable && (
                    <p className="mt-1 text-xs text-error-500">{telegramLoginError}</p>
                  )}
                </>
              )}
            </div>
            {!telegramLinked ? (
              <Button
                size="sm"
                variant="primary"
                onClick={handleTelegramLoginStart}
                disabled={!telegramLoginAvailable || telegramLinkLoading || telegramScriptLoading || telegramAuthStarting || telegramLinking}
                startIcon={<PaperAirplaneIcon className="h-4 w-4" />}
                className="shrink-0"
              >
                {telegramScriptLoading
                  ? "Готовим..."
                  : telegramAuthStarting
                    ? "Открываем..."
                    : telegramLinking
                      ? "Привязываем..."
                      : "Привязать"}
              </Button>
            ) : (
              <button
                onClick={handleUnlinkTelegram}
                disabled={unlinkingTelegram}
                className="shrink-0 text-xs text-gray-400 hover:text-error-500 transition-colors disabled:opacity-50"
              >
                {unlinkingTelegram ? "…" : "Отвязать"}
              </button>
            )}
          </div>

          {/* Master toggle */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                Уведомления в Telegram
              </p>
              <p className="text-xs text-gray-400">Обычные уведомления без недельного отчёта</p>
            </div>
            <Toggle
              checked={notifs.all}
              onChange={() => toggleNotif("all")}
              ariaLabel="Переключить обычные Telegram уведомления"
              testId="telegram-notifications-master-toggle"
            />
          </div>

          {/* Individual toggles */}
          <ul className="mt-4 space-y-0 divide-y divide-gray-50 dark:divide-gray-800">
            {notifItems.map(({ key, icon: Icon, label, desc }) => (
              <li key={key} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{label}</p>
                    <p
                      className={`text-xs ${
                        key === "weeklyReport" && notifs.weeklyReport && weeklyReportStatus?.last_run?.status === "failed"
                          ? "text-error-500"
                          : "text-gray-400"
                      }`}
                      data-testid={
                        key === "weeklyReport" && notifs.weeklyReport
                          ? weeklyReportStatus?.last_run?.status === "failed"
                            ? "weekly-report-error"
                            : "weekly-report-next-run"
                          : undefined
                      }
                    >
                      {key === "weeklyReport" ? weeklyReportDescription(desc) : desc}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={notifs[key as NotifKey]}
                  onChange={() => toggleNotif(key as NotifKey)}
                  ariaLabel={`Переключить ${label}`}
                  testId={key === "weeklyReport" ? "weekly-report-toggle" : undefined}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Modal isOpen={weeklyReportModalOpen} onClose={closeWeeklyReportModal} className="max-w-md p-6">
        <div data-testid="weekly-report-schedule-modal">
          <div className="pr-10">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Недельный отчёт</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Выберите день и время отправки статистики.</p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                День недели
              </label>
              <select
                value={draftWeeklyReportDay}
                onChange={(event) => setDraftWeeklyReportDay(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {weeklyReportDays.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Время
              </label>
              <input
                type="time"
                value={draftWeeklyReportTime}
                onChange={(event) => setDraftWeeklyReportTime(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={closeWeeklyReportModal}>
              Отмена
            </Button>
            <Button variant="primary" className="flex-1" onClick={saveWeeklyReportSchedule}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
