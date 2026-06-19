'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi, AdminMonitoring } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';

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
  if (value >= criticalAt) return 'text-error-600 dark:text-error-400';
  if (value >= warnAt) return 'text-warning-600 dark:text-warning-400';
  return 'text-success-600 dark:text-success-500';
}

function MetricCard({ title, value, helper, valueClass = 'text-gray-900 dark:text-white' }: {
  title: string;
  value: string;
  helper?: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
        {helper && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{helper}</p>}
      </CardContent>
    </Card>
  );
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
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const updatedAt = useMemo(() => {
    if (!data?.timestamp) return '—';
    return new Date(data.timestamp).toLocaleString('ru-RU');
  }, [data?.timestamp]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Мониторинг</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Данные из Prometheus. Автообновление каждые 30 секунд.</p>
      </div>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard title="CPU" value={loading || !data ? '…' : `${data.server.cpu_percent.toFixed(1)}%`}
          valueClass={data ? metricColor(data.server.cpu_percent, 65, 85) : ''} helper="Avg idle rate (5m)" />
        <MetricCard title="RAM" value={loading || !data ? '…' : `${data.server.ram_percent.toFixed(1)}%`}
          valueClass={data ? metricColor(data.server.ram_percent, 75, 90) : ''} helper="node_memory" />
        <MetricCard title="Диск" value={loading || !data ? '…' : `${data.server.disk_percent.toFixed(1)}%`}
          valueClass={data ? metricColor(data.server.disk_percent, 80, 92) : ''} helper="mount /" />
        <MetricCard title="Uptime" value={loading || !data ? '…' : formatUptime(data.server.uptime_seconds)}
          valueClass="text-brand-500" helper={loading ? '—' : `обновлено ${updatedAt}`} />
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">HTTP метрики (backend)</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Источник: /metrics → funpaycloud_http_*</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard title="Запросов за час"
              value={loading || !data ? '…' : data.requests.total_last_hour.toLocaleString('ru-RU')} />
            <MetricCard title="Ошибок за час"
              value={loading || !data ? '…' : data.requests.errors_last_hour.toLocaleString('ru-RU')}
              valueClass={data && data.requests.errors_last_hour > 0 ? 'text-error-600 dark:text-error-400' : 'text-success-600 dark:text-success-500'} />
            <MetricCard title="Средняя задержка"
              value={loading || !data ? '…' : `${data.requests.avg_response_time_ms.toFixed(0)} мс`}
              valueClass={data ? metricColor(data.requests.avg_response_time_ms, 250, 600) : ''} />
          </div>
        </CardContent>
      </Card>

      <Alert
        variant="info"
        title="Grafana"
        message="Для детальных графиков используйте Grafana"
        showLink
        linkHref="https://monitoring.funpay.cloud"
        linkText="monitoring.funpay.cloud"
      />
    </div>
  );
}
