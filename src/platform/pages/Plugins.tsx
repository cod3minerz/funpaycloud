import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Search, Settings, Star, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { plugins as initialPlugins, Plugin } from '@/platform/data/demoData';

const CATEGORIES = ['Все', 'Автоматизация', 'Игровые товары', 'SMM', 'Финансы', 'Интеграции'];

const MOCK_REVIEWS = [
  { user: 'maxim_99', rating: 5, text: 'Плагин работает стабильно, всё завелось без доработок.' },
  { user: 'anna_shop', rating: 4, text: 'Хороший базовый функционал, удобно для ежедневной рутины.' },
  { user: 'peter_gamer', rating: 5, text: 'Сильно ускорил обработку заказов, поставил на все аккаунты.' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={12} fill={i < Math.round(rating) ? '#f59e0b' : 'none'} color={i < Math.round(rating) ? '#f59e0b' : '#64748b'} />
      ))}
    </div>
  );
}

export default function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>(initialPlugins);
  const [category, setCategory] = useState('Все');
  const [query, setQuery] = useState('');
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'var(--font-sans)' }}
    >
      <section className="platform-card" style={{ marginBottom: 16 }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="platform-page-title">Плагины</h1>
            <p className="platform-page-subtitle">Единый каталог расширений для автоматизации и роста магазина.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="platform-chip">Установлено: {installed.length}</span>
            <span className="platform-chip">Каталог: {plugins.length}</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]" style={{ marginTop: 14 }}>
          <label className="platform-search max-w-none" style={{ minHeight: 40 }}>
            <Search size={15} color="var(--pf-text-dim)" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по названию или описанию" aria-label="Поиск плагина" />
          </label>

          <select className="platform-select" value={category} onChange={e => setCategory(e.target.value)} style={{ minWidth: 220 }}>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="platform-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="platform-table" style={{ minWidth: 860 }}>
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
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: 'inherit',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span style={{ fontSize: 24, lineHeight: 1 }}>{plugin.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{plugin.name}</div>
                          <div style={{ color: 'var(--pf-text-muted)', fontSize: 12, maxWidth: 360, lineHeight: 1.45 }}>
                            {plugin.description}
                          </div>
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
                      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>{plugin.rating}</span>
                      <span style={{ color: 'var(--pf-text-dim)', fontSize: 12 }}>({plugin.reviews})</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{plugin.price === 'free' ? 'Бесплатно' : `${plugin.price} ₽/мес`}</td>
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
                        style={plugin.installed ? { color: '#f87171', borderColor: 'rgba(251,113,133,0.36)' } : { minHeight: 34 }}
                        onClick={() => toggleInstall(plugin.id)}
                      >
                        {plugin.installed ? <Trash2 size={14} /> : <Download size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '34px 12px', color: 'var(--pf-text-muted)' }}>
                    По текущим фильтрам плагины не найдены.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={!!selectedPlugin} onOpenChange={() => setSelectedPlugin(null)}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: '620px', maxHeight: '80vh', overflowY: 'auto' }}>
          {selectedPlugin && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: '#fff' }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 30 }}>{selectedPlugin.icon}</span>
                    <div>
                      <div>{selectedPlugin.name}</div>
                      <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                        <Stars rating={selectedPlugin.rating} />
                        <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>{selectedPlugin.rating}</span>
                        <span style={{ color: 'var(--pf-text-dim)', fontSize: 12 }}>({selectedPlugin.reviews} отзывов)</span>
                      </div>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4">
                <p style={{ color: 'var(--pf-text-muted)', fontSize: 14, lineHeight: 1.6 }}>{selectedPlugin.description}</p>

                <div className="platform-panel" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Как подключить</div>
                  <ol style={{ color: 'var(--pf-text-muted)', fontSize: 13, lineHeight: 1.8, paddingLeft: 18 }}>
                    <li>Установите плагин в один клик.</li>
                    <li>Откройте настройки и заполните параметры.</li>
                    <li>Активируйте модуль и проверьте тестовый сценарий.</li>
                  </ol>
                </div>

                <div>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Отзывы</div>
                  <div className="grid gap-2">
                    {MOCK_REVIEWS.map((review, idx) => (
                      <div key={idx} className="platform-panel" style={{ padding: 10 }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                          <span className="platform-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{review.user[0].toUpperCase()}</span>
                          <span style={{ fontWeight: 700, fontSize: 12 }}>{review.user}</span>
                          <Stars rating={review.rating} />
                        </div>
                        <p style={{ margin: 0, color: 'var(--pf-text-muted)', fontSize: 13 }}>{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className={selectedPlugin.installed ? 'platform-btn-secondary' : 'platform-btn-primary'}
                  onClick={() => toggleInstall(selectedPlugin.id)}
                  style={selectedPlugin.installed ? { color: '#f87171', borderColor: 'rgba(251,113,133,0.36)' } : undefined}
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
