'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Square, SquareStack } from 'lucide-react';
import { adminApi, AdminRunner } from '@/lib/api';

function StateBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-red-400'}`} />
      {active ? 'Активен' : 'Остановлен'}
    </span>
  );
}

export default function AdminRunnersPage() {
  const [items, setItems] = useState<AdminRunner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.runners();
      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки воркеров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const stopAll = async () => {
    try {
      await adminApi.stopAllRunners();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка остановки воркеров');
    }
  };

  const stop = async (accountID: number) => {
    try {
      await adminApi.stopRunner(accountID);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка остановки воркера');
    }
  };

  const restart = async (accountID: number) => {
    try {
      await adminApi.restartRunner(accountID);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка перезапуска воркера');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Runtime воркеры</h1>
          <p className="text-sm text-slate-400">Автообновление каждые 10 секунд.</p>
        </div>
        <button
          type="button"
          onClick={stopAll}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 text-sm text-red-200 hover:bg-red-500/20"
        >
          <SquareStack size={16} />
          Остановить всё
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Аккаунт</th>
              <th className="px-3 py-2 text-left">Пользователь</th>
              <th className="px-3 py-2 text-left">Runner</th>
              <th className="px-3 py-2 text-left">Keeper</th>
              <th className="px-3 py-2 text-left">Raiser</th>
              <th className="px-3 py-2 text-left">Запущен</th>
              <th className="px-3 py-2 text-left">Последнее событие</th>
              <th className="px-3 py-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {!loading && items.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                  Нет активных runtime-аккаунтов
                </td>
              </tr>
            )}

            {items.map(item => (
              <tr key={item.account_id} className="align-top text-slate-200">
                <td className="px-3 py-2">#{item.account_id} · {item.username || '—'}</td>
                <td className="px-3 py-2 text-slate-300">{item.user_id}</td>
                <td className="px-3 py-2"><StateBadge active={item.runner_active} /></td>
                <td className="px-3 py-2"><StateBadge active={item.keeper_active} /></td>
                <td className="px-3 py-2"><StateBadge active={item.raiser_active} /></td>
                <td className="px-3 py-2 text-xs text-slate-400">{item.started_at ? new Date(item.started_at).toLocaleString('ru-RU') : '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-400">{item.last_event_at ? new Date(item.last_event_at).toLocaleString('ru-RU') : '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => stop(item.account_id)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-700 px-2 text-xs text-slate-200 hover:border-red-500/40 hover:text-red-300"
                    >
                      <Square size={12} /> Стоп
                    </button>
                    <button
                      type="button"
                      onClick={() => restart(item.account_id)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-700 px-2 text-xs text-slate-200 hover:border-blue-500/40 hover:text-blue-300"
                    >
                      <RotateCcw size={12} /> Рестарт
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
