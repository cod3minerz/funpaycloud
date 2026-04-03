import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Wallet, TrendingUp, ArrowDownCircle, Download, Filter } from 'lucide-react';
import { accounts, orders, transactions, Transaction } from '@/platform/data/demoData';

const CARD: React.CSSProperties = {
  background: '#0a1428',
  border: '1px solid rgba(0,121,255,0.18)',
  borderRadius: '12px',
  padding: '20px',
};

const typeLabelMap: Record<string, string> = {
  sale: 'Продажа',
  withdrawal: 'Вывод',
  refund: 'Возврат',
  fee: 'Комиссия',
};

const typeColorMap: Record<string, string> = {
  sale:       '#22c55e',
  withdrawal: '#0079FF',
  refund:     '#ef4444',
  fee:        '#6b7280',
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
  // Last 6 months
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    result.push({ name: monthNames[d.getMonth()], revenue: map[key] || 0 });
  }
  return result;
}

export default function Finances() {
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showExportAlert, setShowExportAlert] = useState(false);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const frozenAmount = orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.amount, 0);
  const withdrawnThisMonth = transactions
    .filter(t => t.type === 'withdrawal' && t.date.startsWith('2026-04'))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const filteredTxs = useMemo(() => {
    return transactions.filter(t => {
      if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      return true;
    });
  }, [accountFilter, typeFilter]);

  const monthlyData = getMonthlyData(transactions);

  function handleExport() {
    setShowExportAlert(true);
    setTimeout(() => setShowExportAlert(false), 3000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: '#050C1C', color: '#fff', fontFamily: 'Syne, sans-serif' }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Финансы</h1>

      {showExportAlert && (
        <div style={{ marginBottom: '16px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Download size={16} />
          Файл CSV подготовлен и скачивается...
        </div>
      )}

      {/* Top 3 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Balance */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,79,255,0.35) 0%, rgba(0,52,244,0.20) 100%)',
          border: '1px solid rgba(0,121,255,0.4)',
          borderRadius: '12px',
          padding: '22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(0,121,255,0.2)', borderRadius: '8px', padding: '8px' }}>
              <Wallet size={20} color="#0079FF" />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Доступный баланс</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {totalBalance.toLocaleString('ru-RU')}₽
          </div>
          <div style={{ color: 'rgba(125,200,255,0.8)', fontSize: '12px', marginTop: '6px' }}>
            по всем аккаунтам
          </div>
        </div>

        {/* Frozen */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(234,179,8,0.15)', borderRadius: '8px', padding: '8px' }}>
              <TrendingUp size={20} color="#eab308" />
            </div>
            <span style={{ color: '#7DC8FF', fontSize: '13px' }}>Заморожено</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{frozenAmount.toLocaleString('ru-RU')}₽</div>
          <div style={{ color: '#7DC8FF', fontSize: '12px', marginTop: '6px' }}>в активных заказах</div>
        </div>

        {/* Withdrawn */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: '8px', padding: '8px' }}>
              <ArrowDownCircle size={20} color="#22c55e" />
            </div>
            <span style={{ color: '#7DC8FF', fontSize: '13px' }}>Выведено за апрель</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{withdrawnThisMonth.toLocaleString('ru-RU')}₽</div>
          <div style={{ color: '#7DC8FF', fontSize: '12px', marginTop: '6px' }}>апрель 2026</div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div style={{ ...CARD, marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={18} color="#0079FF" />
          <span style={{ fontWeight: 600, fontSize: '16px' }}>Поступления по месяцам</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,121,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#7DC8FF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#7DC8FF', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#0a1428', border: '1px solid rgba(0,121,255,0.3)', borderRadius: '8px', color: '#fff' }}
              formatter={(v: number) => [`${v.toLocaleString('ru-RU')}₽`, 'Выручка']}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {monthlyData.map((_, i) => (
                <Cell key={i} fill={i === monthlyData.length - 1 ? '#0079FF' : 'rgba(0,121,255,0.5)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters + Table */}
      <div style={CARD}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7DC8FF', fontSize: '14px' }}>
            <Filter size={15} />
            Фильтры:
          </div>
          {/* Account filter */}
          <select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            style={{ background: '#0d1e38', border: '1px solid rgba(0,121,255,0.25)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">Все аккаунты</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
          </select>
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ background: '#0d1e38', border: '1px solid rgba(0,121,255,0.25)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">Все операции</option>
            <option value="sale">Продажи</option>
            <option value="withdrawal">Выводы</option>
            <option value="refund">Возвраты</option>
            <option value="fee">Комиссии</option>
          </select>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={handleExport}
              style={{ background: 'rgba(0,121,255,0.12)', border: '1px solid rgba(0,121,255,0.3)', borderRadius: '8px', padding: '7px 14px', color: '#7DC8FF', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              Экспорт CSV
            </button>
          </div>
        </div>

        {/* Table header */}
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Транзакции</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '560px' }}>
            <thead>
              <tr style={{ color: '#7DC8FF', borderBottom: '1px solid rgba(0,121,255,0.15)' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>Дата</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>Тип</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>Описание</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>Аккаунт</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 500 }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.map(tx => {
                const isPositive = tx.type === 'sale';
                const color = typeColorMap[tx.type];
                const amountSign = tx.type === 'sale' ? '+' : tx.type === 'fee' || tx.type === 'withdrawal' ? '-' : '-';
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(0,121,255,0.07)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,121,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 10px', color: '#7DC8FF', whiteSpace: 'nowrap' }}>
                      {new Date(tx.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td style={{ padding: '11px 10px' }}>
                      <span style={{
                        background: `${color}20`,
                        color,
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {typeLabelMap[tx.type]}
                      </span>
                    </td>
                    <td style={{ padding: '11px 10px', color: '#fff' }}>{tx.description}</td>
                    <td style={{ padding: '11px 10px', color: '#7DC8FF' }}>
                      {accounts.find(a => a.id === tx.accountId)?.username ?? tx.accountId}
                    </td>
                    <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: isPositive ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>
                      {amountSign}{Math.abs(tx.amount).toLocaleString('ru-RU')}₽
                    </td>
                  </tr>
                );
              })}
              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#7DC8FF' }}>
                    Транзакции не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
