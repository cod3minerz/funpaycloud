'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiProxy, proxiesApi } from '@/lib/api';
import { DataTableWrap, EmptyState, PageHeader, PageShell, PageTitle, RequestErrorState, SectionCard, ToolbarRow } from '@/platform/components/primitives';

export default function ProxyMarket() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [proxies, setProxies] = useState<ApiProxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rentingIDs, setRentingIDs] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoadError(null);
    accountsApi.list().then(rows => {
      const safe = Array.isArray(rows) ? rows : [];
      setAccounts(safe);
      if (safe.length > 0) setSelectedAccountID(safe[0].id);
    }).catch(() => {
      setLoadError('Не удалось загрузить список аккаунтов');
    });
  }, [reloadKey]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    proxiesApi
      .market({ page: 1, limit: 200 })
      .then(data => setProxies(Array.isArray(data.proxies) ? data.proxies : []))
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки прокси';
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return proxies;
    return proxies.filter(proxy =>
      `${proxy.host}:${proxy.port} ${proxy.country} ${proxy.city} ${proxy.type}`.toLowerCase().includes(q),
    );
  }, [search, proxies]);

  async function rent(proxy: ApiProxy) {
    if (!selectedAccountID) {
      toast.error('Выберите аккаунт');
      return;
    }
    setRentingIDs(prev => new Set(prev).add(proxy.id));
    try {
      await proxiesApi.rent(proxy.id, selectedAccountID);
      toast.success(`Прокси арендован: ${proxy.host}:${proxy.port}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка аренды прокси');
    } finally {
      setRentingIDs(prev => {
        const next = new Set(prev);
        next.delete(proxy.id);
        return next;
      });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Прокси в аренду" subtitle="Прокси-маркет с привязкой аренды к выбранному аккаунту." />
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <select className="platform-select" value={selectedAccountID ?? ''} onChange={event => setSelectedAccountID(Number(event.target.value))}>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
              ))}
            </select>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={14} color="var(--pf-text-dim)" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск по IP/стране/городу" />
            </label>
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
                  <table className="platform-table" style={{ minWidth: 980 }}>
                    <thead>
                      <tr>
                        <th>IP</th>
                        <th>Гео</th>
                        <th>Тип</th>
                        <th>Протокол</th>
                        <th style={{ textAlign: 'right' }}>Скорость</th>
                        <th style={{ textAlign: 'right' }}>Цена/мес</th>
                        <th style={{ textAlign: 'right' }}>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(proxy => (
                        <tr key={proxy.id}>
                          <td>{proxy.host}:{proxy.port}</td>
                          <td>{proxy.country}, {proxy.city}</td>
                          <td>{proxy.type}</td>
                          <td>{proxy.protocol}</td>
                          <td style={{ textAlign: 'right' }}>{proxy.speed_ms} ms</td>
                          <td style={{ textAlign: 'right' }}>{proxy.price_month} ₽</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="platform-btn-primary" onClick={() => rent(proxy)} disabled={rentingIDs.has(proxy.id)}>
                              {rentingIDs.has(proxy.id) ? <Loader2 size={14} className="animate-spin" /> : 'Арендовать'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>
              {filtered.length === 0 && <EmptyState>Прокси не найдены.</EmptyState>}
            </>
          )}
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
