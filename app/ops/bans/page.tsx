'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApi, AdminBan } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';
import Button from '@/platform2/components/ui/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/platform2/components/ui/table';
import Input from '@/platform2/components/form/input/InputField';
import { Select } from '@/platform2/components/form/Select';
import Label from '@/platform2/components/form/Label';
import Pagination from '@/platform2/components/tables/Pagination';

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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ban-list</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Управление ручными блокировками email / ip / username / golden_key.</p>
      </div>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={addBan}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label>Тип</Label>
                <Select
                  value={form.type}
                  onChange={val => setForm(prev => ({ ...prev, type: val }))}
                >
                  <option value="email">email</option>
                  <option value="ip">ip</option>
                  <option value="telegram_id">telegram_id</option>
                  <option value="golden_key">golden_key</option>
                  <option value="funpay_username">funpay_username</option>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Значение</Label>
                <Input
                  placeholder="value"
                  value={form.value}
                  onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Причина</Label>
                <Input
                  placeholder="optional"
                  value={form.reason}
                  onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={() => {}} className="w-full md:w-auto">
                Добавить в ban-list
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Тип</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Значение</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Причина</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Дата</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Действие</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      Ban-list пуст
                    </TableCell>
                  </TableRow>
                )}
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.type}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 break-all">{item.value}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.reason || '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(item.created_at).toLocaleString('ru-RU')}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeBan(item.id)}
                        className="border-error-200 text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
                      >
                        Разбанить
                      </Button>
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
