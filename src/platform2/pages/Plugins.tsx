"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import { accountsApi, pluginsApi, ApiAccount, ApiPlugin } from "@/lib/api";

type Plugin = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  installed: boolean;
  iconName: string;
};

function apiToPlugin(p: ApiPlugin): Plugin {
  return {
    id: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price_month === 0 ? "Бесплатно" : `${p.price_month} ₽/мес`,
    installed: p.installed,
    iconName: "plug-in",
  };
}

const categoryColors: Record<string, string> = {
  Интеграции: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  Безопасность: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Автоматизация: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  Продажи: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
};

export default function PluginsPage() {
  const router = useRouter();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [account, setAccount] = useState<string>("");

  useEffect(() => {
    accountsApi.list().then((list) => {
      setAccounts(list);
      if (list.length > 0) setAccount(String(list[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    pluginsApi.list(account || undefined).then((list) => {
      setPlugins(list.map(apiToPlugin));
    }).catch(() => {});
  }, [account]);

  async function toggle(id: string) {
    const plugin = plugins.find((p) => p.id === id);
    if (!plugin || !account) return;
    try {
      if (plugin.installed) {
        await pluginsApi.uninstall(id, account);
      } else {
        await pluginsApi.install(id, account);
      }
      setPlugins((prev) =>
        prev.map((p) => (p.id === id ? { ...p, installed: !p.installed } : p))
      );
    } catch {
      // ignore
    }
  }

  const filtered = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Плагины</h1>

      {/* Search + account */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Icon name="list" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по плагинам"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="relative w-48">
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={String(a.id)}>{a.username ?? `#${a.id}`}</option>
                ))}
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plugin grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plugin) => (
          <Card key={plugin.id}>
            <CardContent className="flex h-full flex-col p-5">
              {/* Top row: icon + badge */}
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                  <Icon name={plugin.iconName} className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    plugin.installed
                      ? "bg-success-500/10 text-success-600"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  }`}
                >
                  {plugin.installed ? "Установлен" : "Не установлен"}
                </span>
              </div>

              {/* Name + description */}
              <div className="mt-3 flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">{plugin.name}</p>
                <p className="mt-1 text-sm text-gray-500">{plugin.description}</p>
              </div>

              {/* Category + price */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[plugin.category] ?? "bg-gray-100 text-gray-500"}`}>
                  {plugin.category}
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{plugin.price}</span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  disabled={!plugin.installed}
                  onClick={() => plugin.installed && router.push(`/platform2/plugins/${plugin.id}`)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-medium transition-colors ${
                    plugin.installed
                      ? "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      : "cursor-not-allowed border-gray-100 text-gray-300 dark:border-gray-800 dark:text-gray-600"
                  }`}
                >
                  <Icon name="wrench" className="h-3.5 w-3.5" />
                  Настройки
                </button>
                <button
                  onClick={() => { toggle(plugin.id); }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors ${
                    plugin.installed
                      ? "border border-error-200 text-error-500 hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
                      : "bg-brand-500 text-white hover:opacity-90"
                  }`}
                >
                  <Icon name={plugin.installed ? "trash" : "plus"} className="h-3.5 w-3.5" />
                  {plugin.installed ? "Удалить" : "Установить"}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Icon name="plug-in" className="h-12 w-12 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">Плагины не найдены</p>
        </div>
      )}
    </div>
  );
}
