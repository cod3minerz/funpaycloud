'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Headphones,
  Loader2,
  RefreshCw,
  Shield,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, settingsApi, type SubscriptionData } from '@/lib/api';
import {
  type CanonicalPlanId,
  getPlanLabel,
  normalizePlanId,
  subscriptionPlans,
} from '@/shared/subscriptions';
import { PageHeader, PageShell, PageTitle, RequestErrorState } from '@/platform/components/primitives';

type PlanLimit = {
  accounts: number;
  analytics: string;
  plugins: string;
  aiMessages: string;
};

const PLAN_LIMITS: Record<CanonicalPlanId, PlanLimit> = {
  trial: { accounts: 1, analytics: '7 дней', plugins: 'Базовые', aiMessages: '100 / мес' },
  lite: { accounts: 1, analytics: '7 дней', plugins: 'Нет', aiMessages: 'Нет' },
  pro: { accounts: 5, analytics: '30 дней', plugins: 'Базовые', aiMessages: '500 / мес' },
  ultra: { accounts: Number.POSITIVE_INFINITY, analytics: 'Без ограничений', plugins: 'VIP', aiMessages: 'Без лимита' },
};

const COMPARISON_ROWS = [
  { label: 'Аккаунты', lite: '1', pro: '5', ultra: 'Безлимит' },
  { label: 'Аналитика', lite: '7 дней', pro: '30 дней + CSV', ultra: 'Без ограничений' },
  { label: 'Автоматизация', lite: '2 правила', pro: '10 правил', ultra: 'Без ограничений' },
  { label: 'Шаблоны сообщений', lite: '3', pro: '15', ultra: 'Без ограничений' },
  { label: 'AI ответы', lite: '—', pro: '500 / мес', ultra: 'Без лимита' },
  { label: 'Плагины', lite: '—', pro: 'Базовые', ultra: 'VIP + эксклюзив' },
  { label: 'Поддержка', lite: 'Базовая', pro: 'Приоритетная', ultra: 'Персональная 24/7' },
] as const;

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function getDaysLeft(subscription: SubscriptionData | null): number | null {
  if (!subscription) return null;
  if (typeof subscription.days_left === 'number' && Number.isFinite(subscription.days_left)) {
    return Math.max(0, Math.round(subscription.days_left));
  }

  if (!subscription.expires_at) return null;
  const expiresAt = new Date(subscription.expires_at);
  if (Number.isNaN(expiresAt.getTime())) return null;

  const ms = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function isSubscriptionActive(subscription: SubscriptionData | null, planId: CanonicalPlanId): boolean {
  if (planId === 'trial') return true;
  if (!subscription?.expires_at) return false;
  const expiresAt = new Date(subscription.expires_at);
  if (Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt.getTime() > Date.now();
}

function subscriptionProgress(daysLeft: number | null, planId: CanonicalPlanId): number {
  if (planId === 'trial' && daysLeft === null) return 100;
  if (daysLeft === null) return 0;
  const base = planId === 'ultra' ? 30 : 30;
  return Math.max(0, Math.min(100, Math.round((daysLeft / base) * 100)));
}

function cardOrderClass(planId: 'lite' | 'pro' | 'ultra') {
  if (planId === 'pro') return 'order-1 xl:order-2';
  if (planId === 'lite') return 'order-2 xl:order-1';
  return 'order-3 xl:order-3';
}

export default function SubscriptionPage() {
  const [annual, setAnnual] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [accountsUsed, setAccountsUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      const [subscriptionResult, accountsResult] = await Promise.allSettled([
        settingsApi.getSubscription(),
        accountsApi.list(),
      ]);

      if (cancelled) return;

      if (subscriptionResult.status === 'fulfilled') {
        setSubscription(subscriptionResult.value);
      } else {
        setSubscription(null);
        setError(subscriptionResult.reason instanceof Error ? subscriptionResult.reason.message : 'Не удалось загрузить подписку');
      }

      if (accountsResult.status === 'fulfilled') {
        setAccountsUsed(accountsResult.value.length);
      } else {
        setAccountsUsed(0);
      }

      setLoading(false);
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlanId = useMemo(
    () => normalizePlanId(subscription?.plan ?? 'trial'),
    [subscription?.plan],
  );

  const currentPlanLabel = useMemo(() => getPlanLabel(currentPlanId), [currentPlanId]);
  const daysLeft = useMemo(() => getDaysLeft(subscription), [subscription]);
  const active = useMemo(() => isSubscriptionActive(subscription, currentPlanId), [subscription, currentPlanId]);
  const progress = useMemo(() => subscriptionProgress(daysLeft, currentPlanId), [daysLeft, currentPlanId]);
  const planLimit = PLAN_LIMITS[currentPlanId];
  const accountLimitText = Number.isFinite(planLimit.accounts) ? String(planLimit.accounts) : '∞';

  const statusLabel = active ? 'Активная подписка' : 'Пробный период';

  const heroCtaLabel = active ? 'Продлить на месяц' : 'Выбрать тариф';

  if (loading) {
    return (
      <PageShell>
        <PageHeader>
          <PageTitle title="Подписка" subtitle="Управляйте тарифом и лимитами аккаунта" />
        </PageHeader>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader>
          <PageTitle title="Подписка" subtitle="Управляйте тарифом и лимитами аккаунта" />
        </PageHeader>
        <div className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
          <RequestErrorState message={error} onRetry={() => window.location.reload()} />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader>
        <PageTitle title="Подписка" subtitle="Выберите оптимальный тариф для роста продаж" />
      </PageHeader>

      <div className="space-y-8 pb-8">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--pf-accent-soft-strong)] bg-gradient-to-br from-[var(--pf-accent-soft)] via-[var(--pf-surface)] to-[var(--pf-surface-2)] p-5 sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-28 -translate-y-28 rounded-full bg-[var(--pf-accent-soft)] blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 -translate-x-20 translate-y-20 rounded-full bg-[var(--pf-accent-soft)] blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                <span className={`text-xs font-semibold tracking-wide uppercase ${active ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {statusLabel}
                </span>
              </div>

              <h2 className="mb-2 text-2xl font-bold text-[var(--pf-text)] sm:text-3xl">
                Тариф{' '}
                <span className="bg-gradient-to-r from-[var(--pf-accent)] to-[var(--pf-accent-2)] bg-clip-text text-transparent">
                  {currentPlanLabel}
                </span>
              </h2>

              <p className="text-sm text-[var(--pf-text-muted)]">
                {subscription?.expires_at ? (
                  <>
                    Действует до <span className="font-medium text-[var(--pf-text)]">{formatDate(subscription.expires_at)}</span>
                    {typeof daysLeft === 'number' ? (
                      <>
                        {' '}
                        · Осталось <span className="font-medium text-[var(--pf-text)]">{daysLeft} дн.</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>Пробный период активен. Подберите тариф и зафиксируйте лучшие лимиты для работы.</>
                )}
              </p>
            </div>

            <div className="relative hidden h-20 w-20 shrink-0 md:flex md:items-center md:justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--pf-border-strong)" strokeWidth="2.2" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="url(#subscription-progress-grad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${progress} 100`}
                />
                <defs>
                  <linearGradient id="subscription-progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--pf-accent)" />
                    <stop offset="100%" stopColor="var(--pf-accent-2)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-[var(--pf-text)]">{progress}%</span>
                <span className="text-[9px] text-[var(--pf-text-soft)]">остаток</span>
              </div>
            </div>
          </div>

          <div className="relative mt-6 border-t border-[var(--pf-border)] pt-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:items-center lg:gap-7">
              <div>
                <div className="text-xs text-[var(--pf-text-dim)]">Аккаунтов</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--pf-text)]">
                  {accountsUsed} / {accountLimitText}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--pf-text-dim)]">Аналитика</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--pf-text)]">{planLimit.analytics}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--pf-text-dim)]">Плагины</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--pf-text)]">{planLimit.plugins}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--pf-text-dim)]">AI сообщений</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--pf-text)]">{planLimit.aiMessages}</div>
              </div>

              <button
                type="button"
                onClick={() => toast.info('Оплата появится в следующем обновлении')}
                className="platform-btn-secondary col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:justify-self-end lg:ml-auto"
              >
                {heroCtaLabel}
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="text-sm text-[var(--pf-text-muted)]">Ежемесячно</span>
            <button
              type="button"
              aria-label="Переключить период оплаты"
              onClick={() => setAnnual(value => !value)}
              className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${
                annual ? 'bg-indigo-500' : 'bg-[var(--pf-surface-3)]'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  annual ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--pf-text-muted)]">Ежегодно</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700">-20%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {subscriptionPlans.map(plan => {
              const isCurrent = currentPlanId === plan.id;
              const price = annual ? plan.priceYearly : plan.priceMonthly;

              return (
                <article
                  key={plan.id}
                  className={`relative ${cardOrderClass(plan.id)} rounded-2xl border p-6 transition-all duration-300 ${
                    plan.id === 'pro'
                      ? 'border-[var(--pf-accent-soft-strong)] bg-gradient-to-br from-[var(--pf-accent-soft)] via-[var(--pf-surface)] to-[var(--pf-surface)] shadow-[var(--pf-shadow-soft)]'
                      : 'border-[var(--pf-border)] bg-[var(--pf-surface)] hover:border-[var(--pf-border-strong)]'
                  }`}
                >
                  {plan.id === 'pro' ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--pf-accent-2)] to-[var(--pf-accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      Популярный
                    </div>
                  ) : null}

                  <div className="mb-6">
                    <div className={`mb-2 text-xs font-semibold uppercase tracking-widest ${plan.id === 'pro' ? 'text-[var(--pf-accent)]' : 'text-[var(--pf-text-dim)]'}`}>
                      {plan.name}
                    </div>
                    <div className="mb-1 flex items-end gap-1">
                      <span className="text-4xl font-bold text-[var(--pf-text)]">{price}</span>
                      <span className="mb-1 text-sm text-[var(--pf-text-dim)]">₽/мес</span>
                    </div>
                    {annual ? <div className="text-xs text-[var(--pf-text-soft)] line-through">{plan.priceMonthly} ₽/мес</div> : null}
                    <p className="mt-2 text-xs text-[var(--pf-text-dim)]">{plan.tagline}</p>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => toast.info('Оплата будет доступна в ближайшем релизе')}
                    className={`mb-6 h-11 w-full rounded-xl text-sm font-semibold transition-all ${
                      isCurrent
                        ? 'cursor-default border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                        : plan.id === 'pro'
                          ? 'bg-gradient-to-r from-[var(--pf-accent-2)] to-[var(--pf-accent)] text-white shadow-[var(--pf-shadow-soft)] hover:from-[var(--pf-accent-hover)] hover:to-[var(--pf-accent)]'
                          : plan.id === 'ultra'
                            ? 'border border-purple-500/30 bg-purple-500/10 text-purple-700 hover:bg-purple-500/15'
                            : 'border border-[var(--pf-border-strong)] bg-[var(--pf-surface-2)] text-[var(--pf-text-muted)] hover:border-[var(--pf-accent-soft-strong)] hover:text-[var(--pf-text)]'
                    }`}
                  >
                    {isCurrent ? 'Текущий тариф' : plan.cta}
                  </button>

                  <ul className="space-y-3">
                    {plan.features.map(feature => (
                      <li
                        key={feature.text}
                        className={`flex items-center gap-2.5 text-sm ${feature.available ? 'text-[var(--pf-text-muted)]' : 'text-[var(--pf-text-soft)]/80'}`}
                      >
                        {feature.available ? (
                          <Check size={14} className={plan.id === 'ultra' ? 'text-purple-600' : plan.id === 'pro' ? 'text-[var(--pf-accent)]' : 'text-emerald-600'} />
                        ) : (
                          <X size={14} className="text-[var(--pf-text-soft)]/70" />
                        )}
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setComparisonOpen(open => !open)}
              className="inline-flex items-center gap-2 text-sm text-[var(--pf-text-soft)] transition-colors hover:text-[var(--pf-text-muted)]"
            >
              <ChevronDown size={14} className={`transition-transform ${comparisonOpen ? 'rotate-180' : ''}`} />
              {comparisonOpen ? 'Скрыть подробное сравнение' : 'Показать подробное сравнение'}
            </button>
          </div>

          {comparisonOpen ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--pf-border)] bg-[var(--pf-surface-2)]">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--pf-text-dim)]">Функция</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--pf-text-dim)]">Lite</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--pf-accent)]">Pro</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-purple-700">Ultra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map(row => (
                      <tr key={row.label} className="border-b border-[var(--pf-border)] last:border-0">
                        <td className="px-4 py-3 text-sm text-[var(--pf-text)]">{row.label}</td>
                        <td className="px-4 py-3 text-sm text-[var(--pf-text-muted)]">{row.lite}</td>
                        <td className="px-4 py-3 text-sm text-[var(--pf-text-muted)]">{row.pro}</td>
                        <td className="px-4 py-3 text-sm text-[var(--pf-text-muted)]">{row.ultra}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>

        <section className="border-t border-[var(--pf-border)] pt-8">
          <div className="flex flex-col items-stretch justify-center gap-7 md:flex-row md:items-start md:gap-12">
            {[
              { icon: Shield, text: 'Безопасная оплата', sub: 'ЮKassa · шифрование' },
              { icon: RefreshCw, text: 'Возврат за 3 дня', sub: 'Если сервис не работал' },
              { icon: Headphones, text: 'Поддержка 24/7', sub: 'Ответ в течение 30 минут' },
            ].map(item => (
              <div key={item.text} className="flex flex-col items-center gap-2 text-center">
                <item.icon size={18} className="text-[var(--pf-text-dim)]" />
                <div className="text-xs font-medium text-[var(--pf-text-muted)]">{item.text}</div>
                <div className="text-[10px] text-[var(--pf-text-soft)]">{item.sub}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
