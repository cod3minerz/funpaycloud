'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { adminApi, AdminPurchase } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';
import Badge from '@/platform2/components/ui/badge/Badge';
import Button from '@/platform2/components/ui/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/platform2/components/ui/table';
import Input from '@/platform2/components/form/input/InputField';
import { Select } from '@/platform2/components/form/Select';
import Label from '@/platform2/components/form/Label';
import Pagination from '@/platform2/components/tables/Pagination';

const productLabel: Record<string, string> = {
  proxy_lite: 'Proxy Lite',
  proxy_pro: 'Proxy Pro',
  subscription_lite: 'Sub Lite',
  subscription_pro: 'Sub Pro',
  subscription_ultra: 'Sub Ultra',
};

const paymentStatusColor: Record<string, 'light' | 'success' | 'error' | 'warning'> = {
  paid: 'success',
  failed: 'error',
  pending: 'warning',
};

const provisionStatusColor: Record<string, 'light' | 'success' | 'error' | 'warning'> = {
  success: 'success',
  failed: 'error',
  pending: 'warning',
};

export default function AdminPurchasesPage() {
  const [items, setItems] = useState<AdminPurchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const [userId, setUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [provisionFilter, setProvisionFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pages = Math.max(1, Math.ceil(total / limit));

  const buildParams = () => ({
    page,
    limit,
    user_id: userId ? Number(userId) : undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    provision_status: provisionFilter || undefined,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.purchases(buildParams());
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки покупок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, dateFrom, dateTo, typeFilter, statusFilter, provisionFilter, page]);

  const exportCsv = async () => {
    try {
      const { page: _p, limit: _l, ...csvParams } = buildParams();
      const response = await adminApi.purchasesCsv(csvParams);
      if (!response.ok) throw new Error('Не удалось выгрузить CSV');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchases-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка экспорта');
    }
  };

  const resetFilters = () => {
    setUserId('');
    setDateFrom('');
    setDateTo('');
    setTypeFilter('');
    setStatusFilter('');
    setProvisionFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Покупки</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Все платежи — прокси, подписки. Всего: {total}
          </p>
        </div>
        <Button variant="outline" size="sm" startIcon={<Download size={15} />} onClick={exportCsv}>
          Экспорт CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
              <Label>Тип</Label>
              <Select value={typeFilter} onChange={val => { setPage(1); setTypeFilter(val); }}>
                <option value="">Все</option>
                <option value="proxy">Прокси</option>
                <option value="subscription">Подписка</option>
              </Select>
            </div>
            <div>
              <Label>Статус оплаты</Label>
              <Select value={statusFilter} onChange={val => { setPage(1); setStatusFilter(val); }}>
                <option value="">Все</option>
                <option value="paid">Оплачено</option>
                <option value="failed">Неуспешно</option>
                <option value="pending">В обработке</option>
              </Select>
            </div>
            <div>
              <Label>Провижнинг</Label>
              <Select value={provisionFilter} onChange={val => { setPage(1); setProvisionFilter(val); }}>
                <option value="">Все</option>
                <option value="success">Выполнен</option>
                <option value="failed">Ошибка</option>
                <option value="pending">Ожидание</option>
              </Select>
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
            <div className="flex items-end col-span-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert
          variant="error"
          title="Ошибка загрузки"
          message={`${error}${error.includes('404') || error.includes('not found') ? ' — бэкенд-эндпоинт /admin-api/billing/purchases ещё не готов' : ''}`}
        />
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  {['ID', 'Юзер', 'Аккаунт FP', 'Продукт', 'Сумма', 'Оплата', 'Провижнинг', 'Ошибка', 'Дата'].map(h => (
                    <TableCell key={h} isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      {error ? 'Ошибка загрузки' : 'Покупки не найдены'}
                    </TableCell>
                  </TableRow>
                )}
                {items.map(item => (
                  <TableRow
                    key={item.id}
                    className={item.provision_status === 'failed' ? 'bg-error-50 dark:bg-error-950/20' : ''}
                  >
                    <TableCell className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                      #{item.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      {item.user_id != null ? (
                        <a href={`/ops/users/${item.user_id}`} className="font-mono text-brand-600 hover:underline dark:text-brand-400">
                          #{item.user_id}
                        </a>
                      ) : '—'}
                      {item.user_email && (
                        <div className="mt-0.5 text-gray-400">{item.user_email}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {item.funpay_account_id != null ? (
                        <span className="font-mono">#{item.funpay_account_id}</span>
                      ) : '—'}
                      {item.funpay_username && (
                        <div className="mt-0.5 text-gray-400">{item.funpay_username}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
                      {productLabel[item.product ?? ''] || item.product || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-gray-800 dark:text-white">
                      {item.amount} {item.currency}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="light" color={paymentStatusColor[item.status] ?? 'light'} size="sm">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {item.provision_status ? (
                        <Badge variant="light" color={provisionStatusColor[item.provision_status] ?? 'light'} size="sm">
                          {item.provision_status}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] px-4 py-3 text-xs text-error-600 dark:text-error-400">
                      {item.provision_error || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.created_at).toLocaleString('ru-RU')}
                    </TableCell>
                  </TableRow>
                ))}
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
