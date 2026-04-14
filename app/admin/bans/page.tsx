'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApi, AdminBan } from '@/lib/api';

export default function AdminBansPage() {
  const [items, setItems] = useState<AdminBan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [form, setForm] = useState({ type: 'email', value: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pages = Math.max(1, Math.ceil(total / limit));

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.bans({ page, limit });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки ban-листа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const addBan = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.value.trim()) return;
    try {
      await adminApi.addBan({ type: form.type, value: form.value.trim(), reason: form.reason.trim() });
      setForm({ type: form.type, value: '', reason: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления в ban-list');
    }
  };

  const removeBan = async (id: number) => {
    try {
      await adminApi.deleteBan(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления записи');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Ban-list</h1>
        <p className="text-sm text-slate-400">Управление ручными блокировками email / ip / username / golden_key.</p>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <form onSubmit={addBan} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-4">
        <label className="text-xs text-slate-400">
          Тип
          <select
            value={form.type}
            onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
            className="mt-1 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="email">email</option>
            <option value="ip">ip</option>
            <option value="telegram_id">telegram_id</option>
            <option value="golden_key">golden_key</option>
            <option value="funpay_username">funpay_username</option>
          </select>
        </label>

        <label className="text-xs text-slate-400 md:col-span-2">
          Значение
          <input
            value={form.value}
            onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
            className="mt-1 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
            placeholder="value"
            required
          />
        </label>

        <label className="text-xs text-slate-400">
          Причина
          <input
            value={form.reason}
            onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
            className="mt-1 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
            placeholder="optional"
          />
        </label>

        <button
          type="submit"
          className="h-10 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 md:col-span-4"
        >
          Добавить в ban-list
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Тип</th>
              <th className="px-3 py-2 text-left">Значение</th>
              <th className="px-3 py-2 text-left">Причина</th>
              <th className="px-3 py-2 text-left">Дата</th>
              <th className="px-3 py-2 text-left">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {!loading && items.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>
                  Ban-list пуст
                </td>
              </tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="text-slate-200">
                <td className="px-3 py-2">{item.type}</td>
                <td className="px-3 py-2 break-all">{item.value}</td>
                <td className="px-3 py-2">{item.reason || '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('ru-RU')}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeBan(item.id)}
                    className="h-8 rounded-md border border-red-500/30 px-2 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Разбанить
                  </button>
                </td>
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
