'use client';

import { useMemo, useState } from 'react';
import { MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import type { Plugin } from '@/platform/data/demoData';
import { plugins as initialPlugins } from '@/platform/data/demoData';
import { P2PageHeader, P2Panel, P2PrimaryAction, P2SecondaryAction } from '@/platform2/components/primitives';

export default function Plugins2() {
  const [plugins, setPlugins] = useState<Plugin[]>(initialPlugins);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = useMemo(() => ['all', ...Array.from(new Set(plugins.map(plugin => plugin.category)))], [plugins]);

  const filtered = useMemo(
    () =>
      plugins.filter(plugin => {
        if (category !== 'all' && plugin.category !== category) return false;
        if (query && ![plugin.name, plugin.description, plugin.category].join(' ').toLowerCase().includes(query.toLowerCase())) {
          return false;
        }
        return true;
      }),
    [plugins, category, query],
  );

  const selected = selectedId ? plugins.find(item => item.id === selectedId) ?? null : null;

  function toggleInstall(id: string) {
    setPlugins(prev => prev.map(plugin => (plugin.id === id ? { ...plugin, installed: !plugin.installed } : plugin)));
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Плагины" description="Каталог расширений с единым качественным UX без визуального шума." />

      <P2Panel title="Каталог" subtitle="Поиск, фильтры и установка">
        <div className="p2-toolbar">
          <label className="p2-search max-w-none w-full">
            <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="p2-input h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              placeholder="Поиск плагина"
            />
          </label>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              {categories.map(item => (
                <SelectItem key={item} value={item} className="p2-select-item">{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <P2SecondaryAction className="px-4">Сбросить</P2SecondaryAction>
        </div>

        <div className="mt-4 p2-table-wrap p2-scroll">
          <table className="p2-table min-w-0">
            <thead>
              <tr>
                <th>Плагин</th>
                <th>Категория</th>
                <th>Рейтинг</th>
                <th>Цена</th>
                <th>Состояние</th>
                <th className="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(plugin => (
                <tr key={plugin.id}>
                  <td>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--p2-text)] truncate">{plugin.icon} {plugin.name}</p>
                      <p className="mt-1 text-xs text-[var(--p2-text-dim)] line-clamp-1">{plugin.description}</p>
                    </div>
                  </td>
                  <td>{plugin.category}</td>
                  <td>
                    <span className="p2-chip">
                      <StarIcon className="size-3" />
                      {plugin.rating}
                    </span>
                  </td>
                  <td>{plugin.price === 'free' ? 'Free' : plugin.price + ' ₽'}</td>
                  <td>{plugin.installed ? 'Установлен' : 'Не установлен'}</td>
                  <td className="text-right space-x-2">
                    <button className="p2-btn-soft px-3" onClick={() => setSelectedId(plugin.id)}>
                      Детали
                    </button>
                    <button className={plugin.installed ? 'p2-btn-soft px-3' : 'p2-btn-primary px-3'} onClick={() => toggleInstall(plugin.id)}>
                      {plugin.installed ? 'Отключить' : 'Установить'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </P2Panel>

      <Dialog open={Boolean(selected)} onOpenChange={open => !open && setSelectedId(null)}>
        <DialogContent className="p2-dialog max-w-xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[var(--p2-text)]">{selected.icon} {selected.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <p className="text-sm text-[var(--p2-text-soft)]">{selected.description}</p>
                <div className="inline-flex items-center gap-2">
                  <span className="p2-chip">Категория: {selected.category}</span>
                  <span className="p2-chip">Отзывы: {selected.reviews}</span>
                </div>

                <div className="flex justify-end gap-2">
                  <P2SecondaryAction onClick={() => setSelectedId(null)}>Закрыть</P2SecondaryAction>
                  <P2PrimaryAction onClick={() => toggleInstall(selected.id)}>
                    {selected.installed ? 'Отключить' : 'Установить'}
                  </P2PrimaryAction>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
