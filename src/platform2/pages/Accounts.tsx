"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { Modal } from "@/platform2/components/ui/modal";
import Icon from "@/platform2/icons";
import { accountsApi, ApiAccount, ConnectProxyPayload } from "@/lib/api";

// ── Pulsing dot ───────────────────────────────────────────────────────────────
function Dot({ active, color }: { active: boolean; color: "success" | "warning" | "error" }) {
  const base = { success: "bg-success", warning: "bg-warning", error: "bg-error" };
  const pingCls = `${base[color]}-400`;
  const dotCls = `${base[color]}-500`;
  if (!active) return <span className={`h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600`} />;
  return (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${pingCls} opacity-75`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${dotCls}`} />
    </span>
  );
}

// ── Account drawer ────────────────────────────────────────────────────────────
function AccountDrawer({
  account,
  onClose,
  onStartRunner,
  onStopRunner,
  onStartRaiser,
  onStopRaiser,
  onProxy,
  onDelete,
}: {
  account: ApiAccount;
  onClose: () => void;
  onStartRunner: () => void;
  onStopRunner: () => void;
  onStartRaiser: () => void;
  onStopRaiser: () => void;
  onProxy: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {account.username ?? `Аккаунт #${account.id}`}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Icon name="close" className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Status */}
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
            <Dot active={account.keeper_active} color="success" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Keeper: {account.keeper_active ? "онлайн" : "оффлайн"}
            </span>
          </div>

          {/* Runner */}
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Dot active={!!account.runner_active} color="success" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Runner</p>
                  {account.runner_events_today !== undefined && (
                    <p className="text-xs text-gray-400">Событий сегодня: {account.runner_events_today}</p>
                  )}
                </div>
              </div>
              <Button
                variant={account.runner_active ? "outline" : "primary"}
                size="sm"
                onClick={account.runner_active ? onStopRunner : onStartRunner}
              >
                {account.runner_active ? "Стоп" : "Старт"}
              </Button>
            </CardContent>
          </Card>

          {/* Raiser */}
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Dot active={account.raiser_active} color="warning" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Raiser</p>
                  {account.raiser_time && (
                    <p className="text-xs text-gray-400">Расписание: {account.raiser_time}</p>
                  )}
                </div>
              </div>
              <Button
                variant={account.raiser_active ? "outline" : "primary"}
                size="sm"
                onClick={account.raiser_active ? onStopRaiser : onStartRaiser}
              >
                {account.raiser_active ? "Стоп" : "Старт"}
              </Button>
            </CardContent>
          </Card>

          {/* Proxy */}
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Dot active={!!account.proxy_connected} color="success" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Прокси</p>
                  <p className="text-xs text-gray-400">
                    {account.proxy_label ?? (account.proxy_connected ? "Подключён" : "Не подключён")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onProxy}>
                Настроить
              </Button>
            </CardContent>
          </Card>

          {/* Danger */}
          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              onClick={onDelete}
              className="flex w-full items-center gap-2 rounded-xl border border-error-200 px-4 py-2.5 text-sm font-medium text-error-500 hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
            >
              <Icon name="trash" className="h-4 w-4" />
              Удалить аккаунт
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Proxy modal ───────────────────────────────────────────────────────────────
function ProxyModal({
  accountId,
  onClose,
  onConnected,
}: {
  accountId: number;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [selected, setSelected] = useState<"free" | "external" | null>(null);
  const [ext, setExt] = useState({ protocol: "HTTP", host: "", port: "8080", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setLoading(true);
    setError("");
    try {
      let payload: ConnectProxyPayload;
      if (selected === "free") {
        payload = { mode: "free" };
      } else {
        payload = {
          mode: "external",
          protocol: ext.protocol as "HTTP" | "HTTPS" | "SOCKS5",
          host: ext.host,
          port: Number(ext.port),
          username: ext.username || undefined,
          password: ext.password || undefined,
        };
      }
      await accountsApi.connectProxy(accountId, payload);
      onConnected();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} className="w-full max-w-md p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Подключить прокси</h2>

      <div className="space-y-3">
        {[
          { id: "free" as const, label: "Бесплатный прокси", desc: "Общий прокси платформы" },
          { id: "external" as const, label: "Внешний прокси", desc: "Ваш собственный прокси" },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`w-full rounded-xl border p-4 text-left transition-colors ${
              selected === opt.id
                ? "border-brand-500 bg-brand-500/5"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
            }`}
          >
            <p className="font-semibold text-gray-800 dark:text-white">{opt.label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
          </button>
        ))}
      </div>

      {selected === "external" && (
        <div className="mt-4 space-y-3">
          <select
            value={ext.protocol}
            onChange={(e) => setExt({ ...ext, protocol: e.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {["HTTP", "HTTPS", "SOCKS5"].map((p) => <option key={p}>{p}</option>)}
          </select>
          {[
            { key: "host", placeholder: "IP или hostname" },
            { key: "port", placeholder: "Порт" },
            { key: "username", placeholder: "Логин (необязательно)" },
            { key: "password", placeholder: "Пароль (необязательно)" },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              value={ext[key as keyof typeof ext]}
              onChange={(e) => setExt({ ...ext, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-error-500">{error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="primary" onClick={connect} disabled={!selected || loading}>
          {loading ? "Подключение..." : "Подключить"}
        </Button>
        <Button variant="outline" onClick={onClose}>Отмена</Button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<ApiAccount | null>(null);
  const [proxyAccountId, setProxyAccountId] = useState<number | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [goldenKey, setGoldenKey] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());

  function reload() {
    return accountsApi.list().then((rows) => setAccounts(Array.isArray(rows) ? rows : []));
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  async function act(key: string, fn: () => Promise<unknown>) {
    setPending((prev) => new Set(prev).add(key));
    try { await fn(); await reload(); } catch {} finally {
      setPending((prev) => { const n = new Set(prev); n.delete(key); return n; });
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!goldenKey.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      await accountsApi.add(goldenKey.trim());
      setGoldenKey("");
      setAddModal(false);
      await reload();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Ошибка добавления");
    } finally {
      setAdding(false);
    }
  }

  const stats = {
    total: accounts.length,
    runnerActive: accounts.filter((a) => a.runner_active).length,
    keeperOnline: accounts.filter((a) => a.keeper_active).length,
    raiserRunning: accounts.filter((a) => a.raiser_active).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Аккаунты</h1>
        <Button variant="primary" onClick={() => setAddModal(true)}>
          <Icon name="plus" className="mr-2 h-4 w-4" />
          Добавить аккаунт
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Всего аккаунтов", value: stats.total, icon: "group" },
          { label: "Runner активен", value: stats.runnerActive, icon: "bolt" },
          { label: "Keeper онлайн", value: stats.keeperOnline, icon: "check-circle" },
          { label: "Raiser работает", value: stats.raiserRunning, icon: "arrow-up" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                <Icon name={s.icon} className="h-6 w-6 text-brand-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accounts list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Icon name="group" className="h-12 w-12 text-gray-200" />
            <p className="mt-3 text-sm text-gray-400">Аккаунтов пока нет</p>
            <Button variant="primary" className="mt-4" onClick={() => setAddModal(true)}>
              Добавить первый аккаунт
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Name + keeper status */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-sm font-bold text-brand-500">
                      {(account.username ?? "#").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Dot active={account.keeper_active} color="success" />
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {account.username ?? `Аккаунт #${account.id}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {account.active_lots_count !== undefined ? `${account.active_lots_count} активных лотов` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Runner */}
                    <div className="flex items-center gap-1.5">
                      <Dot active={!!account.runner_active} color="success" />
                      <span className="text-xs text-gray-500">Runner</span>
                    </div>

                    {/* Proxy */}
                    <div className="flex items-center gap-1.5">
                      <Dot active={!!account.proxy_connected && !!account.proxy_healthy} color="success" />
                      <span className="text-xs text-gray-500">{account.proxy_label ?? "Прокси"}</span>
                    </div>

                    {/* Raiser */}
                    <div className="flex items-center gap-1.5">
                      <Dot active={account.raiser_active} color="warning" />
                      <span className="text-xs text-gray-500">Raiser</span>
                    </div>

                    {/* Runner toggle */}
                    <button
                      onClick={() => act(`runner-${account.id}`, () =>
                        account.runner_active
                          ? accountsApi.stopRuntime(account.id)
                          : accountsApi.startRuntime(account.id)
                      )}
                      disabled={pending.has(`runner-${account.id}`)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        account.runner_active
                          ? "border border-error-200 text-error-500 hover:bg-error-50"
                          : "bg-brand-500 text-white hover:opacity-90"
                      }`}
                    >
                      {pending.has(`runner-${account.id}`) ? "..." : account.runner_active ? "Стоп" : "Старт"}
                    </button>

                    {/* Details */}
                    <button
                      onClick={() => setDrawer(account)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add account modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} className="w-full max-w-md p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Добавить аккаунт FunPay</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Golden Key
            </label>
            <input
              value={goldenKey}
              onChange={(e) => setGoldenKey(e.target.value)}
              placeholder="Вставьте golden key из FunPay"
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          {addError && <p className="text-sm text-error-500">{addError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="primary" type="submit" disabled={adding || !goldenKey.trim()}>
              {adding ? "Добавление..." : "Добавить"}
            </Button>
            <Button variant="outline" type="button" onClick={() => setAddModal(false)}>Отмена</Button>
          </div>
        </form>
      </Modal>

      {/* Drawer */}
      {drawer && (
        <AccountDrawer
          account={drawer}
          onClose={() => setDrawer(null)}
          onStartRunner={() => act(`runner-${drawer.id}`, () => accountsApi.startRuntime(drawer.id))}
          onStopRunner={() => act(`runner-${drawer.id}`, () => accountsApi.stopRuntime(drawer.id))}
          onStartRaiser={() => act(`raiser-${drawer.id}`, () => accountsApi.startRaiser(drawer.id))}
          onStopRaiser={() => act(`raiser-${drawer.id}`, () => accountsApi.stopRaiser(drawer.id))}
          onProxy={() => { setProxyAccountId(drawer.id); setDrawer(null); }}
          onDelete={async () => {
            if (!confirm("Удалить аккаунт?")) return;
            await accountsApi.delete(drawer.id);
            setDrawer(null);
            await reload();
          }}
        />
      )}

      {/* Proxy modal */}
      {proxyAccountId !== null && (
        <ProxyModal
          accountId={proxyAccountId}
          onClose={() => setProxyAccountId(null)}
          onConnected={async () => { setProxyAccountId(null); await reload(); }}
        />
      )}
    </div>
  );
}
