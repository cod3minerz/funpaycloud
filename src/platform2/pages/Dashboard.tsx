"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Badge from "@/platform2/components/ui/badge/Badge";
import Icon from "@/platform2/icons";
import { accountsApi, settingsApi, problemsApi, ApiAccount, UserProblem } from "@/lib/api";
import Link from "next/link";

const TELEGRAM_CHANNEL = "https://t.me/funpay_cloud";
const TELEGRAM_SUPPORT = "https://t.me/fpcloud_support";

type OnboardingState = {
  hasAccount: boolean;
  hasProxy: boolean;
  hasRunner: boolean;
  hasTelegram: boolean;
};

function OnboardingChecklist({ state }: { state: OnboardingState }) {
  const steps = [
    {
      num: 1,
      done: state.hasAccount,
      title: "Добавьте аккаунт FunPay",
      hint: "Нужен Golden Key из настроек профиля на FunPay",
      action: "Перейти",
      href: "/platform/accounts",
    },
    {
      num: 2,
      done: state.hasProxy,
      title: "Подключите прокси",
      hint: "Без прокси воркер не запустится — обязательный шаг",
      action: "Перейти",
      href: "/platform/accounts",
    },
    {
      num: 3,
      done: state.hasRunner,
      title: "Запустите автоматизацию",
      hint: "Откройте аккаунт и нажмите «Запустить Runner»",
      action: "Перейти",
      href: "/platform/accounts",
    },
    {
      num: 4,
      done: state.hasTelegram,
      title: "Подключите Telegram",
      hint: "Получайте уведомления о заказах и сообщениях (опционально)",
      action: "Настроить",
      href: "/platform/integrations",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 dark:border-brand-900/40 dark:bg-brand-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Начало работы
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {allDone
              ? "Всё готово! Автоматизация запущена."
              : `Выполните шаги чтобы запустить автоматизацию — ${completedCount} из ${steps.length} готово`}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {steps.map((step) => (
          <div
            key={step.num}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
              step.done
                ? "border-success-200 bg-white dark:border-success-900/40 dark:bg-success-950/10"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step.done
                  ? "bg-success-500 text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {step.done ? <Icon name="check-circle" className="h-4 w-4" /> : step.num}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${step.done ? "text-success-700 dark:text-success-400 line-through" : "text-gray-800 dark:text-white"}`}>
                {step.title}
              </p>
              {!step.done && (
                <p className="mt-0.5 text-sm text-gray-400">{step.hint}</p>
              )}
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="shrink-0 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-950/30 dark:text-brand-400"
              >
                {step.action} →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1.5 rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function problemColor(severity: string): "error" | "warning" | "info" {
  if (severity === "critical") return "error";
  if (severity === "warning") return "warning";
  return "info";
}

function ProblemInbox({ problems }: { problems: UserProblem[] }) {
  if (problems.length === 0) return null;

  return (
    <Card className="border-warning-200 bg-warning-50/60 dark:border-warning-900/40 dark:bg-warning-950/10">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Требует внимания</CardTitle>
            <p className="mt-1 text-sm text-body">
              Собрали проблемы, которые могут мешать автоматизации прямо сейчас.
            </p>
          </div>
          <Badge color={problems.some((item) => item.severity === "critical") ? "error" : "warning"} size="sm">
            {problems.length} событий
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid gap-3 lg:grid-cols-2">
          {problems.slice(0, 4).map((problem) => (
            <div
              key={problem.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge color={problemColor(problem.severity)} size="sm">
                      {problem.severity === "critical" ? "Важно" : problem.severity === "warning" ? "Проверьте" : "Инфо"}
                    </Badge>
                    {problem.account_username && (
                      <span className="truncate text-xs text-body">{problem.account_username}</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-dark dark:text-white">{problem.title}</h3>
                  <p className="mt-1 text-sm text-body">{problem.message}</p>
                </div>
              </div>
              <Link
                href={problem.action_href || "/platform/accounts"}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-950/30 dark:text-brand-400"
              >
                {problem.action_label || "Открыть"}
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [problems, setProblems] = useState<UserProblem[]>([]);

  useEffect(() => {
    Promise.all([
      accountsApi.list().catch(() => [] as ApiAccount[]),
      settingsApi.getProfile().catch(() => null),
      problemsApi.get().catch(() => ({ items: [] as UserProblem[] })),
    ]).then(([accounts, profile, problemInbox]) => {
      const hasAccount = accounts.length > 0;
      const hasProxy = accounts.some((a) => a.proxy_connected);
      const hasRunner = accounts.some((a) => a.runner_active);
      const hasTelegram = profile?.telegram_linked === true;
      setOnboardingState({ hasAccount, hasProxy, hasRunner, hasTelegram });
      setProblems(problemInbox.items ?? []);
    }).catch(() => {
      setOnboardingState({ hasAccount: false, hasProxy: false, hasRunner: false, hasTelegram: false });
      setProblems([]);
    });
  }, []);

  const allDone = onboardingState !== null &&
    onboardingState.hasAccount &&
    onboardingState.hasProxy &&
    onboardingState.hasRunner &&
    onboardingState.hasTelegram;

  const showOnboarding = onboardingState !== null && !allDone;

  return (
    <div className="space-y-6">

      {/* ОНБОРДИНГ ЧЕКЛИСТ */}
      {showOnboarding && (
        <OnboardingChecklist state={onboardingState} />
      )}

      <ProblemInbox problems={problems} />

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
      <a href="/blog" className="block rounded-2xl bg-gradient-to-r from-brand-500 to-blue-600 border-0 hover:opacity-95 transition-opacity">
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div className="max-w-2xl space-y-3 text-white">
              <div className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                БЛОГ
              </div>
              <h2 className="text-xl md:text-2xl font-bold">
                Как настроить работу с заказами на FunPay
              </h2>
              <p className="text-white/90">
                Полезные материалы по работе с заказами, чатами и настройками аккаунта.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                Читать в блоге
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
                  Телеграм канал
                </h3>
                <p className="text-sm text-body">
                  Новости платформы, промокоды и обновления в едином Telegram-канале.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.open(TELEGRAM_CHANNEL, "_blank")}>
                Открыть канал
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
                  Поддержка
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
        <a href="/blog" className="block">
        <Card className="h-full transition-colors hover:border-brand-400/50 hover:bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-500/10">
                <Icon name="pencil" className="h-5 w-5 text-error-500" />
              </div>
              <CardTitle>Блог</CardTitle>
              <Icon name="arrow-right" className="ml-auto h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-body">
              Кейсы и советы для продавцов
            </p>
          </CardContent>
        </Card>
        </a>
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
                  Управление заказами
                </h4>
                <p className="mt-1 text-sm text-body">
                  Контроль заказов и статусов в одном месте
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
