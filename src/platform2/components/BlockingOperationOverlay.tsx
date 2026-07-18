'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BackgroundOperation } from '@/lib/api';
import { BACKGROUND_OPERATION_ATTEMPT_MS } from '@/lib/backgroundOperations';

type Props = {
  operation: BackgroundOperation;
  title: string;
};

export default function BlockingOperationOverlay({ operation, title }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const blockBackgroundInteraction = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ' || event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('keydown', blockBackgroundInteraction, true);
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('keydown', blockBackgroundInteraction, true);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const progress = useMemo(() => {
    if (!operation.attempt_started_at) return 0;
    const started = new Date(operation.attempt_started_at).getTime();
    const deadline = operation.attempt_deadline_at
      ? new Date(operation.attempt_deadline_at).getTime()
      : started + BACKGROUND_OPERATION_ATTEMPT_MS;
    const duration = Math.max(1, deadline - started);
    return Math.max(0, Math.min(100, ((now - started) / duration) * 100));
  }, [now, operation.attempt_started_at, operation.attempt_deadline_at, operation.attempt]);

  const retrySeconds = operation.next_retry_at
    ? Math.max(0, Math.ceil((new Date(operation.next_retry_at).getTime() - now) / 1000))
    : 0;
  const attempt = Math.max(1, operation.attempt || 1);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-950/75 p-4 backdrop-blur-sm"
      data-testid="blocking-operation-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blocking-operation-title"
      onPointerDown={(event) => event.preventDefault()}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 text-center shadow-2xl dark:bg-gray-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" aria-hidden="true" />
        </div>
        <h2 id="blocking-operation-title" className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {operation.status === 'retry_wait'
            ? `Повтор через ${retrySeconds} сек.`
            : 'Ожидание ответа FunPay'}
        </p>
        <p className="mt-4 text-sm font-semibold text-brand-600 dark:text-brand-400" data-testid="blocking-operation-attempt">
          Попытка {attempt} из {operation.max_attempts || 3}
        </p>
        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
          role="progressbar"
          aria-label="Ожидание ответа FunPay"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(operation.status === 'retry_wait' ? 100 : progress)}
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-200 ease-linear"
            data-testid="blocking-operation-progress"
            data-duration-ms={BACKGROUND_OPERATION_ATTEMPT_MS}
            data-attempt={attempt}
            style={{ width: `${operation.status === 'retry_wait' ? 100 : progress}%` }}
          />
        </div>
        <p className="mt-4 text-xs text-gray-400">Не закрывайте страницу — действие продолжится в фоне.</p>
      </div>
    </div>
  );
}
