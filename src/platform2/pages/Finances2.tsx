'use client';

import { useMemo, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { accounts, transactions } from '@/platform/data/demoData';
import { P2Panel, P2PageHeader, P2PrimaryAction, P2Status } from '@/platform2/components/primitives';

export default function Finances2() {
  const [accountFilter, setAccountFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      transactions.filter(item => {
        if (accountFilter !== 'all' && item.accountId !== accountFilter) return false;
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;
        if (search && !`${item.description} ${item.id}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [accountFilter, typeFilter, search],
  );

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const sales = transactions.filter(item => item.type === 'sale').reduce((sum, item) => sum + item.amount, 0);
  const payouts = Math.abs(transactions.filter(item => item.type === 'withdrawal').reduce((sum, item) => sum + item.amount, 0));

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader
        title="Finances"
        description="Track flow, payouts and accounting events in one stream."
        actions={
          <P2PrimaryAction>
            <ArrowDownTrayIcon className="size-4" />
            Export CSV
          </P2PrimaryAction>
        }
      />

      <div className="p2-kpi-grid">
        <article className="p2-kpi">
          <p className="p2-kpi-label">Total balance</p>
          <p className="p2-kpi-value">{totalBalance.toLocaleString('ru-RU')} ₽</p>
        </article>
        <article className="p2-kpi">
          <p className="p2-kpi-label">Sales turnover</p>
          <p className="p2-kpi-value">{sales.toLocaleString('ru-RU')} ₽</p>
        </article>
        <article className="p2-kpi">
          <p className="p2-kpi-label">Payouts</p>
          <p className="p2-kpi-value">{payouts.toLocaleString('ru-RU')} ₽</p>
        </article>
      </div>

      <P2Panel title="Transactions" subtitle="Filters and detailed movement table">
        <div className="p2-toolbar">
          <label className="p2-search max-w-none w-full">
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="p2-input border-0 shadow-none h-auto p-0 focus-visible:ring-0"
              placeholder="Search transactions"
            />
          </label>

          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              <SelectItem value="all" className="p2-select-item">All accounts</SelectItem>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id} className="p2-select-item">{account.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="p2-select-trigger">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="p2-select-content">
              <SelectItem value="all" className="p2-select-item">All types</SelectItem>
              <SelectItem value="sale" className="p2-select-item">Sale</SelectItem>
              <SelectItem value="withdrawal" className="p2-select-item">Withdrawal</SelectItem>
              <SelectItem value="refund" className="p2-select-item">Refund</SelectItem>
              <SelectItem value="fee" className="p2-select-item">Fee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 p2-table-wrap p2-scroll">
          <table className="p2-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Account</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.id}</td>
                  <td>{item.description}</td>
                  <td>{accounts.find(account => account.id === item.accountId)?.username ?? item.accountId}</td>
                  <td>
                    <P2Status
                      type={
                        item.type === 'sale'
                          ? 'success'
                          : item.type === 'withdrawal'
                            ? 'warning'
                            : item.type === 'refund'
                              ? 'danger'
                              : 'info'
                      }
                    >
                      {item.type}
                    </P2Status>
                  </td>
                  <td className="text-right">{item.amount > 0 ? '+' : ''}{item.amount} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </P2Panel>
    </div>
  );
}
