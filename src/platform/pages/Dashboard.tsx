import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Wallet, ShoppingCart, Package, MessageSquare, Bot, TrendingUp,
  ArrowUpRight, Zap, MessageCircle, Gift,
} from 'lucide-react';
import { accounts, orders, lots, chats, salesData } from '@/platform/data/demoData';

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--pf-surface)',
  border: '1px solid var(--pf-border)',
  borderRadius: '12px',
  padding: '20px',
};

const BTN_PRIMARY: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  fontSize: '14px',
};

const statusLabel: Record<string, string> = {
  paid: 'Оплачен',
  completed: 'Выполнен',
  refund: 'Возврат',
  dispute: 'Спор',
};

const statusColor: Record<string, string> = {
  paid: '#eab308',
  completed: '#22c55e',
  refund: '#ef4444',
  dispute: '#f97316',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const activeLots = lots.filter(l => l.status === 'active').length;
  const unreadChats = chats.filter(c => c.unread > 0).length;

  const chartData = salesData.slice(salesData.length - period);

  const recentOrders = [...orders].slice(0, 10);

  const recentChats = chats.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'var(--font-sans)' }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>Дашборд</h1>

      {/* Metrics Row */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
        {/* Общий баланс */}
        <div style={{ ...CARD_STYLE, minWidth: '200px', flex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: '8px', padding: '8px' }}>
              <Wallet size={20} color="#22c55e" />
            </div>
            <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Общий баланс</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700 }}>{totalBalance.toLocaleString('ru-RU')}₽</div>
          <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px', marginTop: '4px' }}>2 аккаунта</div>
        </div>

        {/* Заказов сегодня */}
        <div style={{ ...CARD_STYLE, minWidth: '200px', flex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(59,130,246,0.18)', borderRadius: '8px', padding: '8px' }}>
              <ShoppingCart size={20} color="var(--pf-accent)" />
            </div>
            <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Заказов сегодня</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700 }}>{todayOrders.length}</div>
          <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px', marginTop: '4px' }}>
            {todayOrders.reduce((s, o) => s + o.amount, 0).toLocaleString('ru-RU')}₽
          </div>
        </div>

        {/* Активных лотов */}
        <div style={{ ...CARD_STYLE, minWidth: '200px', flex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(59,130,246,0.18)', borderRadius: '8px', padding: '8px' }}>
              <Package size={20} color="var(--pf-accent)" />
            </div>
            <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Активных лотов</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700 }}>{activeLots}</div>
          <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px', marginTop: '4px' }}>из {lots.length} лотов</div>
        </div>

        {/* Сообщений без ответа */}
        <div style={{ ...CARD_STYLE, minWidth: '200px', flex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: unreadChats > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.18)', borderRadius: '8px', padding: '8px' }}>
              <MessageSquare size={20} color={unreadChats > 0 ? '#ef4444' : 'var(--pf-accent)'} />
            </div>
            <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Без ответа</span>
            {unreadChats > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, marginLeft: 'auto' }}>
                {unreadChats}
              </span>
            )}
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700 }}>{unreadChats}</div>
          <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px', marginTop: '4px' }}>чатов ждут ответа</div>
        </div>

        {/* Статус бота */}
        <div style={{ ...CARD_STYLE, minWidth: '200px', flex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: '8px', padding: '8px' }}>
              <Bot size={20} color="#22c55e" />
            </div>
            <span style={{ color: 'var(--pf-text-muted)', fontSize: '13px' }}>Статус бота</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', fontWeight: 700 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            Работает
          </div>
          <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px', marginTop: '4px' }}>uptime 99.9%</div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sales Chart */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--pf-accent)" />
                <span style={{ fontWeight: 600, fontSize: '16px' }}>График продаж</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {([7, 30, 90] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: period === p ? 'none' : '1px solid rgba(96,165,250,0.4)',
                      background: period === p ? 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {p} дней
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(96,165,250,0.44)" />
                    <stop offset="100%" stopColor="rgba(96,165,250,0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.12)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }}
                  tickFormatter={v => v.slice(5)}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--pf-surface)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', color: '#fff' }}
                  formatter={(v: number) => [`${v.toLocaleString('ru-RU')}₽`, 'Выручка']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--pf-accent)" fill="url(#salesGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Orders */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShoppingCart size={18} color="var(--pf-accent)" />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Последние заказы</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'var(--pf-text-muted)', borderBottom: '1px solid rgba(59,130,246,0.18)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 500 }}>Заказ</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 500 }}>Товар</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 500 }}>Покупатель</th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 500 }}>Сумма</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: 500 }}>Статус</th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 500 }}>Время</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                      <td style={{ padding: '10px 6px', color: 'var(--pf-text-muted)' }}>{o.id}</td>
                      <td style={{ padding: '10px 6px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.lot}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                            {o.buyerAvatar}
                          </div>
                          {o.buyer}
                        </div>
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 600 }}>{o.amount}₽</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                        <span style={{
                          background: `${statusColor[o.status]}20`,
                          color: statusColor[o.status],
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          {statusLabel[o.status]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'right', color: 'var(--pf-text-muted)' }}>{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Accounts */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ArrowUpRight size={18} color="var(--pf-accent)" />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Аккаунты FunPay</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(59,130,246,0.08)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.14)' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>
                      {acc.avatar}
                    </div>
                    <span style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', background: acc.online ? '#22c55e' : '#6b7280', border: '2px solid var(--pf-surface)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{acc.username}</div>
                    <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px' }}>{acc.lotsCount} лотов • ⭐ {acc.rating}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#22c55e' }}>{acc.balance.toLocaleString('ru-RU')}₽</div>
                    <div style={{ color: 'var(--pf-text-muted)', fontSize: '11px' }}>{acc.sales} продаж</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Chats */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <MessageCircle size={18} color="var(--pf-accent)" />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Новые сообщения</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {recentChats.map(chat => (
                <div key={chat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: chat.accountId === 'acc1' ? 'linear-gradient(135deg, var(--pf-accent), var(--pf-accent-2))' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                    {chat.buyerAvatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{chat.buyer}</span>
                      <span style={{ color: 'var(--pf-text-muted)', fontSize: '11px' }}>{chat.lastTime}</span>
                    </div>
                    <div style={{ color: 'var(--pf-text-muted)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.lastMessage}</div>
                  </div>
                  {chat.unread > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '2px 7px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      {chat.unread}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/platform/chats')} style={{ ...BTN_PRIMARY, width: '100%' }}>
              Перейти в чаты
            </button>
          </div>

          {/* Quick Actions */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={18} color="var(--pf-accent)" />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Быстрые действия</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button style={{ ...BTN_PRIMARY, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '10px 16px' }}>
                <ArrowUpRight size={16} />
                Поднять все лоты
              </button>
              <button style={{
                background: 'transparent',
                color: 'var(--pf-text-muted)',
                border: '1px solid rgba(96,165,250,0.4)',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
              }}>
                <MessageSquare size={16} />
                Включить автоответы
              </button>
              <button style={{
                background: 'transparent',
                color: 'var(--pf-text-muted)',
                border: '1px solid rgba(96,165,250,0.4)',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
              }}>
                <Gift size={16} />
                Выдать товары
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
