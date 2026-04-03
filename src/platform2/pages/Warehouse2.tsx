'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import type { WarehouseLot } from '@/platform/data/demoData';
import { warehouseLots as initialLots } from '@/platform/data/demoData';
import { P2Panel, P2PageHeader, P2PrimaryAction } from '@/platform2/components/primitives';

export default function Warehouse2() {
  const [lots, setLots] = useState<WarehouseLot[]>(initialLots);
  const [selectedLotId, setSelectedLotId] = useState(initialLots[0]?.lotId ?? '');
  const [singleItem, setSingleItem] = useState('');
  const [bulkItems, setBulkItems] = useState('');

  const selectedLot = useMemo(() => lots.find(lot => lot.lotId === selectedLotId), [lots, selectedLotId]);

  function addSingle() {
    if (!selectedLot || !singleItem.trim()) return;

    const item = { id: `wi-${Date.now()}`, value: singleItem.trim(), status: 'available' as const };
    setLots(prev => prev.map(lot => (lot.lotId === selectedLotId ? { ...lot, items: [item, ...lot.items] } : lot)));
    setSingleItem('');
  }

  function addBulk() {
    if (!selectedLot || !bulkItems.trim()) return;

    const rows = bulkItems
      .split('\n')
      .map(value => value.trim())
      .filter(Boolean)
      .map((value, index) => ({ id: `wi-${Date.now()}-${index}`, value, status: 'available' as const }));

    setLots(prev => prev.map(lot => (lot.lotId === selectedLotId ? { ...lot, items: [...rows, ...lot.items] } : lot)));
    setBulkItems('');
  }

  function updateTemplate(value: string) {
    setLots(prev => prev.map(lot => (lot.lotId === selectedLotId ? { ...lot, messageTemplate: value } : lot)));
  }

  function toggleAuto(enabled: boolean) {
    setLots(prev => prev.map(lot => (lot.lotId === selectedLotId ? { ...lot, autoDeliveryEnabled: enabled } : lot)));
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Warehouse" description="Manage stock pools and delivery templates for each lot." />

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <P2Panel title="Lots" subtitle="Select lot for stock control">
          <div className="space-y-2 max-h-[680px] overflow-y-auto p2-scroll">
            {lots.map(lot => {
              const available = lot.items.filter(item => item.status === 'available').length;
              const active = lot.lotId === selectedLotId;

              return (
                <button
                  key={lot.lotId}
                  type="button"
                  onClick={() => setSelectedLotId(lot.lotId)}
                  className={[
                    'w-full text-left rounded-xl border p-3 transition',
                    active
                      ? 'border-blue-500/45 bg-blue-500/10'
                      : 'border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)]',
                  ].join(' ')}
                >
                  <p className="text-sm font-semibold text-white line-clamp-1">{lot.lotTitle}</p>
                  <p className="text-xs text-[var(--p2-text-dim)] mt-1">{available} available</p>
                </button>
              );
            })}
          </div>
        </P2Panel>

        {selectedLot ? (
          <div className="space-y-4">
            <P2Panel title={selectedLot.lotTitle} subtitle="Stock operations and template settings">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                  <p className="text-xs text-[var(--p2-text-dim)]">Available</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {selectedLot.items.filter(item => item.status === 'available').length}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                  <p className="text-xs text-[var(--p2-text-dim)]">Delivered</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {selectedLot.items.filter(item => item.status === 'delivered').length}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3">
                <div>
                  <p className="text-sm font-semibold text-white">Auto delivery</p>
                  <p className="text-xs text-[var(--p2-text-dim)]">Send item instantly after payment</p>
                </div>
                <Switch checked={selectedLot.autoDeliveryEnabled} onCheckedChange={toggleAuto} />
              </div>
            </P2Panel>

            <P2Panel title="Add stock" subtitle="Single item or bulk insert">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Input className="p2-input" value={singleItem} onChange={event => setSingleItem(event.target.value)} placeholder="Single key / account" />
                  <P2PrimaryAction className="w-full" onClick={addSingle}>Add item</P2PrimaryAction>
                </div>

                <div className="space-y-2">
                  <Textarea
                    className="p2-input min-h-24"
                    value={bulkItems}
                    onChange={event => setBulkItems(event.target.value)}
                    placeholder="Paste list, one item per line"
                  />
                  <P2PrimaryAction className="w-full" onClick={addBulk}>Add bulk</P2PrimaryAction>
                </div>
              </div>
            </P2Panel>

            <P2Panel title="Message template" subtitle="Variables: {товар}, {имя_покупателя}, {номер_заказа}">
              <Textarea
                className="p2-input min-h-28"
                value={selectedLot.messageTemplate}
                onChange={event => updateTemplate(event.target.value)}
              />
            </P2Panel>

            <P2Panel title="Stock list" subtitle="Recent inventory values">
              <div className="p2-table-wrap p2-scroll">
                <table className="p2-table">
                  <thead>
                    <tr>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLot.items.slice(0, 40).map(item => (
                      <tr key={item.id}>
                        <td className="font-semibold max-w-[300px] truncate">{item.value}</td>
                        <td>
                          <span className={item.status === 'available' ? 'p2-status success' : 'p2-status info'}>
                            {item.status}
                          </span>
                        </td>
                        <td className="text-[var(--p2-text-dim)]">{item.deliveredAt ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </P2Panel>
          </div>
        ) : null}
      </div>
    </div>
  );
}
