'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Square, SquareStack } from 'lucide-react';
import { adminApi, AdminRunner, BackgroundOperation } from '@/lib/api';
import { operationFailure, waitForBackgroundOperation } from '@/lib/backgroundOperations';
import BlockingOperationOverlay from '@/platform2/components/BlockingOperationOverlay';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';
import Badge from '@/platform2/components/ui/badge/Badge';
import Button from '@/platform2/components/ui/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/platform2/components/ui/table';

function StateBadge({ active }: { active: boolean }) {
  return (
    <Badge variant="light" color={active ? 'success' : 'light'} size="sm">
      {active ? 'Активен' : 'Остановлен'}
    </Badge>
  );
}

const ADMIN_RUNNER_OPERATION_STORAGE_KEY = 'fpcloud:admin-runners:active-operation';

export default function AdminRunnersPage() {
  const [items, setItems] = useState<AdminRunner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [activeOperation, setActiveOperation] = useState<BackgroundOperation | null>(null);
  const [operationTitle, setOperationTitle] = useState('');
  const operationRestoreStarted = useRef(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.runners();
      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки воркеров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const monitorOperation = async (initial: BackgroundOperation, title: string) => {
    setOperationTitle(title);
    setActiveOperation(initial);
    window.sessionStorage.setItem(ADMIN_RUNNER_OPERATION_STORAGE_KEY, JSON.stringify({ id: initial.id, title }));
    try {
      return await waitForBackgroundOperation(initial, adminApi.runnerOperation, setActiveOperation);
    } finally {
      setActiveOperation(null);
      setOperationTitle('');
      window.sessionStorage.removeItem(ADMIN_RUNNER_OPERATION_STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (operationRestoreStarted.current) return;
    operationRestoreStarted.current = true;
    const raw = window.sessionStorage.getItem(ADMIN_RUNNER_OPERATION_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { id?: string; title?: string };
      if (!saved.id) return;
      adminApi.runnerOperation(saved.id)
        .then((operation) => monitorOperation(operation, saved.title || 'Запускаем Runner'))
        .then(async (operation) => {
          if (operation.status === 'failed' || operation.status === 'interrupted') throw operationFailure(operation);
          await load();
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось восстановить операцию'));
    } catch {
      window.sessionStorage.removeItem(ADMIN_RUNNER_OPERATION_STORAGE_KEY);
    }
  }, []);

  const stopAll = async () => {
    try {
      setBulkActionLoading(true);
      await adminApi.stopAllRunners();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка остановки воркеров');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const startAll = async () => {
    try {
      setBulkActionLoading(true);
      const started = await adminApi.startAllRunners();
      const completed = await monitorOperation(started.operation, 'Запускаем все Runner');
      if (completed.status === 'failed' || completed.status === 'interrupted') throw operationFailure(completed);
      if (completed.status === 'partially_succeeded') setError(completed.error_message || 'Часть Runner не запущена');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка запуска воркеров');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const stop = async (accountID: number) => {
    try {
      await adminApi.stopRunner(accountID);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка остановки воркера');
    }
  };

  const start = async (accountID: number) => {
    try {
      const started = await adminApi.restartRunner(accountID);
      const completed = await monitorOperation(started.operation, 'Запускаем Runner');
      if (completed.status !== 'succeeded') throw operationFailure(completed);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка запуска воркера');
    }
  };

  const hasAnyActive = items.some(i => i.runner_active || i.keeper_active);

  return (
    <div className="space-y-5">
      {activeOperation && <BlockingOperationOverlay operation={activeOperation} title={operationTitle} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Runtime воркеры</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Автообновление каждые 10 секунд.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          startIcon={hasAnyActive ? <SquareStack size={15} /> : <Play size={15} />}
          onClick={hasAnyActive ? stopAll : startAll}
          disabled={bulkActionLoading}
          className={hasAnyActive ? 'border-error-300 text-error-600 hover:bg-error-50 dark:border-error-500/40 dark:text-error-400' : ''}
        >
          {hasAnyActive ? 'Остановить всё' : 'Запустить всё'}
        </Button>
      </div>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  {['Аккаунт', 'Пользователь', 'Runner', 'Keeper', 'Запущен', 'Последнее событие', 'Действия'].map(h => (
                    <TableCell key={h} isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      Нет активных runtime-аккаунтов
                    </TableCell>
                  </TableRow>
                )}
                {items.map(item => {
                  const isActive = item.runner_active || item.keeper_active;
                  return (
                    <TableRow key={item.account_id}>
                      <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">#{item.account_id} · {item.username || '—'}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.user_id}</TableCell>
                      <TableCell className="px-4 py-3"><StateBadge active={item.runner_active} /></TableCell>
                      <TableCell className="px-4 py-3"><StateBadge active={item.keeper_active} /></TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{item.started_at ? new Date(item.started_at).toLocaleString('ru-RU') : '—'}</TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{item.last_event_at ? new Date(item.last_event_at).toLocaleString('ru-RU') : '—'}</TableCell>
                      <TableCell className="px-4 py-3">
                        {isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<Square className="h-3 w-3" />}
                            onClick={() => stop(item.account_id)}
                            className="border-error-200 text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
                          >
                            Выключить
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<Play className="h-3 w-3" />}
                            onClick={() => start(item.account_id)}
                            className="border-success-200 text-success-700 hover:bg-success-50 dark:border-success-500/30 dark:text-success-400 dark:hover:bg-success-500/10"
                          >
                            Включить
                          </Button>
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
    </div>
  );
}
