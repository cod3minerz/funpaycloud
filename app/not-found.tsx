import { SystemState } from '@/public/system/SystemState';

export default function NotFound() {
  return <SystemState kind="not-found" title="Страница не найдена" description="Возможно, адрес изменился или страница больше недоступна." actionLabel="Вернуться на главную" actionHref="/" />;
}
