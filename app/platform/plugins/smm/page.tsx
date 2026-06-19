"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Badge from "@/platform2/components/ui/badge/Badge";
import Select from "@/platform2/components/form/Select";
import InputField from "@/platform2/components/form/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";
import Pagination from "@/platform2/components/tables/Pagination";
import Icon from "@/platform2/icons";
import Alert from "@/platform2/components/ui/alert/Alert";
import { toast } from "sonner";
import {
  accountsApi,
  smmApi,
  ApiAccount,
  SMMConnection,
  SMMService,
  SMMMapping,
  SMMOrder,
} from "@/lib/api";

type Tab = "overview" | "connection" | "mappings" | "orders";

const STATUS_LABELS: Record<string, { label: string; color: "success" | "error" | "warning" | "primary" | "light" }> = {
  pending_link: { label: "Ожидает ссылку", color: "warning" },
  pending_submit: { label: "Ожидает отправки", color: "warning" },
  submitted: { label: "Отправлен", color: "primary" },
  in_progress: { label: "Выполняется", color: "primary" },
  completed: { label: "Выполнен", color: "success" },
  partial: { label: "Частично", color: "warning" },
  cancelled: { label: "Отменён", color: "light" },
  error: { label: "Ошибка", color: "error" },
  manual: { label: "Вручную", color: "light" },
};

function fmt(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : `${d.toLocaleDateString("ru-RU")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );
}

export default function SMMPluginPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    accountsApi.list().then((data) => {
      setAccounts(data);
      if (data.length > 0) setAccountId(data[0].id);
    }).catch(() => {});
  }, []);

  return (
    <div data-p2 className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/platform/plugins" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <Icon name="chevron-left" className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Icon name="chart-bar" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">SMM-накрутка</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Автоматическая накрутка через SMM-панель</p>
          </div>
        </div>
      </div>

      {/* Account selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">Аккаунт:</span>
        <Select
          value={accountId !== null ? String(accountId) : ""}
          onChange={(v) => setAccountId(Number(v))}
          className="w-64"
        >
          {accounts.map((a) => (
            <option key={a.id} value={String(a.id)}>{a.username}</option>
          ))}
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
        {(["overview", "connection", "mappings", "orders"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {{ overview: "Обзор", connection: "Подключение", mappings: "Маппинги", orders: "Заказы" }[t]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {accountId !== null && (
        <>
          {tab === "overview" && <OverviewTab accountId={accountId} />}
          {tab === "connection" && <ConnectionTab accountId={accountId} />}
          {tab === "mappings" && <MappingsTab accountId={accountId} />}
          {tab === "orders" && <OrdersTab accountId={accountId} />}
        </>
      )}
      {accountId === null && accounts.length === 0 && (
        <Alert variant="warning" title="Нет аккаунтов" message="Добавьте FunPay-аккаунт в разделе Аккаунты, чтобы использовать плагин." />
      )}
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({ accountId }: { accountId: number }) {
  const [conn, setConn] = useState<SMMConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    smmApi.getConnection(accountId)
      .then((conn) => setConn(conn))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Загрузка...</div>;

  if (!conn) {
    return (
      <Alert
        variant="info"
        title="Подключение не настроено"
        message="Перейдите на вкладку «Подключение», чтобы настроить SMM-панель."
      />
    );
  }

  const stats = [
    { label: "Баланс", value: `${conn.balance.toFixed(2)} ${conn.balance_currency}`, icon: "dollar-line", color: conn.balance <= conn.min_balance_alert ? "text-error-600" : "text-success-600" },
    { label: "Мин. баланс", value: `${conn.min_balance_alert} ${conn.balance_currency}`, icon: "alert", color: "text-warning-600" },
    { label: "Статус", value: conn.is_active ? "Активен" : "Отключён", icon: "bolt", color: conn.is_active ? "text-success-600" : "text-gray-400" },
    { label: "Обновлён", value: fmt(conn.balance_updated_at), icon: "time", color: "text-gray-500" },
  ];

  return (
    <div className="space-y-4">
      {conn.balance <= conn.min_balance_alert && (
        <Alert
          variant="warning"
          title="Низкий баланс"
          message={`Баланс на SMM-панели (${conn.balance.toFixed(2)} ${conn.balance_currency}) ниже порогового значения.`}
        />
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Icon name={s.icon} className="h-3.5 w-3.5" />
                <span className="text-xs">{s.label}</span>
              </div>
              <span className={`text-lg font-semibold ${s.color}`}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Панель: <span className="text-gray-900 dark:text-white">{conn.panel_url}</span>
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Connection ───────────────────────────────────────────────────────────────

function ConnectionTab({ accountId }: { accountId: number }) {
  const [conn, setConn] = useState<SMMConnection | null>(null);
  const [form, setForm] = useState({ panel_url: "", api_key: "", min_balance_alert: 5 });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ balance?: number; currency?: string; error?: string } | null>(null);

  useEffect(() => {
    smmApi.getConnection(accountId).then((conn) => {
      if (conn) {
        setConn(conn);
        setForm({ panel_url: conn.panel_url, api_key: "***", min_balance_alert: conn.min_balance_alert });
      }
    }).catch(() => {});
  }, [accountId]);

  const save = async () => {
    setSaving(true);
    try {
      const conn = await smmApi.upsertConnection(accountId, form);
      setConn(conn);
      toast.success("Настройки сохранены — синхронизируем услуги...");
      // Auto-sync services so mappings are immediately available
      setSyncing(true);
      try {
        const s = await smmApi.syncServices(accountId);
        toast.success(`Готово! Загружено ${s.synced} услуг SMM-панели`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Услуги не синхронизированы — попробуйте вручную");
      } finally {
        setSyncing(false);
      }
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await smmApi.testConnection(accountId);
      setTestResult(r);
      toast.success(`Подключение успешно! Баланс: ${r.balance?.toFixed(2)} ${r.currency}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка подключения";
      setTestResult({ error: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await smmApi.syncServices(accountId);
      toast.success(`Синхронизировано ${r.synced} услуг`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка синхронизации");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Настройки SMM-панели</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <FormField label="URL панели">
            <InputField
              placeholder="https://panel.example.com"
              value={form.panel_url}
              onChange={(e) => setForm((p) => ({ ...p, panel_url: e.target.value }))}
            />
          </FormField>
          <FormField label="API-ключ">
            <InputField
              placeholder="Ваш API-ключ"
              type="password"
              value={form.api_key}
              onFocus={() => { if (form.api_key === "***") setForm((p) => ({ ...p, api_key: "" })); }}
              onChange={(e) => setForm((p) => ({ ...p, api_key: e.target.value }))}
            />
          </FormField>
          <FormField label="Минимальный баланс для уведомления">
            <InputField
              type="number"
              placeholder="5"
              value={String(form.min_balance_alert)}
              onChange={(e) => setForm((p) => ({ ...p, min_balance_alert: Number(e.target.value) }))}
            />
          </FormField>

          {testResult && (
            <Alert
              variant={testResult.error ? "error" : "success"}
              title={testResult.error ? "Ошибка подключения" : "Подключение успешно"}
              message={testResult.error || `Баланс: ${testResult.balance?.toFixed(2)} ${testResult.currency}`}
            />
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
            {conn && (
              <>
                <Button variant="outline" onClick={test} disabled={testing}>
                  {testing ? "Проверка..." : "Проверить подключение"}
                </Button>
                <Button variant="outline" onClick={sync} disabled={syncing}>
                  {syncing ? "Синхронизация..." : "Синхронизировать услуги"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Mappings ─────────────────────────────────────────────────────────────────

function MappingsTab({ accountId }: { accountId: number }) {
  const [mappings, setMappings] = useState<SMMMapping[]>([]);
  const [services, setServices] = useState<SMMService[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<SMMMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      smmApi.getMappings(accountId),
      smmApi.getServices(accountId),
    ]).then(([m, s]) => {
      setMappings(m ?? []);
      setServices(s ?? []);
    }).catch(() => setError("Ошибка загрузки маппингов"))
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  const del = async (id: number) => {
    try {
      await smmApi.deleteMapping(accountId, id);
      toast.success("Маппинг удалён");
      load();
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Загрузка...</div>;
  if (error) return <Alert variant="error" title="Ошибка" message={error} />;

  return (
    <div className="space-y-4">
      {services.length === 0 && (
        <Alert variant="info" title="Нет услуг" message="Сначала синхронизируйте услуги на вкладке «Подключение»." />
      )}

      <div className="flex justify-end">
        <Button onClick={() => { setEditTarget(null); setShowForm(true); }} startIcon={<Icon name="plus" className="h-3.5 w-3.5" />}>
          Новый маппинг
        </Button>
      </div>

      {mappings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Icon name="table" className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm">Маппинги не настроены</p>
            <p className="text-xs mt-1">Создайте маппинг, чтобы связать тип заказа FunPay с услугой SMM-панели</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>{"Название"}</TableCell>
                <TableCell isHeader>{"Услуга"}</TableCell>
                <TableCell isHeader>{"Ключевые слова"}</TableCell>
                <TableCell isHeader>{"Ссылка"}</TableCell>
                <TableCell isHeader>{"Кол-во"}</TableCell>
                <TableCell isHeader>{"Статус"}</TableCell>
                <TableCell isHeader>{""}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name || "—"}</TableCell>
                  <TableCell><span className="text-xs text-gray-500">#{m.external_service_id}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(m.keywords ?? []).slice(0, 3).map((k) => (
                        <Badge key={k} variant="light" color="light" size="sm">{k}</Badge>
                      ))}
                      {(m.keywords ?? []).length > 3 && <Badge variant="light" color="light" size="sm">+{(m.keywords ?? []).length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">
                      {({ message: "Из сообщения", description: "Из описания", fixed: "Фиксированная" } as Record<string, string>)[m.link_source] ?? m.link_source}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">{m.qty_mode === "fixed" ? m.qty_value : "Авто"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="light" color={m.is_enabled ? "success" : "light"} size="sm">
                      {m.is_enabled ? "Активен" : "Выкл"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditTarget(m); setShowForm(true); }}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        <Icon name="pencil" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => del(m.id)}
                        className="text-gray-400 hover:text-error-600 dark:hover:text-error-400 transition-colors"
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {showForm && (
        <MappingForm
          accountId={accountId}
          services={services}
          initial={editTarget}
          onSave={() => { setShowForm(false); setEditTarget(null); load(); }}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

function MappingForm({
  accountId,
  services,
  initial,
  onSave,
  onCancel,
}: {
  accountId: number;
  services: SMMService[];
  initial: SMMMapping | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    external_service_id: initial?.external_service_id ?? "",
    keywords: (initial?.keywords ?? []).join(", "),
    link_source: initial?.link_source ?? "message",
    link_platform: initial?.link_platform ?? "any",
    fixed_link: initial?.fixed_link ?? "",
    qty_mode: initial?.qty_mode ?? "parse",
    qty_value: initial?.qty_value ?? 1000,
    notify_message: initial?.notify_message ?? "✅ Ваш заказ выполнен! Подписчики/лайки добавлены.",
    is_enabled: initial?.is_enabled ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        qty_value: Number(form.qty_value),
      };
      if (initial) {
        await smmApi.updateMapping(accountId, initial.id, payload);
        toast.success("Маппинг обновлён");
      } else {
        await smmApi.createMapping(accountId, payload);
        toast.success("Маппинг создан");
      }
      onSave();
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? "Редактировать маппинг" : "Новый маппинг"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <FormField label="Название">
          <InputField value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Напр. ВКонтакте подписчики" />
        </FormField>

        <FormField label="Услуга SMM-панели">
          <Select value={form.external_service_id} onChange={(v) => setForm((p) => ({ ...p, external_service_id: v }))}>
            <option value="">— Выберите услугу —</option>
            {services.map((s) => (
              <option key={s.external_service_id} value={s.external_service_id}>
                #{s.external_service_id} {s.name} (мин {s.min_qty} – макс {s.max_qty})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Ключевые слова (через запятую)">
          <InputField value={form.keywords} onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))} placeholder="подписчики, фолловеры, vk" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Источник ссылки">
            <Select value={form.link_source} onChange={(v) => setForm((p) => ({ ...p, link_source: v as SMMMapping["link_source"] }))}>
              <option value="message">Из сообщения покупателя</option>
              <option value="description">Из описания заказа</option>
              <option value="fixed">Фиксированная ссылка</option>
            </Select>
          </FormField>
          <FormField label="Платформа">
            <Select value={form.link_platform} onChange={(v) => setForm((p) => ({ ...p, link_platform: v }))}>
              <option value="any">Любая</option>
              <option value="vk">ВКонтакте</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="telegram">Telegram</option>
            </Select>
          </FormField>
        </div>

        {form.link_source === "fixed" && (
          <FormField label="Фиксированная ссылка">
            <InputField value={form.fixed_link} onChange={(e) => setForm((p) => ({ ...p, fixed_link: e.target.value }))} placeholder="https://vk.com/example" />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Режим количества">
            <Select value={form.qty_mode} onChange={(v) => setForm((p) => ({ ...p, qty_mode: v as SMMMapping["qty_mode"] }))}>
              <option value="parse">Извлечь из описания</option>
              <option value="fixed">Фиксированное</option>
            </Select>
          </FormField>
          <FormField label="Количество по умолчанию">
            <InputField
              type="number"
              value={String(form.qty_value)}
              onChange={(e) => setForm((p) => ({ ...p, qty_value: Number(e.target.value) }))}
            />
          </FormField>
        </div>

        <FormField label="Сообщение о выполнении">
          <InputField value={form.notify_message} onChange={(e) => setForm((p) => ({ ...p, notify_message: e.target.value }))} />
        </FormField>

        <div className="flex gap-3">
          <Button onClick={save} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button>
          <Button variant="outline" onClick={onCancel}>Отмена</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function OrdersTab({ accountId }: { accountId: number }) {
  const [orders, setOrders] = useState<SMMOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    smmApi.getOrders(accountId, page, limit)
      .then((r) => { setOrders(r.orders ?? []); setTotal(r.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accountId, page]);

  useEffect(() => { load(); }, [load]);

  const retry = async (id: number) => {
    try {
      await smmApi.retryOrder(accountId, id);
      toast.success("Заказ повторно отправлен");
      load();
    } catch {
      toast.error("Ошибка повторной отправки");
    }
  };

  const manual = async (id: number) => {
    try {
      await smmApi.manualOrder(accountId, id);
      toast.success("Заказ переведён в ручной режим");
      load();
    } catch {
      toast.error("Ошибка");
    }
  };

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Загрузка...</div>;

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-400">
          <Icon name="box" className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm">Заказов пока нет</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>{"Заказ FunPay"}</TableCell>
              <TableCell isHeader>{"Покупатель"}</TableCell>
              <TableCell isHeader>{"Услуга"}</TableCell>
              <TableCell isHeader>{"Ссылка"}</TableCell>
              <TableCell isHeader>{"Кол-во"}</TableCell>
              <TableCell isHeader>{"Статус"}</TableCell>
              <TableCell isHeader>{"Дата"}</TableCell>
              <TableCell isHeader>{""}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const statusInfo = STATUS_LABELS[o.status] ?? { label: o.status, color: "light" as const };
              return (
                <TableRow key={o.id}>
                  <TableCell><span className="font-mono text-xs">{o.funpay_order_id}</span></TableCell>
                  <TableCell>{o.buyer_username || "—"}</TableCell>
                  <TableCell><span className="text-xs text-gray-500">#{o.external_service_id}</span></TableCell>
                  <TableCell>
                    {o.link ? (
                      <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline text-xs truncate block max-w-[140px]">
                        {o.link.replace(/^https?:\/\//, "")}
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{o.quantity}</TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="light" color={statusInfo.color} size="sm">{statusInfo.label}</Badge>
                      {o.error_message && (
                        <p className="text-[10px] text-error-500 mt-0.5 max-w-[120px] truncate" title={o.error_message}>{o.error_message}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs text-gray-400">{fmt(o.created_at)}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {(o.status === "error" || o.status === "cancelled") && (
                        <button onClick={() => retry(o.id)} title="Повторить" className="text-gray-400 hover:text-brand-500 transition-colors">
                          <Icon name="chevron-right" className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {o.status !== "completed" && o.status !== "manual" && o.status !== "cancelled" && (
                        <button onClick={() => manual(o.id)} title="Вручную" className="text-gray-400 hover:text-warning-500 transition-colors">
                          <Icon name="alert" className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      {total > limit && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / limit)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
