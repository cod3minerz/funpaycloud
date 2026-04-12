'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Filter, Loader2, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { accountsApi, ApiAccount, financesApi, FinancesData } from '@/lib/api';
import {
  DataTableWrap,
  EmptyState,
  KpiCard,
  KpiGrid,
  PageHeader,
  PageShell,
  PageTitle,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

type Tx = FinancesData['transactions'][number];

const typeLabelMap: Record<string, string> = {
  sale: 'Продажа',
  withdrawal: 'Вывод',
  refund: 'Возврат',
  fee: 'Комиссия',
};

const typeColorMap: Record<string, string> = {
  sale: '#22c55e',
  withdrawal: '#60a5fa',
  refund: '#ef4444',
  fee: '#94a3b8',
};

const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

function csvEscape(value: string | number) {
  const stringified = String(value ?? '');
  if (/[",\n]/.test(stringified)) return `"${stringified.replace(/"/g, '""')}"`;
  return stringified;
}

function getMonthlyData(txs: Tx[]) {
  const map: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.type !== 'sale') continue;
    const d = new Date(tx.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    map[key] = (map[key] || 0) + Number(tx.amount || 0);
  }

  const now = new Date();
  const result: Array<{ name: string; revenue: number }> = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    result.push({ name: monthNames[d.getMonth()], revenue: Number(map[key] || 0) });
  }
  return result;
}

export default function Finances() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportAlert, setShowExportAlert] = useState(false);
  const [data, setData] = useState<FinancesData>({
    total_revenue: 0,
    total_orders: 0,
    accounts_count: 0,
    transactions: [],
  });

  useEffect(() => {
    accountsApi
      .list()
      .then(rows => setAccounts(Array.isArray(rows) ? rows : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    financesApi
      .get({ account_id: accountFilter === 'all' ? undefined : Number(accountFilter), limit: 500 })
      .then(response => {
        if (cancelled) return;
        setData({
          total_revenue: Number(response.total_revenue || 0),
          total_orders: Number(response.total_orders || 0),
          accounts_count: Number(response.accounts_count || 0),
          transactions: Array.isArray(response.transactions) ? response.transactions : [],
        });
      })
      .catch(err => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Ошибка загрузки финансовых данных');
          setData({ total_revenue: 0, total_orders: 0, accounts_count: 0, transactions: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountFilter]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      if (!media.matches) setShowFilters(false);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const transactions = useMemo(() => (Array.isArray(data.transactions) ? data.transactions : []), [data.transactions]);

  const filteredTxs = useMemo(() => {
    return transactions.filter(tx => {
      if (accountFilter !== 'all' && String(tx.funpay_account_id) !== accountFilter) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, accountFilter, typeFilter]);

  const monthlyData = useMemo(() => getMonthlyData(filteredTxs), [filteredTxs]);

  const revenueByFilter = useMemo(
    () => filteredTxs.filter(tx => tx.type === 'sale').reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    [filteredTxs],
  );

  const withdrawalsByFilter = useMemo(
    () =>
      filteredTxs
        .filter(tx => tx.type === 'withdrawal')
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0),
    [filteredTxs],
  );

  function handleExport() {
    if (filteredTxs.length === 0) {
      toast.error('Нет данных для экспорта');
      return;
    }

    const header = ['Дата', 'Тип', 'Описание', 'Аккаунт', 'Сумма'];
    const lines = filteredTxs.map(tx => [
      csvEscape(fmtDate(tx.date)),
      csvEscape(typeLabelMap[tx.type] || tx.type),
      csvEscape(tx.description || ''),
      csvEscape(tx.account_username || `ID ${tx.funpay_account_id}`),
      csvEscape(Number(tx.amount || 0).toFixed(2)),
    ]);

    const csv = [header, ...lines].map(row => row.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `finances-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportAlert(true);
    setTimeout(() => setShowExportAlert(false), 2200);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Финансы"
            subtitle="Финансовые потоки, операции и экспорт отчётов на основе реальных данных."
          />
        </PageHeader>

        {showExportAlert && (
          <SectionCard className="border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.08)] py-3">
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#86efac]">
              <Download size={15} /> CSV выгружен.
            </div>
          </SectionCard>
        )}

        <KpiGrid>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <Wallet size={15} color="#60a5fa" />
              Общая выручка
            </div>
            <strong className="text-[26px]">
              {Number(accountFilter === 'all' ? data.total_revenue : revenueByFilter).toLocaleString('ru-RU')} ₽
            </strong>
            <span className="platform-kpi-meta">
              {accountFilter === 'all' ? 'По всем аккаунтам' : 'По выбранному аккаунту'}
            </span>
          </KpiCard>

          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <TrendingUp size={15} color="#fbbf24" />
              Заказов
            </div>
            <strong className="text-[26px]">{Number(data.total_orders || 0)}</strong>
            <span className="platform-kpi-meta">Всего оплаченных заказов</span>
          </KpiCard>

          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">Выводы</div>
            <strong className="text-[26px]">{withdrawalsByFilter.toLocaleString('ru-RU')} ₽</strong>
            <span className="platform-kpi-meta">По активным фильтрам</span>
          </KpiCard>

          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">Операций</div>
            <strong className="text-[26px]">{filteredTxs.length}</strong>
            <span className="platform-kpi-meta">С учётом фильтров</span>
          </KpiCard>
        </KpiGrid>

        <SectionCard>
          <h2 className="m-0 text-[15px] font-bold">Поступления по месяцам</h2>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 6, right: 8, bottom: 2, left: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--pf-text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--pf-surface)',
                    border: '1px solid rgba(96,165,250,0.44)',
                    borderRadius: 10,
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                />
                <Bar dataKey="revenue" radius={[5, 5, 0, 0]}>
                  {monthlyData.map((_, idx) => (
                    <Cell key={idx} fill={idx === monthlyData.length - 1 ? '#5b8cff' : 'rgba(91,140,255,0.48)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard>
          <ToolbarRow>
            <div className="inline-flex items-center gap-2 text-[13px] text-[var(--pf-text-muted)]">
              <Filter size={14} />
              Фильтры
            </div>

            <button
              className={showFilters ? 'platform-btn-primary md:hidden' : 'platform-btn-secondary md:hidden'}
              onClick={() => setShowFilters(prev => !prev)}
            >
              {showFilters ? 'Скрыть' : 'Показать'}
            </button>

            <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
              <select
                className="platform-select"
                value={accountFilter}
                onChange={event => setAccountFilter(event.target.value)}
                style={{ maxWidth: 240 }}
              >
                <option value="all">Все аккаунты</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.username || `ID ${account.id}`}
                  </option>
                ))}
              </select>

              <select
                className="platform-select"
                value={typeFilter}
                onChange={event => setTypeFilter(event.target.value)}
                style={{ maxWidth: 240 }}
              >
                <option value="all">Все операции</option>
                <option value="sale">Продажи</option>
                <option value="withdrawal">Выводы</option>
                <option value="refund">Возвраты</option>
                <option value="fee">Комиссии</option>
              </select>
            </div>

            <button className="platform-btn-secondary" onClick={handleExport}>
              <Download size={14} /> Экспорт CSV
            </button>
          </ToolbarRow>

          {showFilters && (
            <ToolbarRow className="mt-2 md:hidden">
              <select
                className="platform-select"
                value={accountFilter}
                onChange={event => setAccountFilter(event.target.value)}
                style={{ maxWidth: 240 }}
              >
                <option value="all">Все аккаунты</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.username || `ID ${account.id}`}
                  </option>
                ))}
              </select>

              <select
                className="platform-select"
                value={typeFilter}
                onChange={event => setTypeFilter(event.target.value)}
                style={{ maxWidth: 240 }}
              >
                <option value="all">Все операции</option>
                <option value="sale">Продажи</option>
                <option value="withdrawal">Выводы</option>
                <option value="refund">Возвраты</option>
                <option value="fee">Комиссии</option>
              </select>
            </ToolbarRow>
          )}
        </SectionCard>

        <SectionCard className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
            </div>
          ) : (
            <>
              <div className="platform-desktop-table">
                <DataTableWrap className="tablet-dense-scroll">
                  <table className="platform-table" style={{ minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Тип</th>
                        <th>Описание</th>
                        <th className="platform-col-tablet-hide">Аккаунт</th>
                        <th style={{ textAlign: 'right' }}>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.map(tx => {
                        const isPositive = tx.type === 'sale';
                        const amountSign = isPositive ? '+' : '-';
                        const color = typeColorMap[tx.type] || '#94a3b8';
                        return (
                          <tr key={`${tx.id}-${tx.date}`}>
                            <td className="whitespace-nowrap">{fmtDate(tx.date)}</td>
                            <td>
                              <span
                                className="platform-chip !min-h-[22px] !text-[11px]"
                                style={{ color, borderColor: `${color}66` }}
                              >
                                {typeLabelMap[tx.type] || tx.type}
                              </span>
                            </td>
                            <td>{tx.description || '—'}</td>
                            <td className="platform-col-tablet-hide">{tx.account_username || `ID ${tx.funpay_account_id}`}</td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontWeight: 700,
                                color: isPositive ? '#4ade80' : '#f87171',
                              }}
                            >
                              {amountSign}{Math.abs(Number(tx.amount || 0)).toLocaleString('ru-RU')} ₽
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>

              {filteredTxs.length === 0 && <EmptyState>Операции по текущим фильтрам не найдены.</EmptyState>}
            </>
          )}
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
