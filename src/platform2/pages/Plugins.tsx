"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/platform2/components/ui/card";
import Icon from "@/platform2/icons";
import { accountsApi, pluginsApi, ApiAccount, ApiPlugin } from "@/lib/api";

const categoryColors: Record<string, string> = {
  integrations: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  security: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  automation: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  sales: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
};

export default function PluginsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [plugins, setPlugins] = useState<ApiPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  useEffect(() => {
    accountsApi.list().then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setAccounts(list);
      if (list.length > 0) setSelectedAccountId(list[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedAccountId === null) return;
    setLoading(true);
    pluginsApi.list(selectedAccountId)
      .then((rows) => setPlugins(Array.isArray(rows) ? rows : []))
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  async function togglePlugin(plugin: ApiPlugin) {
    if (selectedAccountId === null) return;
    setToggling((prev) => new Set(prev).add(plugin.slug));
    try {
      if (plugin.installed) {
        await pluginsApi.uninstall(plugin.slug, selectedAccountId);
      } else {
        await pluginsApi.install(plugin.slug, selectedAccountId);
      }
      setPlugins((prev) => prev.map((p) =>
        p.slug === plugin.slug ? { ...p, installed: !p.installed } : p
      ));
    } catch {
      // ignore
    } finally {
      setToggling((prev) => { const n = new Set(prev); n.delete(plugin.slug); return n; });
    }
  }

  const filtered = plugins.filter((p) =>
    !search.trim() ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Плагины</h1>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="list" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск плагинов..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={selectedAccountId ?? ""}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Icon name="plug-in" className="h-12 w-12 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">Плагины не найдены</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plugin) => (
            <Card key={plugin.slug}>
              <CardContent className="flex h-full flex-col p-5">
                {/* Icon + status */}
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10">
                    {plugin.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={plugin.icon_url} alt={plugin.name} className="h-6 w-6 object-contain" />
                    ) : (
                      <Icon name="plug-in" className="h-6 w-6 text-brand-500" />
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    plugin.installed
                      ? "bg-success-500/10 text-success-600"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  }`}>
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
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[plugin.category] ?? "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                    {plugin.category}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    {plugin.price_month > 0 ? `${plugin.price_month} ₽/мес` : "Бесплатно"}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    disabled={!plugin.installed}
                    onClick={() => plugin.installed && router.push(`/platform2/plugins/${plugin.slug}`)}
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
                    onClick={() => togglePlugin(plugin)}
                    disabled={toggling.has(plugin.slug)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                      plugin.installed
                        ? "border border-error-200 text-error-500 hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
                        : "bg-brand-500 text-white hover:opacity-90"
                    }`}
                  >
                    {toggling.has(plugin.slug) ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Icon name={plugin.installed ? "trash" : "plus"} className="h-3.5 w-3.5" />
                    )}
                    {plugin.installed ? "Удалить" : "Установить"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
