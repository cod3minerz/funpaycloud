'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CircleCheck,
  CircleOff,
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
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

export default function Accounts() {
  const [list, setList] = useState<ApiAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [goldenKey, setGoldenKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [stoppingAll, setStoppingAll] = useState(false);
  // Map of accountId → loading state for raiser toggle
  const [raisingIds, setRaisingIds] = useState<Set<string | number>>(new Set());

  async function loadAccounts() {
    setLoading(true);
    try {
      const data = await accountsApi.list();
      setList(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки аккаунтов');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAccounts(); }, []);

  const filtered = useMemo(() => {
    return list.filter(acc => {
      if (statusFilter === 'online' && !acc.keeper_active) return false;
      if (statusFilter === 'offline' && acc.keeper_active) return false;
      if (query && !acc.username.toLowerCase().includes(query.toLowerCase())) return false;
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
      const newAcc = await accountsApi.add(key);
      setList(prev => [newAcc, ...prev]);
      setGoldenKey('');
      setShowCreate(false);
      toast.success('Аккаунт успешно добавлен');
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
        toast.success(`Автоподнятие остановлено (${acc.username})`);
      } else {
        await accountsApi.startRaiser(acc.id);
        setList(prev => prev.map(a => a.id === acc.id ? { ...a, raiser_active: true } : a));
        toast.success(`Автоподнятие запущено (${acc.username})`);
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

  const onlineCount = list.filter(a => a.keeper_active).length;
  const offlineCount = list.filter(a => !a.keeper_active).length;
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
              <CircleCheck size={15} color="#4ade80" />
              Keeper онлайн
            </div>
            <strong className="text-[26px]">{onlineCount}</strong>
            <span className="platform-kpi-meta">Аккаунты активны сейчас</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <CircleOff size={15} color="#fbbf24" />
              Keeper оффлайн
            </div>
            <strong className="text-[26px]">{offlineCount}</strong>
            <span className="platform-kpi-meta">Требуется проверка</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <Play size={15} color="#60a5fa" />
              Авторайзер
            </div>
            <strong className="text-[26px]">{raisingCount}</strong>
            <span className="platform-kpi-meta">Автоподнятие активно</span>
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
          ) : (
            <>
              <div className="platform-desktop-table">
                <DataTableWrap>
                  <table className="platform-table" style={{ minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 270 }}>Аккаунт</th>
                        <th>Keeper</th>
                        <th>Раисер</th>
                        <th style={{ textAlign: 'right' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(acc => {
                        const isRaising = raisingIds.has(acc.id);
                        return (
                          <tr key={acc.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <span className="platform-avatar">
                                  {acc.username[0]?.toUpperCase() ?? 'U'}
                                </span>
                                <div className="font-semibold">{acc.username}</div>
                              </div>
                            </td>
                            <td>
                              <span className={acc.keeper_active ? 'badge-active' : 'badge-inactive'}>
                                {acc.keeper_active ? 'Онлайн' : 'Оффлайн'}
                              </span>
                            </td>
                            <td>
                              <span className={acc.raiser_active ? 'badge-active' : 'badge-inactive'}>
                                {acc.raiser_active ? 'Запущен' : 'Остановлен'}
                              </span>
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
                                    <><Pause size={14} /> Пауза</>
                                  ) : (
                                    <><Play size={14} /> Запуск</>
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
                  return (
                    <article key={acc.id} className="platform-mobile-card">
                      <div className="platform-mobile-card-head">
                        <div className="inline-flex items-center gap-2">
                          <span className="platform-avatar">
                            {acc.username[0]?.toUpperCase() ?? 'U'}
                          </span>
                          <div className="text-[13px] font-semibold">{acc.username}</div>
                        </div>
                        <span className={acc.keeper_active ? 'badge-active' : 'badge-inactive'}>
                          {acc.keeper_active ? 'Онлайн' : 'Оффлайн'}
                        </span>
                      </div>

                      <div className="platform-mobile-meta">
                        <span>Раисер: {acc.raiser_active ? 'Запущен' : 'Остановлен'}</span>
                      </div>

                      <div className="platform-mobile-actions">
                        <button
                          className="platform-btn-secondary"
                          onClick={() => toggleRaiser(acc)}
                          disabled={isRaising}
                        >
                          {isRaising ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : acc.raiser_active ? (
                            <><Pause size={14} /> Пауза</>
                          ) : (
                            <><Play size={14} /> Запуск</>
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
