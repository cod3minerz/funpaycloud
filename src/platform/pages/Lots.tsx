'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpCircle, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiLot, lotsApi } from '@/lib/api';
import { DataTableWrap, EmptyState, PageHeader, PageShell, PageTitle, RequestErrorState, SectionCard, ToolbarRow } from '@/platform/components/primitives';

export default function Lots() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [lots, setLots] = useState<ApiLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [raisingIDs, setRaisingIDs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const accs = await accountsApi.list();
        const safeAccs = Array.isArray(accs) ? accs : [];
        if (cancelled) return;
        setAccounts(safeAccs);

        const collected: ApiLot[] = [];
        const perAccount = await Promise.allSettled(safeAccs.map(acc => lotsApi.listByAccount(acc.id)));
        for (let i = 0; i < perAccount.length; i += 1) {
          const result = perAccount[i];
          const account = safeAccs[i];
          if (result.status !== 'fulfilled') continue;
          const rows = Array.isArray(result.value) ? result.value : [];
          for (const row of rows) {
            collected.push({ ...row, account_username: row.account_username || account.username || `ID ${account.id}` });
          }
        }
        if (!cancelled) setLots(collected);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Ошибка загрузки лотов';
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lots.filter(lot => {
      if (accountFilter !== 'all' && String(lot.funpay_account_id) !== accountFilter) return false;
      if (!q) return true;
      return `${lot.title} ${lot.category_name} ${lot.lot_id} ${lot.account_username}`.toLowerCase().includes(q);
    });
  }, [lots, search, accountFilter]);

  async function raise(lot: ApiLot) {
    const key = `${lot.funpay_account_id}:${lot.lot_id}`;
    setRaisingIDs(prev => new Set(prev).add(key));
    try {
      await lotsApi.raiseLot(lot.funpay_account_id, lot.lot_id);
      toast.success(`Лот поднят: ${lot.title}`);
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

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Лоты" subtitle="Реальные лоты из аккаунтов с ручным поднятием и привязкой к аккаунту." />
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={14} color="var(--pf-text-dim)" />
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
                  <table className="platform-table" style={{ minWidth: 960 }}>
                    <thead>
                      <tr>
                        <th>Лот</th>
                        <th>Категория</th>
                        <th>Аккаунт</th>
                        <th style={{ textAlign: 'right' }}>Цена</th>
                        <th>Статус</th>
                        <th style={{ textAlign: 'right' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(lot => {
                        const key = `${lot.funpay_account_id}:${lot.lot_id}`;
                        return (
                          <tr key={`${lot.funpay_account_id}-${lot.lot_id}`}>
                            <td>{lot.title}</td>
                            <td>{lot.category_name}</td>
                            <td>{lot.account_username || `ID ${lot.funpay_account_id}`}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(lot.price || 0)} ₽</td>
                            <td>
                              <span className={lot.is_active ? 'badge-active' : 'badge-inactive'}>
                                {lot.is_active ? 'Активен' : 'Неактивен'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="platform-btn-primary" onClick={() => raise(lot)} disabled={raisingIDs.has(key)}>
                                {raisingIDs.has(key) ? <Loader2 size={14} className="animate-spin" /> : <><ArrowUpCircle size={14} /> Поднять</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>
              {filtered.length === 0 && <EmptyState>Лоты по текущим фильтрам не найдены.</EmptyState>}
            </>
          )}
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
