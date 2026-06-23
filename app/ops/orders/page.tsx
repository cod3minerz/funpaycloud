'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi, AdminOrder } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Badge from '@/platform2/components/ui/badge/Badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/platform2/components/ui/table';
import Input from '@/platform2/components/form/input/InputField';
import Pagination from '@/platform2/components/tables/Pagination';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 50;

const STATUS_LABELS: Record<number, string> = { 0: 'Оплачен', 1: 'Завершён', 2: 'Возврат' };
const STATUS_COLORS: Record<number, 'warning' | 'success' | 'error'> = { 0: 'warning', 1: 'success', 2: 'error' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPrice(price: number) {
  return price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [accountId, setAccountId] = useState('');
  const [draftAccountId, setDraftAccountId] = useState('');
  const [status, setStatus] = useState<string>('-1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const load = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof adminApi.orders>[0] = { page: p, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (accountId) params.account_id = parseInt(accountId);
      if (status !== '-1') params.status = parseInt(status);
      const data = await adminApi.orders(params);
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page, search, accountId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilters() {
    setSearch(draftSearch);
    setAccountId(draftAccountId);
    setPage(1);
  }

  function openChat(order: AdminOrder) {
    router.push(`/ops/chats?account_id=${order.funpay_account_id}&buyer=${encodeURIComponent(order.buyer_username)}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Заказы</h1>
        <span className="text-sm text-gray-400">{total.toLocaleString('ru-RU')} всего</span>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Поиск (покупатель / ID заказа)</label>
              <Input
                placeholder="Поиск..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Account ID</label>
              <Input
                placeholder="Все аккаунты"
                value={draftAccountId}
                onChange={(e) => setDraftAccountId(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Статус</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="-1">Все</option>
                <option value="0">Оплачен</option>
                <option value="1">Завершён</option>
                <option value="2">Возврат</option>
              </select>
            </div>
            <button
              onClick={applyFilters}
              className="h-11 rounded-xl bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Применить
            </button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="rounded-xl bg-error-50 p-4 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{error}</div>}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="pl-5">ID / Заказ FP</TableCell>
                  <TableCell isHeader>Аккаунт</TableCell>
                  <TableCell isHeader>Покупатель</TableCell>
                  <TableCell isHeader>Товар</TableCell>
                  <TableCell isHeader>Цена</TableCell>
                  <TableCell isHeader>Статус</TableCell>
                  <TableCell isHeader>AI</TableCell>
                  <TableCell isHeader>Дата</TableCell>
                  <TableCell isHeader className="pr-5">{''}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-gray-400">Загрузка...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-gray-400">Заказов не найдено</TableCell>
                  </TableRow>
                ) : orders.map((o) => (
                  <TableRow key={o.id} className="group">
                    <TableCell className="pl-5">
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400">#{o.id}</div>
                      <div className="text-xs text-gray-400">{o.funpay_order_id}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{o.funpay_account_id}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{o.buyer_username || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 max-w-[200px]">{o.description || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">{formatPrice(o.price)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge color={STATUS_COLORS[o.status] ?? 'light'} size="sm">
                        {STATUS_LABELS[o.status] ?? `Status ${o.status}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {o.ai_message_count > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                          🤖 {o.ai_message_count}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(o.created_at)}</span>
                    </TableCell>
                    <TableCell className="pr-5">
                      <button
                        onClick={() => openChat(o)}
                        className="text-xs text-brand-500 hover:text-brand-600 hover:underline transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Чат →
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pages > 1 && (
            <div className="border-t border-gray-100 p-4 dark:border-gray-800">
              <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
