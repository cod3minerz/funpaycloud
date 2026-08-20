"use client";
import React from "react";
import Link from "next/link";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { Card, CardContent } from "@/platform2/components/ui/card";
import Badge from "@/platform2/components/ui/badge/Badge";
import Icon from "@/platform2/icons";
import { usePinnedPlugins, ALL_PLUGINS } from "@/lib/pinnedPlugins";

export default function PluginsCatalogPage() {
  const { isPinned, toggle } = usePinnedPlugins();

  return (
    <div data-p2 className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Плагины</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Подключайте инструменты автоматизации к своим аккаунтам
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ALL_PLUGINS.map((plugin) => (
          <PluginItem
            key={plugin.slug}
            plugin={plugin}
            pinned={isPinned(plugin.slug)}
            onTogglePin={() => toggle(plugin.slug)}
          />
        ))}
      </div>
    </div>
  );
}

const pluginMeta: Record<string, { description: string; icon: string; color: string; badge?: string }> = {
  smm: {
    description: "Автоматическая накрутка подписчиков, лайков и просмотров через любую SMM-панель.",
    icon: "chart-bar",
    color: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    badge: "NEW",
  },
  robux: {
    description: "Автоматическая доставка Robux и Telegram Stars через настраиваемые поставщики.",
    icon: "shooting-star",
    color: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
    badge: "Скоро",
  },
  steam: {
    description: "Управление арендой Steam-аккаунтов: автовыдача, таймеры, возврат доступа.",
    icon: "beaker",
    color: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    badge: "NEW",
  },
  keys: {
    description: "Авто-выдача ключей активации из склада — игры, подписки, программы.",
    icon: "lock",
    color: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
    badge: "Скоро",
  },
};

function PluginItem({
  plugin,
  pinned,
  onTogglePin,
}: {
  plugin: (typeof ALL_PLUGINS)[number];
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const meta = pluginMeta[plugin.slug];

  const inner = (
    <Card className={`transition-shadow ${plugin.available ? "hover:shadow-md cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
          <Icon name={meta.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">{plugin.name}</span>
            {meta.badge && (
              <Badge
                variant="light"
                color={meta.badge === "NEW" ? "primary" : "light"}
                size="sm"
              >
                {meta.badge}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-snug">{meta.description}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (plugin.available) onTogglePin();
          }}
          disabled={!plugin.available}
          title={pinned ? "Убрать из меню" : "Закрепить в меню"}
          className={`flex-shrink-0 rounded-lg p-1.5 transition-colors ${
            plugin.available
              ? pinned
                ? "text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              : "cursor-not-allowed opacity-40"
          }`}
        >
          {pinned ? (
            <BookmarkSolidIcon className="h-4 w-4" />
          ) : (
            <BookmarkIcon className="h-4 w-4" />
          )}
        </button>
      </CardContent>
    </Card>
  );

  if (plugin.path && plugin.available) {
    return <Link href={plugin.path}>{inner}</Link>;
  }
  return inner;
}
