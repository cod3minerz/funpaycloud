'use client';

import { useMemo, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import type { Plugin } from '@/platform/data/demoData';
import { plugins as initialPlugins } from '@/platform/data/demoData';
import { P2Card, P2PageHeader, P2PrimaryAction, P2SecondaryAction } from '@/platform2/components/primitives';

export default function Plugins2() {
  const [plugins, setPlugins] = useState<Plugin[]>(initialPlugins);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<Plugin | null>(null);

  const categories = useMemo(() => ['all', ...Array.from(new Set(plugins.map(plugin => plugin.category)))], [plugins]);

  const filtered = useMemo(
    () =>
      plugins.filter(plugin => {
        if (category !== 'all' && plugin.category !== category) return false;
        if (query && !`${plugin.name} ${plugin.description}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [plugins, category, query],
  );

  function toggleInstall(id: string) {
    setPlugins(prev => prev.map(plugin => (plugin.id === id ? { ...plugin, installed: !plugin.installed } : plugin)));
    setSelected(prev => (prev && prev.id === id ? { ...prev, installed: !prev.installed } : prev));
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Plugins" description="Curated extensions for automation and conversion growth." />

      <P2Card title="Catalog" subtitle="Discover and manage integrations">
        <div className="p2-toolbar">
          <label className="p2-search max-w-none w-full">
            <MagnifyingGlassIcon className="size-4 text-[var(--p2-text-dim)]" />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="p2-input border-0 shadow-none h-auto p-0 focus-visible:ring-0"
              placeholder="Search plugins"
            />
          </label>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              {categories.map(item => (
                <SelectItem key={item} className="p2-select-item" value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(plugin => (
            <article key={plugin.id} className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{plugin.icon} {plugin.name}</h3>
                  <p className="text-xs text-[var(--p2-text-dim)] mt-1">{plugin.category}</p>
                </div>
                <span className="p2-chip">★ {plugin.rating}</span>
              </div>

              <p className="text-sm text-[var(--p2-text-muted)] mt-3 line-clamp-3">{plugin.description}</p>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm text-white font-semibold">
                  {plugin.price === 'free' ? 'Free' : `${plugin.price} ₽`}
                </span>
                <button className={plugin.installed ? 'p2-secondary-btn px-3' : 'p2-primary-btn px-3'} onClick={() => toggleInstall(plugin.id)}>
                  {plugin.installed ? 'Installed' : 'Install'}
                </button>
              </div>

              <button className="mt-2 p2-secondary-btn w-full" onClick={() => setSelected(plugin)}>Details</button>
            </article>
          ))}
        </div>
      </P2Card>

      <Dialog open={Boolean(selected)} onOpenChange={() => setSelected(null)}>
        <DialogContent className="p2-dialog max-w-xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selected.icon} {selected.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <p className="text-sm text-[var(--p2-text-muted)]">{selected.description}</p>
                <div className="inline-flex items-center gap-2">
                  <span className="p2-chip">Category: {selected.category}</span>
                  <span className="p2-chip">Reviews: {selected.reviews}</span>
                </div>

                <div className="flex justify-end gap-2">
                  <P2SecondaryAction onClick={() => setSelected(null)}>Close</P2SecondaryAction>
                  <P2PrimaryAction onClick={() => toggleInstall(selected.id)}>
                    {selected.installed ? 'Uninstall' : 'Install'}
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
