import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Download,
  Gamepad2,
  LayoutGrid,
  List,
  Megaphone,
  Package,
  Puzzle,
  Search,
  Settings,
  Star,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Plugin, plugins as initialPlugins } from '@/platform/data/demoData';
import {
  DataTableWrap,
  EmptyState,
  PageHeader,
  PageShell,
  PageTitle,
  Panel,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

const CATEGORIES = ['Все', 'Автоматизация', 'Игровые товары', 'SMM', 'Финансы', 'Интеграции'];

const MOCK_REVIEWS = [
  { user: 'maxim_99', rating: 5, text: 'Плагин работает стабильно, всё завелось без доработок.' },
  { user: 'anna_shop', rating: 4, text: 'Хороший базовый функционал, удобно для ежедневной рутины.' },
  { user: 'peter_gamer', rating: 5, text: 'Сильно ускорил обработку заказов, поставил на все аккаунты.' },
];

const pluginIconByCategory: Record<string, LucideIcon> = {
  Автоматизация: Bot,
  'Игровые товары': Gamepad2,
  SMM: Megaphone,
  Финансы: Wallet,
  Интеграции: Puzzle,
};

function PluginIcon({ plugin }: { plugin: Plugin }) {
  const Icon = pluginIconByCategory[plugin.category] ?? Package;
  return (
    <span className="platform-plugin-glyph" aria-hidden="true">
      <Icon size={18} />
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, idx) => (
        <Star
          key={idx}
          size={12}
          fill={idx < Math.round(rating) ? '#f59e0b' : 'none'}
          color={idx < Math.round(rating) ? '#f59e0b' : '#64748b'}
        />
      ))}
    </div>
  );
}

export default function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>(initialPlugins);
  const [category, setCategory] = useState('Все');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const installed = useMemo(() => plugins.filter(plugin => plugin.installed), [plugins]);

  const filtered = useMemo(() => {
    return plugins.filter(plugin => {
      if (category !== 'Все' && plugin.category !== category) return false;
      if (query && !`${plugin.name} ${plugin.description}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [plugins, category, query]);

  function toggleInstall(id: string) {
    setPlugins(prev => prev.map(plugin => (plugin.id === id ? { ...plugin, installed: !plugin.installed } : plugin)));
    setSelectedPlugin(prev => (prev && prev.id === id ? { ...prev, installed: !prev.installed } : prev));
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Плагины"
            subtitle="Премиальный каталог расширений: единый стиль, чистые статусы установки и быстрые действия."
          />
          <ToolbarRow>
            <span className="platform-chip">Установлено: {installed.length}</span>
            <span className="platform-chip">Каталог: {plugins.length}</span>
          </ToolbarRow>
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={15} color="var(--pf-text-dim)" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Поиск по названию или описанию"
                aria-label="Поиск плагина"
              />
            </label>

            <select className="platform-select" value={category} onChange={event => setCategory(event.target.value)} style={{ maxWidth: 230 }}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="platform-view-switch" role="tablist" aria-label="Режим отображения">
              <button
                type="button"
                className={`platform-view-switch-btn${viewMode === 'cards' ? ' active' : ''}`}
                onClick={() => setViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
              >
                <LayoutGrid size={14} /> Карточки
              </button>
              <button
                type="button"
                className={`platform-view-switch-btn${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
              >
                <List size={14} /> Список
              </button>
            </div>
          </ToolbarRow>
        </SectionCard>

        <SectionCard className="p-0">
          {viewMode === 'list' && (
            <div className="platform-desktop-table">
              <DataTableWrap>
                <table className="platform-table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 320 }}>Плагин</th>
                      <th>Категория</th>
                      <th>Рейтинг</th>
                      <th>Цена</th>
                      <th>Статус</th>
                      <th style={{ textAlign: 'right' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(plugin => (
                      <tr key={plugin.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedPlugin(plugin)}
                            className="w-full bg-transparent p-0 text-left text-inherit"
                            style={{ border: 0, cursor: 'pointer' }}
                          >
                            <div className="flex items-start gap-3">
                              <PluginIcon plugin={plugin} />
                              <div className="min-w-0">
                                <div className="font-semibold">{plugin.name}</div>
                                <div className="line-clamp-2 text-[12px] text-[var(--pf-text-muted)]">{plugin.description}</div>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td>
                          <span className="platform-chip">{plugin.category}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Stars rating={plugin.rating} />
                            <span className="text-[12px] font-bold text-[#f59e0b]">{plugin.rating}</span>
                            <span className="text-[12px] text-[var(--pf-text-dim)]">({plugin.reviews})</span>
                          </div>
                        </td>
                        <td className="font-bold">{plugin.price === 'free' ? 'Бесплатно' : `${plugin.price} ₽/мес`}</td>
                        <td>
                          <span className={plugin.installed ? 'badge-active' : 'badge-inactive'}>
                            {plugin.installed ? 'Установлен' : 'Не установлен'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="inline-flex items-center gap-2">
                            <button className="platform-topbar-btn" title="Настройки плагина" onClick={() => setSelectedPlugin(plugin)}>
                              <Settings size={14} />
                            </button>
                            <button
                              className={plugin.installed ? 'platform-topbar-btn' : 'platform-btn-primary'}
                              style={plugin.installed ? { color: '#fb7185', borderColor: 'rgba(251,113,133,0.44)' } : { minHeight: 34 }}
                              onClick={() => toggleInstall(plugin.id)}
                            >
                              {plugin.installed ? <Trash2 size={14} /> : <Download size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTableWrap>
            </div>
          )}

          <div className={`platform-plugin-grid${viewMode === 'list' ? ' platform-plugin-grid-mobile-only' : ''}`}>
            {filtered.map(plugin => (
              <article key={plugin.id} className="platform-plugin-card">
                <div className="platform-mobile-card-head">
                  <div className="inline-flex min-w-0 items-center gap-2">
                    <PluginIcon plugin={plugin} />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold">{plugin.name}</div>
                      <div className="text-[12px] text-[var(--pf-text-muted)]">{plugin.category}</div>
                    </div>
                  </div>
                  <span className={plugin.installed ? 'badge-active' : 'badge-inactive'}>
                    {plugin.installed ? 'Установлен' : 'Не установлен'}
                  </span>
                </div>

                <div className="text-[13px] text-[var(--pf-text-muted)]">{plugin.description}</div>

                <div className="platform-mobile-meta">
                  <span className="inline-flex items-center gap-2">
                    <Stars rating={plugin.rating} />
                    <span>{plugin.rating}</span>
                    <span className="text-[var(--pf-text-dim)]">({plugin.reviews})</span>
                  </span>
                  <span className="font-semibold">{plugin.price === 'free' ? 'Бесплатно' : `${plugin.price} ₽/мес`}</span>
                </div>

                <div className="platform-mobile-actions">
                  <button className="platform-btn-secondary" onClick={() => setSelectedPlugin(plugin)}>
                    <Settings size={14} /> Подробнее
                  </button>
                  <button
                    className={plugin.installed ? 'platform-topbar-btn' : 'platform-btn-primary'}
                    style={plugin.installed ? { color: '#fb7185', borderColor: 'rgba(251,113,133,0.44)' } : undefined}
                    onClick={() => toggleInstall(plugin.id)}
                  >
                    {plugin.installed ? <Trash2 size={14} /> : <Download size={14} />}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && <EmptyState>По текущим фильтрам плагины не найдены.</EmptyState>}
        </SectionCard>
      </PageShell>

      <Dialog open={!!selectedPlugin} onOpenChange={() => setSelectedPlugin(null)}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: 620, maxHeight: '80vh', overflowY: 'auto' }}>
          {selectedPlugin && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">
                  <div className="flex items-center gap-3">
                    <PluginIcon plugin={selectedPlugin} />
                    <div>
                      <div>{selectedPlugin.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Stars rating={selectedPlugin.rating} />
                        <span className="text-[12px] font-bold text-[#f59e0b]">{selectedPlugin.rating}</span>
                        <span className="text-[12px] text-[var(--pf-text-dim)]">({selectedPlugin.reviews} отзывов)</span>
                      </div>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4">
                <p className="text-[14px] leading-6 text-[var(--pf-text-muted)]">{selectedPlugin.description}</p>

                <Panel className="p-3">
                  <div className="mb-2 font-bold">Как подключить</div>
                  <ol className="list-decimal pl-4 text-[13px] leading-7 text-[var(--pf-text-muted)]">
                    <li>Установите плагин в один клик.</li>
                    <li>Откройте настройки и заполните параметры.</li>
                    <li>Активируйте модуль и проверьте тестовый сценарий.</li>
                  </ol>
                </Panel>

                <div>
                  <div className="mb-2 font-bold">Отзывы</div>
                  <div className="grid gap-2">
                    {MOCK_REVIEWS.map((review, idx) => (
                      <Panel key={idx} className="p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="platform-avatar !h-6 !w-6 !text-[10px]">{review.user[0].toUpperCase()}</span>
                          <span className="text-[12px] font-bold">{review.user}</span>
                          <Stars rating={review.rating} />
                        </div>
                        <p className="m-0 text-[13px] text-[var(--pf-text-muted)]">{review.text}</p>
                      </Panel>
                    ))}
                  </div>
                </div>

                <button
                  className={selectedPlugin.installed ? 'platform-btn-secondary' : 'platform-btn-primary'}
                  onClick={() => toggleInstall(selectedPlugin.id)}
                  style={selectedPlugin.installed ? { color: '#fb7185', borderColor: 'rgba(251,113,133,0.44)' } : undefined}
                >
                  {selectedPlugin.installed
                    ? 'Удалить плагин'
                    : selectedPlugin.price === 'free'
                      ? 'Установить бесплатно'
                      : `Подключить за ${selectedPlugin.price} ₽/мес`}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
