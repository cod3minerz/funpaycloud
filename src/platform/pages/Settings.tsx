'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiError,
  settingsApi,
  type NotificationSettings,
  type ProfileData,
  type SubscriptionData,
  type TelegramLinkData,
} from '@/lib/api';
import { validatePassword } from '@/lib/sanitize';
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

function Toggle({ checked, onChange, disabled, compact = false }: { checked: boolean; onChange: () => void; disabled?: boolean; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${
        checked ? 'bg-indigo-500' : 'bg-white/10'
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
    enabled: true,
    new_order: true,
    new_message: true,
    login: true,
    weekly_report: false,
    subscription: true,
  });
  const [notificationsUnavailable, setNotificationsUnavailable] = useState(false);

  const [telegramLink, setTelegramLink] = useState<TelegramLinkData | null>(null);
  const [telegramUnavailable, setTelegramUnavailable] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
        setNotifications({
          enabled: Boolean(data.enabled),
          new_order: Boolean(data.new_order),
          new_message: Boolean(data.new_message),
          login: Boolean(data.login),
          weekly_report: Boolean(data.weekly_report),
          subscription: Boolean(data.subscription),
        });
      })
      .catch(err => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotificationsUnavailable(true);
          return;
        }
        setNotificationsUnavailable(true);
      });

    settingsApi
      .getTelegramLink()
      .then(data => {
        if (cancelled) return;
        setTelegramLink(data);
      })
      .catch(err => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setTelegramUnavailable(true);
          return;
        }
        setTelegramUnavailable(true);
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
    if (passwordStrength === 3) return { label: 'Хороший пароль', color: 'bg-blue-500', textColor: 'text-blue-400' };
    return { label: 'Надёжный пароль', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  }, [passwordStrength]);

  const planId = String(subscription?.plan || 'pro').toLowerCase();
  const planMeta = PLAN_META[planId] ?? { title: 'Профи', limits: '5 аккаунтов · 30 дней аналитики · Базовые плагины' };
  const expiresAt = subscription?.expires_at ?? null;
  const leftDays = daysLeft(expiresAt);
  const progressPercent = leftDays === null ? 100 : Math.min(100, Math.max(0, Math.round((leftDays / 30) * 100)));

  const telegramUsernameRaw = String(profile?.telegram_username ?? profile?.telegram ?? '').trim();
  const telegramUsername = telegramUsernameRaw ? (telegramUsernameRaw.startsWith('@') ? telegramUsernameRaw : `@${telegramUsernameRaw}`) : '';
  const telegramLinked = Boolean(telegramUsername);

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
    setNotifications(nextState);
    if (notificationsUnavailable) return;

    try {
      await settingsApi.updateNotifications(nextState);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotificationsUnavailable(true);
        toast.info('Сохранение уведомлений скоро будет доступно');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Не удалось сохранить настройки уведомлений');
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
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
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
              <h2 className="text-sm font-semibold text-white">Безопасность</h2>
              <p className="text-xs text-slate-500">Управление паролем аккаунта</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="max-w-sm space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Текущий пароль</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none transition-colors"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                    aria-label="Показать или скрыть текущий пароль"
                  >
                    {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none transition-colors"
                    placeholder="Введите новый пароль"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                    aria-label="Показать или скрыть новый пароль"
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 rounded-full transition-colors ${passwordStrength >= i ? strengthView.color : 'bg-white/10'}`}
                    />
                  ))}
                </div>
                <p className={`mt-1 text-[10px] ${newPassword ? strengthView.textColor : 'text-slate-600'}`}>
                  {newPassword ? strengthView.label : 'Минимум 8 символов'}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Повторите новый пароль</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none transition-colors"
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                    aria-label="Показать или скрыть подтверждение"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {mismatch ? <p className="mt-1 text-[10px] text-red-400">Пароли не совпадают</p> : null}
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword || !canChangePassword}
                className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
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
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <CreditCard size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Подписка</h2>
              <p className="text-xs text-slate-500">Тариф и управление оплатой</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10">
                  <Zap size={20} className="text-blue-400" />
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-white">{planMeta.title}</span>
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                      АКТИВНА
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {subscriptionLoading ? 'Проверяем подписку...' : (
                      <>Действует до <span className="text-slate-400">{formatDate(expiresAt)}</span></>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">{planMeta.limits}</div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:w-auto">
                <button
                  type="button"
                  onClick={() => toast.info('Продление будет доступно в ближайшем обновлении')}
                  className="w-full rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-white/[0.15] sm:w-auto"
                >
                  Продлить
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Апгрейд тарифа скоро будет доступен')}
                  className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-xs font-medium text-white transition-all hover:from-purple-500 hover:to-blue-500 sm:w-auto"
                >
                  ↑ Ultra
                </button>
              </div>
            </div>

            <div className="mt-5 border-t border-white/[0.04] pt-5">
              <div className="mb-1.5 flex justify-between text-[10px] text-slate-600">
                <span>{leftDays === null ? 'Без ограничения по времени' : `Осталось ${leftDays} дн.`}</span>
                <span>{leftDays === null ? '∞' : 'из 30'}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Send size={16} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Telegram уведомления</h2>
              <p className="text-xs text-slate-500">Получайте важные события в Telegram</p>
            </div>
            {(telegramUnavailable || notificationsUnavailable) ? (
              <span className="ml-auto rounded-full border border-white/[0.12] bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">
                Скоро
              </span>
            ) : null}
          </div>

          <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <Bot size={18} className="text-blue-400" />
              </div>

              <div className="flex-1">
                <div className="mb-0.5 text-sm font-medium text-white">
                  {telegramLinked ? 'Telegram аккаунт уже привязан' : 'Привяжите Telegram аккаунт'}
                </div>
                <div className="text-xs text-slate-500">
                  {telegramUnavailable
                    ? 'Интеграция Telegram в процессе запуска. Скоро станет доступна.'
                    : 'Нажмите кнопку и напишите боту /start с вашим кодом'}
                </div>
              </div>

              {telegramUnavailable ? (
                <button
                  type="button"
                  disabled
                  className="flex-shrink-0 rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-medium text-slate-500 opacity-70"
                >
                  Скоро
                </button>
              ) : (
                <a
                  href={telegramLink?.link || 'https://t.me/funpaycloud_bot'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500"
                >
                  <Send size={12} />
                  Открыть бота
                </a>
              )}
            </div>

            {telegramLinked ? (
              <div className="mt-3 flex items-center gap-2 border-t border-white/[0.04] pt-3">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400">
                  Привязан: <span className="text-white">{telegramUsername}</span>
                </span>
                <button
                  type="button"
                  onClick={() => toast.info('Отвязка Telegram скоро появится')}
                  className="ml-auto text-[10px] text-red-400 transition-colors hover:text-red-300"
                >
                  Отвязать
                </button>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/[0.04] p-4">
              <div>
                <div className="text-sm font-medium text-white">Уведомления в Telegram</div>
                <div className="mt-0.5 text-xs text-slate-500">Включить или выключить все</div>
              </div>
              <Toggle
                checked={notifications.enabled}
                onChange={() => {
                  const nextState = { ...notifications, enabled: !notifications.enabled };
                  void persistNotifications(nextState);
                }}
                disabled={notificationsUnavailable}
              />
            </div>

            {NOTIFICATION_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const disabledByMaster = !notifications.enabled || notificationsUnavailable;
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-4 px-4 py-3.5 ${index < NOTIFICATION_ITEMS.length - 1 ? 'border-b border-white/[0.04]' : ''} ${
                    disabledByMaster ? 'pointer-events-none opacity-40' : ''
                  }`}
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                    <Icon size={13} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
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
    </PageShell>
  );
}
