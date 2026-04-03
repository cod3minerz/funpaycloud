'use client';

import { useMemo } from 'react';
import {
  ArrowTrendingUpIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { orders, salesData } from '@/platform/data/demoData';
import {
  P2KPI,
  P2PageHeader,
  P2Panel,
  P2PrimaryAction,
  P2SecondaryAction,
  P2Status,
  p2FormatDate,
  statusLabelByOrder,
  statusTypeByOrder,
} from '@/platform2/components/primitives';

export default function Dashboard2() {
  const periodData = useMemo(() => salesData.slice(-30), []);

  const totals = useMemo(() => {
    const revenue = periodData.reduce((sum, item) => sum + item.revenue, 0);
    const orderCount = periodData.reduce((sum, item) => sum + item.orders, 0);
    const avg = Math.round(revenue / Math.max(orderCount, 1));
    return { revenue, orderCount, avg };
  }, [periodData]);

  const recentOrders = useMemo(() => orders.slice(0, 6), []);

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader
        title="Дашборд"
        description="Операционный центр магазина: продажи, заказы и скорость обработки."
        actions={
          <>
            <P2SecondaryAction>Экспорт</P2SecondaryAction>
            <P2PrimaryAction>
              <BoltIcon className="size-4" />
              Запустить сценарий
            </P2PrimaryAction>
          </>
        }
      />

      <div className="p2-kpi-grid">
        <P2KPI label="Выручка за 30 дней" value={totals.revenue.toLocaleString('ru-RU') + ' ₽'} note="+11.8% к прошлому периоду" />
        <P2KPI label="Заказы за 30 дней" value={totals.orderCount.toLocaleString('ru-RU')} note="Без пропусков в ночные часы" />
        <P2KPI label="Средний чек" value={totals.avg.toLocaleString('ru-RU') + ' ₽'} note="Стабильный рост LTV" />
        <P2KPI label="SLA ответа" value="2.1 мин" note="92% диалогов закрываются в первый ответ" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <P2Panel title="Динамика выручки" subtitle="Последние 30 дней">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={periodData} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="p2RevenueArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(79, 134, 255, 0.34)" />
                    <stop offset="100%" stopColor="rgba(79, 134, 255, 0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(122,145,186,0.18)" />
                <XAxis dataKey="date" tick={{ fill: '#8090ab', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: '#8090ab', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--p2-surface-2)',
                    border: '1px solid var(--p2-border)',
                    borderRadius: 10,
                    color: 'var(--p2-text)',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f86ff" strokeWidth={2} fill="url(#p2RevenueArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </P2Panel>

        <P2Panel title="Оперативная лента" subtitle="Что важно сейчас" bodyClassName="space-y-2">
          {[
            { icon: ShoppingCartIcon, text: '7 новых оплаченных заказов за последний час', tone: 'warning' as const },
            { icon: ChatBubbleLeftRightIcon, text: '3 диалога требуют ответа', tone: 'danger' as const },
            { icon: ArrowTrendingUpIcon, text: 'Лот "Minecraft Java" в топ-5 категории', tone: 'success' as const },
            { icon: BoltIcon, text: 'Автовыдача работает штатно, задержек нет', tone: 'info' as const },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 flex items-start gap-3">
                <Icon className="size-4 text-[var(--p2-text-dim)] mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-[var(--p2-text)]">{item.text}</p>
                  <div className="mt-1">
                    <P2Status type={item.tone}>Обновлено сейчас</P2Status>
                  </div>
                </div>
              </div>
            );
          })}
        </P2Panel>
      </div>

      <P2Panel title="Последние заказы" subtitle="Быстрый контроль статусов и суммы">
        <div className="p2-table-wrap p2-scroll">
          <table className="p2-table">
            <thead>
              <tr>
                <th>Заказ</th>
                <th>Покупатель</th>
                <th>Лот</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Время</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td className="font-semibold">{order.id}</td>
                  <td>{order.buyer}</td>
                  <td className="max-w-[280px] truncate">{order.lot}</td>
                  <td>{order.amount.toLocaleString('ru-RU')} ₽</td>
                  <td>
                    <P2Status type={statusTypeByOrder(order.status)}>{statusLabelByOrder(order.status)}</P2Status>
                  </td>
                  <td className="text-[var(--p2-text-dim)]">{p2FormatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </P2Panel>
    </div>
  );
}
