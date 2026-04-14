'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
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
    try {
      await accountsApi.delete(id);
      setList(prev => prev.filter(acc => acc.id !== id));
      toast.success('Аккаунт удалён');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления аккаунта');
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
                  <table className="platform-table" style={{ minWidth: 960 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 300 }}>Аккаунт</th>
                        <th>Статусы</th>
                        <th>Метрики</th>
                        <th>Следующее поднятие</th>
                        <th style={{ textAlign: 'right' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(acc => {
                        const isRaising = raisingIds.has(acc.id);
                        const name = displayName(acc);
                        const runnerEventsToday = acc.runner_events_today ?? 0;
                        const nextRaiseCountdown = getNextRaiseCountdown(
                          scheduleDrafts[String(acc.id)] || acc.raiser_time,
                          acc.raiser_timezone,
                        );
                        return (
                          <tr key={acc.id}>
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
                                      style={{ backgroundColor: acc.keeper_active ? '#22c55e' : '#64748b' }}
                                    />
                                    {acc.keeper_active ? 'Онлайн' : 'Оффлайн'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="text-[12px] leading-6 space-y-0.5">
                                <div>
                                  Runner:{' '}
                                  <span className={acc.runner_active ? 'badge-active' : 'badge-inactive'}>
                                    ● {acc.runner_active ? 'Активен' : 'Остановлен'}
                                  </span>
                                </div>
                                <div>
                                  Keeper:{' '}
                                  <span className={acc.keeper_active ? 'badge-active' : 'badge-inactive'}>
                                    ● {acc.keeper_active ? 'Онлайн' : 'Оффлайн'}
                                  </span>
                                </div>
                                <div>
                                  Raiser:{' '}
                                  <span className={acc.raiser_active ? 'badge-active' : 'badge-inactive'}>
                                    ● {acc.raiser_active ? 'Запущен' : 'Остановлен'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="text-[12px] leading-6 text-[var(--pf-text-muted)]">
                                <div>Событий Runner сегодня: <strong>{runnerEventsToday}</strong></div>
                                <div>Последнее событие: <strong>{formatRelativeTime(acc.runner_last_event_at)}</strong></div>
                                <div>Активных лотов: <strong>{acc.active_lots_count ?? 0}</strong></div>
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-col gap-2">
                                <div className="text-[12px] text-[var(--pf-text-muted)]">
                                  {nextRaiseCountdown}
                                </div>
                                <div className="inline-flex items-center gap-2">
                                <input
                                  type="time"
                                  className="platform-input"
                                  style={{ minHeight: 34, padding: '4px 8px', width: 140 }}
                                  value={scheduleDrafts[String(acc.id)] || '12:00'}
                                  onChange={event =>
                                    setScheduleDrafts(prev => ({ ...prev, [String(acc.id)]: event.target.value }))
                                  }
                                />
                                <button
                                  className="platform-btn-secondary"
                                  onClick={() => saveSchedule(acc)}
                                  disabled={savingScheduleIds.has(acc.id)}
                                >
                                  {savingScheduleIds.has(acc.id) ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    'Сохранить'
                                  )}
                                </button>
                              </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="inline-flex items-center gap-2">
                                <button
                                  className="platform-btn-secondary"
                                  onClick={() => toggleRaiser(acc)}
                                  disabled={isRaising}
                                  title={acc.raiser_active ? 'Остановить автоподнятие' : 'Запустить автоподнятие'}
                                >
                                  {isRaising ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : acc.raiser_active ? (
                                    <><Pause size={14} /> Пауза Raiser</>
                                  ) : (
                                    <><Play size={14} /> Запуск Raiser</>
                                  )}
                                </button>
                                <button
                                  className="platform-topbar-btn"
                                  onClick={() => removeAccount(acc.id)}
                                  aria-label="Удалить аккаунт"
                                >
                                  <Trash2 size={15} />
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
                  const isRaising = raisingIds.has(acc.id);
                  const name = displayName(acc);
                  const nextRaiseCountdown = getNextRaiseCountdown(
                    scheduleDrafts[String(acc.id)] || acc.raiser_time,
                    acc.raiser_timezone,
                  );
                  return (
                    <article key={acc.id} className="platform-mobile-card">
                      <div className="platform-mobile-card-head">
                        <div className="inline-flex items-center gap-2">
                          <span className="platform-avatar" style={{ backgroundColor: getAvatarColor(name) }}>
                            {name[0]?.toUpperCase() ?? 'U'}
                          </span>
                          <div className="text-[13px] font-semibold">{name}</div>
                        </div>
                        <span className={acc.keeper_active ? 'badge-active' : 'badge-inactive'}>
                          {acc.keeper_active ? 'Онлайн' : 'Оффлайн'}
                        </span>
                      </div>

                      <div className="platform-mobile-meta">
                        <span>Runner: {acc.runner_active ? '● Активен' : '● Остановлен'}</span>
                        <span>Keeper: {acc.keeper_active ? '● Онлайн' : '● Оффлайн'}</span>
                        <span>Raiser: {acc.raiser_active ? '● Запущен' : '● Остановлен'}</span>
                        <span>Событий сегодня: {acc.runner_events_today ?? 0}</span>
                        <span>Последнее событие: {formatRelativeTime(acc.runner_last_event_at)}</span>
                        <span>Следующее поднятие: {nextRaiseCountdown}</span>
                        <span>Активных лотов: {acc.active_lots_count ?? 0}</span>
                      </div>

                      <div className="platform-mobile-actions">
                        <input
                          type="time"
                          className="platform-input"
                          style={{ minHeight: 34, padding: '4px 8px' }}
                          value={scheduleDrafts[String(acc.id)] || '12:00'}
                          onChange={event =>
                            setScheduleDrafts(prev => ({ ...prev, [String(acc.id)]: event.target.value }))
                          }
                        />
                        <button
                          className="platform-btn-secondary"
                          onClick={() => saveSchedule(acc)}
                          disabled={savingScheduleIds.has(acc.id)}
                        >
                          {savingScheduleIds.has(acc.id) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            'Сохранить'
                          )}
                        </button>
                        <button
                          className="platform-btn-secondary"
                          onClick={() => toggleRaiser(acc)}
                          disabled={isRaising}
                        >
                          {isRaising ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : acc.raiser_active ? (
                            <><Pause size={14} /> Пауза Raiser</>
                          ) : (
                            <><Play size={14} /> Запуск Raiser</>
                          )}
                        </button>
                        <button
                          className="platform-topbar-btn"
                          onClick={() => removeAccount(acc.id)}
                          aria-label="Удалить аккаунт"
                        >
                          <Trash2 size={15} />
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
