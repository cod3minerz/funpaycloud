'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import {
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { adminApi, AdminOperations } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform2/components/ui/card';
import Badge from '@/platform2/components/ui/badge/Badge';
import Alert from '@/platform2/components/ui/alert/Alert';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

function rub(value: number) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function levelColor(level: string): 'error' | 'warning' | 'info' | 'success' {
  if (level === 'critical') return 'error';
  if (level === 'warning') return 'warning';
  if (level === 'info') return 'info';
  return 'success';
}

function scoreColor(score: number) {
  if (score < 50) return 'text-error-600 dark:text-error-400';
  if (score < 75) return 'text-warning-600 dark:text-warning-400';
  return 'text-success-600 dark:text-success-500';
}

function MetricCard({
  title,
  value,
  helper,
  Icon,
  tone = 'primary',
}: {
  title: string;
  value: string;
  helper?: string;
  Icon: ComponentType<{ className?: string }>;
  tone?: 'primary' | 'error' | 'warning' | 'success' | 'info';
}) {
  const toneClass = {
    primary: 'bg-brand-500/10 text-brand-500',
    error: 'bg-error-500/10 text-error-500',
    warning: 'bg-warning-500/10 text-warning-500',
    success: 'bg-success-500/10 text-success-600',
    info: 'bg-blue-light-500/10 text-blue-light-500',
  }[tone];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            {helper && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helper}</p>}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OperationsPage() {
  const [data, setData] = useState<AdminOperations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await adminApi.operations();
        if (!active) return;
        setData(next);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить Operations Center');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const updatedAt = useMemo(() => formatDate(data?.checked_at), [data?.checked_at]);
  const critical = data?.summary?.critical ?? 0;
  const warning = data?.summary?.warning ?? 0;
  const incidents = data?.incidents ?? [];
  const accountHealth = data?.account_health ?? [];
  const pulseGate = data?.pulsegate;
  const activeCooldowns = pulseGate?.active_cooldowns ?? [];
  const paymentIssues = data?.payment_issues ?? [];
  const aiMemory = data?.ai_memory ?? [];
  const recentPayments = data?.payments ?? data?.recent_payments ?? [];
  const proxyCost = data?.proxy_cost;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Operations Center</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Единый слой контроля: инциденты, воркеры, платежи, прокси, PulseGate и память ИИ.
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Обновлено: {loading && !data ? '…' : updatedAt}
        </div>
      </div>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Инциденты"
          value={loading && !data ? '…' : `${critical} / ${warning}`}
          helper="critical / warning"
          Icon={ExclamationTriangleIcon}
          tone={critical > 0 ? 'error' : warning > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Аккаунты"
          value={loading && !data ? '…' : `${data?.summary?.unhealthy_accounts ?? 0} / ${data?.summary?.accounts_total ?? 0}`}
          helper="требуют внимания / всего"
          Icon={ShieldCheckIcon}
          tone={(data?.summary?.unhealthy_accounts ?? 0) > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="PulseGate"
          value={loading && !data ? '…' : pulseGate?.mode ?? '—'}
          helper={`${activeCooldowns.length} cooldown, ${pulseGate?.total_rate_limited_events ?? 0} 429`}
          Icon={BoltIcon}
          tone={(pulseGate?.total_rate_limited_events ?? 0) > 0 ? 'warning' : 'info'}
        />
        <MetricCard
          title="Прокси"
          value={loading && !data ? '…' : `${proxyCost?.shared_free_slots ?? 0} сл.`}
          helper={`оценка ${rub(proxyCost?.estimated_monthly_rub ?? 0)}/мес`}
          Icon={SparklesIcon}
          tone={(proxyCost?.shared_free_slots ?? 0) < 3 ? 'warning' : 'success'}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800">
          <CardTitle>Incident Center</CardTitle>
          <Badge color={critical > 0 ? 'error' : warning > 0 ? 'warning' : 'success'} size="sm">
            {incidents.length} событий
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {!incidents.length ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Загружаем инциденты…' : 'Критичных событий нет. Система выглядит спокойно.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {incidents.slice(0, 12).map((item) => (
                <div key={item.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color={levelColor(item.level)} size="sm">{item.level}</Badge>
                      <span className="text-xs uppercase tracking-wide text-gray-400">{item.source}</span>
                    </div>
                    <p className="mt-2 font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.message}</p>
                  </div>
                  {item.action_href && (
                    <Link
                      href={item.action_href}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                    >
                      {item.action_label || 'Открыть'}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Account Health Score</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3">
              {accountHealth.slice(0, 12).map((account) => (
                <div key={account.account_id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {account.username}
                        <span className="ml-2 text-xs font-normal text-gray-400">#{account.account_id}</span>
                      </p>
                      <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                        {account.user_email || 'без email'} · {account.plan} · {account.proxy_label || 'без прокси'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xl font-bold ${scoreColor(account.score)}`}>{account.score}</span>
                      <Badge color={account.runner_active ? 'success' : 'light'} size="sm">runner</Badge>
                      <Badge color={account.keeper_active ? 'success' : 'light'} size="sm">keeper</Badge>
                      <Badge color={account.raiser_active ? 'success' : 'light'} size="sm">raiser</Badge>
                    </div>
                  </div>
                  {(account.issues.length > 0 || account.recommendation) && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                      {account.issues.length > 0 && <p>{account.issues.join(' · ')}</p>}
                      {account.recommendation && <p className="mt-1 text-gray-500 dark:text-gray-400">{account.recommendation}</p>}
                    </div>
                  )}
                </div>
              ))}
              {!loading && !accountHealth.length && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Аккаунты не найдены.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reliability</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                {paymentIssues.slice(0, 6).map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900 dark:text-white">#{payment.id}</p>
                      <Badge color={payment.provision_status === 'failed' ? 'error' : 'warning'} size="sm">
                        {payment.provision_status || payment.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {payment.user_email || `user ${payment.user_id}`} · {payment.type} · {rub(payment.amount)}
                    </p>
                    {payment.provision_error && (
                      <p className="mt-2 text-xs text-error-600 dark:text-error-400">{payment.provision_error}</p>
                    )}
                  </div>
                ))}
                {!loading && !paymentIssues.length && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Зависших платежей нет.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proxy Cost Control</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                  <p className="text-gray-500">Shared active</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">{proxyCost?.shared_active ?? '…'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                  <p className="text-gray-500">Free slots</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">{proxyCost?.shared_free_slots ?? '…'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                  <p className="text-gray-500">Unhealthy</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">{proxyCost?.shared_unhealthy ?? '…'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                  <p className="text-gray-500">Paid</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">{proxyCost?.paid_active ?? '…'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>PulseGate Control</CardTitle>
            <Badge color={pulseGate?.mode === 'enforce' ? 'success' : 'warning'} size="sm">
              {pulseGate?.mode ?? '…'}
            </Badge>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                <p className="text-gray-500">Buckets</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">{pulseGate?.buckets_total ?? '…'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                <p className="text-gray-500">Cooldown</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">{activeCooldowns.length}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                <p className="text-gray-500">429</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">{pulseGate?.total_rate_limited_events ?? '…'}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {activeCooldowns.slice(0, 5).map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                  <span className="truncate text-gray-700 dark:text-gray-300">{item.key}</span>
                  <Badge color="warning" size="sm">{Math.ceil(item.remaining_sec)} сек</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>AI Conversation Memory</CardTitle>
            <Badge color="info" size="sm">{aiMemory.length} summaries</Badge>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3">
              {aiMemory.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {item.account_username || `account ${item.account_id}`} · {item.with_user || `chat ${item.chat_id}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        msg #{item.last_message_id} · {formatDate(item.updated_at)}
                      </p>
                    </div>
                    <ChatBubbleLeftRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
                    {item.summary_preview || 'Сводка пустая'}
                  </p>
                </div>
              ))}
              {!loading && !aiMemory.length && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Память диалогов пока не накоплена.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Recent Payments</CardTitle>
          <CreditCardIcon className="h-5 w-5 text-gray-400" />
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {recentPayments.slice(0, 8).map((payment) => (
              <div key={payment.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900 dark:text-white">#{payment.id}</p>
                  <Badge color={payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'error' : 'warning'} size="sm">
                    {payment.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{payment.user_email || 'unknown'}</p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{payment.type} · {rub(payment.amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
