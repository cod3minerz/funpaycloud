'use client';

import { SystemState } from '@/public/system/SystemState';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="ru"><body><SystemState title="Интерфейс временно недоступен" description="Обновите страницу. Ваши данные и настройки сохранены." actionLabel="Обновить" onAction={reset} /></body></html>;
}
