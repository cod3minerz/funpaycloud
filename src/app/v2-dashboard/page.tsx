import { Card, CardContent, CardHeader, CardTitle } from '@/components/tailwind-admin/ui/card';
import { Button } from '@/components/tailwind-admin/ui/button';
import { Icon } from '@/shims/iconify-react';

export default function DashboardV2() {
  return (
    <div className="space-y-6">
      
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Медиахаб платформы</h1>
        <p className="text-muted-foreground">
          Новости, обновления и полезные ресурсы
        </p>
      </div>

      {/* ✅ БЛОГ КАРТОЧКА - из Tailwind Admin стиль */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                БЛОГ
              </p>
              <h2 className="text-2xl font-bold">
                Как автоматически поднимать лоты на FunPay
              </h2>
              <p className="text-sm opacity-90">
                Пошаговый разбор настроек автоподнятия и ошибок, которых важно избегать.
              </p>
              <Button variant="secondary" className="mt-4">
                Читать статью
                <Icon icon="solar:arrow-right-line-duotone" className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <Icon icon="solar:document-text-line-duotone" className="h-16 w-16 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* ✅ 3 КАРТОЧКИ - из Tailwind Admin стиль */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* Telegram */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Icon icon="solar:telegram-line-duotone" className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  КАНАЛ
                </p>
                <h3 className="mt-1 text-xl font-bold">@funpay_cloud</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Новости платформы, промокоды и обновления в едином Telegram-аккаунте.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Открыть @funpay_cloud
                <Icon icon="solar:arrow-right-line-duotone" className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* VK */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <Icon icon="solar:chat-round-line-line-duotone" className="h-8 w-8 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  СООБЩЕСТВО
                </p>
                <h3 className="mt-1 text-xl font-bold">Группа VK</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Полезные посты, кейсы продавцов и живые обсуждения автоматизации.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Вступить
                <Icon icon="solar:arrow-right-line-duotone" className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Поддержка */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <Icon icon="solar:chat-round-call-line-duotone" className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  ТЕХПОДДЕРЖКА
                </p>
                <h3 className="mt-1 text-xl font-bold">@fpcloud_support</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Если что-то сломалось — напишите в единый Telegram поддержки.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Написать @fpcloud_support
                <Icon icon="solar:arrow-right-line-duotone" className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Документация и Блог */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Icon icon="solar:book-line-duotone" className="h-5 w-5 text-warning" />
              </div>
              <CardTitle>Документация</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Подробные инструкции по всем функциям
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10">
                <Icon icon="solar:pen-new-square-line-duotone" className="h-5 w-5 text-error" />
              </div>
              <CardTitle>Блог</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Кейсы и советы для продавцов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Возможности платформы */}
      <Card>
        <CardHeader>
          <CardTitle>ВОЗМОЖНОСТИ ПЛАТФОРМЫ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl shrink-0">
                01
              </div>
              <div>
                <h4 className="font-semibold">Автоподнятие лотов</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  По расписанию или круглую
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl shrink-0">
                02
              </div>
              <div>
                <h4 className="font-semibold">AI автоответы</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Нейросеть отвечает 24/7
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl shrink-0">
                03
              </div>
              <div>
                <h4 className="font-semibold">Автовыдача товаров</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Мгновенно после оплаты
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
