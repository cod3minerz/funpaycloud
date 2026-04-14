'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { adminApi, AdminLog } from '@/lib/api';

type LevelFilter = '' | 'info' | 'warning' | 'error';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<LevelFilter>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pages = Math.max(1, Math.ceil(total / limit));

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.logs({ category, level, page, limit });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, level, page]);

  const levelClass = useMemo(
    () => ({
      info: 'text-slate-300 bg-slate-700/50 border-slate-600/60',
      warning: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
      error: 'text-red-300 bg-red-500/10 border-red-500/30',
    }),
    [],
  );

  const exportCsv = async () => {
    try {
      const response = await adminApi.logsCsv({ category, level });
      if (!response.ok) {
        throw new Error('Не удалось выгрузить CSV');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка экспорта');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Системные логи</h1>
          <p className="text-sm text-slate-400">Фильтры по категории и уровню, пагинация, экспорт CSV.</p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 hover:border-blue-500/40 hover:text-blue-300"
        >
          <Download size={16} />
          Экспорт CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 md:grid-cols-3">
        <label className="text-xs text-slate-400">
          Категория
          <input
            value={category}
            onChange={e => {
              setPage(1);
              setCategory(e.target.value);
            }}
            className="mt-1 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
            placeholder="auth, order, chat..."
          />
        </label>

        <label className="text-xs text-slate-400">
          Уровень
          <select
            value={level}
            onChange={e => {
              setPage(1);
              setLevel(e.target.value as LevelFilter);
            }}
            className="mt-1 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="">Все</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            setCategory('');
            setLevel('');
            setPage(1);
          }}
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-300 hover:border-slate-500"
        >
          Сбросить фильтры
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2">Время</th>
              <th className="px-3 py-2">Уровень</th>
              <th className="px-3 py-2">Категория</th>
              <th className="px-3 py-2">Аккаунт</th>
              <th className="px-3 py-2">Сообщение</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>
                  Логи не найдены
                </td>
              </tr>
            )}

            {logs.map(log => (
              <tr key={log.id} className="align-top text-slate-200">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${levelClass[log.level as keyof typeof levelClass] || levelClass.info}`}>
                    {log.level}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-300">{log.category}</td>
                <td className="px-3 py-2 text-xs text-slate-300">{log.funpay_account_id || '—'}</td>
                <td className="px-3 py-2 text-sm text-slate-200">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Всего: {total} · Страница {page} из {pages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="h-9 rounded-md border border-slate-700 px-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Назад
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage(prev => Math.min(pages, prev + 1))}
            className="h-9 rounded-md border border-slate-700 px-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Вперёд
          </button>
        </div>
      </div>
    </div>
  );
}
