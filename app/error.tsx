'use client';

import { useEffect } from 'react';
import { SystemState } from '@/public/system/SystemState';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <SystemState title="Не удалось загрузить страницу" description="Мы сохранили состояние. Попробуйте повторить запрос." actionLabel="Повторить" onAction={reset} />;
}
