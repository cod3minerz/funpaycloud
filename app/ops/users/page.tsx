'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi, AdminLog, AdminUser } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';
import Badge from '@/platform2/components/ui/badge/Badge';
import Button from '@/platform2/components/ui/button/Button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/platform2/components/ui/table';
import Input from '@/platform2/components/form/input/InputField';
import Pagination from '@/platform2/components/tables/Pagination';

const PAGE_SIZE = 20;
const plans = ['trial', 'lite', 'pro', 'ultra'];

type UserDetails = {
  user: AdminUser;
  accounts: Array<Record<string, unknown>>;
  logs: AdminLog[];
};

function planBadgeColor(plan: string): 'success' | 'warning' | 'primary' | 'light' {
  if (plan === 'pro') return 'success';
  if (plan === 'ultra') return 'primary';
  if (plan === 'lite') return 'warning';
  return 'light';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUserID, setSelectedUserID] = useState<number | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.users({ page, limit: PAGE_SIZE, search });
      setUsers(data.users || []);
      setTotal(data.total || 0);
      if (selectedUserID && !(data.users || []).some(u => u.id === selectedUserID)) {
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
    if (selectedUserID) loadDetails(selectedUserID);
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Управление тарифами, просмотры аккаунтов и блокировки.
        </p>
      </div>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        {/* Users list */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Поиск по email"
                value={search}
                onChange={e => { setPage(1); setSearch(e.target.value); }}
              />
              <Button variant="outline" onClick={() => { setSearch(''); setPage(1); }}>
                Сброс
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <Table className="divide-y divide-gray-200 text-sm dark:divide-gray-800">
                <TableHeader className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  <TableRow>
                    <TableCell isHeader className="px-3 py-2.5">ID</TableCell>
                    <TableCell isHeader className="px-3 py-2.5">Email</TableCell>
                    <TableCell isHeader className="px-3 py-2.5">Тариф</TableCell>
                    <TableCell isHeader className="px-3 py-2.5">Аккаунтов</TableCell>
                    <TableCell isHeader className="px-3 py-2.5">Регистрация</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {!loading && users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="px-3 py-6 text-center text-gray-400 dark:text-gray-500">
                        Пользователи не найдены
                      </TableCell>
                    </TableRow>
                  )}
                  {users.map(user => (
                    <tr
                      key={user.id}
                      className={`cursor-pointer border-b border-gray-100 text-gray-700 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800/60 ${
                        selectedUserID === user.id ? 'bg-brand-50 dark:bg-brand-500/10' : ''
                      }`}
                      onClick={() => setSelectedUserID(user.id)}
                    >
                      <td className="px-3 py-2 align-middle text-sm">{user.id}</td>
                      <td className="px-3 py-2 align-middle text-sm">{user.email}</td>
                      <td className="px-3 py-2 align-middle">
                        <Badge variant="light" color={planBadgeColor(user.plan)} size="sm">
                          {user.plan}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-middle text-sm">{user.accounts_count}</td>
                      <td className="px-3 py-2 align-middle text-xs text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Всего: {total}</span>
              <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
            </div>
          </CardContent>
        </Card>

        {/* User details */}
        <Card>
          <CardContent className="space-y-4 p-4">
            {!selectedUserID && (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Выберите пользователя, чтобы посмотреть детали.
              </p>
            )}

            {selectedUserID && detailsLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Загрузка деталей...</p>
            )}

            {selectedUserID && details && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{details.user.email}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: {details.user.id}</p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Тариф</p>
                  <div className="grid grid-cols-2 gap-2">
                    {plans.map(plan => (
                      <Button
                        key={plan}
                        variant="outline"
                        size="sm"
                        onClick={() => updatePlan(details.user.id, plan)}
                        className={details.user.plan === plan
                          ? 'border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-300'
                          : ''}
                      >
                        {plan}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => banUser(details.user.id)}
                    className="border-error-200 text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
                  >
                    Заблокировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unbanUser(details.user.id)}
                    className="border-success-200 text-success-700 hover:bg-success-50 dark:border-success-500/30 dark:text-success-400 dark:hover:bg-success-500/10"
                  >
                    Снять блок
                  </Button>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Аккаунты FunPay</h3>
                  <div className="space-y-1.5">
                    {details.accounts.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">Нет аккаунтов</p>
                    )}
                    {details.accounts.map((account, index) => (
                      <div
                        key={`${account.id ?? index}`}
                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        #{String(account.id)} · {String(account.username ?? '—')} · {Boolean(account.is_active) ? 'active' : 'inactive'}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Последние логи</h3>
                  <div className="max-h-56 space-y-1.5 overflow-auto pr-1">
                    {details.logs.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">Нет логов</p>
                    )}
                    {details.logs.map(log => (
                      <div
                        key={log.id}
                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                      >
                        <p className="text-gray-400 dark:text-gray-500">
                          {new Date(log.created_at).toLocaleString('ru-RU')} · {log.level}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
