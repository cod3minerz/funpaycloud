'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiPlugin, pluginsApi } from '@/lib/api';
import { DataTableWrap, EmptyState, PageHeader, PageShell, PageTitle, SectionCard, ToolbarRow } from '@/platform/components/primitives';

export default function Plugins() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [plugins, setPlugins] = useState<ApiPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIDs, setTogglingIDs] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    accountsApi
      .list()
      .then(rows => {
        const safe = Array.isArray(rows) ? rows : [];
        setAccounts(safe);
        if (safe.length > 0) {
          setSelectedAccountID(safe[0].id);
        } else {
          setSelectedAccountID(null);
          setLoading(false);
        }
      })
      .catch(() => {
        setAccounts([]);
        setSelectedAccountID(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedAccountID) {
      setPlugins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([pluginsApi.list(selectedAccountID), pluginsApi.installed(selectedAccountID)])
      .then(([catalogRows, installedRows]) => {
        const catalog = Array.isArray(catalogRows) ? catalogRows : [];
        const installed = Array.isArray(installedRows) ? installedRows : [];
        const installedByID = new Set(installed.map(item => item.id));
        setPlugins(catalog.map(item => ({ ...item, installed: installedByID.has(item.id) })));
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Ошибка загрузки плагинов'))
      .finally(() => setLoading(false));
  }, [selectedAccountID]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plugins;
    return plugins.filter(plugin => `${plugin.name} ${plugin.description} ${plugin.category}`.toLowerCase().includes(q));
  }, [plugins, search]);

  async function toggle(plugin: ApiPlugin) {
    if (!selectedAccountID) return;
    setTogglingIDs(prev => new Set(prev).add(plugin.id));
    try {
      if (plugin.installed) {
        await pluginsApi.uninstall(plugin.slug, selectedAccountID);
      } else {
        await pluginsApi.install(plugin.slug, selectedAccountID);
      }
      setPlugins(prev => prev.map(item => (item.id === plugin.id ? { ...item, installed: !item.installed } : item)));
      toast.success(plugin.installed ? 'Плагин удалён' : 'Плагин установлен');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка изменения статуса плагина');
    } finally {
      setTogglingIDs(prev => {
        const next = new Set(prev);
        next.delete(plugin.id);
        return next;
      });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Плагины" subtitle="Каталог и установка плагинов для выбранного аккаунта." />
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
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск по плагинам" />
            </label>
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
                  <table className="platform-table" style={{ minWidth: 980 }}>
                    <thead>
                      <tr>
                        <th>Плагин</th>
                        <th>Категория</th>
                        <th style={{ textAlign: 'right' }}>Цена/мес</th>
                        <th style={{ textAlign: 'right' }}>Рейтинг</th>
                        <th>Статус</th>
                        <th style={{ textAlign: 'right' }}>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(plugin => (
                        <tr key={plugin.id}>
                          <td>
                            <div className="font-semibold">{plugin.name}</div>
                            <div className="text-[12px] text-[var(--pf-text-muted)]">{plugin.description}</div>
                          </td>
                          <td>{plugin.category}</td>
                          <td style={{ textAlign: 'right' }}>{plugin.price_month > 0 ? `${plugin.price_month} ₽` : 'Бесплатно'}</td>
                          <td style={{ textAlign: 'right' }}>{Number(plugin.rating || 0)} ({plugin.reviews_count || 0})</td>
                          <td>
                            <span className={plugin.installed ? 'badge-active' : 'badge-inactive'}>
                              {plugin.installed ? 'Установлен' : 'Не установлен'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className={plugin.installed ? 'platform-btn-secondary' : 'platform-btn-primary'} onClick={() => toggle(plugin)} disabled={togglingIDs.has(plugin.id)}>
                              {togglingIDs.has(plugin.id) ? <Loader2 size={14} className="animate-spin" /> : plugin.installed ? 'Удалить' : 'Установить'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>
              {filtered.length === 0 && <EmptyState>Плагины не найдены.</EmptyState>}
            </>
          )}
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
