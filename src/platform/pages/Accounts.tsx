'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import {
  BadgeDollarSign,
  ChevronRight,
  CircleCheck,
  Loader2,
  LifeBuoy,
  Network,
  Pause,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Square,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Sheet, SheetContent } from '@/app/components/ui/sheet';
import { accountsApi, ApiAccount } from '@/lib/api';
import { sanitizeInput, validateGoldenKey } from '@/lib/sanitize';
import {
  DataTableWrap,
  EmptyState,
  KpiCard,
  KpiGrid,
  PageHeader,
  PageShell,
  PageTitle,
  RequestErrorState,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

const AVATAR_TONES = [
  'platform-avatar-tone-0',
  'platform-avatar-tone-1',
  'platform-avatar-tone-2',
  'platform-avatar-tone-3',
  'platform-avatar-tone-4',
  'platform-avatar-tone-5',
  'platform-avatar-tone-6',
  'platform-avatar-tone-7',
];

function getAvatarToneClass(name: string): string {
  if (!name) return 'platform-avatar-tone-fallback';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function displayName(acc: ApiAccount): string {
  const value = acc.username?.trim();
  return value ? value : 'Загрузка...';
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'только что';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'только что';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} дн назад`;
}

function getMinutesInTimezone(timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

function getNextRaiseCountdown(timeValue?: string, timezoneValue?: string): string {
  const raw = (timeValue || '').trim();
  if (!/^\d{2}:\d{2}$/.test(raw)) return '—';
  const [hh, mm] = raw.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return '—';

  const currentMinutes = getMinutesInTimezone(timezoneValue || 'Europe/Moscow');
  const targetMinutes = hh * 60 + mm;
  let delta = targetMinutes - currentMinutes;
  if (delta <= 0) delta += 24 * 60;

  const hours = Math.floor(delta / 60);
  const minutes = delta % 60;
  if (hours === 0) return `через ${minutes}м`;
  if (minutes === 0) return `через ${hours}ч`;
  return `через ${hours}ч ${minutes}м`;
}

function getRecencyClass(value?: string | null): string {
  if (!value) return 'text-[var(--pf-text-soft)]';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'text-[var(--pf-text-soft)]';
  const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (diffHours < 1) return 'text-[var(--pf-success)]';
  if (diffHours < 6) return 'text-[var(--pf-warning)]';
  return 'text-[var(--pf-danger)]';
}

function getProxyDotClass(acc: ApiAccount): string {
  if (!acc.proxy_connected) return 'platform-status-dot-soft';
  if (acc.proxy_healthy) return 'platform-status-dot-success';
  return 'platform-status-dot-warning';
}

function isAccountRuntimeActive(acc: ApiAccount): boolean {
  return Boolean(acc.runner_active || acc.keeper_active || acc.raiser_active);
}

export default function Accounts() {
  const [list, setList] = useState<ApiAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [goldenKey, setGoldenKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [bulkRuntimeLoading, setBulkRuntimeLoading] = useState(false);
  // Map of accountId → loading state for raiser toggle
  const [raisingIds, setRaisingIds] = useState<Set<string | number>>(new Set());
  const [runtimeLoadingIds, setRuntimeLoadingIds] = useState<Set<string | number>>(new Set());
  const [savingScheduleIds, setSavingScheduleIds] = useState<Set<string | number>>(new Set());
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showProxyDialog, setShowProxyDialog] = useState(false);
  const [showExternalProxyDialog, setShowExternalProxyDialog] = useState(false);
  const [switchingToExternalProxyDialog, setSwitchingToExternalProxyDialog] = useState(false);
  const [proxyAccountID, setProxyAccountID] = useState<number | null>(null);
  const [proxyConnecting, setProxyConnecting] = useState(false);
  const [proxyConnectingMode, setProxyConnectingMode] = useState<'free' | 'external' | null>(null);
  const [proxyConnectError, setProxyConnectError] = useState<string | null>(null);
  const [proxySupportURL, setProxySupportURL] = useState('https://t.me/funpaycloud_support');
  const [externalProxyStatus, setExternalProxyStatus] = useState<'form' | 'checking' | 'success'>('form');
  const [externalProxyError, setExternalProxyError] = useState<string | null>(null);
  const [externalProxyHost, setExternalProxyHost] = useState('');
  const [externalProxyPort, setExternalProxyPort] = useState('8080');
  const [externalProxyProtocol, setExternalProxyProtocol] = useState<'HTTP' | 'HTTPS' | 'SOCKS5'>('HTTP');
  const [externalProxyUsername, setExternalProxyUsername] = useState('');
  const [externalProxyPassword, setExternalProxyPassword] = useState('');
  const [, setMinuteTick] = useState(Date.now());

  async function loadAccounts() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await accountsApi.list();
      const next = Array.isArray(data) ? data : [];
      setList(next);
      setScheduleDrafts(Object.fromEntries(next.map(acc => [String(acc.id), String(acc.raiser_time ?? '12:00').slice(0, 5)])));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки аккаунтов';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => {
    const interval = setInterval(() => setMinuteTick(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return list.filter(acc => {
      if (statusFilter === 'online' && !acc.keeper_active) return false;
      if (statusFilter === 'offline' && acc.keeper_active) return false;
      if (q && !(acc.username || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, query, statusFilter]);

  const selectedAccount = useMemo(
    () => list.find(acc => acc.id === selectedAccountID) ?? null,
    [list, selectedAccountID],
  );
  const proxyTargetAccount = useMemo(
    () => list.find(acc => acc.id === proxyAccountID) ?? null,
    [list, proxyAccountID],
  );

  async function createAccount() {
    const key = sanitizeInput(goldenKey);
    if (!validateGoldenKey(key)) {
      toast.error('Golden Key должен содержать 20–64 латинских букв или цифр');
      return;
    }

    setCreating(true);
    try {
      await accountsApi.add(key);
      setGoldenKey('');
      setShowCreate(false);
      toast.success('Аккаунт добавлен. Подключите прокси, чтобы запустить воркеры.');
      await loadAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка добавления аккаунта');
    } finally {
      setCreating(false);
    }
  }

  async function removeAccount(id: string | number) {
    setDeletingAccount(true);
    try {
      await accountsApi.delete(id);
      toast.success('Аккаунт удалён');
      setShowDeleteConfirm(false);
      setSelectedAccountID(null);
      await loadAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления аккаунта');
    } finally {
      setDeletingAccount(false);
    }
  }

  async function toggleRaiser(acc: ApiAccount) {
    setRaisingIds(prev => new Set(prev).add(acc.id));
    try {
      if (acc.raiser_active) {
        await accountsApi.stopRaiser(acc.id);
        setList(prev => prev.map(a => a.id === acc.id ? { ...a, raiser_active: false } : a));
        toast.success(`Автоподнятие остановлено (${displayName(acc)})`);
      } else {
        await accountsApi.startRaiser(acc.id);
        setList(prev => prev.map(a => a.id === acc.id ? { ...a, raiser_active: true } : a));
        toast.success(`Автоподнятие запущено (${displayName(acc)})`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка управления воркером');
    } finally {
      setRaisingIds(prev => { const next = new Set(prev); next.delete(acc.id); return next; });
    }
  }

  async function toggleAccountRuntime(acc: ApiAccount) {
    setRuntimeLoadingIds(prev => new Set(prev).add(acc.id));
    try {
      if (isAccountRuntimeActive(acc)) {
        await accountsApi.stopRuntime(acc.id);
        setList(prev => prev.map(a => (a.id === acc.id ? { ...a, runner_active: false, keeper_active: false, raiser_active: false } : a)));
        toast.success(`Аккаунт выключен (${displayName(acc)})`);
      } else {
        await accountsApi.startRuntime(acc.id);
        setList(prev => prev.map(a => (a.id === acc.id ? { ...a, runner_active: true, keeper_active: true, raiser_active: true } : a)));
        toast.success(`Аккаунт включен (${displayName(acc)})`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка управления аккаунтом');
    } finally {
      setRuntimeLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(acc.id);
        return next;
      });
    }
  }

  async function toggleAllRuntime() {
    if (list.length === 0) return;
    const hasAnyActive = list.some(isAccountRuntimeActive);
    setBulkRuntimeLoading(true);
    try {
      if (hasAnyActive) {
        await accountsApi.stopAllRuntime();
        setList(prev => prev.map(a => ({ ...a, runner_active: false, keeper_active: false, raiser_active: false })));
        toast.success('Все аккаунты выключены');
      } else {
        const result = await accountsApi.startAllRuntime();
        const failedIDs = new Set(Object.keys(result.failed || {}).map(Number));
        setList(prev =>
          prev.map(a => (failedIDs.has(Number(a.id)) ? a : { ...a, runner_active: true, keeper_active: true, raiser_active: true })),
        );
        if (failedIDs.size > 0) {
          toast.warning(`Запущено: ${result.started}. Не удалось запустить: ${failedIDs.size}. Проверьте прокси.`);
        } else {
          toast.success('Все аккаунты запущены');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка управления воркерами');
    } finally {
      setBulkRuntimeLoading(false);
    }
  }

  async function saveSchedule(acc: ApiAccount) {
    const nextTime = scheduleDrafts[String(acc.id)] || '12:00';
    setSavingScheduleIds(prev => new Set(prev).add(acc.id));
    try {
      await accountsApi.updateRaiserSchedule(acc.id, nextTime, acc.raiser_timezone || 'Europe/Moscow');
      setList(prev => prev.map(a => (a.id === acc.id ? { ...a, raiser_time: nextTime } : a)));
      toast.success(`Расписание сохранено (${displayName(acc)})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения расписания');
    } finally {
      setSavingScheduleIds(prev => {
        const next = new Set(prev);
        next.delete(acc.id);
        return next;
      });
    }
  }

  const runnerActiveCount = list.filter(a => a.runner_active).length;
  const onlineCount = list.filter(a => a.keeper_active).length;
  const raisingCount = list.filter(a => a.raiser_active).length;
  const hasAnyRuntimeActive = list.some(isAccountRuntimeActive);

  const openAccountSheet = (accountId: number) => {
    setSelectedAccountID(accountId);
    setShowDeleteConfirm(false);
  };

  const openProxyConnectDialog = (accountID: number) => {
    setProxyAccountID(accountID);
    setProxyConnectError(null);
    setProxyConnectingMode(null);
    setExternalProxyStatus('form');
    setExternalProxyError(null);
    setExternalProxyHost('');
    setExternalProxyPort('8080');
    setExternalProxyProtocol('HTTP');
    setExternalProxyUsername('');
    setExternalProxyPassword('');
    setShowProxyDialog(true);
  };

  const openExternalProxyDialog = () => {
    setSwitchingToExternalProxyDialog(true);
    setExternalProxyStatus('form');
    setExternalProxyError(null);
    setShowExternalProxyDialog(true);
    setShowProxyDialog(false);
  };

  async function connectFreeProxy() {
    if (!proxyTargetAccount) return;
    setProxyConnecting(true);
    setProxyConnectingMode('free');
    setProxyConnectError(null);
    try {
      const result = await accountsApi.connectProxy(proxyTargetAccount.id, { mode: 'free' });
      if (result?.support_url) {
        setProxySupportURL(result.support_url);
      }
      toast.success(result?.label || 'Бесплатный прокси подключен');
      await loadAccounts();
      setShowProxyDialog(false);
      setProxyAccountID(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось подключить прокси';
      setProxyConnectError(message);
      toast.error(message);
      if (message.toLowerCase().includes('заняты')) {
        setProxySupportURL('https://t.me/funpaycloud_support');
      }
    } finally {
      setProxyConnecting(false);
      setProxyConnectingMode(null);
    }
  }

  async function connectExternalProxy() {
    if (!proxyTargetAccount) return;
    const host = sanitizeInput(externalProxyHost).trim().toLowerCase();
    const port = Number(externalProxyPort);
    const username = sanitizeInput(externalProxyUsername).trim();
    const password = sanitizeInput(externalProxyPassword).trim();

    if (!host) {
      const message = 'Введите хост внешнего прокси';
      setExternalProxyError(message);
      toast.error(message);
      return;
    }
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      const message = 'Порт должен быть числом от 1 до 65535';
      setExternalProxyError(message);
      toast.error(message);
      return;
    }

    setExternalProxyStatus('checking');
    setExternalProxyError(null);
    try {
      const result = await accountsApi.connectProxy(proxyTargetAccount.id, {
        mode: 'external',
        protocol: externalProxyProtocol,
        host,
        port,
        username: username || undefined,
        password: password || undefined,
      });
      toast.success(result?.label || 'Внешний прокси подключен');
      await loadAccounts();
      setExternalProxyStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось подключить внешний прокси';
      setExternalProxyStatus('form');
      setExternalProxyError(message);
      toast.error(message);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Аккаунты"
            subtitle="Управление фермами аккаунтов: статусы, баланс, рейтинг и операционные действия в одном месте."
          />
          <div className="inline-flex items-center gap-2 flex-wrap">
            <button
              className={hasAnyRuntimeActive ? 'platform-btn-secondary' : 'platform-btn-primary'}
              onClick={toggleAllRuntime}
              disabled={bulkRuntimeLoading || list.length === 0}
            >
              {bulkRuntimeLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : hasAnyRuntimeActive ? (
                <Square size={14} />
              ) : (
                <Play size={14} />
              )}
              {hasAnyRuntimeActive ? 'Остановить всё' : 'Запустить всё'}
            </button>
            <button className="platform-btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Добавить аккаунт
            </button>
          </div>
        </PageHeader>

        <KpiGrid>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <ShieldCheck size={15} color="var(--pf-success)" />
              Аккаунтов
            </div>
            <strong className="text-[26px]">{list.length}</strong>
            <span className="platform-kpi-meta">Всего в управлении</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <CircleCheck size={15} color="var(--pf-accent)" />
              Runner активен
            </div>
            <strong className="text-[26px]">{runnerActiveCount}</strong>
            <span className="platform-kpi-meta">Ловит события прямо сейчас</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <CircleCheck size={15} color="var(--pf-success)" />
              Keeper онлайн
            </div>
            <strong className="text-[26px]">{onlineCount}</strong>
            <span className="platform-kpi-meta">Сессии поддерживаются</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <Play size={15} color="var(--pf-accent)" />
              Raiser запущен
            </div>
            <strong className="text-[26px]">{raisingCount}</strong>
            <span className="platform-kpi-meta">Автоподнятие включено</span>
          </KpiCard>
        </KpiGrid>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={14} color="var(--pf-text-dim)" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Поиск по логину аккаунта"
                aria-label="Поиск аккаунта"
              />
            </label>

            <select
              className="platform-select w-full sm:max-w-[220px]"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <option value="all">Все статусы</option>
              <option value="online">Keeper онлайн</option>
              <option value="offline">Keeper оффлайн</option>
            </select>
          </ToolbarRow>
        </SectionCard>

        <SectionCard className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
            </div>
          ) : loadError ? (
            <RequestErrorState message={loadError} onRetry={loadAccounts} />
          ) : (
            <>
              <div className="platform-desktop-table">
                <DataTableWrap>
                  <table className="platform-table min-w-[760px]">
                    <thead>
                      <tr>
                        <th className="w-[320px]">Аккаунт</th>
                        <th>Статусы</th>
                        <th>Прокси</th>
                        <th className="text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(acc => {
                        const name = displayName(acc);
                        const isOnline = acc.runner_active || acc.keeper_active || acc.raiser_active;
                        return (
                          <tr
                            key={acc.id}
                            className="cursor-pointer hover:bg-[var(--pf-surface-2)]"
                            onClick={() => openAccountSheet(acc.id)}
                          >
                            <td>
                              <div className="flex items-center gap-3">
                                <span className={`platform-avatar ${getAvatarToneClass(name)}`}>
                                  {name[0]?.toUpperCase() ?? 'U'}
                                </span>
                                <div>
                                  <div className="font-semibold">{name}</div>
                                  <div className="text-[12px] text-[var(--pf-text-dim)] inline-flex items-center gap-1.5">
                                    <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? 'platform-status-dot-success' : 'platform-status-dot-muted'}`} />
                                    {isOnline ? 'Онлайн' : 'Оффлайн'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="inline-flex items-center gap-2">
                                <span
                                  title={`Runner: ${acc.runner_active ? 'Активен' : 'Остановлен'}`}
                                  className={`h-2.5 w-2.5 rounded-full ${acc.runner_active ? 'platform-status-dot-accent' : 'platform-status-dot-soft'}`}
                                />
                                <span
                                  title={`Keeper: ${acc.keeper_active ? 'Онлайн' : 'Оффлайн'}`}
                                  className={`h-2.5 w-2.5 rounded-full ${acc.keeper_active ? 'platform-status-dot-success' : 'platform-status-dot-soft'}`}
                                />
                                <span
                                  title={`Raiser: ${acc.raiser_active ? 'Запущен' : 'Остановлен'}`}
                                  className={`h-2.5 w-2.5 rounded-full ${acc.raiser_active ? 'platform-status-dot-warning' : 'platform-status-dot-soft'}`}
                                />
                              </div>
                            </td>
                            <td>
                              <div className="inline-flex items-center gap-1.5 text-xs text-[var(--pf-text-muted)]">
                                <span className={`inline-block h-2 w-2 rounded-full ${getProxyDotClass(acc)}`} />
                                {acc.proxy_label || 'Прокси не подключен'}
                              </div>
                            </td>
                            <td className="text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  className="platform-account-inline-btn"
                                  onClick={event => {
                                    event.stopPropagation();
                                    openAccountSheet(acc.id);
                                  }}
                                >
                                  Открыть
                                  <ChevronRight size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="platform-account-inline-btn"
                                  onClick={event => {
                                    event.stopPropagation();
                                    openProxyConnectDialog(acc.id);
                                  }}
                                >
                                  <Network size={14} />
                                  {acc.proxy_connected ? 'Сменить прокси' : 'Подключить прокси'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>

              <div className="platform-mobile-cards">
                {filtered.map(acc => {
                  const name = displayName(acc);
                  const isOnline = acc.runner_active || acc.keeper_active || acc.raiser_active;
                  return (
                    <article
                      key={acc.id}
                      className="platform-mobile-card platform-mobile-card-bordered cursor-pointer"
                      onClick={() => openAccountSheet(acc.id)}
                    >
                      <div className="platform-mobile-card-head">
                        <div className="inline-flex items-center gap-2">
                          <span className={`platform-avatar ${getAvatarToneClass(name)}`}>
                            {name[0]?.toUpperCase() ?? 'U'}
                          </span>
                          <div className="text-[13px] font-semibold">{name}</div>
                        </div>
                        <span className={isOnline ? 'badge-active' : 'badge-inactive'}>
                          {isOnline ? 'Онлайн' : 'Оффлайн'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2">
                          <span
                            title={`Runner: ${acc.runner_active ? 'Активен' : 'Остановлен'}`}
                            className={`h-2.5 w-2.5 rounded-full ${acc.runner_active ? 'platform-status-dot-accent' : 'platform-status-dot-soft'}`}
                          />
                          <span
                            title={`Keeper: ${acc.keeper_active ? 'Онлайн' : 'Оффлайн'}`}
                            className={`h-2.5 w-2.5 rounded-full ${acc.keeper_active ? 'platform-status-dot-success' : 'platform-status-dot-soft'}`}
                          />
                          <span
                            title={`Raiser: ${acc.raiser_active ? 'Запущен' : 'Остановлен'}`}
                            className={`h-2.5 w-2.5 rounded-full ${acc.raiser_active ? 'platform-status-dot-warning' : 'platform-status-dot-soft'}`}
                          />
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--pf-text-dim)]">
                          Подробнее <ChevronRight size={14} />
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--pf-text-dim)]">
                          <span className="text-[var(--pf-text-soft)]">Прокси:</span>
                          <span className={`inline-block h-2 w-2 rounded-full ${getProxyDotClass(acc)}`} />
                          {acc.proxy_label || 'Прокси не подключен'}
                        </span>
                        <button
                          type="button"
                          className="platform-account-inline-btn !px-2 !py-1 !text-xs"
                          onClick={event => {
                            event.stopPropagation();
                            openProxyConnectDialog(acc.id);
                          }}
                        >
                          <Network size={12} />
                          Подключить
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              {filtered.length === 0 && <EmptyState>По текущим фильтрам аккаунты не найдены.</EmptyState>}
            </>
          )}
        </SectionCard>
      </PageShell>

      <Sheet
        open={Boolean(selectedAccount)}
        onOpenChange={open => {
          if (!open) {
            setSelectedAccountID(null);
            setShowDeleteConfirm(false);
          }
        }}
      >
        <SheetContent
          side="right"
          className="platform-account-sheet-content w-full p-0 data-[state=open]:duration-200 data-[state=closed]:duration-200 sm:max-w-[380px]"
        >
          {selectedAccount && (
            <div className="h-full overflow-y-auto p-4 pb-6 sm:p-5 sm:pb-7">
              <div className="space-y-6">
                <section className="platform-account-sheet-block rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white ${getAvatarToneClass(displayName(selectedAccount))}`}
                    >
                      {displayName(selectedAccount)[0]?.toUpperCase() ?? 'U'}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-[var(--pf-text)]">
                        {displayName(selectedAccount)}
                      </h3>
                      <p className="text-xs text-[var(--pf-text-dim)]">
                        FunPay ID: {selectedAccount.funpay_user_id || '—'}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--pf-text-muted)]">
                        <span className={`h-2 w-2 rounded-full ${
                          selectedAccount.runner_active || selectedAccount.keeper_active || selectedAccount.raiser_active
                            ? 'platform-status-dot-success'
                            : 'platform-status-dot-soft'
                        }`} />
                        {selectedAccount.runner_active || selectedAccount.keeper_active || selectedAccount.raiser_active ? 'Онлайн' : 'Оффлайн'}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-text-dim)]">Воркеры</h4>

                  <div className="platform-account-sheet-block rounded-xl p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Runner</span>
                      <span className={selectedAccount.runner_active ? 'text-[var(--pf-success)]' : 'text-[var(--pf-text-soft)]'}>
                        {selectedAccount.runner_active ? 'Активен' : 'Остановлен'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-[var(--pf-text-dim)]">
                      <p>Событий сегодня: {selectedAccount.runner_events_today ?? 0}</p>
                      <p>
                        Последнее событие:{' '}
                        <span className={getRecencyClass(selectedAccount.runner_last_event_at)}>
                          {formatRelativeTime(selectedAccount.runner_last_event_at)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="platform-account-sheet-block rounded-xl p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Keeper</span>
                      <span className={selectedAccount.keeper_active ? 'text-[var(--pf-success)]' : 'text-[var(--pf-text-soft)]'}>
                        {selectedAccount.keeper_active ? 'Онлайн' : 'Остановлен'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--pf-text-dim)]">
                      Сессия обновлена: {formatRelativeTime(selectedAccount.runner_last_event_at)}
                    </p>
                  </div>

                  <div className="platform-account-sheet-block rounded-xl p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Raiser</span>
                      <span className={selectedAccount.raiser_active ? 'text-[var(--pf-success)]' : 'text-[var(--pf-text-soft)]'}>
                        {selectedAccount.raiser_active ? 'Запущен' : 'Остановлен'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--pf-text-dim)]">
                      Следующее поднятие:{' '}
                      {getNextRaiseCountdown(
                        scheduleDrafts[String(selectedAccount.id)] || selectedAccount.raiser_time,
                        selectedAccount.raiser_timezone,
                      )}
                    </p>
                    <button
                      type="button"
                      className="platform-account-inline-btn mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => toggleRaiser(selectedAccount)}
                      disabled={raisingIds.has(selectedAccount.id)}
                    >
                      {raisingIds.has(selectedAccount.id) ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : selectedAccount.raiser_active ? (
                        <>
                          <Pause size={14} />
                          Пауза Raiser
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          Запуск Raiser
                        </>
                      )}
                    </button>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-text-dim)]">Расписание</h4>
                  <div className="platform-account-sheet-block rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        className="platform-input h-11 flex-1"
                        value={scheduleDrafts[String(selectedAccount.id)] || '12:00'}
                        onChange={event =>
                          setScheduleDrafts(prev => ({ ...prev, [String(selectedAccount.id)]: event.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="platform-account-inline-btn inline-flex h-11 items-center justify-center px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => saveSchedule(selectedAccount)}
                        disabled={savingScheduleIds.has(selectedAccount.id)}
                      >
                        {savingScheduleIds.has(selectedAccount.id) ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          'Сохранить'
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[var(--pf-text-soft)]">
                      Часовой пояс: {selectedAccount.raiser_timezone || 'Europe/Moscow'}
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-text-dim)]">Прокси</h4>
                  <div className="platform-account-sheet-block rounded-xl p-3">
                    <p className="inline-flex items-center gap-1.5 text-sm text-[var(--pf-text)]">
                      <span className={`h-2 w-2 rounded-full ${getProxyDotClass(selectedAccount)}`} />
                      {selectedAccount.proxy_label || 'Прокси не подключен'}
                    </p>
                    <p className="mt-2 text-xs text-[var(--pf-text-dim)]">
                      {selectedAccount.proxy_connected
                        ? 'Все запросы аккаунта идут через прокси.'
                        : 'Без прокси воркеры (Runner, Keeper, Raiser) не запускаются.'}
                    </p>
                    <button
                      type="button"
                      className="platform-account-inline-btn mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 text-sm"
                      onClick={() => openProxyConnectDialog(selectedAccount.id)}
                    >
                      <Network size={14} />
                      {selectedAccount.proxy_connected ? 'Сменить прокси' : 'Подключить прокси'}
                    </button>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-text-dim)]">Действия</h4>
                  <button
                    type="button"
                    onClick={() => toggleAccountRuntime(selectedAccount)}
                    className={`inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md border text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                      isAccountRuntimeActive(selectedAccount)
                        ? 'platform-account-danger-btn'
                        : 'platform-account-success-btn'
                    }`}
                    disabled={runtimeLoadingIds.has(selectedAccount.id)}
                  >
                    {runtimeLoadingIds.has(selectedAccount.id) ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isAccountRuntimeActive(selectedAccount) ? (
                      <>
                        <Square size={14} />
                        Выключить аккаунт
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        Включить аккаунт
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="platform-account-danger-btn inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md border text-sm font-medium"
                  >
                    <Trash2 size={14} />
                    Удалить аккаунт
                  </button>
                </section>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="platform-dialog-content sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Удалить аккаунт?</DialogTitle>
            <DialogDescription className="sr-only">
              Подтверждение удаления выбранного аккаунта FunPay.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-[var(--pf-text-muted)]">
            <strong>{selectedAccount ? displayName(selectedAccount) : 'Этот аккаунт'}</strong> будет удалён.
            <br />
            История чатов и заказов сохранится в базе данных.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="platform-account-inline-btn inline-flex h-10 items-center justify-center px-3 text-sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deletingAccount}
            >
              Отмена
            </button>
            <button
              type="button"
              className="platform-account-danger-btn inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => selectedAccount && removeAccount(selectedAccount.id)}
              disabled={!selectedAccount || deletingAccount}
            >
              {deletingAccount ? <Loader2 size={14} className="animate-spin" /> : 'Удалить'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showProxyDialog}
        onOpenChange={open => {
          setShowProxyDialog(open);
          if (!open) {
            setProxyConnectError(null);
            setProxyConnectingMode(null);
            setExternalProxyHost('');
            setExternalProxyPort('8080');
            setExternalProxyProtocol('HTTP');
            setExternalProxyUsername('');
            setExternalProxyPassword('');
            setExternalProxyError(null);
            setExternalProxyStatus('form');
            if (!switchingToExternalProxyDialog) {
              setProxyAccountID(null);
            } else {
              setSwitchingToExternalProxyDialog(false);
            }
          }
        }}
      >
        <DialogContent className="platform-dialog-content platform-proxy-dialog max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-[820px]">
          <DialogHeader>
            <DialogTitle>Выберите прокси</DialogTitle>
            <DialogDescription className="sr-only">
              Подключение бесплатного shared прокси или выбор индивидуального тарифа.
            </DialogDescription>
          </DialogHeader>
          <p className="text-base text-[var(--pf-text-muted)]">
            Аккаунт: <strong>{proxyTargetAccount ? displayName(proxyTargetAccount) : '—'}</strong>
          </p>

          <div className="platform-proxy-grid">
            <button
              type="button"
              className="platform-proxy-card platform-proxy-card-action text-left disabled:opacity-60"
              onClick={connectFreeProxy}
              disabled={proxyConnecting || !proxyTargetAccount}
            >
              <div className="platform-proxy-card-content">
                <h4 className="platform-proxy-card-title">Бесплатный прокси</h4>
                <p className="platform-proxy-card-description">
                  Прокси для 2 человек на платформе.
                </p>
                <div className="platform-proxy-card-illustration">
                  <Image
                    src="/illustrations/proxy/free_proxy.png"
                    alt=""
                    width={118}
                    height={118}
                    className="h-[118px] w-[118px] object-contain"
                  />
                </div>
              </div>
              {proxyConnecting && proxyConnectingMode === 'free' ? (
                <span className="platform-proxy-card-badge">
                  <Loader2 size={13} className="animate-spin" />
                  Подключаем...
                </span>
              ) : (
                <span className="platform-proxy-card-badge">
                  <Network size={13} />
                  Подключить
                </span>
              )}
            </button>

            <div className="platform-proxy-card platform-proxy-card-muted">
              <div className="platform-proxy-card-content">
                <h4 className="platform-proxy-card-title">Индивидуальный прокси</h4>
                <p className="platform-proxy-card-description">
                  Ваш личный безопасный прокси.
                </p>
                <div className="platform-proxy-card-illustration">
                  <Image
                    src="/illustrations/proxy/individual_proxy.png"
                    alt=""
                    width={118}
                    height={118}
                    className="h-[118px] w-[118px] object-contain"
                  />
                </div>
              </div>
              <span className="platform-proxy-card-badge">
                <BadgeDollarSign size={13} />
                Скоро
              </span>
            </div>

            <button
              type="button"
              className="platform-proxy-card platform-proxy-card-action text-left disabled:opacity-60"
              onClick={openExternalProxyDialog}
              disabled={!proxyTargetAccount}
            >
              <div className="platform-proxy-card-content">
                <h4 className="platform-proxy-card-title">Внешний прокси</h4>
                <p className="platform-proxy-card-description">
                  Подключи свой собственный прокси.
                </p>
                <div className="platform-proxy-card-illustration platform-proxy-card-illustration-external">
                  <Image
                    src="/illustrations/proxy/external_proxy.png"
                    alt=""
                    width={134}
                    height={118}
                    className="h-[118px] w-auto object-contain object-right"
                  />
                </div>
              </div>
              <span className="platform-proxy-card-badge">
                <Network size={13} />
                Настроить
              </span>
            </button>
          </div>

          {proxyConnectError && (
            <div className="platform-alert-warning rounded-lg px-3 py-2">
              <p className="text-sm text-[var(--pf-text)]">{proxyConnectError}</p>
              {proxyConnectError.toLowerCase().includes('заняты') && (
                <a
                  href={proxySupportURL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pf-accent)]"
                >
                  <LifeBuoy size={12} />
                  Написать в поддержку
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showExternalProxyDialog}
        onOpenChange={open => {
          setShowExternalProxyDialog(open);
          if (!open) {
            setExternalProxyStatus('form');
            setExternalProxyError(null);
            setProxyAccountID(null);
            setExternalProxyHost('');
            setExternalProxyPort('8080');
            setExternalProxyProtocol('HTTP');
            setExternalProxyUsername('');
            setExternalProxyPassword('');
          }
        }}
      >
        <DialogContent className="platform-dialog-content platform-external-proxy-dialog max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Настройка внешнего прокси</DialogTitle>
            <DialogDescription className="sr-only">
              Введите параметры собственного прокси и подключите его к аккаунту.
            </DialogDescription>
          </DialogHeader>

          {externalProxyStatus === 'checking' ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
              <p className="text-sm font-medium text-[var(--pf-text)]">
                Проверяем прокси и подключаем аккаунт
              </p>
              <p className="text-xs text-[var(--pf-text-dim)]">
                Пробуем подключиться к FunPay через указанный прокси...
              </p>
            </div>
          ) : externalProxyStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <CircleCheck size={34} className="text-[var(--pf-success)]" />
              <p className="text-base font-semibold text-[var(--pf-text)]">Вы подключены</p>
              <p className="text-sm text-[var(--pf-text-dim)]">
                Внешний прокси успешно привязан к аккаунту{' '}
                <strong>{proxyTargetAccount ? displayName(proxyTargetAccount) : '—'}</strong>.
              </p>
              <button
                type="button"
                className="platform-btn-primary mt-1"
                onClick={() => {
                  setShowExternalProxyDialog(false);
                  setExternalProxyStatus('form');
                  setExternalProxyError(null);
                  setProxyAccountID(null);
                }}
              >
                Готово
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--pf-text-muted)]">
                Аккаунт: <strong>{proxyTargetAccount ? displayName(proxyTargetAccount) : '—'}</strong>
              </p>
              <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
                  <input
                    value={externalProxyHost}
                    onChange={event => setExternalProxyHost(event.target.value)}
                    placeholder="host или ip"
                    className="platform-input h-11"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <input
                    value={externalProxyPort}
                    onChange={event => setExternalProxyPort(event.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                    placeholder="port"
                    inputMode="numeric"
                    className="platform-input h-11"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <select
                    value={externalProxyProtocol}
                    onChange={event => setExternalProxyProtocol(event.target.value as 'HTTP' | 'HTTPS' | 'SOCKS5')}
                    className="platform-select h-11 min-w-0"
                  >
                    <option value="HTTP">HTTP</option>
                    <option value="HTTPS">HTTPS</option>
                    <option value="SOCKS5">SOCKS5</option>
                  </select>
                  <input
                    value={externalProxyUsername}
                    onChange={event => setExternalProxyUsername(event.target.value)}
                    placeholder="логин (опц.)"
                    className="platform-input h-11"
                    autoComplete="off"
                  />
                  <input
                    value={externalProxyPassword}
                    onChange={event => setExternalProxyPassword(event.target.value)}
                    placeholder="пароль (опц.)"
                    className="platform-input h-11"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {externalProxyError && (
                <div className="platform-alert-warning rounded-lg px-3 py-2">
                  <p className="text-sm text-[var(--pf-text)]">{externalProxyError}</p>
                </div>
              )}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  className="platform-btn-secondary"
                  onClick={() => {
                    setShowExternalProxyDialog(false);
                    setExternalProxyStatus('form');
                    setExternalProxyError(null);
                    setProxyAccountID(null);
                  }}
                >
                  Отмена
                </button>
                <button type="button" className="platform-btn-primary" onClick={() => void connectExternalProxy()}>
                  Подтвердить
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="platform-dialog-content sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Новый аккаунт</DialogTitle>
            <DialogDescription className="sr-only">
              Форма добавления аккаунта FunPay по Golden Key.
            </DialogDescription>
          </DialogHeader>
          <p className="text-[14px] text-[var(--pf-text-muted)]">
            Введите Golden Key от аккаунта FunPay для подключения к ферме.
          </p>
          <div className="grid gap-3">
            <div>
              <input
                className="platform-input"
                value={goldenKey}
                onChange={event => setGoldenKey(event.target.value)}
                placeholder="Golden Key (20–64 символа)"
              />
              <p className="mt-1 text-[12px] text-[var(--pf-text-dim)]">
                Найти в настройках профиля на FunPay
              </p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="platform-btn-secondary flex-1" onClick={() => setShowCreate(false)}>
              Отмена
            </button>
            <button className="platform-btn-primary flex-1" onClick={createAccount} disabled={creating}>
              {creating ? <Loader2 size={14} className="animate-spin" /> : 'Добавить'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
