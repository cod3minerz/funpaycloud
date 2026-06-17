"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { accountsApi, billingApi, proxiesApi, ApiAccount, MyProxyCredentials, MyProxyItem } from "@/lib/api";
import { Badge } from "@/platform2/components/ui/badge";
import { Button } from "@/platform2/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Modal } from "@/platform2/components/ui/modal";
import Select from "@/platform2/components/form/Select";
import Icon from "@/platform2/icons";

const productLabels: Record<string, string> = {
  free_shared: "Free",
  proxy_lite: "Lite",
  proxy_pro: "Pro",
  external_custom: "External",
};

const productDescriptions: Record<string, string> = {
  free_shared: "Бесплатный ресурс платформы, виден только пока назначен аккаунту.",
  proxy_lite: "Личный прокси на месяц для стабильной работы одного аккаунта.",
  proxy_pro: "Усиленный личный прокси с отдельным IPv4.",
  external_custom: "Ваш внешний прокси. Храним в инвентаре без ограничения по сроку.",
};

const statusLabels: Record<string, string> = {
  healthy: "Работает",
  degraded: "Проверить",
  unhealthy: "Проблема",
  expired: "Истёк",
};

function statusVariant(status: string) {
  if (status === "healthy") return "success";
  if (status === "degraded") return "warning";
  if (status === "unhealthy" || status === "expired") return "danger";
  return "secondary";
}

function formatDate(value?: string | null) {
  if (!value) return "Без срока";
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(value?: string | null) {
  if (!value) return Infinity;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

function endpoint(proxy: MyProxyItem) {
  return `${proxy.host}:${proxy.port}`;
}

function masked(value?: string) {
  return value ? value : "••••••••";
}

export default function MyProxiesPage() {
  const [items, setItems] = useState<MyProxyItem[]>([]);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<Record<number, MyProxyCredentials>>({});
  const [selectedAccount, setSelectedAccount] = useState<Record<number, string>>({});
  const [buyProduct, setBuyProduct] = useState<"proxy_lite" | "proxy_pro" | null>(null);
  const [buyAccountId, setBuyAccountId] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [assignProxyTarget, setAssignProxyTarget] = useState<MyProxyItem | null>(null);
  const [externalOpen, setExternalOpen] = useState(false);
  const [externalSaving, setExternalSaving] = useState(false);
  const [externalProxy, setExternalProxy] = useState({
    host: "",
    port: "8080",
    protocol: "HTTP" as "HTTP" | "HTTPS" | "SOCKS5",
    username: "",
    password: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [proxyResp, accountResp] = await Promise.all([
        proxiesApi.listMine(),
        accountsApi.list(),
      ]);
      setItems(proxyResp.items ?? []);
      setAccounts(accountResp);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить прокси";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => item.is_active && item.health_status === "healthy").length;
    const attention = items.filter((item) => item.health_status !== "healthy").length;
    const expiring = items.filter((item) => daysUntil(item.expires_at) <= 7 && daysUntil(item.expires_at) >= 0).length;
    return { total, active, attention, expiring };
  }, [items]);

  const accountOptions = accounts.map((account) => ({
    id: String(account.id),
    label: account.username || `Аккаунт #${account.id}`,
  }));

  async function revealCredentials(proxy: MyProxyItem) {
    if (credentials[proxy.id]) return;
    setBusyId(proxy.id);
    try {
      const creds = await proxiesApi.getCredentials(proxy.id);
      setCredentials((prev) => ({ ...prev, [proxy.id]: creds }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось открыть данные прокси";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function copyValue(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} скопирован`);
  }

  async function assignProxy(proxy: MyProxyItem) {
    const accountID = Number(selectedAccount[proxy.id]);
    if (!accountID) {
      toast.error("Выберите аккаунт");
      return;
    }
    setBusyId(proxy.id);
    try {
      await proxiesApi.assignMine(proxy.id, { account_id: accountID });
      toast.success("Прокси назначен");
      setAssignProxyTarget(null);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось назначить прокси";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function releaseProxy(proxy: MyProxyItem) {
    setBusyId(proxy.id);
    try {
      await proxiesApi.releaseMine(proxy.id);
      toast.success(proxy.is_shared_free ? "Бесплатный прокси освобождён" : "Прокси освобождён");
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось освободить прокси";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function checkProxy(proxy: MyProxyItem) {
    setBusyId(proxy.id);
    try {
      const result = await proxiesApi.checkMine(proxy.id);
      if (result.status === "healthy") {
        toast.success("Прокси отвечает");
      } else {
        toast.warning(result.error || "Прокси требует внимания");
      }
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось проверить прокси";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function buyProxy() {
    if (!buyProduct || !buyAccountId) {
      toast.error("Выберите аккаунт для покупки");
      return;
    }
    setBuyLoading(true);
    try {
      const response = await billingApi.createProxyPayment({
        account_id: Number(buyAccountId),
        product: buyProduct,
      });
      window.location.assign(response.checkout_url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось создать оплату";
      toast.error(message);
    } finally {
      setBuyLoading(false);
    }
  }

  async function saveExternalProxy() {
    setExternalSaving(true);
    try {
      await proxiesApi.createExternal({
        host: externalProxy.host.trim(),
        port: Number(externalProxy.port),
        protocol: externalProxy.protocol,
        username: externalProxy.username.trim() || undefined,
        password: externalProxy.password || undefined,
      });
      toast.success("Внешний прокси добавлен");
      setExternalOpen(false);
      setExternalProxy({ host: "", port: "8080", protocol: "HTTP", username: "", password: "" });
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось добавить прокси";
      toast.error(message);
    } finally {
      setExternalSaving(false);
    }
  }

  const renderSecretCell = (proxy: MyProxyItem) => {
    const creds = credentials[proxy.id];
    if (proxy.is_shared_free || proxy.product === "free_shared") {
      return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-400">
          Доступы скрыты, это ресурс сервиса.
        </div>
      );
    }

    if (!creds) {
      return (
        <Button size="sm" variant="outline" onClick={() => revealCredentials(proxy)} disabled={busyId === proxy.id || !proxy.has_credentials}>
          Показать доступы
        </Button>
      );
    }

    return (
      <div className="flex flex-wrap gap-2 text-sm">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/70">
          <span className="text-xs text-gray-400">Логин</span>
          <code className="max-w-[120px] truncate text-gray-700 dark:text-gray-200">
            {masked(creds.username)}
          </code>
          <button className="shrink-0 text-gray-400 hover:text-brand-500" onClick={() => copyValue(creds.username, "Логин")}>
            <Icon name="copy" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/70">
          <span className="text-xs text-gray-400">Пароль</span>
          <code className="max-w-[120px] truncate text-gray-700 dark:text-gray-200">
            {masked(creds.password)}
          </code>
          <button className="shrink-0 text-gray-400 hover:text-brand-500" onClick={() => copyValue(creds.password, "Пароль")}>
            <Icon name="copy" className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const openAssignModal = (proxy: MyProxyItem) => {
    setSelectedAccount((prev) => ({
      ...prev,
      [proxy.id]: prev[proxy.id] ?? (proxy.assigned_account_id ? String(proxy.assigned_account_id) : ""),
    }));
    setAssignProxyTarget(proxy);
  };

  const renderMetaChip = (label: string, value: string, tone: "default" | "success" | "warning" = "default") => {
    const toneClass =
      tone === "success"
        ? "border-success-500/20 bg-success-500/10 text-success-600 dark:text-success-400"
        : tone === "warning"
          ? "border-warning-500/20 bg-warning-500/10 text-warning-600 dark:text-warning-400"
          : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-300";
    return (
      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${toneClass}`}>
        <span className="text-gray-400">{label}</span>
        {value}
      </span>
    );
  };

  const renderActions = (proxy: MyProxyItem) => (
    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
      {!proxy.is_shared_free && (
        <Button size="sm" variant="outline" onClick={() => openAssignModal(proxy)} disabled={busyId === proxy.id}>
          Назначить
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => checkProxy(proxy)} disabled={busyId === proxy.id}>
        Проверить
      </Button>
      {proxy.assigned_account_id && (
        <Button size="sm" variant="secondary" onClick={() => releaseProxy(proxy)} disabled={busyId === proxy.id}>
          Освободить
        </Button>
      )}
    </div>
  );

  const renderProxyRow = (proxy: MyProxyItem) => (
    <div
      key={proxy.id}
      className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-brand-200 hover:bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30 dark:hover:bg-white/[0.03] xl:grid-cols-[minmax(260px,1.15fr)_minmax(260px,1fr)_minmax(210px,.75fr)_minmax(250px,.9fr)] xl:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={proxy.product === "proxy_pro" ? "primary" : "secondary"}>
            {productLabels[proxy.product] ?? proxy.product}
          </Badge>
          <Badge variant={statusVariant(proxy.health_status)}>
            {statusLabels[proxy.health_status] ?? proxy.health_status}
          </Badge>
        </div>
        <p className="mt-3 truncate font-mono text-base font-semibold text-gray-900 dark:text-white" title={endpoint(proxy)}>
          {endpoint(proxy)}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{productDescriptions[proxy.product]}</p>
      </div>

      <div className="min-w-0">{renderSecretCell(proxy)}</div>

      <div className="flex flex-wrap gap-2">
        {renderMetaChip("Срок", proxy.is_shared_free ? "Пока назначен" : formatDate(proxy.expires_at))}
        {renderMetaChip("Протокол", proxy.protocol)}
        {proxy.last_error && (
          <span className="line-clamp-2 text-xs text-error-500">{proxy.last_error}</span>
        )}
      </div>

      <div className="flex flex-col gap-3 xl:items-end">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 xl:text-right">Аккаунт</p>
          <p className="truncate font-semibold text-gray-900 dark:text-white" title={proxy.assigned_username || undefined}>
            {proxy.assigned_username || "Не назначен"}
          </p>
        </div>
        {renderActions(proxy)}
      </div>
    </div>
  );

  const renderProxyCard = (proxy: MyProxyItem) => (
    <Card key={proxy.id} className="overflow-hidden">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={proxy.product === "proxy_pro" ? "primary" : "secondary"}>
                {productLabels[proxy.product] ?? proxy.product}
              </Badge>
              <Badge variant={statusVariant(proxy.health_status)}>
                {statusLabels[proxy.health_status] ?? proxy.health_status}
              </Badge>
            </div>
            <p className="mt-3 font-semibold text-gray-900 dark:text-white">{endpoint(proxy)}</p>
            <p className="mt-1 text-sm text-gray-500">{productDescriptions[proxy.product]}</p>
          </div>
        </div>
        {renderSecretCell(proxy)}
        <div className="flex flex-wrap gap-2">
          {renderMetaChip("Срок", proxy.is_shared_free ? "Пока назначен" : formatDate(proxy.expires_at))}
          {renderMetaChip("Аккаунт", proxy.assigned_username || "Не назначен")}
        </div>
        {renderActions(proxy)}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Мои прокси</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управляйте платными, внешними и назначенными бесплатными прокси.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setExternalOpen(true)} startIcon={<Icon name="plus" className="h-4 w-4" />}>
            Добавить внешний
          </Button>
          <Button variant="secondary" onClick={() => { setBuyProduct("proxy_lite"); setBuyAccountId(""); }}>
            Купить Lite
          </Button>
          <Button variant="primary" onClick={() => { setBuyProduct("proxy_pro"); setBuyAccountId(""); }}>
            Купить Pro
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Всего прокси", stats.total],
          ["Активные", stats.active],
          ["Требуют внимания", stats.attention],
          ["Истекают скоро", stats.expiring],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden lg:block">
        <CardHeader className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Инвентарь</CardTitle>
            <span className="text-sm text-gray-500">{items.length} прокси</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500 dark:border-gray-800">
              Загружаем прокси...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500 dark:border-gray-800">
              Прокси пока нет. Купите Lite/Pro или добавьте внешний прокси.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(renderProxyRow)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:hidden">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">Загружаем прокси...</CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">Прокси пока нет.</CardContent>
          </Card>
        ) : (
          items.map(renderProxyCard)
        )}
      </div>

      <Modal isOpen={buyProduct !== null} onClose={() => setBuyProduct(null)} className="max-w-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Купить {buyProduct === "proxy_pro" ? "Proxy Pro" : "Proxy Lite"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Выберите аккаунт, которому подключим прокси сразу после успешной оплаты.
        </p>
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Аккаунт</label>
          <Select value={buyAccountId} onChange={setBuyAccountId}>
            <option value="">Выберите аккаунт</option>
            {accountOptions.map((account) => (
              <option key={account.id} value={account.id}>{account.label}</option>
            ))}
          </Select>
        </div>
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setBuyProduct(null)}>Отмена</Button>
          <Button className="flex-1" onClick={buyProxy} disabled={buyLoading || !buyAccountId}>
            {buyLoading ? "Создаём..." : "Перейти к оплате"}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={assignProxyTarget !== null} onClose={() => setAssignProxyTarget(null)} className="max-w-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Назначить прокси</h2>
        <p className="mt-2 text-sm text-gray-500">
          Выберите аккаунт для {assignProxyTarget ? endpoint(assignProxyTarget) : "прокси"}.
        </p>
        {assignProxyTarget && (
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Аккаунт</label>
            <Select
              value={selectedAccount[assignProxyTarget.id] ?? ""}
              onChange={(value) => setSelectedAccount((prev) => ({ ...prev, [assignProxyTarget.id]: value }))}
            >
              <option value="">Выберите аккаунт</option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>{account.label}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setAssignProxyTarget(null)}>Отмена</Button>
          <Button
            className="flex-1"
            onClick={() => assignProxy(assignProxyTarget!)}
            disabled={!assignProxyTarget || !selectedAccount[assignProxyTarget.id] || busyId === assignProxyTarget.id}
          >
            Назначить
          </Button>
        </div>
      </Modal>

      <Modal isOpen={externalOpen} onClose={() => setExternalOpen(false)} className="max-w-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Добавить внешний прокси</h2>
        <p className="mt-2 text-sm text-gray-500">
          Мы проверим подключение перед сохранением. Назначить аккаунт можно будет из таблицы.
        </p>
        <div className="mt-6 grid gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Протокол</label>
            <Select
              value={externalProxy.protocol}
              onChange={(value) => setExternalProxy((prev) => ({ ...prev, protocol: value as "HTTP" | "HTTPS" | "SOCKS5" }))}
            >
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="SOCKS5">SOCKS5</option>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Хост</label>
              <input
                value={externalProxy.host}
                onChange={(event) => setExternalProxy((prev) => ({ ...prev, host: event.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="1.2.3.4"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Порт</label>
              <input
                value={externalProxy.port}
                onChange={(event) => setExternalProxy((prev) => ({ ...prev, port: event.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="8080"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Логин</label>
              <input
                value={externalProxy.username}
                onChange={(event) => setExternalProxy((prev) => ({ ...prev, username: event.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Необязательно"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Пароль</label>
              <input
                value={externalProxy.password}
                onChange={(event) => setExternalProxy((prev) => ({ ...prev, password: event.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Необязательно"
                type="password"
              />
            </div>
          </div>
        </div>
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setExternalOpen(false)}>Отмена</Button>
          <Button className="flex-1" onClick={saveExternalProxy} disabled={externalSaving || !externalProxy.host || !externalProxy.port}>
            {externalSaving ? "Проверяем..." : "Сохранить"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
