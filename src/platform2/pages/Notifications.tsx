"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { notificationsApi, UserNotification } from "@/lib/api";
import { toast } from "sonner";
import {
  EnvelopeIcon,
  ClipboardDocumentListIcon as TaskIcon,
  SparklesIcon,
  InformationCircleIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const TYPE_FILTERS = [
  { label: "Все", value: "" },
  { label: "Сообщения", value: "new_message" },
  { label: "Заказы", value: "new_order" },
  { label: "Отзывы", value: "new_review" },
  { label: "Система", value: "system" },
];

function typeIcon(type: string) {
  switch (type) {
    case "new_message": return <EnvelopeIcon className="h-5 w-5 text-blue-500" />;
    case "new_order":   return <TaskIcon className="h-5 w-5 text-green-500" />;
    case "new_review":  return <SparklesIcon className="h-5 w-5 text-amber-500" />;
    default:            return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
  }
}

function formatMSK(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 20;

export default function Notifications() {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications({ page: p });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
      setUnread(res.unread ?? 0);
    } catch {
      toast.error("Не удалось загрузить уведомления");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const handleMarkRead = async (n: UserNotification) => {
    if (n.is_read) return;
    try {
      await notificationsApi.markRead(n.id);
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {
      toast.error("Не удалось отметить уведомление");
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setItems(prev => prev.map(x => ({ ...x, is_read: true })));
      setUnread(0);
      toast.success("Все уведомления прочитаны");
    } catch {
      toast.error("Не удалось обновить уведомления");
    } finally {
      setMarkingAll(false);
    }
  };

  const visibleItems = filter
    ? items.filter(n => n.type === filter)
    : items;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BellIcon className="h-6 w-6" />
            Уведомления
            {unread > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                {unread}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            События по вашим аккаунтам — сообщения, заказы, отзывы
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markingAll}
          >
            {markingAll ? "Обновляю..." : "Прочитать все"}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex gap-3 p-4 animate-pulse">
                  <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 flex-shrink-0" />
                </li>
              ))}
            </ul>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <BellIcon className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Уведомлений нет</p>
              <p className="text-sm mt-1">Здесь будут появляться события по вашим аккаунтам</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {visibleItems.map(n => (
                <li
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    !n.is_read ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                  }`}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 flex items-start pt-0.5">
                    {!n.is_read ? (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 pt-0.5">
                    {typeIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {n.body}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap pt-0.5">
                    {formatMSK(n.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Назад
          </Button>
          <span className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  );
}
