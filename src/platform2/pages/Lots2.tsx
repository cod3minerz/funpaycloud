'use client';

import { useMemo, useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import type { Lot } from '@/platform/data/demoData';
import { lots as initialLots } from '@/platform/data/demoData';
import { P2Panel, P2PageHeader, P2PrimaryAction, P2SecondaryAction } from '@/platform2/components/primitives';

export default function Lots2() {
  const [lots, setLots] = useState<Lot[]>(initialLots);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editLot, setEditLot] = useState<Lot | null>(null);
  const [form, setForm] = useState<Partial<Lot>>({});

  const filtered = useMemo(
    () =>
      lots.filter(lot => {
        if (status !== 'all' && lot.status !== status) return false;
        if (search && !`${lot.title} ${lot.category}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [lots, search, status],
  );

  function startEdit(lot: Lot) {
    setEditLot(lot);
    setForm({ ...lot });
  }

  function saveLot() {
    if (!editLot) return;

    setLots(prev => prev.map(lot => (lot.id === editLot.id ? { ...lot, ...form } : lot)));
    setEditLot(null);
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Lots" description="Control product catalog, visibility and pricing." />

      <P2Panel title="Filters" subtitle="Search by title and status">
        <div className="p2-toolbar">
          <label className="p2-search max-w-none w-full">
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="p2-input border-0 shadow-none h-auto p-0 focus-visible:ring-0"
              placeholder="Search lots"
            />
          </label>

          <Select value={status} onValueChange={value => setStatus(value as typeof status)}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              <SelectItem className="p2-select-item" value="all">All</SelectItem>
              <SelectItem className="p2-select-item" value="active">Active</SelectItem>
              <SelectItem className="p2-select-item" value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </P2Panel>

      <P2Panel title="Lot list" subtitle="Product matrix with direct edits">
        <div className="p2-table-wrap p2-scroll">
          <table className="p2-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Monthly sales</th>
                <th className="text-right">Price</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lot => (
                <tr key={lot.id}>
                  <td className="font-semibold max-w-[320px] truncate">{lot.title}</td>
                  <td>{lot.category}</td>
                  <td>
                    <span className={lot.status === 'active' ? 'p2-status success' : 'p2-status danger'}>
                      {lot.status}
                    </span>
                  </td>
                  <td>{lot.salesMonth}</td>
                  <td className="text-right">{lot.price} ₽</td>
                  <td className="text-right">
                    <button className="p2-secondary-btn inline-flex items-center gap-1.5 px-3" onClick={() => startEdit(lot)}>
                      <PencilSquareIcon className="size-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </P2Panel>

      <Dialog open={Boolean(editLot)} onOpenChange={() => setEditLot(null)}>
        <DialogContent className="p2-dialog max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit lot</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <label className="space-y-1.5 block">
              <span className="text-xs text-[var(--p2-text-dim)]">Title</span>
              <Input className="p2-input" value={form.title ?? ''} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs text-[var(--p2-text-dim)]">Description</span>
              <Textarea className="p2-input min-h-24" value={form.description ?? ''} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 block">
                <span className="text-xs text-[var(--p2-text-dim)]">Price</span>
                <Input className="p2-input" value={form.price ?? ''} onChange={event => setForm(prev => ({ ...prev, price: Number(event.target.value) }))} />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs text-[var(--p2-text-dim)]">Status</span>
                <Select value={form.status ?? 'active'} onValueChange={value => setForm(prev => ({ ...prev, status: value as Lot['status'] }))}>
                  <SelectTrigger className="p2-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p2-select-content">
                    <SelectItem className="p2-select-item" value="active">active</SelectItem>
                    <SelectItem className="p2-select-item" value="inactive">inactive</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <P2SecondaryAction onClick={() => setEditLot(null)}>Cancel</P2SecondaryAction>
              <P2PrimaryAction onClick={saveLot}>Save</P2PrimaryAction>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
