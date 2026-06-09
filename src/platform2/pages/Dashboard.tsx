"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";

const TELEGRAM_CHANNEL = "https://t.me/funpay_cloud";
const TELEGRAM_SUPPORT = "https://t.me/fpcloud_support";

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* ЗАГОЛОВОК */}
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          Медиахаб платформы
        </h1>
        <p className="text-body">
          Новости, обновления и полезные ресурсы
        </p>
      </div>

      {/* БЛОГ КАРТОЧКА - ГРАДИЕНТ */}
      <a href="https://t.me/funpay_cloud" target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-gradient-to-r from-brand-500 to-blue-600 border-0 hover:opacity-95 transition-opacity">
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div className="max-w-2xl space-y-3 text-white">
              <div className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                БЛОГ
              </div>
              <h2 className="text-xl md:text-2xl font-bold">
                Как автоматически поднимать лоты на FunPay
              </h2>
              <p className="text-white/90">
                Пошаговый разбор настроек автоподнятия и ошибок, которых важно избегать.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                Читать в канале
                <Icon name="arrow-right" className="h-4 w-4" />
              </div>
            </div>
            <Icon
              name="docs"
              className="hidden md:block h-20 w-20 text-white/20"
            />
          </div>
        </div>
      </a>

      {/* 3 КАРТОЧКИ: TELEGRAM, VK, ПОДДЕРЖКА */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* TELEGRAM */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10">
                <Icon name="chat" className="h-8 w-8 text-brand-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-body uppercase tracking-wide">
                  КАНАЛ
                </p>
                <h3 className="text-lg font-bold text-dark dark:text-white">
                  @funpay_cloud
                </h3>
                <p className="text-sm text-body">
                  Новости платформы, промокоды и обновления в едином Telegram-канале.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.open(TELEGRAM_CHANNEL, "_blank")}>
                Открыть @funpay_cloud
                <Icon name="arrow-right" className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* VK */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-500/10">
                <Icon name="group" className="h-8 w-8 text-gray-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-body uppercase tracking-wide">
                  СООБЩЕСТВО
                </p>
                <h3 className="text-lg font-bold text-dark dark:text-white">
                  Группа VK
                </h3>
                <p className="text-sm text-body">
                  Полезные посты, кейсы продавцов и живые обсуждения автоматизации.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Вступить
                <Icon name="arrow-right" className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ПОДДЕРЖКА */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10">
                <Icon name="chat" className="h-8 w-8 text-success-600" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-body uppercase tracking-wide">
                  ТЕХПОДДЕРЖКА
                </p>
                <h3 className="text-lg font-bold text-dark dark:text-white">
                  @funpay_cloud
                </h3>
                <p className="text-sm text-body">
                  Если что-то сломалось — напишите нам в Telegram поддержки.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.open(TELEGRAM_SUPPORT, "_blank")}>
                Написать в поддержку
                <Icon name="arrow-right" className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ДОКУМЕНТАЦИЯ И БЛОГ */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* ДОКУМЕНТАЦИЯ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-500/10">
                <Icon name="docs" className="h-5 w-5 text-warning-600" />
              </div>
              <CardTitle>Документация</CardTitle>
              <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                Скоро
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-body">
              Подробные инструкции по всем функциям
            </p>
          </CardContent>
        </Card>

        {/* БЛОГ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-500/10">
                <Icon name="pencil" className="h-5 w-5 text-error-500" />
              </div>
              <CardTitle>Блог</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-body">
              Кейсы и советы для продавцов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ВОЗМОЖНОСТИ ПЛАТФОРМЫ */}
      <Card>
        <CardHeader>
          <CardTitle className="uppercase text-body text-xs tracking-wide">
            Возможности платформы
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid gap-6 md:grid-cols-3">

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-xl font-bold text-brand-500">
                01
              </div>
              <div>
                <h4 className="font-semibold text-dark dark:text-white">
                  Автоподнятие лотов
                </h4>
                <p className="mt-1 text-sm text-body">
                  По расписанию или круглую
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-xl font-bold text-brand-500">
                02
              </div>
              <div>
                <h4 className="font-semibold text-dark dark:text-white">
                  AI автоответы
                </h4>
                <p className="mt-1 text-sm text-body">
                  Нейросеть отвечает 24/7
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-xl font-bold text-brand-500">
                03
              </div>
              <div>
                <h4 className="font-semibold text-dark dark:text-white">
                  Автовыдача товаров
                </h4>
                <p className="mt-1 text-sm text-body">
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
