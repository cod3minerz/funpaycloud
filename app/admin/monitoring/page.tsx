'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi, AdminMonitoring } from '@/lib/api';

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0м';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
}

function metricColor(value: number, warnAt = 70, criticalAt = 85) {
  if (value >= criticalAt) return 'text-red-400';
  if (value >= warnAt) return 'text-amber-300';
  return 'text-emerald-300';
}

export default function AdminMonitoringPage() {
  const [data, setData] = useState<AdminMonitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await adminApi.monitoring();
        if (!active) return;
        setData(next);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить метрики Prometheus');
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

  const updatedAt = useMemo(() => {
    if (!data?.timestamp) return '—';
    return new Date(data.timestamp).toLocaleString('ru-RU');
  }, [data?.timestamp]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Мониторинг</h1>
        <p className="text-sm text-slate-400">
          Данные из Prometheus. Автообновление каждые 30 секунд.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          title="CPU"
          value={loading || !data ? '…' : `${data.server.cpu_percent.toFixed(1)}%`}
          valueClass={data ? metricColor(data.server.cpu_percent, 65, 85) : 'text-slate-100'}
          helper="Avg idle rate (5m)"
        />
        <MetricCard
          title="RAM"
          value={loading || !data ? '…' : `${data.server.ram_percent.toFixed(1)}%`}
          valueClass={data ? metricColor(data.server.ram_percent, 75, 90) : 'text-slate-100'}
          helper="node_memory"
        />
        <MetricCard
          title="Диск"
          value={loading || !data ? '…' : `${data.server.disk_percent.toFixed(1)}%`}
          valueClass={data ? metricColor(data.server.disk_percent, 80, 92) : 'text-slate-100'}
          helper="mount /"
        />
        <MetricCard
          title="Uptime"
          value={loading || !data ? '…' : formatUptime(data.server.uptime_seconds)}
          valueClass="text-blue-300"
          helper={loading ? '—' : `обновлено ${updatedAt}`}
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-white">HTTP метрики (backend)</h2>
        <p className="mt-1 text-xs text-slate-400">Источник: /metrics → funpaycloud_http_*</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            title="Запросов за час"
            value={loading || !data ? '…' : data.requests.total_last_hour.toLocaleString('ru-RU')}
            valueClass="text-slate-100"
          />
          <MetricCard
            title="Ошибок за час"
            value={loading || !data ? '…' : data.requests.errors_last_hour.toLocaleString('ru-RU')}
            valueClass={data && data.requests.errors_last_hour > 0 ? 'text-red-300' : 'text-emerald-300'}
          />
          <MetricCard
            title="Средняя задержка"
            value={loading || !data ? '…' : `${data.requests.avg_response_time_ms.toFixed(0)} мс`}
            valueClass={data ? metricColor(data.requests.avg_response_time_ms, 250, 600) : 'text-slate-100'}
          />
        </div>
      </div>

      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
        Для детальных графиков используйте Grafana:{' '}
        <a
          href="https://monitoring.funpay.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline decoration-blue-300/70 underline-offset-4 hover:text-white"
        >
          monitoring.funpay.cloud
        </a>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  helper,
  valueClass = 'text-slate-100',
}: {
  title: string;
  value: string;
  helper?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}
