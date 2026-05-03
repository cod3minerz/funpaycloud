'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { adminApi, AdminSharedProxy } from '@/lib/api';

type FormState = {
  host: string;
  port: string;
  username: string;
  password: string;
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS5';
};

const initialForm: FormState = {
  host: '',
  port: '',
  username: '',
  password: '',
  protocol: 'HTTP',
};

export default function AdminProxiesPage() {
  const [items, setItems] = useState<AdminSharedProxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.sharedProxies();
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить shared прокси');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    const host = form.host.trim();
    const port = Number(form.port);
    if (!host || !Number.isFinite(port) || port <= 0 || port > 65535) {
      setError('Укажите корректные host и port');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminApi.addSharedProxy({
        host,
        port,
        username: form.username.trim() || undefined,
        password: form.password.trim() || undefined,
        protocol: form.protocol,
      });
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить прокси');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Shared прокси</h1>
        <p className="text-sm text-slate-400">
          Бесплатный пул для пользователей. На один прокси можно назначить ограниченное число аккаунтов.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Добавить shared прокси</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
            placeholder="host"
            value={form.host}
            onChange={event => setForm(prev => ({ ...prev, host: event.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
            placeholder="port"
            value={form.port}
            onChange={event => setForm(prev => ({ ...prev, port: event.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
            placeholder="username (опционально)"
            value={form.username}
            onChange={event => setForm(prev => ({ ...prev, username: event.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
            placeholder="password (опционально)"
            value={form.password}
            onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))}
          />
          <select
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
            value={form.protocol}
            onChange={event => setForm(prev => ({ ...prev, protocol: event.target.value as FormState['protocol'] }))}
          >
            <option value="HTTP">HTTP</option>
            <option value="HTTPS">HTTPS</option>
            <option value="SOCKS5">SOCKS5</option>
          </select>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Добавить в бесплатный пул
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Текущий пул</h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-slate-300" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">Shared прокси пока не добавлены.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">Номер</th>
                  <th className="pb-2 pr-3">Адрес</th>
                  <th className="pb-2 pr-3">Protocol</th>
                  <th className="pb-2 pr-3">Загрузка</th>
                  <th className="pb-2 pr-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map(item => (
                  <tr key={item.id} className="text-slate-200">
                    <td className="py-2 pr-3 font-medium">#{item.shared_number}</td>
                    <td className="py-2 pr-3">
                      {item.host}:{item.port}
                    </td>
                    <td className="py-2 pr-3">{item.protocol}</td>
                    <td className="py-2 pr-3">
                      {item.used_accounts}/{item.max_accounts}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          item.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
