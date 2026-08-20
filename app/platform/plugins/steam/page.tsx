"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Select from "@/platform2/components/form/Select";
import InputField from "@/platform2/components/form/InputField";
import Alert from "@/platform2/components/ui/alert/Alert";
import Icon from "@/platform2/icons";
import {
  accountsApi,
  lotsApi,
  steamRentalApi,
  ApiAccount,
  ApiLot,
  SteamRentalAccount,
  SteamRentalAccountInput,
  SteamRentalLease,
  SteamRentalMapping,
  SteamRentalMappingInput,
} from "@/lib/api";

type Tab = "accounts" | "mappings" | "leases";

const DEFAULT_TEMPLATE = "Ваш Steam-аккаунт на время аренды:\nЛогин: {{login}}\nПароль: {{password}}\nАренда до: {{ends_at}}\nДля кода Steam Guard отправьте {{guard_command}} в этот чат.";

const ACCOUNT_STATUS: Record<string, { label: string; className: string }> = {
  available: { label: "Свободен", className: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" },
  rented: { label: "В аренде", className: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400" },
  quarantine: { label: "Нужна проверка", className: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400" },
  disabled: { label: "Отключён", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const LEASE_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Активна", className: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" },
  expired: { label: "Завершена", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  refunded: { label: "Возврат", className: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400" },
  failed: { label: "Ошибка", className: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400" },
  manual_review: { label: "Закрыта вручную", className: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400" },
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </label>
  );
}

function StatusPill({ status, lease = false, rotationRequired = false }: { status: string; lease?: boolean; rotationRequired?: boolean }) {
  const meta = rotationRequired && !lease
    ? { label: "Нужно сменить пароль", className: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400" }
    : (lease ? LEASE_STATUS : ACCOUNT_STATUS)[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>{meta.label}</span>;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeLeft(value: string, now: number) {
  const diff = new Date(value).getTime() - now;
  if (diff <= 0) return "завершается";
  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return [days ? `${days} д` : "", hours ? `${hours} ч` : "", `${minutes} мин`].filter(Boolean).join(" ");
}

export default function SteamRentalPage() {
  const [funpayAccounts, setFunpayAccounts] = useState<ApiAccount[]>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("accounts");
  const [steamAccounts, setSteamAccounts] = useState<SteamRentalAccount[]>([]);
  const [mappings, setMappings] = useState<SteamRentalMapping[]>([]);
  const [leases, setLeases] = useState<SteamRentalLease[]>([]);
  const [lots, setLots] = useState<ApiLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    accountsApi.list().then((items) => {
      setFunpayAccounts(items);
      setAccountId((current) => current ?? items[0]?.id ?? null);
    }).catch((error) => toast.error(error?.message || "Не удалось загрузить FunPay-аккаунты"));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const reload = useCallback(async () => {
    if (accountId === null) return;
    setLoading(true);
    try {
      const [accounts, mappingItems, leaseItems, lotItems] = await Promise.all([
        steamRentalApi.accounts(accountId),
        steamRentalApi.mappings(accountId),
        steamRentalApi.leases(accountId),
        lotsApi.listByAccount(accountId).catch(() => [] as ApiLot[]),
      ]);
      setSteamAccounts(accounts);
      setMappings(mappingItems);
      setLeases(leaseItems);
      setLots(lotItems);
    } catch (error: any) {
      toast.error(error?.message || "Не удалось загрузить настройки Steam");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { reload(); }, [reload]);

  const stats = useMemo(() => ({
    available: steamAccounts.filter((item) => item.status === "available").length,
    rented: steamAccounts.filter((item) => item.status === "rented").length,
    quarantine: steamAccounts.filter((item) => item.status === "quarantine").length,
    activeLeases: leases.filter((item) => item.status === "active").length,
  }), [steamAccounts, leases]);

  return (
    <div data-p2 className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/platform/plugins" className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300">
          <Icon name="chevron-left" className="h-5 w-5" />
        </Link>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
          <Icon name="beaker" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Аренда Steam</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Автовыдача, таймер аренды и Steam Guard из почты</p>
        </div>
      </div>

      <Alert
        variant="warning"
        title="Перед запуском"
        message="Передача аккаунта третьим лицам может противоречить правилам Steam. После окончания аренды плагин прекращает выдавать Steam Guard и переводит аккаунт на ручную проверку, но не может гарантировать принудительный выход клиента Steam."
      />

      {funpayAccounts.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">FunPay-аккаунт:</span>
            <Select value={accountId === null ? "" : String(accountId)} onChange={(value) => setAccountId(Number(value))} className="w-64">
              {funpayAccounts.map((account) => <option key={account.id} value={account.id}>{account.username || `Аккаунт #${account.id}`}</option>)}
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={reload} disabled={loading} startIcon={<Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}>
            Обновить
          </Button>
        </div>
      ) : (
        <Alert variant="info" title="Нет FunPay-аккаунта" message="Сначала добавьте аккаунт в разделе «Аккаунты»." />
      )}

      {accountId !== null && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Свободно" value={stats.available} className="text-success-600" />
            <Metric label="В аренде" value={stats.rented} className="text-brand-600" />
            <Metric label="На проверке" value={stats.quarantine} className="text-warning-600" />
            <Metric label="Активных аренд" value={stats.activeLeases} className="text-sky-600" />
          </div>

          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {(["accounts", "mappings", "leases"] as Tab[]).map((item) => (
              <button key={item} type="button" onClick={() => setTab(item)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === item ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
                {{ accounts: "Steam-аккаунты", mappings: "Лоты и сроки", leases: "Аренды" }[item]}
              </button>
            ))}
          </div>

          {loading && steamAccounts.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Загрузка...</div>
          ) : (
            <>
              {tab === "accounts" && <AccountsTab funpayAccountId={accountId} items={steamAccounts} reload={reload} />}
              {tab === "mappings" && <MappingsTab funpayAccountId={accountId} items={mappings} lots={lots} reload={reload} />}
              {tab === "leases" && <LeasesTab funpayAccountId={accountId} items={leases} now={now} reload={reload} />}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <Card><CardContent className="p-4"><div className={`text-2xl font-semibold ${className}`}>{value}</div><div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</div></CardContent></Card>
  );
}

function AccountsTab({ funpayAccountId, items, reload }: { funpayAccountId: number; items: SteamRentalAccount[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<SteamRentalAccount | null>(null);
  const [showForm, setShowForm] = useState(items.length === 0);
  const [busyId, setBusyId] = useState<number | null>(null);

  const run = async (id: number, action: () => Promise<unknown>, success: string) => {
    setBusyId(id);
    try { await action(); toast.success(success); await reload(); }
    catch (error: any) { toast.error(error?.message || "Операция не выполнена"); }
    finally { setBusyId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-medium text-gray-900 dark:text-white">Пул аккаунтов</h2><p className="text-sm text-gray-500 dark:text-gray-400">Один аккаунт может иметь только одну активную аренду.</p></div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>Добавить аккаунт</Button>
      </div>

      {showForm && <SteamAccountForm funpayAccountId={funpayAccountId} item={editing} onCancel={() => { setShowForm(false); setEditing(null); }} onSaved={async () => { setShowForm(false); setEditing(null); await reload(); }} />}

      {items.length === 0 && !showForm && <Alert variant="info" title="Пул пуст" message="Добавьте хотя бы один Steam-аккаунт для автовыдачи." />}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-medium text-gray-900 dark:text-white">{item.label}</div><div className="mt-1 text-sm text-gray-500">{item.steam_login_masked}</div></div>
                <StatusPill status={item.status} rotationRequired={item.password_rotation_required} />
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div>Почта: <span className="text-gray-900 dark:text-gray-200">{item.email_masked}</span></div>
                <div>Провайдер: <span className="uppercase text-gray-900 dark:text-gray-200">{item.email_provider}</span></div>
                <div>Напоминание о смене пароля: <span className="text-gray-900 dark:text-gray-200">{item.notify_owner_on_expiry ? "включено" : "выключено"}</span></div>
                <div>Уведомление в Telegram: <span className="text-gray-900 dark:text-gray-200">{item.notify_owner_in_telegram ? "включено" : "выключено"}</span></div>
                <div>Последняя IMAP-проверка: {formatDate(item.last_checked_at)}</div>
              </div>
              {item.notes && <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">{item.notes}</p>}
              {item.password_rotation_required && <Alert variant="warning" title="Смените пароль Steam" message="Аккаунт останется вне пула, пока вы не измените пароль в Steam и не сохраните новый пароль здесь." />}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busyId === item.id} onClick={() => run(item.id, () => steamRentalApi.testEmail(funpayAccountId, item.id), "Почта подключена")}>Проверить почту</Button>
                <Button size="sm" variant="secondary" onClick={() => { setEditing(item); setShowForm(true); }}>Изменить</Button>
                {item.password_rotation_required && <Button size="sm" onClick={() => { setEditing(item); setShowForm(true); }}>Сохранить новый пароль</Button>}
                {(item.status === "quarantine" || item.status === "disabled") && !item.password_rotation_required && <Button size="sm" onClick={() => run(item.id, () => steamRentalApi.releaseAccount(funpayAccountId, item.id), "Аккаунт возвращён в пул")}>Вернуть в пул</Button>}
                {item.status === "available" && <Button size="sm" variant="outline" onClick={() => run(item.id, () => steamRentalApi.updateAccount(funpayAccountId, item.id, accountUpdatePayload(item, "disabled")), "Аккаунт отключён")}>Отключить</Button>}
                {item.status !== "rented" && <Button size="sm" variant="danger" onClick={() => {
                  if (window.confirm(`Удалить «${item.label}»?`)) run(item.id, () => steamRentalApi.deleteAccount(funpayAccountId, item.id), "Аккаунт удалён");
                }}>Удалить</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function accountUpdatePayload(item: SteamRentalAccount, status: "available" | "disabled"): SteamRentalAccountInput {
  return { label: item.label, steam_login: "***", steam_password: "***", email: "***", email_secret: "***", status, notify_owner_on_expiry: item.notify_owner_on_expiry, notify_owner_in_telegram: item.notify_owner_in_telegram, notes: item.notes };
}

function SteamAccountForm({ funpayAccountId, item, onCancel, onSaved }: { funpayAccountId: number; item: SteamRentalAccount | null; onCancel: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<SteamRentalAccountInput>({ label: "", steam_login: "", steam_password: "", email: "", email_secret: "", status: "available", notify_owner_on_expiry: false, notify_owner_in_telegram: false, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(item ? { label: item.label, steam_login: "***", steam_password: "***", email: "***", email_secret: "***", status: item.status === "disabled" ? "disabled" : "available", notify_owner_on_expiry: item.notify_owner_on_expiry, notify_owner_in_telegram: item.notify_owner_in_telegram, notes: item.notes } : { label: "", steam_login: "", steam_password: "", email: "", email_secret: "", status: "available", notify_owner_on_expiry: false, notify_owner_in_telegram: false, notes: "" });
  }, [item]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (item) await steamRentalApi.updateAccount(funpayAccountId, item.id, form);
      else await steamRentalApi.createAccount(funpayAccountId, form);
      toast.success(item ? "Steam-аккаунт обновлён" : "Steam-аккаунт добавлен");
      await onSaved();
    } catch (error: any) { toast.error(error?.message || "Не удалось сохранить аккаунт"); }
    finally { setSaving(false); }
  };

  return (
    <Card className="border-brand-200 dark:border-brand-800">
      <CardHeader><CardTitle>{item ? "Изменить Steam-аккаунт" : "Новый Steam-аккаунт"}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название"><InputField required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Например, CS2 #1" /></Field>
            <Field label="Логин Steam" hint={item ? "*** — оставить без изменений" : undefined}><InputField required value={form.steam_login} onChange={(e) => setForm({ ...form, steam_login: e.target.value })} autoComplete="off" /></Field>
            <Field label="Пароль Steam" hint={item?.password_rotation_required ? "Сначала измените пароль в Steam, затем введите новый пароль здесь" : item ? "Оставьте ***, чтобы не менять" : undefined}><InputField required type="password" value={form.steam_password} onChange={(e) => setForm({ ...form, steam_password: e.target.value })} autoComplete="new-password" /></Field>
            <Field label="Email Steam" hint="Gmail, Яндекс, Mail.ru или Rambler"><InputField required type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" /></Field>
            <Field label="Пароль приложения почты" hint="Не основной пароль. Включите IMAP и создайте отдельный пароль приложения."><InputField required type="password" value={form.email_secret} onChange={(e) => setForm({ ...form, email_secret: e.target.value })} autoComplete="new-password" /></Field>
            <Field label="Состояние"><Select value={form.status || "available"} onChange={(value) => setForm({ ...form, status: value as "available" | "disabled" })}><option value="available">Доступен для аренды</option><option value="disabled">Отключён</option></Select></Field>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <input type="checkbox" checked={Boolean(form.notify_owner_on_expiry)} onChange={(e) => setForm({ ...form, notify_owner_on_expiry: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
            <span><span className="block text-sm font-medium text-gray-800 dark:text-gray-200">Напомнить о смене пароля после аренды</span><span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">После срабатывания таймера уведомление появится в центре уведомлений funpay.cloud.</span></span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <input type="checkbox" checked={Boolean(form.notify_owner_in_telegram)} onChange={(e) => setForm({ ...form, notify_owner_in_telegram: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
            <span><span className="block text-sm font-medium text-gray-800 dark:text-gray-200">Продублировать напоминание в Telegram</span><span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">Требуется привязанный Telegram и включённые уведомления в разделе «Интеграции».</span></span>
          </label>
          <Field label="Заметка"><textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="Игры, ограничения, действия перед возвратом..." /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Отмена</Button><Button type="submit" disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function MappingsTab({ funpayAccountId, items, lots, reload }: { funpayAccountId: number; items: SteamRentalMapping[]; lots: ApiLot[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<SteamRentalMapping | null>(null);
  const [showForm, setShowForm] = useState(items.length === 0);
  const lotNames = useMemo(() => new Map(lots.map((lot) => [String(lot.lot_id || lot.id), lot.title])), [lots]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-medium text-gray-900 dark:text-white">Привязка лотов</h2><p className="text-sm text-gray-500 dark:text-gray-400">Для каждого лота задайте длительность и команду Steam Guard.</p></div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>Добавить привязку</Button>
      </div>
      {showForm && <MappingForm funpayAccountId={funpayAccountId} item={editing} lots={lots} onCancel={() => { setEditing(null); setShowForm(false); }} onSaved={async () => { setEditing(null); setShowForm(false); await reload(); }} />}
      {items.length === 0 && !showForm && <Alert variant="info" title="Нет привязок" message="Автовыдача сработает только для лотов, добавленных на этой вкладке." />}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><div className="font-medium text-gray-900 dark:text-white">{lotNames.get(item.lot_id) || `Лот ${item.lot_id}`}</div><div className="mt-1 text-sm text-gray-500">{item.duration_minutes} мин · команда {item.guard_command} · до {item.guard_limit} запросов</div></div>
            <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.is_enabled ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>{item.is_enabled ? "Включена" : "Отключена"}</span><Button size="sm" variant="outline" onClick={() => { setEditing(item); setShowForm(true); }}>Изменить</Button><Button size="sm" variant="danger" onClick={async () => { if (!window.confirm("Удалить привязку лота?")) return; try { await steamRentalApi.deleteMapping(funpayAccountId, item.id); toast.success("Привязка удалена"); await reload(); } catch (error: any) { toast.error(error?.message || "Не удалось удалить привязку"); } }}>Удалить</Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function MappingForm({ funpayAccountId, item, lots, onCancel, onSaved }: { funpayAccountId: number; item: SteamRentalMapping | null; lots: ApiLot[]; onCancel: () => void; onSaved: () => Promise<void> }) {
  const firstLotID = String(lots[0]?.lot_id || lots[0]?.id || "");
  const [form, setForm] = useState<SteamRentalMappingInput>({ lot_id: firstLotID, duration_minutes: 60, delivery_template: DEFAULT_TEMPLATE, guard_command: "!guard", guard_limit: 5, is_enabled: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(item ? { lot_id: item.lot_id, duration_minutes: item.duration_minutes, delivery_template: item.delivery_template, guard_command: item.guard_command, guard_limit: item.guard_limit, is_enabled: item.is_enabled } : { lot_id: firstLotID, duration_minutes: 60, delivery_template: DEFAULT_TEMPLATE, guard_command: "!guard", guard_limit: 5, is_enabled: true });
  }, [item, firstLotID]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (item) await steamRentalApi.updateMapping(funpayAccountId, item.id, form);
      else await steamRentalApi.createMapping(funpayAccountId, form);
      toast.success(item ? "Привязка обновлена" : "Лот подключён к аренде Steam");
      await onSaved();
    } catch (error: any) { toast.error(error?.message || "Не удалось сохранить привязку"); }
    finally { setSaving(false); }
  };

  return (
    <Card className="border-brand-200 dark:border-brand-800"><CardHeader><CardTitle>{item ? "Изменить привязку" : "Новая привязка"}</CardTitle></CardHeader><CardContent>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Лот FunPay" hint={lots.length === 0 ? "Лоты не загрузились — введите ID вручную" : undefined}>
            {lots.length > 0 ? <Select value={form.lot_id} onChange={(value) => setForm({ ...form, lot_id: value })}>{lots.map((lot) => { const id = String(lot.lot_id || lot.id); return <option key={id} value={id}>{lot.title} · {id}</option>; })}</Select> : <InputField required value={form.lot_id} onChange={(e) => setForm({ ...form, lot_id: e.target.value })} />}
          </Field>
          <Field label="Длительность, минут"><InputField required type="number" min="5" max="43200" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></Field>
          <Field label="Команда Steam Guard"><InputField required value={form.guard_command} onChange={(e) => setForm({ ...form, guard_command: e.target.value })} /></Field>
          <Field label="Лимит запросов кода"><InputField required type="number" min="1" max="20" value={form.guard_limit} onChange={(e) => setForm({ ...form, guard_limit: Number(e.target.value) })} /></Field>
        </div>
        <Field label="Сообщение автовыдачи" hint="Доступные переменные: {{login}}, {{password}}, {{ends_at}}, {{guard_command}}"><textarea required rows={7} value={form.delivery_template} onChange={(e) => setForm({ ...form, delivery_template: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 font-mono text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white" /></Field>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />Привязка активна</label>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Отмена</Button><Button type="submit" disabled={saving || !form.lot_id}>{saving ? "Сохранение..." : "Сохранить"}</Button></div>
      </form>
    </CardContent></Card>
  );
}

function LeasesTab({ funpayAccountId, items, now, reload }: { funpayAccountId: number; items: SteamRentalLease[]; now: number; reload: () => Promise<void> }) {
  if (items.length === 0) return <Alert variant="info" title="Аренд пока нет" message="После оплаты подключённого лота здесь появится таймер и история выдачи." />;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}><CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium text-gray-900 dark:text-white">{item.steam_account_label}</span><StatusPill status={item.status} lease /></div><div className="text-sm text-gray-500">Заказ #{item.funpay_order_id} · {item.buyer_username || `покупатель ${item.buyer_id}`}</div><div className="text-xs text-gray-400">Начало: {formatDate(item.starts_at)} · Конец: {formatDate(item.ends_at)} · Guard: {item.guard_requests}</div>{item.last_error && <div className="text-xs text-error-600">{item.last_error}</div>}</div>
            <div className="flex items-center gap-3">{item.status === "active" && <div className="text-right"><div className="text-xs text-gray-400">Осталось</div><div className="font-medium text-brand-600">{timeLeft(item.ends_at, now)}</div></div>}{item.status === "active" && <Button size="sm" variant="danger" onClick={async () => { if (!window.confirm("Завершить аренду и перевести аккаунт на проверку?")) return; try { await steamRentalApi.closeLease(funpayAccountId, item.id); toast.success("Аренда завершена"); await reload(); } catch (error: any) { toast.error(error?.message || "Не удалось завершить аренду"); } }}>Завершить</Button>}</div>
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}
