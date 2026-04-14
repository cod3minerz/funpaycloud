'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi, AdminLog, AdminUser } from '@/lib/api';

const plans = ['trial', 'lite', 'pro', 'ultra'];

type UserDetails = {
  user: AdminUser;
  accounts: Array<Record<string, unknown>>;
  logs: AdminLog[];
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedUserID, setSelectedUserID] = useState<number | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.users({ page, limit, search });
      setUsers(data.users || []);
      setTotal(data.total || 0);
      if (selectedUserID && !(data.users || []).some(user => user.id === selectedUserID)) {
        setSelectedUserID(null);
        setDetails(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (userID: number) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const data = await adminApi.userDetail(userID);
      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных пользователя');
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    if (selectedUserID) {
      loadDetails(selectedUserID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserID]);

  const updatePlan = async (userID: number, plan: string) => {
    try {
      await adminApi.updatePlan(userID, plan);
      await Promise.all([loadUsers(), selectedUserID === userID ? loadDetails(userID) : Promise.resolve()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить тариф');
    }
  };

  const banUser = async (userID: number) => {
    const reason = window.prompt('Причина блокировки пользователя', 'нарушение правил') || '';
    try {
      await adminApi.banUser(userID, reason);
      await Promise.all([loadUsers(), selectedUserID === userID ? loadDetails(userID) : Promise.resolve()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось заблокировать пользователя');
    }
  };

  const unbanUser = async (userID: number) => {
    try {
      await adminApi.unbanUser(userID);
      await Promise.all([loadUsers(), selectedUserID === userID ? loadDetails(userID) : Promise.resolve()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось разблокировать пользователя');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Пользователи</h1>
        <p className="text-sm text-slate-400">Управление тарифами, просмотры аккаунтов и блокировки.</p>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <input
              value={search}
              onChange={e => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Поиск по email"
              className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="h-10 shrink-0 rounded-md border border-slate-700 px-3 text-sm text-slate-300"
            >
              Сброс
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Тариф</th>
                  <th className="px-3 py-2 text-left">Аккаунтов</th>
                  <th className="px-3 py-2 text-left">Дата регистрации</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {!loading && users.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
                {users.map(user => (
                  <tr
                    key={user.id}
                    className={`cursor-pointer text-slate-200 transition-colors hover:bg-slate-800/60 ${selectedUserID === user.id ? 'bg-blue-500/10' : ''}`}
                    onClick={() => setSelectedUserID(user.id)}
                  >
                    <td className="px-3 py-2">{user.id}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">{user.plan}</td>
                    <td className="px-3 py-2">{user.accounts_count}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Всего: {total}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="h-9 rounded-md border border-slate-700 px-3 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Назад
              </button>
              <span>
                {page} / {pages}
              </span>
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

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          {!selectedUserID && <p className="text-sm text-slate-400">Выберите пользователя, чтобы посмотреть детали.</p>}

          {selectedUserID && detailsLoading && <p className="text-sm text-slate-400">Загрузка деталей...</p>}

          {selectedUserID && details && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-white">{details.user.email}</h2>
                <p className="text-xs text-slate-400">ID: {details.user.id}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {plans.map(plan => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => updatePlan(details.user.id, plan)}
                    className={`h-9 rounded-md border px-3 text-sm ${details.user.plan === plan ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-slate-700 text-slate-300 hover:border-blue-500/40'}`}
                  >
                    {plan}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => banUser(details.user.id)}
                  className="h-9 rounded-md border border-red-500/30 bg-red-500/10 px-3 text-sm text-red-300"
                >
                  Заблокировать
                </button>
                <button
                  type="button"
                  onClick={() => unbanUser(details.user.id)}
                  className="h-9 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm text-emerald-300"
                >
                  Снять блок
                </button>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">Аккаунты FunPay</h3>
                <div className="space-y-2">
                  {details.accounts.length === 0 && <p className="text-xs text-slate-500">Нет аккаунтов</p>}
                  {details.accounts.map((account, index) => (
                    <div key={`${account.id || index}`} className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                      #{String(account.id)} · {String(account.username || '—')} · {Boolean(account.is_active) ? 'active' : 'inactive'}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">Последние логи</h3>
                <div className="max-h-56 space-y-2 overflow-auto pr-1">
                  {details.logs.length === 0 && <p className="text-xs text-slate-500">Нет логов</p>}
                  {details.logs.map(log => (
                    <div key={log.id} className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                      <p className="text-slate-500">{new Date(log.created_at).toLocaleString('ru-RU')} · {log.level}</p>
                      <p>{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
