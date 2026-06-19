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

  const exportCsv = async () => {
    try {
      const response = await adminApi.logsCsv({ category, level });
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Системные логи</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Фильтры по категории и уровню, пагинация, экспорт CSV.</p>
        </div>
        <Button variant="outline" size="sm" startIcon={<Download size={15} />} onClick={exportCsv}>
          Экспорт CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Категория</Label>
              <Input
                placeholder="auth, order, chat..."
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
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={() => { setCategory(''); setLevel(''); setPage(1); }}>
                Сбросить фильтры
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
                  {['Время', 'Уровень', 'Категория', 'Аккаунт', 'Сообщение'].map(h => (
                    <TableCell key={h} isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      Логи не найдены
                    </TableCell>
                  </TableRow>
                )}
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleString('ru-RU')}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="light" color={levelColor[log.level] ?? 'light'} size="sm">
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{log.category}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{log.funpay_account_id || '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{log.message}</TableCell>
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
