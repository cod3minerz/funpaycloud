'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BackgroundOperation, ProxyBatchCheckResult } from '@/lib/api';

type Props = {
  operation: BackgroundOperation;
};

function detectDarkMode(): boolean {
  const scopedThemeRoot = document.querySelector<HTMLElement>('[data-p2], [data-admin]');
  if (scopedThemeRoot) return scopedThemeRoot.classList.contains('dark');
  return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
}

function readResult(operation: BackgroundOperation): ProxyBatchCheckResult {
  const source = operation.result ?? {};
  return {
    total: Number(source.total) || 0,
    processed: Number(source.processed) || 0,
    current_proxy_id: Number(source.current_proxy_id) || null,
    current_proxy_name: typeof source.current_proxy_name === 'string' ? source.current_proxy_name : '',
    current_index: Number(source.current_index) || 0,
    healthy_count: Number(source.healthy_count) || 0,
    failed_count: Number(source.failed_count) || 0,
    failed_proxy_ids: Array.isArray(source.failed_proxy_ids) ? source.failed_proxy_ids.map(Number) : [],
    failures: typeof source.failures === 'object' && source.failures ? source.failures as ProxyBatchCheckResult['failures'] : {},
    delete_eligible_count: Number(source.delete_eligible_count) || 0,
    delete_blocked_count: Number(source.delete_blocked_count) || 0,
  };
}

export default function ProxyBatchCheckOverlay({ operation }: Props) {
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const result = useMemo(() => readResult(operation), [operation]);
  const progress = result.total > 0 ? Math.min(100, (result.processed / result.total) * 100) : 0;
  const current = result.current_index || Math.min(result.processed + 1, result.total);

  useEffect(() => {
    setPortalHost(document.body);
    setDarkMode(detectDarkMode());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const blockBackgroundInteraction = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ' || event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('keydown', blockBackgroundInteraction, true);
    return () => {
      document.removeEventListener('keydown', blockBackgroundInteraction, true);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!portalHost) return null;

  return createPortal(
    <div
      className={`${darkMode ? 'dark' : ''} fixed inset-0 z-[2147483647] flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-sm`}
      data-testid="proxy-check-batch-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proxy-check-batch-title"
      onPointerDown={(event) => event.preventDefault()}
    >
      <div className={`${darkMode ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'} w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" aria-hidden="true" />
        </div>
        <h2 id="proxy-check-batch-title" className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-4 text-xl font-bold`}>
          Проверяем прокси
        </h2>
        <p className={`${darkMode ? 'text-brand-400' : 'text-brand-600'} mt-4 text-base font-semibold`} data-testid="proxy-check-batch-counter">
          {result.total > 0 ? `Прокси ${current || 1} из ${result.total}` : 'Подготавливаем список прокси'}
        </p>
        {result.current_proxy_name && (
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 truncate text-sm`} title={result.current_proxy_name}>
            {result.current_proxy_name}
          </p>
        )}
        <div
          className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mt-5 h-2.5 overflow-hidden rounded-full`}
          role="progressbar"
          aria-label="Прогресс проверки прокси"
          aria-valuemin={0}
          aria-valuemax={result.total}
          aria-valuenow={result.processed}
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
            data-testid="proxy-check-batch-progress"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-gray-400">
          Проверено {result.processed} из {result.total || '—'}
        </p>
        <p className="mt-4 text-xs text-gray-400">Проверка идёт последовательно и продолжится в фоне.</p>
      </div>
    </div>,
    portalHost,
  );
}
