import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Settings, Download, X } from 'lucide-react';
import { plugins as initialPlugins, Plugin } from '@/platform/data/demoData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';

const CARD_STYLE: React.CSSProperties = {
  background: '#0a1428',
  border: '1px solid rgba(0,121,255,0.18)',
  borderRadius: '12px',
  padding: '20px',
};

const CATEGORIES = ['Все', 'Автоматизация', 'Игровые товары', 'SMM', 'Финансы', 'Интеграции'];

const categoryColors: Record<string, string> = {
  'Автоматизация': '#0079FF',
  'Игровые товары': '#22c55e',
  'SMM': '#7c3aed',
  'Финансы': '#eab308',
  'Интеграции': '#f97316',
};

const MOCK_REVIEWS = [
  { user: 'maxim_99', rating: 5, text: 'Отличный плагин, работает стабильно. Рекомендую всем!' },
  { user: 'anna_shop', rating: 4, text: 'Хороший, но хотелось бы больше настроек.' },
  { user: 'peter_gamer', rating: 5, text: 'Упростил работу в разы. Отличная поддержка.' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={12} fill={i < Math.round(rating) ? '#eab308' : 'none'} color={i < Math.round(rating) ? '#eab308' : '#4b5563'} />
      ))}
    </div>
  );
}

export default function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>(initialPlugins);
  const [category, setCategory] = useState('Все');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [installedEnabled, setInstalledEnabled] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialPlugins.filter(p => p.installed).forEach(p => { map[p.id] = true; });
    return map;
  });

  const installed = plugins.filter(p => p.installed);

  const filtered = plugins.filter(p => {
    if (category !== 'Все' && p.category !== category) return false;
    return true;
  });

  function toggleInstall(id: string) {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, installed: !p.installed } : p));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: '#050C1C', color: '#fff', fontFamily: 'Syne, sans-serif' }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Плагины</h1>

      {/* Installed plugins */}
      {installed.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Установленные ({installed.length})
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {installed.map(p => (
              <div key={p.id} style={{ ...CARD_STYLE, minWidth: '240px', padding: '14px 16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '28px' }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{p.name}</div>
                    <div style={{ color: '#7DC8FF', fontSize: '11px' }}>{p.category}</div>
                  </div>
                  <Switch
                    checked={installedEnabled[p.id] ?? true}
                    onCheckedChange={v => setInstalledEnabled(m => ({ ...m, [p.id]: v }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ flex: 1, background: 'rgba(0,121,255,0.12)', border: '1px solid rgba(0,121,255,0.25)', borderRadius: '7px', padding: '6px', color: '#7DC8FF', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    <Settings size={12} /> Настройки
                  </button>
                  <button
                    onClick={() => toggleInstall(p.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', padding: '6px 10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: category === cat ? 'none' : '1px solid rgba(0,121,255,0.2)',
              background: category === cat ? 'linear-gradient(135deg, #007BFF, #0052F4)' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plugin catalog grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => setSelectedPlugin(p)}
            style={{ ...CARD_STYLE, cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,121,255,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,121,255,0.18)')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '36px', lineHeight: 1 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{p.name}</span>
                </div>
                <span style={{
                  background: `${categoryColors[p.category] ?? '#7DC8FF'}20`,
                  color: categoryColors[p.category] ?? '#7DC8FF',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {p.category}
                </span>
              </div>
            </div>

            <p style={{ color: '#7DC8FF', fontSize: '13px', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {p.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Stars rating={p.rating} />
              <span style={{ color: '#eab308', fontWeight: 600, fontSize: '13px' }}>{p.rating}</span>
              <span style={{ color: '#7DC8FF', fontSize: '12px' }}>({p.reviews} отзывов)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: p.price === 'free' ? '#22c55e' : '#0079FF' }}>
                {p.price === 'free' ? 'Бесплатно' : `${p.price}₽/мес`}
              </span>
              <button
                onClick={e => { e.stopPropagation(); toggleInstall(p.id); }}
                style={{
                  background: p.installed ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #007BFF, #0052F4)',
                  border: p.installed ? '1px solid rgba(239,68,68,0.3)' : 'none',
                  borderRadius: '7px',
                  padding: '7px 14px',
                  color: p.installed ? '#ef4444' : '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {p.installed ? <><X size={12} /> Удалить</> : <><Download size={12} /> Установить</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Plugin Detail Dialog */}
      <Dialog open={!!selectedPlugin} onOpenChange={() => setSelectedPlugin(null)}>
        <DialogContent style={{ background: '#0a1428', border: '1px solid rgba(0,121,255,0.3)', color: '#fff', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{selectedPlugin?.icon}</span>
                <div>
                  <div>{selectedPlugin?.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <Stars rating={selectedPlugin?.rating ?? 0} />
                    <span style={{ color: '#eab308', fontSize: '13px', fontWeight: 600 }}>{selectedPlugin?.rating}</span>
                    <span style={{ color: '#7DC8FF', fontSize: '12px', fontWeight: 400 }}>({selectedPlugin?.reviews} отзывов)</span>
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedPlugin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.6 }}>{selectedPlugin.description}</p>

              <div style={{ background: 'rgba(0,121,255,0.08)', border: '1px solid rgba(0,121,255,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>Как настроить</div>
                <ol style={{ color: '#7DC8FF', fontSize: '13px', paddingLeft: '18px', lineHeight: 2 }}>
                  <li>Установите плагин и перейдите в раздел настроек</li>
                  <li>Введите необходимые параметры в конфигурации</li>
                  <li>Включите плагин и проверьте работу</li>
                  <li>Настройте уведомления при необходимости</li>
                </ol>
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Отзывы</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {MOCK_REVIEWS.map((r, i) => (
                    <div key={i} style={{ background: 'rgba(0,121,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #007BFF, #0052F4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                          {r.user[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.user}</span>
                        <Stars rating={r.rating} />
                      </div>
                      <p style={{ color: '#ccc', fontSize: '13px', lineHeight: 1.5 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { toggleInstall(selectedPlugin.id); setSelectedPlugin(null); }}
                style={{
                  background: selectedPlugin.installed ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #007BFF, #0052F4)',
                  border: selectedPlugin.installed ? '1px solid rgba(239,68,68,0.3)' : 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  color: selectedPlugin.installed ? '#ef4444' : '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                }}
              >
                {selectedPlugin.installed
                  ? 'Удалить плагин'
                  : selectedPlugin.price === 'free'
                    ? 'Установить бесплатно'
                    : `Подключить за ${selectedPlugin.price}₽/мес`}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
