"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import {
  accountsApi,
  pluginsApi,
  ApiAccount,
  ApiPlugin,
  ApiPluginSchema,
  ApiConfigField,
  ApiStatField,
  ApiPluginLog,
} from "@/lib/api";

type Tab = "settings" | "stats" | "logs";

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const LOG_LEVEL_CLS: Record<string, string> = {
  info: "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  error: "bg-error-50 text-error-500 dark:bg-error-500/10",
  debug: "bg-gray-100 text-gray-500 dark:bg-gray-800",
};

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ApiConfigField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "boolean") {
    const on = value === "true" || value === "1";
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {field.label}
          {field.required && <span className="ml-0.5 text-error-500">*</span>}
        </span>
        <button
          onClick={() => onChange(on ? "false" : "true")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.label}{field.required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.label}{field.required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}{field.required && <span className="ml-0.5 text-error-500">*</span>}
      </label>
      <input
        type={field.type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

export default function PluginDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [plugin, setPlugin] = useState<ApiPlugin | null>(null);
  const [schema, setSchema] = useState<ApiPluginSchema | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [logs, setLogs] = useState<ApiPluginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [tab, setTab] = useState<Tab>("settings");

  useEffect(() => {
    accountsApi.list().then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setAccounts(list);
      if (list.length > 0) setSelectedAccountId(list[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedAccountId === null || !slug) return;
    setLoading(true);
    setPlugin(null);
    setSchema(null);
    setConfig({});
    setStats({});
    setLogs([]);

    Promise.all([
      pluginsApi.list(selectedAccountId),
      pluginsApi.schema(slug, selectedAccountId),
      pluginsApi.getConfig(slug, selectedAccountId),
      pluginsApi.logs(slug, selectedAccountId),
    ]).then(([pluginList, schemaData, configData, logsData]) => {
      const found = Array.isArray(pluginList) ? pluginList.find((p) => p.slug === slug) : null;
      setPlugin(found ?? null);
      setSchema(schemaData);
      // Initialize config with defaults for missing keys
      const initial: Record<string, string> = {};
      if (schemaData?.config_schema) {
        for (const field of schemaData.config_schema) {
          initial[field.key] = configData?.[field.key] ?? field.default ?? "";
        }
      }
      setConfig(initial);
      setLogs(Array.isArray(logsData) ? logsData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedAccountId, slug]);

  // Load stats when stats tab opened
  useEffect(() => {
    if (tab !== "stats" || selectedAccountId === null || !slug) return;
    pluginsApi.stats(slug, selectedAccountId)
      .then((data) => setStats(data as Record<string, unknown>))
      .catch(() => {});
  }, [tab, selectedAccountId, slug]);

  async function handleSave() {
    if (selectedAccountId === null || !slug) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await pluginsApi.saveConfig(slug, selectedAccountId, config);
      setSaveMsg({ text: "Настройки сохранены", ok: true });
    } catch (err) {
      setSaveMsg({ text: err instanceof Error ? err.message : "Ошибка", ok: false });
    } finally {
      setSaving(false);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "settings", label: "Настройки" },
    { id: "stats", label: "Статистика" },
    { id: "logs", label: "Логи" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/platform2/plugins")}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <Icon name="arrow-left" className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {plugin?.name ?? slug}
        </h1>
        {plugin?.installed && (
          <span className="rounded-full bg-success-500/10 px-2.5 py-0.5 text-xs font-medium text-success-600">
            Установлен
          </span>
        )}
      </div>

      {/* Account selector */}
      <Card>
        <CardContent className="p-4">
          <select
            value={selectedAccountId ?? ""}
            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-brand-500 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Settings tab */}
          {tab === "settings" && (
            <Card>
              <CardContent className="p-6">
                {!schema || schema.config_schema.length === 0 ? (
                  <p className="text-sm text-gray-400">Настраиваемых параметров нет</p>
                ) : (
                  <div className="space-y-4">
                    {schema.config_schema.map((field) => (
                      <DynamicField
                        key={field.key}
                        field={field}
                        value={config[field.key] ?? ""}
                        onChange={(v) => setConfig((prev) => ({ ...prev, [field.key]: v }))}
                      />
                    ))}
                    {saveMsg && (
                      <p className={`text-sm ${saveMsg.ok ? "text-success-600" : "text-error-500"}`}>
                        {saveMsg.text}
                      </p>
                    )}
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                      {saving ? "Сохранение..." : "Сохранить настройки"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats tab */}
          {tab === "stats" && (
            <Card>
              <CardContent className="p-6">
                {!schema || schema.stats_schema.length === 0 ? (
                  <p className="text-sm text-gray-400">Статистика недоступна</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {schema.stats_schema.map((stat: ApiStatField) => (
                      <div key={stat.key} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                          {String(stats[stat.key] ?? "—")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Logs tab */}
          {tab === "logs" && (
            <Card>
              <CardContent className="p-0">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Icon name="list" className="h-10 w-10 text-gray-200" />
                    <p className="mt-3 text-sm text-gray-400">Логов нет</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${LOG_LEVEL_CLS[log.level] ?? "bg-gray-100 text-gray-500"}`}>
                          {log.level}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 dark:text-white">{log.event}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleString("ru-RU")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
