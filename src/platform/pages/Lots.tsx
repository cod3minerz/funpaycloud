'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpCircle, Loader2, Pencil, Plus, Power, Trash2, SearchX } from '@/shared/streamline/icons';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiLot, lotsApi } from '@/lib/api';
import { LotCreateDialog } from '@/platform/components/LotCreateDialog';
import { LotEditDialog } from '@/platform/components/LotEditDialog';
import {
  DataTableWrap,
  EmptyState,
  PageHeader,
  PageShell,
  PageTitle,
  RequestErrorState,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

export default function Lots() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [lots, setLots] = useState<ApiLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [raisingIDs, setRaisingIDs] = useState<Set<string>>(new Set());
  const [savingIDs, setSavingIDs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialAccountID, setCreateInitialAccountID] = useState<number | null>(null);

  const [editingLot, setEditingLot] = useState<ApiLot | null>(null);

  async function loadLots(refresh = false) {
    setLoading(true);
    setRefreshing(refresh);
    setLoadError(null);
    try {
      const accs = await accountsApi.list();
      const safeAccs = Array.isArray(accs) ? accs : [];
      setAccounts(safeAccs);

      const targetAccounts = accountFilter === 'all'
        ? safeAccs
        : safeAccs.filter(acc => String(acc.id) === accountFilter);

      const collected: ApiLot[] = [];
      const perAccount = await Promise.allSettled(
        targetAccounts.map(acc => lotsApi.listByAccount(acc.id, { refresh })),
      );
      for (let i = 0; i < perAccount.length; i += 1) {
        const result = perAccount[i];
        const account = targetAccounts[i];
        if (result.status !== 'fulfilled') continue;
        const rows = Array.isArray(result.value) ? result.value : [];
        for (const row of rows) {
          collected.push({
            ...row,
            lot_id: row.lot_id || String(row.id),
            account_username: row.account_username || account?.username || `ID ${account?.id}`,
            funpay_account_id: row.funpay_account_id || account?.id || 0,
          });
        }
      }
      setLots(collected);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки лотов';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadLots(accountFilter !== 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, accountFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lots.filter(lot => {
      if (!q) return true;
      return `${lot.title} ${lot.category_name} ${lot.lot_id} ${lot.account_username}`.toLowerCase().includes(q);
    });
  }, [lots, search]);

  function makeLotKey(lot: ApiLot) {
    return `${lot.funpay_account_id}:${lot.lot_id || lot.id}`;
  }

  async function raise(lot: ApiLot) {
    const key = makeLotKey(lot);
    setRaisingIDs(prev => new Set(prev).add(key));
    try {
      await lotsApi.raiseLot(lot.funpay_account_id, lot.lot_id || lot.id);
      toast.success(`Лот поднят: ${lot.title}`);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка поднятия лота');
    } finally {
      setRaisingIDs(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  function openEdit(lot: ApiLot) {
    setEditingLot(lot);
  }

  async function removeLot(lot: ApiLot) {
    if (!window.confirm(`Удалить лот «${lot.title}»?`)) return;
    const key = makeLotKey(lot);
    setSavingIDs(prev => new Set(prev).add(key));
    try {
      await lotsApi.delete(lot.funpay_account_id, lot.lot_id || lot.id);
      toast.success('Лот удалён');
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления лота');
    } finally {
      setSavingIDs(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function toggleActive(lot: ApiLot) {
    const key = makeLotKey(lot);
    setSavingIDs(prev => new Set(prev).add(key));
    try {
      await lotsApi.update(lot.funpay_account_id, lot.lot_id || lot.id, {
        title: lot.title,
        description: lot.description || '',
        price: Number(lot.price || 0),
        amount: Number(lot.amount || 0),
        is_active: !lot.is_active,
      });
      toast.success(!lot.is_active ? 'Лот включён' : 'Лот выключен');
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка изменения статуса');
    } finally {
      setSavingIDs(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Лоты" />
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="platform-btn-secondary"
              onClick={() => void loadLots(true)}
              disabled={loading || refreshing}
            >
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : 'Обновить с FunPay'}
            </button>
            <button
              className="platform-btn-primary"
              onClick={() => {
                if (accounts.length === 0) {
                  toast.error('Сначала добавьте аккаунт');
                  return;
                }
                if (accountFilter !== 'all') {
                  setCreateInitialAccountID(Number(accountFilter));
                } else if (accounts[0]) {
                  setCreateInitialAccountID(accounts[0].id);
                }
                setCreateOpen(true);
              }}
            >
              <Plus size={14} /> Создать лот
            </button>
          </div>
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск по лотам" />
            </label>
            <select className="platform-select" value={accountFilter} onChange={event => setAccountFilter(event.target.value)}>
              <option value="all">Все аккаунты</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
              ))}
            </select>
          </ToolbarRow>
        </SectionCard>

        <SectionCard className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
            </div>
          ) : loadError ? (
            <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
          ) : (
            <>
              <div className="platform-desktop-table">
                <DataTableWrap>
                  <table className="platform-table min-w-[1100px]">
                    <thead>
                      <tr>
                        <th>Лот</th>
                        <th>Категория</th>
                        <th>Аккаунт</th>
                        <th className="text-right">Цена</th>
                        <th className="text-right">Кол-во</th>
                        <th>Статус</th>
                        <th className="text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(lot => {
                        const key = makeLotKey(lot);
                        const busy = raisingIDs.has(key) || savingIDs.has(key);
                        return (
                          <tr key={key}>
                            <td>
                              <div className="font-semibold">{lot.title}</div>
                              {lot.description ? <div className="text-xs text-[var(--pf-text-muted)] line-clamp-2">{lot.description}</div> : null}
                              <div className="text-[11px] text-[var(--pf-text-dim)]">ID: {lot.lot_id || lot.id}</div>
                            </td>
                            <td>{lot.category_name || '—'}</td>
                            <td>{lot.account_username || `ID ${lot.funpay_account_id}`}</td>
                            <td className="text-right font-bold">{Number(lot.price || 0)} {lot.currency || '₽'}</td>
                            <td className="text-right">{Number(lot.amount || 0)}</td>
                            <td>
                              <span className={lot.is_active ? 'badge-active' : 'badge-inactive'}>
                                {lot.is_active ? 'Активен' : 'Неактивен'}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="inline-flex flex-wrap justify-end gap-2">
                                <button className="platform-btn-secondary" onClick={() => void raise(lot)} disabled={busy}>
                                  {raisingIDs.has(key) ? <Loader2 size={14} className="animate-spin" /> : <><ArrowUpCircle size={14} /> Поднять</>}
                                </button>
                                <button className="platform-btn-secondary" onClick={() => openEdit(lot)} disabled={busy}>
                                  <Pencil size={14} /> Редактировать
                                </button>
                                <button className="platform-btn-secondary" onClick={() => void toggleActive(lot)} disabled={busy}>
                                  <Power size={14} /> {lot.is_active ? 'Выключить' : 'Включить'}
                                </button>
                                <button className="platform-btn-secondary" onClick={() => void removeLot(lot)} disabled={busy}>
                                  <Trash2 size={14} /> Удалить
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
              {filtered.length === 0 && (
                <EmptyState
                  icon={SearchX}
                  title="Лоты не найдены"
                  action={
                    search ? (
                      <button className="platform-btn-secondary" onClick={() => setSearch('')}>
                        Сбросить поиск
                      </button>
                    ) : undefined
                  }
                >
                  По текущим фильтрам нет подходящих лотов. Попробуйте изменить параметры поиска.
                </EmptyState>
              )}
            </>
          )}
        </SectionCard>
      </PageShell>

      <LotCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        accounts={accounts}
        initialAccountId={createInitialAccountID}
        onCreated={async () => {
          setReloadKey(prev => prev + 1);
        }}
      />

      <LotEditDialog
        open={Boolean(editingLot)}
        onOpenChange={open => {
          if (!open) {
            setEditingLot(null);
          }
        }}
        lot={editingLot}
        onSaved={async () => {
          setReloadKey(prev => prev + 1);
        }}
      />
    </motion.div>
  );
}
