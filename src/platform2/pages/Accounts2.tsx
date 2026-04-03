'use client';

import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import type { Account } from '@/platform/data/demoData';
import { accounts as initialAccounts } from '@/platform/data/demoData';
import { P2Panel, P2PageHeader, P2PrimaryAction, P2SecondaryAction } from '@/platform2/components/primitives';

export default function Accounts2() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [form, setForm] = useState({ username: '', balance: '' });
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(
    () =>
      accounts.filter(account => {
        if (status === 'online' && !account.online) return false;
        if (status === 'offline' && account.online) return false;
        if (query && !account.username.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [accounts, query, status],
  );

  function createAccount() {
    const username = form.username.trim();
    const balance = Number(form.balance);
    if (!username || Number.isNaN(balance)) return;

    setAccounts(prev => [
      {
        id: `acc-${Date.now()}`,
        username,
        avatar: username.charAt(0).toUpperCase(),
        balance,
        lotsCount: 0,
        online: true,
        rating: 4.8,
        sales: 0,
        verified: false,
      },
      ...prev,
    ]);

    setForm({ username: '', balance: '' });
    setShowCreate(false);
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader
        title="Accounts"
        description="Manage farm accounts, statuses and operational metrics."
        actions={
          <P2PrimaryAction onClick={() => setShowCreate(true)}>
            <PlusIcon className="size-4" />
            Add account
          </P2PrimaryAction>
        }
      />

      <P2Panel title="Filters" subtitle="Search by username and connection state">
        <div className="p2-toolbar">
          <label className="p2-search max-w-none w-full">
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="p2-input border-0 shadow-none h-auto p-0 focus-visible:ring-0"
              placeholder="Search account"
            />
          </label>

          <Select value={status} onValueChange={value => setStatus(value as typeof status)}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              <SelectItem value="all" className="p2-select-item">All</SelectItem>
              <SelectItem value="online" className="p2-select-item">Online</SelectItem>
              <SelectItem value="offline" className="p2-select-item">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </P2Panel>

      <P2Panel title="Account List" subtitle="Performance and health status by account">
        <div className="p2-table-wrap p2-scroll">
          <table className="p2-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Status</th>
                <th>Balance</th>
                <th>Lots</th>
                <th>Sales</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(account => (
                <tr key={account.id}>
                  <td className="font-semibold">{account.username}</td>
                  <td>
                    <span className={account.online ? 'p2-status success' : 'p2-status danger'}>
                      {account.online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td>{account.balance.toLocaleString('ru-RU')} ₽</td>
                  <td>{account.lotsCount}</td>
                  <td>{account.sales}</td>
                  <td>{account.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </P2Panel>

      {showCreate ? (
        <P2Panel title="Create Account" subtitle="Add new farm account">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs text-[var(--p2-text-dim)]">Username</span>
              <Input className="p2-input" value={form.username} onChange={event => setForm(prev => ({ ...prev, username: event.target.value }))} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-[var(--p2-text-dim)]">Start balance</span>
              <Input className="p2-input" value={form.balance} onChange={event => setForm(prev => ({ ...prev, balance: event.target.value }))} />
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <P2SecondaryAction onClick={() => setShowCreate(false)}>Cancel</P2SecondaryAction>
            <P2PrimaryAction onClick={createAccount}>Create</P2PrimaryAction>
          </div>
        </P2Panel>
      ) : null}
    </div>
  );
}
