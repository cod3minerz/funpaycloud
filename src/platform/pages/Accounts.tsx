'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  CircleCheck,
  Loader2,
  Pause,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Square,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
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

const AVATAR_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

function getAvatarColor(name: string): string {
  if (!name) return '#475569';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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

function getRecencyColorClass(value?: string | null): string {
  if (!value) return 'text-slate-500';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'text-slate-500';
  const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (diffHours < 1) return 'text-emerald-400';
  if (diffHours < 6) return 'text-amber-400';
  return 'text-rose-400';
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
  const [stoppingAll, setStoppingAll] = useState(false);
  // Map of accountId → loading state for raiser toggle
  const [raisingIds, setRaisingIds] = useState<Set<string | number>>(new Set());
  const [savingScheduleIds, setSavingScheduleIds] = useState<Set<string | number>>(new Set());
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
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
      toast.success('Аккаунт успешно добавлен');
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

  async function stopAll() {
    if (list.length === 0) return;
    setStoppingAll(true);
    try {
      await Promise.allSettled(list.map(acc => accountsApi.stopRaiser(acc.id)));
      setList(prev => prev.map(a => ({ ...a, raiser_active: false })));
      toast.success('Все воркеры остановлены');
    } catch {
      toast.error('Ошибка при остановке воркеров');
    } finally {
      setStoppingAll(false);
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

  const openAccountSheet = (accountId: number) => {
    setSelectedAccountID(accountId);
    setShowDeleteConfirm(false);
  };

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
              className="platform-btn-secondary"
              onClick={stopAll}
              disabled={stoppingAll || list.length === 0}
            >
              {stoppingAll ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
              Остановить всё
            </button>
            <button className="platform-btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Добавить аккаунт
            </button>
          </div>
        </PageHeader>

        <KpiGrid>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <ShieldCheck size={15} color="#4ade80" />
              Аккаунтов
            </div>
            <strong className="text-[26px]">{list.length}</strong>
            <span className="platform-kpi-meta">Всего в управлении</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <CircleCheck size={15} color="#60a5fa" />
              Runner активен
            </div>
            <strong className="text-[26px]">{runnerActiveCount}</strong>
            <span className="platform-kpi-meta">Ловит события прямо сейчас</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <CircleCheck size={15} color="#4ade80" />
              Keeper онлайн
            </div>
            <strong className="text-[26px]">{onlineCount}</strong>
            <span className="platform-kpi-meta">Сессии поддерживаются</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <Play size={15} color="#60a5fa" />
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
              className="platform-select"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
              style={{ maxWidth: 220 }}
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
                  <table className="platform-table" style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 320 }}>Аккаунт</th>
                        <th>Статусы</th>
                        <th style={{ textAlign: 'right' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(acc => {
                        const name = displayName(acc);
                        const isOnline = acc.runner_active || acc.keeper_active || acc.raiser_active;
                        return (
                          <tr
                            key={acc.id}
                            className="cursor-pointer hover:bg-white/[0.03]"
                            onClick={() => openAccountSheet(acc.id)}
                          >
                            <td>
                              <div className="flex items-center gap-3">
                                <span className="platform-avatar" style={{ backgroundColor: getAvatarColor(name) }}>
                                  {name[0]?.toUpperCase() ?? 'U'}
                                </span>
                                <div>
                                  <div className="font-semibold">{name}</div>
                                  <div className="text-[12px] text-[var(--pf-text-dim)] inline-flex items-center gap-1.5">
                                    <span
                                      className="inline-block w-2 h-2 rounded-full"
                                      style={{ backgroundColor: isOnline ? '#22c55e' : '#64748b' }}
                                    />
                                    {isOnline ? 'Онлайн' : 'Оффлайн'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="inline-flex items-center gap-2">
                                <span
                                  title={`Runner: ${acc.runner_active ? 'Активен' : 'Остановлен'}`}
                                  className={`h-2.5 w-2.5 rounded-full ${acc.runner_active ? 'bg-blue-500' : 'bg-slate-600'}`}
                                />
                                <span
                                  title={`Keeper: ${acc.keeper_active ? 'Онлайн' : 'Оффлайн'}`}
                                  className={`h-2.5 w-2.5 rounded-full ${acc.keeper_active ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                />
                                <span
                                  title={`Raiser: ${acc.raiser_active ? 'Запущен' : 'Остановлен'}`}
                                  className={`h-2.5 w-2.5 rounded-full ${acc.raiser_active ? 'bg-violet-500' : 'bg-slate-600'}`}
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:border-blue-500/40 hover:text-blue-300"
                                  onClick={event => {
                                    event.stopPropagation();
                                    openAccountSheet(acc.id);
                                  }}
                                >
                                  Открыть
                                  <ChevronRight size={14} />
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
                      className="platform-mobile-card cursor-pointer hover:border-blue-500/40"
                      onClick={() => openAccountSheet(acc.id)}
                    >
                      <div className="platform-mobile-card-head">
                        <div className="inline-flex items-center gap-2">
                          <span className="platform-avatar" style={{ backgroundColor: getAvatarColor(name) }}>
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
                            className={`h-2.5 w-2.5 rounded-full ${acc.runner_active ? 'bg-blue-500' : 'bg-slate-600'}`}
                          />
                          <span
                            title={`Keeper: ${acc.keeper_active ? 'Онлайн' : 'Оффлайн'}`}
                            className={`h-2.5 w-2.5 rounded-full ${acc.keeper_active ? 'bg-emerald-500' : 'bg-slate-600'}`}
                          />
                          <span
                            title={`Raiser: ${acc.raiser_active ? 'Запущен' : 'Остановлен'}`}
                            className={`h-2.5 w-2.5 rounded-full ${acc.raiser_active ? 'bg-violet-500' : 'bg-slate-600'}`}
                          />
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          Подробнее <ChevronRight size={14} />
                        </span>
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
          className="w-full border-l border-slate-800 bg-slate-950 p-0 text-slate-100 data-[state=open]:duration-200 data-[state=closed]:duration-200 sm:max-w-[380px]"
        >
          {selectedAccount && (
            <div className="h-full overflow-y-auto p-5">
              <div className="space-y-6">
                <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
                      style={{ backgroundColor: getAvatarColor(displayName(selectedAccount)) }}
                    >
                      {displayName(selectedAccount)[0]?.toUpperCase() ?? 'U'}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-100">
                        {displayName(selectedAccount)}
                      </h3>
                      <p className="text-xs text-slate-400">FunPay ID: {selectedAccount.id}</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <span
                          className={`h-2 w-2 rounded-full ${selectedAccount.runner_active || selectedAccount.keeper_active || selectedAccount.raiser_active ? 'bg-emerald-500' : 'bg-slate-500'}`}
                        />
                        {selectedAccount.runner_active || selectedAccount.keeper_active || selectedAccount.raiser_active ? 'Онлайн' : 'Оффлайн'}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Воркеры</h4>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Runner</span>
                      <span className={selectedAccount.runner_active ? 'text-emerald-400' : 'text-slate-400'}>
                        {selectedAccount.runner_active ? 'Активен' : 'Остановлен'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-400">
                      <p>Событий сегодня: {selectedAccount.runner_events_today ?? 0}</p>
                      <p>
                        Последнее событие:{' '}
                        <span className={getRecencyColorClass(selectedAccount.runner_last_event_at)}>
                          {formatRelativeTime(selectedAccount.runner_last_event_at)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Keeper</span>
                      <span className={selectedAccount.keeper_active ? 'text-emerald-400' : 'text-slate-400'}>
                        {selectedAccount.keeper_active ? 'Онлайн' : 'Остановлен'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Сессия обновлена: {formatRelativeTime(selectedAccount.runner_last_event_at)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Raiser</span>
                      <span className={selectedAccount.raiser_active ? 'text-emerald-400' : 'text-slate-400'}>
                        {selectedAccount.raiser_active ? 'Запущен' : 'Остановлен'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Следующее поднятие:{' '}
                      {getNextRaiseCountdown(
                        scheduleDrafts[String(selectedAccount.id)] || selectedAccount.raiser_time,
                        selectedAccount.raiser_timezone,
                      )}
                    </p>
                    <button
                      type="button"
                      className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] text-sm text-slate-200 hover:border-blue-500/40 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Расписание</h4>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        className="h-10 flex-1 rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                        value={scheduleDrafts[String(selectedAccount.id)] || '12:00'}
                        onChange={event =>
                          setScheduleDrafts(prev => ({ ...prev, [String(selectedAccount.id)]: event.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200 hover:border-blue-500/40 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <p className="mt-2 text-xs text-slate-500">
                      Часовой пояс: {selectedAccount.raiser_timezone || 'Europe/Moscow'}
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Действия</h4>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 text-sm font-medium text-rose-300 hover:bg-rose-500/15"
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
        <DialogContent className="max-w-[420px] border-slate-700 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>Удалить аккаунт?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            <strong>{selectedAccount ? displayName(selectedAccount) : 'Этот аккаунт'}</strong> будет удалён.
            <br />
            История чатов и заказов сохранится в базе данных.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-300 hover:bg-white/[0.06]"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deletingAccount}
            >
              Отмена
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-rose-500/40 bg-rose-500/15 px-3 text-sm font-medium text-rose-200 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => selectedAccount && removeAccount(selectedAccount.id)}
              disabled={!selectedAccount || deletingAccount}
            >
              {deletingAccount ? <Loader2 size={14} className="animate-spin" /> : 'Удалить'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle>Новый аккаунт</DialogTitle>
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
