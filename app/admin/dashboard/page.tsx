'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bug, Package, Users } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi, AdminLog, AdminMetric, AdminStats } from '@/lib/api';

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [history, setHistory] = useState<AdminMetric[]>([]);
  const [alerts, setAlerts] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, metricsData, errorLogsData, warningLogsData] = await Promise.all([
          adminApi.stats(),
          adminApi.metrics('24h'),
          adminApi.logs({ level: 'error', page: 1, limit: 10 }),
          adminApi.logs({ level: 'warning', page: 1, limit: 10 }),
        ]);
        if (!active) return;
        setStats(statsData);
        setHistory(metricsData.history || []);
        const merged = [...(errorLogsData.logs || []), ...(warningLogsData.logs || [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
        setAlerts(merged);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить dashboard');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const chartData = useMemo(
    () =>
      history.map(item => ({
        time: formatTime(item.recorded_at),
        goroutines: item.goroutines,
        requests: item.api_requests_per_min,
        errors: item.errors_per_min,
      })),
    [history],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Оперативное состояние платформы и ошибки в реальном времени.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Пользователей" value={stats?.users_total ?? 0} icon={<Users size={16} />} loading={loading} />
        <StatCard title="Активных горутин" value={stats?.active_goroutines ?? 0} icon={<Bug size={16} />} loading={loading} />
        <StatCard title="Ошибок за час" value={stats?.errors_last_hour ?? 0} icon={<AlertTriangle size={16} />} loading={loading} />
        <StatCard title="Заказов сегодня" value={stats?.orders_today ?? 0} icon={<Package size={16} />} loading={loading} />
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Метрики за 24 часа</h2>
          <p className="text-xs text-slate-400">Горутины, запросы/мин и ошибки/мин</p>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  color: '#e2e8f0',
                }}
              />
              <Line type="monotone" dataKey="goroutines" stroke="#60a5fa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="requests" stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="errors" stroke="#f87171" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Последние ошибки</h2>
        </div>
        <div className="space-y-2">
          {alerts.length === 0 && <p className="text-sm text-slate-400">Пока нет ошибок уровня error.</p>}
          {alerts.map(log => (
            <div key={log.id} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>
                  {new Date(log.created_at).toLocaleString('ru-RU')} · {log.category}
                </span>
                <span className="text-red-300">{log.level}</span>
              </div>
              <p className="mt-1 text-sm text-red-200">{log.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">{icon}</div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{loading ? '…' : value.toLocaleString('ru-RU')}</p>
    </div>
  );
}
