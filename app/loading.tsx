import { SystemState } from '@/public/system/SystemState';

export default function Loading() {
  return <SystemState kind="loading" title="Загружаем FunPay Cloud" description="Собираем актуальное состояние сервиса." />;
}
