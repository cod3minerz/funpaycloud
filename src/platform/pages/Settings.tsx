'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import {
  BarChart2,
  Bell,
  Bot,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MessageCircle,
  Send,
  Shield,
  ShoppingBag,
  Zap,
  type LucideIcon,
} from '@/shared/streamline/icons';
import { toast } from 'sonner';
import {
  ApiError,
  settingsApi,
  type NotificationSettings,
  type ProfileData,
  type SubscriptionData,
  type TelegramAuthPayload,
  type TelegramLinkData,
} from '@/lib/api';
import { validatePassword } from '@/lib/sanitize';
import { TelegramLoginWidget } from '@/platform/components/TelegramLoginWidget';
import { PageHeader, PageShell, PageTitle, RequestErrorState } from '@/platform/components/primitives';

type NotificationItem = {
  key: keyof NotificationSettings;
  label: string;
  desc: string;
  icon: LucideIcon;
};

const NOTIFICATION_ITEMS: NotificationItem[] = [
  { key: 'new_order', label: 'Новый заказ', desc: 'При получении нового заказа', icon: ShoppingBag },
  { key: 'new_message', label: 'Новое сообщение', desc: 'При входящем сообщении в чате', icon: MessageCircle },
  { key: 'login', label: 'Вход в аккаунт', desc: 'При авторизации на платформе', icon: LogIn },
  { key: 'weekly_report', label: 'Недельный отчёт', desc: 'Статистика продаж за неделю', icon: BarChart2 },
  { key: 'subscription', label: 'Подписка истекает', desc: 'За 3 дня до окончания', icon: Bell },
];

const PLAN_META: Record<string, { title: string; limits: string }> = {
  trial: { title: 'Триал', limits: '1 аккаунт · 7 дней аналитики · Базовые функции' },
  lite: { title: 'Лайт', limits: '2 аккаунта · 14 дней аналитики · Базовые плагины' },
  pro: { title: 'Профи', limits: '5 аккаунтов · 30 дней аналитики · Базовые плагины' },
  ultra: { title: 'Ultra', limits: '10 аккаунтов · 90 дней аналитики · Все плагины' },
  start: { title: 'Старт', limits: '1 аккаунт · Базовые функции · Стартовый пакет' },
  team: { title: 'Командный', limits: '10 аккаунтов · Расширенная аналитика · VIP плагины' },
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

function daysLeft(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diff = d.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-ZА-Я]/.test(password) && /[a-zа-я]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-zА-Яа-я0-9]/.test(password)) score += 1;
  return score;
}

function normalizeNotificationSettings(data: NotificationSettings): NotificationSettings {
  return {
    enabled: Boolean(data.enabled),
    new_order: Boolean(data.new_order),
    new_message: Boolean(data.new_message),
    login: Boolean(data.login),
    weekly_report: Boolean(data.weekly_report),
    subscription: Boolean(data.subscription),
  };
}

function Toggle({ checked, onChange, disabled, compact = false }: { checked: boolean; onChange: () => void; disabled?: boolean; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${
        checked ? 'bg-indigo-500' : 'bg-[var(--pf-surface-3)]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    enabled: false,
    new_order: false,
    new_message: false,
    login: false,
    weekly_report: false,
    subscription: false,
  });
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  const [telegramLink, setTelegramLink] = useState<TelegramLinkData | null>(null);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(true);
  const [telegramConfigError, setTelegramConfigError] = useState<string | null>(null);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [telegramLinking, setTelegramLinking] = useState(false);
  const [telegramUnlinking, setTelegramUnlinking] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function refreshTelegramState() {
    const [nextProfile, nextNotifications] = await Promise.all([
      settingsApi.getProfile(),
      settingsApi.getNotifications(),
    ]);
    setProfile(nextProfile);
    setNotifications(normalizeNotificationSettings(nextNotifications));

    try {
      const nextLink = await settingsApi.getTelegramLink();
      setTelegramLink(nextLink);
      setTelegramConfigError(null);
    } catch (err) {
      setTelegramLink(null);
      setTelegramConfigError(err instanceof Error ? err.message : 'Telegram временно недоступен');
    }
  }

  useEffect(() => {
    let cancelled = false;

    settingsApi
      .getProfile()
      .then(data => {
        if (cancelled) return;
        setProfile(data);
        setProfileError(null);
      })
      .catch(err => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Ошибка загрузки профиля';
        setProfileError(message);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    settingsApi
      .getSubscription()
      .then(data => {
        if (cancelled) return;
        setSubscription(data);
      })
      .catch(() => {
        if (cancelled) return;
        setSubscription(null);
      })
      .finally(() => {
        if (!cancelled) setSubscriptionLoading(false);
      });

    settingsApi
      .getNotifications()
      .then(data => {
        if (cancelled) return;
        setNotifications(normalizeNotificationSettings(data));
      })
      .catch(() => {
        if (cancelled) return;
        setNotifications({
          enabled: false,
          new_order: false,
          new_message: false,
          login: false,
          weekly_report: false,
          subscription: false,
        });
      })
      .finally(() => {
        if (!cancelled) setNotificationsLoading(false);
      });

    settingsApi
      .getTelegramLink()
      .then(data => {
        if (cancelled) return;
        setTelegramLink(data);
        setTelegramConfigError(null);
      })
      .catch(err => {
        if (cancelled) return;
        setTelegramLink(null);
        setTelegramConfigError(err instanceof Error ? err.message : 'Telegram временно недоступен');
      })
      .finally(() => {
        if (!cancelled) setTelegramLinkLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canChangePassword = oldPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && !mismatch;

  const strengthView = useMemo(() => {
    if (passwordStrength <= 1) return { label: 'Слабый пароль', color: 'bg-red-500', textColor: 'text-red-400' };
    if (passwordStrength === 2) return { label: 'Средний пароль', color: 'bg-amber-500', textColor: 'text-amber-400' };
    if (passwordStrength === 3) return { label: 'Хороший пароль', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { label: 'Надёжный пароль', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
  }, [passwordStrength]);

  const planId = String(subscription?.plan || 'pro').toLowerCase();
  const planMeta = PLAN_META[planId] ?? { title: 'Профи', limits: '5 аккаунтов · 30 дней аналитики · Базовые плагины' };
  const expiresAt = subscription?.expires_at ?? null;
  const leftDays = daysLeft(expiresAt);
  const progressPercent = leftDays === null ? 100 : Math.min(100, Math.max(0, Math.round((leftDays / 30) * 100)));

  const telegramUsernameRaw = String(profile?.telegram_username ?? '').trim();
  const telegramUsername = telegramUsernameRaw ? (telegramUsernameRaw.startsWith('@') ? telegramUsernameRaw : `@${telegramUsernameRaw}`) : '';
  const telegramLinked = Boolean(profile?.telegram_linked || profile?.telegram_id);
  const telegramDisplayName = [profile?.telegram_first_name, profile?.telegram_last_name].filter(Boolean).join(' ').trim();
  const telegramWidgetAvailable = Boolean(telegramLink?.available && telegramLink?.bot_username);
  const telegramTemporarilyUnavailable = !telegramLinked && !telegramLinkLoading && !telegramWidgetAvailable;
  const telegramNotificationsLocked = !telegramLinked || notificationsLoading || notificationsSaving;

  async function handleChangePassword() {
    const check = validatePassword(newPassword);
    if (!check.valid) {
      toast.error(check.error ?? 'Новый пароль слишком слабый');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setSavingPassword(true);
    try {
      await settingsApi.updatePassword({ old_password: oldPassword, new_password: newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Пароль успешно изменён');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось изменить пароль');
    } finally {
      setSavingPassword(false);
    }
  }

  async function persistNotifications(nextState: NotificationSettings) {
    const previousState = notifications;
    setNotifications(nextState);
    setNotificationsSaving(true);

    try {
      const savedState = await settingsApi.updateNotifications(nextState);
      setNotifications(normalizeNotificationSettings(savedState));
    } catch (err) {
      setNotifications(previousState);
      toast.error(err instanceof Error ? err.message : 'Не удалось сохранить настройки уведомлений');
    } finally {
      setNotificationsSaving(false);
    }
  }

  async function handleTelegramAuth(payload: TelegramAuthPayload) {
    if (telegramLinking) return;

    setTelegramLinking(true);
    try {
      await settingsApi.linkTelegram(payload);
      await refreshTelegramState();
      setTelegramDialogOpen(false);
      toast.success('Telegram аккаунт успешно привязан');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось привязать Telegram аккаунт');
    } finally {
      setTelegramLinking(false);
    }
  }

  async function handleTelegramUnlink() {
    if (telegramUnlinking) return;

    setTelegramUnlinking(true);
    try {
      await settingsApi.unlinkTelegram();
      await refreshTelegramState();
      toast.success('Telegram аккаунт отвязан');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось отвязать Telegram аккаунт');
    } finally {
      setTelegramUnlinking(false);
    }
  }

  if (profileLoading) {
    return (
      <PageShell>
        <PageHeader>
          <PageTitle title="Настройки" subtitle="Управляйте безопасностью, подпиской и уведомлениями" />
        </PageHeader>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
        </div>
      </PageShell>
    );
  }

  if (profileError) {
    return (
      <PageShell>
        <PageHeader>
          <PageTitle title="Настройки" subtitle="Управляйте безопасностью, подпиской и уведомлениями" />
        </PageHeader>
        <div className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
          <RequestErrorState
            message={profileError}
            onRetry={() => window.location.reload()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader>
        <PageTitle
          title="Настройки"
          subtitle="Безопасность аккаунта, подписка и Telegram-уведомления в одном месте"
        />
      </PageHeader>

      <div className="space-y-8">
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <Shield size={16} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--pf-text)]">Безопасность</h2>
              <p className="text-xs text-[var(--pf-text-dim)]">Управление паролем аккаунта</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-6">
            <div className="max-w-sm space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--pf-text-dim)]">Текущий пароль</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="w-full rounded-lg border border-[var(--pf-border-strong)] bg-[var(--pf-elevated)] px-4 py-2.5 pr-10 text-sm text-[var(--pf-text)] placeholder-[var(--pf-text-soft)] focus:border-[var(--pf-accent-soft-strong)] focus:outline-none transition-colors"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pf-text-dim)] hover:text-[var(--pf-text)]"
                    aria-label="Показать или скрыть текущий пароль"
                  >
                    {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--pf-text-dim)]">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="w-full rounded-lg border border-[var(--pf-border-strong)] bg-[var(--pf-elevated)] px-4 py-2.5 pr-10 text-sm text-[var(--pf-text)] placeholder-[var(--pf-text-soft)] focus:border-[var(--pf-accent-soft-strong)] focus:outline-none transition-colors"
                    placeholder="Введите новый пароль"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pf-text-dim)] hover:text-[var(--pf-text)]"
                    aria-label="Показать или скрыть новый пароль"
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 rounded-full transition-colors ${passwordStrength >= i ? strengthView.color : 'bg-[var(--pf-surface-3)]'}`}
                    />
                  ))}
                </div>
                <p className={`mt-1 text-[10px] ${newPassword ? strengthView.textColor : 'text-[var(--pf-text-dim)]'}`}>
                  {newPassword ? strengthView.label : 'Минимум 8 символов'}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--pf-text-dim)]">Повторите новый пароль</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="w-full rounded-lg border border-[var(--pf-border-strong)] bg-[var(--pf-elevated)] px-4 py-2.5 pr-10 text-sm text-[var(--pf-text)] placeholder-[var(--pf-text-soft)] focus:border-[var(--pf-accent-soft-strong)] focus:outline-none transition-colors"
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pf-text-dim)] hover:text-[var(--pf-text)]"
                    aria-label="Показать или скрыть подтверждение"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {mismatch ? <p className="mt-1 text-[10px] text-red-500">Пароли не совпадают</p> : null}
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword || !canChangePassword}
                className="mt-2 w-full rounded-lg bg-[var(--pf-accent)] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--pf-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingPassword ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Сохраняем...
                  </span>
                ) : (
                  'Сменить пароль'
                )}
              </button>
            </div>
          </div>
        </section>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--pf-border)]" />
        </div>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <CreditCard size={16} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--pf-text)]">Подписка</h2>
              <p className="text-xs text-[var(--pf-text-dim)]">Тариф и управление оплатой</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-6">
            <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pf-accent-soft)]">
                  <Zap size={20} className="text-[var(--pf-accent)]" />
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-[var(--pf-text)]">{planMeta.title}</span>
                    <span className="rounded-full bg-[var(--pf-accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--pf-accent)]">
                      АКТИВНА
                    </span>
                  </div>
                  <div className="text-xs text-[var(--pf-text-dim)]">
                    {subscriptionLoading ? 'Проверяем подписку...' : (
                      <>Действует до <span className="text-[var(--pf-text-muted)]">{formatDate(expiresAt)}</span></>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--pf-text-dim)]">{planMeta.limits}</div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:w-auto">
                <button
                  type="button"
                  onClick={() => toast.info('Продление будет доступно в ближайшем обновлении')}
                  className="platform-btn-secondary w-full sm:w-auto"
                >
                  Продлить
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Апгрейд тарифа скоро будет доступен')}
                  className="platform-btn-primary w-full sm:w-auto"
                >
                  ↑ Ultra
                </button>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--pf-border)] pt-5">
              <div className="mb-1.5 flex justify-between text-[10px] text-[var(--pf-text-dim)]">
                <span>{leftDays === null ? 'Без ограничения по времени' : `Осталось ${leftDays} дн.`}</span>
                <span>{leftDays === null ? '∞' : 'из 30'}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-[var(--pf-surface-3)]">
                <progress className="platform-ai-progress normal h-full w-full rounded-full" value={progressPercent} max={100} />
              </div>
            </div>
          </div>
        </section>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--pf-border)]" />
        </div>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--pf-accent-soft)]">
              <Send size={16} className="text-[var(--pf-accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--pf-text)]">Telegram уведомления</h2>
              <p className="text-xs text-[var(--pf-text-dim)]">Получайте важные события в Telegram</p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--pf-accent-soft)]">
                <Bot size={18} className="text-[var(--pf-accent)]" />
              </div>

              <div className="flex-1">
                <div className="mb-0.5 text-sm font-medium text-[var(--pf-text)]">
                  {telegramLinked ? 'Telegram аккаунт привязан' : 'Привяжите Telegram аккаунт'}
                </div>
                <div className="text-xs text-[var(--pf-text-dim)]">
                  {telegramLinked
                    ? 'Уведомления будут приходить в ваш Telegram.'
                    : 'Подключите Telegram, чтобы получать важные уведомления от сайта.'}
                </div>
                {telegramUsername ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--pf-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--pf-text)]">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {telegramUsername}
                  </div>
                ) : telegramLinked && telegramDisplayName ? (
                  <div className="mt-2 text-[11px] text-[var(--pf-text-dim)]">{telegramDisplayName}</div>
                ) : null}
                {telegramTemporarilyUnavailable ? (
                  <div className="mt-2 text-[11px] text-red-400">
                    {telegramConfigError || 'Подключение Telegram временно недоступно.'}
                  </div>
                ) : null}
              </div>

              {telegramLinked ? (
                <button
                  type="button"
                  onClick={handleTelegramUnlink}
                  disabled={telegramUnlinking}
                  className="platform-btn-secondary flex-shrink-0"
                >
                  {telegramUnlinking ? 'Отвязываем...' : 'Отвязать Telegram'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTelegramDialogOpen(true)}
                  disabled={!telegramWidgetAvailable || telegramLinkLoading}
                  className="platform-btn-primary flex flex-shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={12} />
                  Войти через Telegram
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--pf-border)] p-4">
              <div>
                <div className="text-sm font-medium text-[var(--pf-text)]">Уведомления в Telegram</div>
                <div className="mt-0.5 text-xs text-[var(--pf-text-dim)]">
                  {telegramLinked ? 'Включить или выключить все' : 'Сначала привяжите Telegram аккаунт'}
                </div>
              </div>
              <Toggle
                checked={notifications.enabled}
                onChange={() => {
                  const nextState = { ...notifications, enabled: !notifications.enabled };
                  void persistNotifications(nextState);
                }}
                disabled={telegramNotificationsLocked}
              />
            </div>

            {NOTIFICATION_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const disabledByMaster = telegramNotificationsLocked || !notifications.enabled;
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-4 px-4 py-3.5 ${index < NOTIFICATION_ITEMS.length - 1 ? 'border-b border-[var(--pf-border)]' : ''} ${
                    disabledByMaster ? 'pointer-events-none opacity-40' : ''
                  }`}
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--pf-surface-2)]">
                    <Icon size={13} className="text-[var(--pf-text-dim)]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[var(--pf-text)]">{item.label}</div>
                    <div className="text-xs text-[var(--pf-text-dim)]">{item.desc}</div>
                  </div>
                  <Toggle
                    compact
                    checked={Boolean(notifications[item.key])}
                    onChange={() => {
                      const nextState = { ...notifications, [item.key]: !notifications[item.key] };
                      void persistNotifications(nextState);
                    }}
                    disabled={disabledByMaster}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Dialog open={telegramDialogOpen} onOpenChange={setTelegramDialogOpen}>
        <DialogContent className="platform-dialog-content sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Войти через Telegram</DialogTitle>
            <DialogDescription className="text-[var(--pf-text-dim)]">
              Подтвердите вход через Telegram, чтобы привязать аккаунт и разрешить боту отправлять уведомления.
            </DialogDescription>
          </DialogHeader>

          {telegramWidgetAvailable && telegramLink?.bot_username ? (
            <div className="space-y-3">
              <TelegramLoginWidget
                botUsername={telegramLink.bot_username}
                onAuth={user => {
                  void handleTelegramAuth(user);
                }}
              />
              {telegramLinking ? (
                <div className="flex items-center justify-center gap-2 text-xs text-[var(--pf-text-dim)]">
                  <Loader2 size={14} className="animate-spin" />
                  Проверяем данные Telegram и привязываем аккаунт...
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-elevated)] p-4 text-sm text-[var(--pf-text-dim)]">
              Telegram Login Widget сейчас недоступен. Проверьте настройки интеграции и попробуйте снова.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
