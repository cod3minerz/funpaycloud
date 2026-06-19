'use client';

import { useEffect, useState } from 'react';
import { adminApi, FeedbackItem } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/platform2/components/ui/table';
import Pagination from '@/platform2/components/tables/Pagination';

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminTicketsPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listFeedback({ type: 'bug', page, limit: PAGE_SIZE });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [page]);

  const handleSelect = async (item: FeedbackItem) => {
    if (selected?.id === item.id) return;
    setDetailLoading(true);
    try {
      const data = await adminApi.getFeedback(item.id);
      setSelected(data);
      setItems(prev => prev.map(i => i.id === data.id ? { ...i, is_read: true } : i));
    } catch {
      setSelected({ ...item, is_read: true });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Тикеты</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Сообщения об ошибках от пользователей</p>
      </div>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        {/* List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-400">Загрузка...</div>
            ) : (
              <Table className="divide-y divide-gray-200 text-sm dark:divide-gray-800">
                <TableHeader className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  <TableRow>
                    <TableCell isHeader className="w-8 px-3 py-2.5">{null}</TableCell>
                    <TableCell isHeader className="px-3 py-2.5">Заголовок</TableCell>
                    <TableCell isHeader className="px-3 py-2.5">Telegram</TableCell>
                    <TableCell isHeader className="px-3 py-2.5">Дата</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-3 py-10 text-center text-gray-400 dark:text-gray-500">
                        Тикетов пока нет
                      </TableCell>
                    </TableRow>
                  ) : items.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected?.id === item.id ? 'bg-brand-50/40 dark:bg-brand-500/5' : ''}`}
                    >
                      <TableCell className="px-3 py-3">
                        {!item.is_read && (
                          <span className="block h-2 w-2 rounded-full bg-error-500" title="Новый" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate px-3 py-3 font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-gray-500 dark:text-gray-400">
                        {item.telegram || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-3 text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(item.created_at)}
                      </TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            )}
            {total > PAGE_SIZE && (
              <div className="border-t border-gray-200 p-3 dark:border-gray-800">
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(total / PAGE_SIZE)}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail */}
        <Card>
          <CardContent className="p-5">
            {detailLoading ? (
              <div className="py-10 text-center text-sm text-gray-400">Загрузка...</div>
            ) : selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Заголовок</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{selected.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Описание</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{selected.description}</p>
                </div>
                {selected.telegram && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Telegram</p>
                    <p className="mt-1 text-sm text-brand-600 dark:text-brand-400">{selected.telegram}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {selected.user_id && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Пользователь</p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">#{selected.user_id}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">IP адрес</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selected.ip_address || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Дата</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatDate(selected.created_at)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Выберите тикет для просмотра
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
