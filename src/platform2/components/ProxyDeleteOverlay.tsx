'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BackgroundOperation, ProxyDeleteFailedResult } from '@/lib/api';

type Props = {
  operation?: BackgroundOperation | null;
  proxyName?: string;
};

function detectDarkMode(): boolean {
  const scopedThemeRoot = document.querySelector<HTMLElement>('[data-p2], [data-admin]');
  if (scopedThemeRoot) return scopedThemeRoot.classList.contains('dark');
  return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
}

function readResult(operation?: BackgroundOperation | null): ProxyDeleteFailedResult {
  const source = operation?.result ?? {};
  return {
    total: Number(source.total) || 0,
    processed: Number(source.processed) || 0,
    current_proxy_id: Number(source.current_proxy_id) || null,
    current_proxy_name: typeof source.current_proxy_name === 'string' ? source.current_proxy_name : '',
    current_index: Number(source.current_index) || 0,
    deleted_ids: Array.isArray(source.deleted_ids) ? source.deleted_ids.map(Number) : [],
    deleted_count: Number(source.deleted_count) || 0,
    skipped: Array.isArray(source.skipped) ? source.skipped as ProxyDeleteFailedResult['skipped'] : [],
    skipped_count: Number(source.skipped_count) || 0,
  };
}

export default function ProxyDeleteOverlay({ operation, proxyName }: Props) {
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const result = useMemo(() => readResult(operation), [operation]);
  const isBatch = Boolean(operation);
  const total = result.total ?? 0;
  const processed = result.processed ?? 0;
  const current = result.current_index || Math.min(processed + 1, total);
  const progress = total > 0 ? Math.min(100, (processed / total) * 100) : 0;
  const currentName = result.current_proxy_name || proxyName || '';

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
      data-testid="proxy-delete-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proxy-delete-title"
      onPointerDown={(event) => event.preventDefault()}
    >
      <div className={`${darkMode ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'} w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-500/10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-error-200 border-t-error-500" aria-hidden="true" />
        </div>
        <h2 id="proxy-delete-title" className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-4 text-xl font-bold`}>
          {isBatch ? 'Удаляем неработающие прокси' : 'Удаляем прокси'}
        </h2>
        {isBatch && (
          <p className={`${darkMode ? 'text-error-400' : 'text-error-600'} mt-4 text-base font-semibold`} data-testid="proxy-delete-batch-counter">
            {total > 0 ? `Прокси ${current || 1} из ${total}` : 'Подготавливаем список прокси'}
          </p>
        )}
        {currentName && (
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 truncate text-sm`} title={currentName}>
            {currentName}
          </p>
        )}
        <div
          className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mt-5 h-2.5 overflow-hidden rounded-full`}
          role="progressbar"
          aria-label="Прогресс удаления прокси"
          aria-valuemin={0}
          aria-valuemax={isBatch ? total : 100}
          aria-valuenow={isBatch ? processed : undefined}
        >
          <div
            className={`h-full rounded-full bg-error-500 ${isBatch ? 'transition-[width] duration-500 ease-out' : 'w-1/2 animate-pulse'}`}
            data-testid="proxy-delete-progress"
            style={isBatch ? { width: `${progress}%` } : undefined}
          />
        </div>
        {isBatch ? (
          <>
            <p className="mt-3 text-sm text-gray-400">
              Обработано {processed} из {total || '—'} · Удалено {result.deleted_count} · Пропущено {result.skipped_count}
            </p>
            <p className="mt-4 text-xs text-gray-400">Удаление продолжится в фоне, даже если страница будет перезагружена.</p>
          </>
        ) : (
          <p className="mt-4 text-xs text-gray-400">Пожалуйста, дождитесь завершения операции.</p>
        )}
      </div>
    </div>,
    portalHost,
  );
}
