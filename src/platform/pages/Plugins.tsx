'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Bot,
  ChartNoAxesCombined,
  Gift,
  Loader2,
  MessageSquareCode,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Tag,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, ApiPlugin, pluginsApi } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  PageShell,
  PageTitle,
  RequestErrorState,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

const fallbackIcons: LucideIcon[] = [
  Sparkles,
  Zap,
  Shield,
  Bot,
  MessageSquareCode,
  ChartNoAxesCombined,
  Gift,
  Wrench,
  Tag,
];

function iconByPlugin(plugin: ApiPlugin): LucideIcon {
  const source = `${plugin.slug} ${plugin.category} ${plugin.name}`.toLowerCase();
  if (source.includes('ai') || source.includes('chat') || source.includes('ответ')) return Bot;
  if (source.includes('security') || source.includes('safe') || source.includes('защит')) return Shield;
  if (source.includes('analytics') || source.includes('аналит')) return ChartNoAxesCombined;
  if (source.includes('discount') || source.includes('promo') || source.includes('скидк')) return Gift;
  if (source.includes('speed') || source.includes('boost') || source.includes('raise')) return Zap;

  let hash = 0;
  const token = plugin.slug || plugin.name || String(plugin.id);
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return fallbackIcons[hash % fallbackIcons.length];
}

function iconToneClass(plugin: ApiPlugin): string {
  const source = `${plugin.slug} ${plugin.category}`.toLowerCase();
  if (source.includes('ai') || source.includes('chat')) {
    return 'platform-plugin-icon-tone-ai';
  }
  if (source.includes('security') || source.includes('safe')) {
    return 'platform-plugin-icon-tone-security';
  }
  if (source.includes('analytics')) {
    return 'platform-plugin-icon-tone-analytics';
  }
  if (source.includes('promo') || source.includes('discount')) {
    return 'platform-plugin-icon-tone-promo';
  }
  return 'platform-plugin-icon-tone-default';
}

export default function Plugins() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [plugins, setPlugins] = useState<ApiPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [togglingIDs, setTogglingIDs] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoadError(null);
    accountsApi
      .list()
      .then(rows => {
        const safe = Array.isArray(rows) ? rows : [];
        setAccounts(safe);
        if (safe.length > 0) {
          setSelectedAccountID(prev => prev ?? safe[0].id);
        } else {
          setSelectedAccountID(null);
          setLoading(false);
        }
      })
      .catch(() => {
        setAccounts([]);
        setSelectedAccountID(null);
        setLoadError('Не удалось загрузить список аккаунтов');
        setLoading(false);
      });
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedAccountID) {
      setPlugins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);

    Promise.all([pluginsApi.list(selectedAccountID), pluginsApi.installed(selectedAccountID)])
      .then(([catalogRows, installedRows]) => {
        const catalog = Array.isArray(catalogRows) ? catalogRows : [];
        const installed = Array.isArray(installedRows) ? installedRows : [];
        const installedByID = new Set(installed.map(item => item.id));
        setPlugins(catalog.map(item => ({ ...item, installed: installedByID.has(item.id) })));
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки плагинов';
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [selectedAccountID, reloadKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return plugins;
    return plugins.filter(plugin => `${plugin.name} ${plugin.description} ${plugin.category}`.toLowerCase().includes(query));
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
    <PageShell>
      <PageHeader>
        <PageTitle title="Плагины" />
      </PageHeader>

      <SectionCard>
        <ToolbarRow>
          <label className="platform-search platform-toolbar-grow max-w-none">
            <Search size={14} color="var(--pf-text-dim)" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск по плагинам" />
          </label>

          <select
            className="platform-select"
            value={selectedAccountID ?? ''}
            onChange={event => setSelectedAccountID(Number(event.target.value))}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
            ))}
          </select>
        </ToolbarRow>
      </SectionCard>

      <SectionCard>
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={26} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : loadError ? (
          <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
        ) : filtered.length === 0 ? (
          <EmptyState>Плагины не найдены.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(plugin => {
              const Icon = iconByPlugin(plugin);
              const toneClass = iconToneClass(plugin);
              const busy = togglingIDs.has(plugin.id);
              return (
                <article
                  key={plugin.id}
                  className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--pf-border-strong)] hover:shadow-[var(--pf-shadow-soft)]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
                      <Icon size={16} />
                    </div>
                    <span className={plugin.installed ? 'badge-active' : 'badge-inactive'}>
                      {plugin.installed ? 'Установлен' : 'Не установлен'}
                    </span>
                  </div>

                  <div className="mb-2 text-base font-semibold text-[var(--pf-text)]">{plugin.name}</div>
                  <div className="mb-3 line-clamp-2 min-h-[40px] text-xs leading-5 text-[var(--pf-text-muted)]">
                    {plugin.description}
                  </div>

                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pf-text-muted)]">
                      {plugin.category || 'Общее'}
                    </span>
                    <span className="text-sm font-bold text-[var(--pf-text)]">
                      {plugin.price_month > 0 ? `${plugin.price_month} ₽/мес` : 'Бесплатно'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {plugin.installed ? (
                      <Link href={`/platform/plugins/${plugin.slug}`} className="platform-btn-secondary justify-center">
                        <Settings2 size={13} /> Настроить
                      </Link>
                    ) : (
                      <span className="platform-btn-secondary justify-center opacity-60">
                        <Settings2 size={13} /> Настройки
                      </span>
                    )}

                    <button
                      type="button"
                      className={plugin.installed ? 'platform-btn-secondary justify-center' : 'platform-btn-primary justify-center'}
                      onClick={() => toggle(plugin)}
                      disabled={busy}
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : plugin.installed ? 'Удалить' : 'Установить'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
