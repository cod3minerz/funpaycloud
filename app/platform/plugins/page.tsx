"use client";
import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/platform2/components/ui/card";
import Badge from "@/platform2/components/ui/badge/Badge";
import Icon from "@/platform2/icons";

type PluginCard = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  path?: string;
  status: "available" | "soon";
  badge?: string;
};

const plugins: PluginCard[] = [
  {
    slug: "smm",
    name: "SMM-накрутка",
    description: "Автоматическая накрутка подписчиков, лайков и просмотров через любую SMM-панель.",
    icon: "chart-bar",
    color: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    path: "/platform/plugins/smm",
    status: "available",
    badge: "NEW",
  },
  {
    slug: "robux",
    name: "Robux / Stars",
    description: "Автоматическая доставка Robux и Telegram Stars через настраиваемые поставщики.",
    icon: "shooting-star",
    color: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
    status: "soon",
    badge: "Скоро",
  },
  {
    slug: "steam",
    name: "Аренда Steam",
    description: "Управление арендой Steam-аккаунтов: автовыдача, таймеры, возврат доступа.",
    icon: "beaker",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    status: "soon",
    badge: "Скоро",
  },
  {
    slug: "keys",
    name: "Ключи и коды",
    description: "Авто-выдача ключей активации из склада — игры, подписки, программы.",
    icon: "lock",
    color: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
    status: "soon",
    badge: "Скоро",
  },
];

export default function PluginsCatalogPage() {
  return (
    <div data-p2 className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Плагины</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Подключайте инструменты автоматизации к своим аккаунтам
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {plugins.map((plugin) => (
          <PluginItem key={plugin.slug} plugin={plugin} />
        ))}
      </div>
    </div>
  );
}

function PluginItem({ plugin }: { plugin: PluginCard }) {
  const inner = (
    <Card className={`transition-shadow ${plugin.status === "available" ? "hover:shadow-md cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${plugin.color}`}>
          <Icon name={plugin.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">{plugin.name}</span>
            {plugin.badge && (
              <Badge
                variant="light"
                color={plugin.badge === "NEW" ? "primary" : "light"}
                size="sm"
              >
                {plugin.badge}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-snug">{plugin.description}</p>
        </div>
        {plugin.status === "available" && (
          <Icon name="chevron-right" className="h-4 w-4 flex-shrink-0 text-gray-400 mt-0.5" />
        )}
      </CardContent>
    </Card>
  );

  if (plugin.path && plugin.status === "available") {
    return <Link href={plugin.path}>{inner}</Link>;
  }
  return inner;
}
