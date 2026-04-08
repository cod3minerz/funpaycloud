import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownCircle, Download, Filter, TrendingUp, Wallet } from 'lucide-react';
import { accounts, orders, Transaction, transactions } from '@/platform/data/demoData';
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

function getMonthlyData(txs: Transaction[]) {
  const map: Record<string, number> = {};
  txs.forEach(t => {
    if (t.type !== 'sale') return;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    map[key] = (map[key] || 0) + t.amount;
  });

  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    result.push({ name: monthNames[d.getMonth()], revenue: map[key] || 0 });
  }
  return result;
}

export default function Finances() {
  const [isMobile, setIsMobile] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportAlert, setShowExportAlert] = useState(false);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const frozenAmount = orders.filter(order => order.status === 'paid').reduce((sum, order) => sum + order.amount, 0);
  const withdrawnThisMonth = transactions
    .filter(tx => tx.type === 'withdrawal' && tx.date.startsWith('2026-04'))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const filteredTxs = useMemo(() => {
    return transactions.filter(tx => {
      if (accountFilter !== 'all' && tx.accountId !== accountFilter) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      return true;
    });
  }, [accountFilter, typeFilter]);

  const monthlyData = useMemo(() => getMonthlyData(transactions), []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      setIsMobile(media.matches);
      if (!media.matches) setShowFilters(false);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  function handleExport() {
    setShowExportAlert(true);
    setTimeout(() => setShowExportAlert(false), 2200);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Финансы"
            subtitle="Финансовые потоки, операции и экспорт отчётов в едином операционном стандарте."
          />
        </PageHeader>

        {showExportAlert && (
          <SectionCard className="border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.08)] py-3">
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#86efac]">
              <Download size={15} /> Файл CSV подготовлен и скачивается.
            </div>
          </SectionCard>
        )}

        <KpiGrid>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <Wallet size={15} color="#60a5fa" />
              Доступный баланс
            </div>
            <strong className="text-[26px]">{totalBalance.toLocaleString('ru-RU')} ₽</strong>
            <span className="platform-kpi-meta">По всем аккаунтам</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <TrendingUp size={15} color="#fbbf24" />
              Заморожено
            </div>
            <strong className="text-[26px]">{frozenAmount.toLocaleString('ru-RU')} ₽</strong>
            <span className="platform-kpi-meta">В активных заказах</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <ArrowDownCircle size={15} color="#34d399" />
              Выведено за апрель
            </div>
            <strong className="text-[26px]">{withdrawnThisMonth.toLocaleString('ru-RU')} ₽</strong>
            <span className="platform-kpi-meta">Апрель 2026</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">Операций</div>
            <strong className="text-[26px]">{filteredTxs.length}</strong>
            <span className="platform-kpi-meta">С учётом активных фильтров</span>
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

            {isMobile ? (
              <button
                className={showFilters ? 'platform-btn-primary' : 'platform-btn-secondary'}
                onClick={() => setShowFilters(prev => !prev)}
              >
                {showFilters ? 'Скрыть' : 'Показать'}
              </button>
            ) : (
              <>
                <select
                  className="platform-select"
                  value={accountFilter}
                  onChange={event => setAccountFilter(event.target.value)}
                  style={{ maxWidth: 220 }}
                >
                  <option value="all">Все аккаунты</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.username}
                    </option>
                  ))}
                </select>

                <select
                  className="platform-select"
                  value={typeFilter}
                  onChange={event => setTypeFilter(event.target.value)}
                  style={{ maxWidth: 220 }}
                >
                  <option value="all">Все операции</option>
                  <option value="sale">Продажи</option>
                  <option value="withdrawal">Выводы</option>
                  <option value="refund">Возвраты</option>
                  <option value="fee">Комиссии</option>
                </select>
              </>
            )}

            <button className="platform-btn-secondary" onClick={handleExport}>
              <Download size={14} /> Экспорт CSV
            </button>
          </ToolbarRow>

          {isMobile && showFilters && (
            <ToolbarRow className="mt-2">
              <select
                className="platform-select"
                value={accountFilter}
                onChange={event => setAccountFilter(event.target.value)}
                style={{ maxWidth: 220 }}
              >
                <option value="all">Все аккаунты</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.username}
                  </option>
                ))}
              </select>

              <select
                className="platform-select"
                value={typeFilter}
                onChange={event => setTypeFilter(event.target.value)}
                style={{ maxWidth: 220 }}
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
                    const amountSign = tx.type === 'sale' ? '+' : '-';
                    return (
                      <tr key={tx.id}>
                        <td className="whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td>
                          <span
                            className="platform-chip !min-h-[22px] !text-[11px]"
                            style={{ color: typeColorMap[tx.type], borderColor: `${typeColorMap[tx.type]}66` }}
                          >
                            {typeLabelMap[tx.type]}
                          </span>
                        </td>
                        <td>{tx.description}</td>
                        <td className="platform-col-tablet-hide text-[var(--pf-text-muted)]">
                          {accounts.find(account => account.id === tx.accountId)?.username ?? tx.accountId}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                            fontWeight: 700,
                            color: isPositive ? '#4ade80' : '#fb7185',
                          }}
                        >
                          {amountSign}
                          {Math.abs(tx.amount).toLocaleString('ru-RU')} ₽
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DataTableWrap>
          </div>

          <div className="platform-mobile-cards">
            {filteredTxs.map(tx => {
              const isPositive = tx.type === 'sale';
              const amountSign = tx.type === 'sale' ? '+' : '-';
              const accountName = accounts.find(account => account.id === tx.accountId)?.username ?? tx.accountId;
              return (
                <article key={tx.id} className="platform-mobile-card">
                  <div className="platform-mobile-card-head">
                    <strong>{new Date(tx.date).toLocaleDateString('ru-RU')}</strong>
                    <span
                      className="platform-chip !min-h-[22px] !text-[11px]"
                      style={{ color: typeColorMap[tx.type], borderColor: `${typeColorMap[tx.type]}66` }}
                    >
                      {typeLabelMap[tx.type]}
                    </span>
                  </div>
                  <div className="text-[13px] text-[var(--pf-text-muted)]">{tx.description}</div>
                  <div className="platform-mobile-meta">
                    <span>Аккаунт: {accountName}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: isPositive ? '#4ade80' : '#fb7185',
                      }}
                    >
                      {amountSign}
                      {Math.abs(tx.amount).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
          {filteredTxs.length === 0 && <EmptyState>Транзакции по текущим фильтрам не найдены.</EmptyState>}
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
