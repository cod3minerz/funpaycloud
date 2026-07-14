'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { adminApi, AdminLog } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';
import Badge from '@/platform2/components/ui/badge/Badge';
import Button from '@/platform2/components/ui/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/platform2/components/ui/table';
import Input from '@/platform2/components/form/input/InputField';
import { Select } from '@/platform2/components/form/Select';
import Label from '@/platform2/components/form/Label';
import Pagination from '@/platform2/components/tables/Pagination';

type LevelFilter = '' | 'info' | 'warning' | 'error';

const levelColor: Record<string, 'light' | 'warning' | 'error'> = {
  info: 'light',
  warning: 'warning',
  error: 'error',
};

const proxy6PayloadFields = [
  { key: 'error', label: 'Ошибка' },
  { key: 'count', label: 'Кол-во' },
  { key: 'price', label: 'Цена' },
  { key: 'balance', label: 'Баланс' },
  { key: 'country', label: 'Страна' },
  { key: 'version', label: 'Версия' },
] as const;

type PayloadDetail = { label: string; value: string };

function formatPayloadValue(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function proxy6PayloadDetails(log: AdminLog): PayloadDetail[] {
  if (log.category !== 'proxy6_autobuy' || !log.payload) return [];

  return proxy6PayloadFields.reduce<PayloadDetail[]>((details, field) => {
    const value = formatPayloadValue(log.payload?.[field.key]);
    if (value) details.push({ label: field.label, value });
    return details;
  }, []);
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<LevelFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userId, setUserId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pages = Math.max(1, Math.ceil(total / limit));

  const buildParams = () => ({
    category: category || undefined,
    level: level || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    user_id: userId ? Number(userId) : undefined,
    account_id: accountId ? Number(accountId) : undefined,
    page,
    limit,
  });

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.logs(buildParams());
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
  }, [category, level, dateFrom, dateTo, userId, accountId, page]);

  const exportCsv = async () => {
    try {
      const { page: _p, limit: _l, ...csvParams } = buildParams();
      const response = await adminApi.logsCsv(csvParams);
      if (!response.ok) throw new Error('Не удалось выгрузить CSV');
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

  const resetFilters = () => {
    setCategory('');
    setLevel('');
    setDateFrom('');
    setDateTo('');
    setUserId('');
    setAccountId('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Системные логи</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Фильтрация по категории, уровню, дате, пользователю. Всего: {total}</p>
        </div>
        <Button variant="outline" size="sm" startIcon={<Download size={15} />} onClick={exportCsv}>
          Экспорт CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <Label>Категория</Label>
              <Input
                placeholder="auth, proxy6_autobuy..."
                value={category}
                onChange={e => { setPage(1); setCategory(e.target.value); }}
              />
            </div>
            <div>
              <Label>Уровень</Label>
              <Select value={level} onChange={val => { setPage(1); setLevel(val as LevelFilter); }}>
                <option value="">Все</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </Select>
            </div>
            <div>
              <Label>User ID</Label>
              <Input
                type="number"
                placeholder="123"
                value={userId}
                onChange={e => { setPage(1); setUserId(e.target.value); }}
              />
            </div>
            <div>
              <Label>Account ID</Label>
              <Input
                type="number"
                placeholder="456"
                value={accountId}
                onChange={e => { setPage(1); setAccountId(e.target.value); }}
              />
            </div>
            <div>
              <Label>Дата от</Label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setPage(1); setDateFrom(e.target.value); }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <Label>Дата до</Label>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setPage(1); setDateTo(e.target.value); }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end col-span-2 md:col-span-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Сбросить все фильтры
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  {['Время', 'Уровень', 'Категория', 'User ID', 'Аккаунт', 'Сообщение'].map(h => (
                    <TableCell key={h} isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      Логи не найдены
                    </TableCell>
                  </TableRow>
                )}
                {logs.map(log => {
                  const payloadDetails = proxy6PayloadDetails(log);

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="light" color={levelColor[log.level] ?? 'light'} size="sm">
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{log.category}</TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {log.user_id != null ? (
                          <a href={`/ops/users/${log.user_id}`} className="font-mono text-brand-600 hover:underline dark:text-brand-400">
                            #{log.user_id}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{log.funpay_account_id || '—'}</TableCell>
                      <TableCell className="max-w-[720px] px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        <div className="break-words">{log.message}</div>
                        {payloadDetails.length > 0 && (
                          <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                            {payloadDetails.map(detail => (
                              <div key={detail.label} className="break-words">
                                <span className="font-medium text-gray-600 dark:text-gray-300">{detail.label}: </span>
                                <span className="font-mono">{detail.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Всего: {total}</span>
          <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
