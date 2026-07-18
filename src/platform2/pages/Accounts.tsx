"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { Badge } from "@/platform2/components/ui/badge";
import { Modal } from "@/platform2/components/ui/modal";
import Select from "@/platform2/components/form/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";
import Icon from "@/platform2/icons";
import {
  accountOnboardingApi,
  accountsApi,
  billingApi,
  proxiesApi,
  ApiAccount,
  AccountOnboarding,
  ApiError,
  MyProxyItem,
} from "@/lib/api";
import { toast } from "sonner";

type Account = {
  id: string;
  apiId: number;
  username: string;
  funpayId: string;
  status: "online" | "offline";
  runner: boolean;
  keeper: boolean;
  raiser: boolean;
  proxy: string;
  proxyConnected: boolean;
  eventsToday: number;
  lastEvent: string;
  sessionUpdated: string;
};

const GOLDEN_KEY_PATTERN = /^[A-Za-z0-9]{20,64}$/;

function mapApiAccount(a: ApiAccount): Account {
  return {
    id: String(a.id),
    apiId: a.id,
    username: a.username ?? `#${a.id}`,
    funpayId: String(a.funpay_user_id ?? ""),
    status: a.keeper_active ? "online" : "offline",
    runner: a.runner_active ?? false,
    keeper: a.keeper_active,
    raiser: a.raiser_active,
    proxy: a.proxy_label ?? (a.proxy_connected ? "Прокси подключён" : "Нет прокси"),
    proxyConnected: a.proxy_connected ?? false,
    eventsToday: a.runner_events_today ?? 0,
    lastEvent: a.runner_last_event_at
      ? new Date(a.runner_last_event_at).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      : "—",
    sessionUpdated: "—",
  };
}

const proxyOptions = [
  {
    id: "free",
    title: "Бесплатный прокси",
    description: "Делите прокси только с одним продавцом FunPay. Быстрый старт без оплаты, пока есть свободный слот.",
    action: "Подключить",
    icon: "lock" as const,
    available: true,
  },
  {
    id: "proxy_lite",
    title: "Proxy Lite",
    description: "Личный прокси на месяц для стабильной работы одного аккаунта без ручных настроек.",
    action: "79 ₽/мес",
    icon: "user-circle" as const,
    available: true,
  },
  {
    id: "proxy_pro",
    title: "Proxy Pro",
    description: "Усиленный личный прокси на месяц с отдельным IPv4 для максимальной стабильности.",
    action: "139 ₽/мес",
    icon: "lock" as const,
    available: true,
  },
  {
    id: "external",
    title: "Свой прокси",
    description: "Выберите свободный прокси из «Моих прокси» или добавьте новый.",
    action: "Выбрать",
    icon: "plug-in" as const,
    available: true,
  },
];

export default function AccountsPage() {
  const [isAddModal, setIsAddModal] = useState(false);
  const [addStep, setAddStep] = useState<"proxy" | "owned" | "external" | "payment" | "key">("proxy");
  const [onboarding, setOnboarding] = useState<AccountOnboarding | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [ownedProxies, setOwnedProxies] = useState<MyProxyItem[]>([]);
  const [ownedProxiesLoading, setOwnedProxiesLoading] = useState(false);
  const [isProxyModal, setIsProxyModal] = useState(false);
  const [isExternalProxyModal, setIsExternalProxyModal] = useState(false);
  const [drawerAccount, setDrawerAccount] = useState<Account | null>(null);
  const [goldenKey, setGoldenKey] = useState("");
  const [extProxy, setExtProxy] = useState({ host: "", port: "8080", protocol: "HTTP", login: "", password: "" });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [proxyTarget, setProxyTarget] = useState<Account | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "online" | "offline">("");
  const [runningAll, setRunningAll] = useState(false);
  const [stoppingAll, setStoppingAll] = useState(false);
  const [raiserTogglingIds, setRaiserTogglingIds] = useState<Set<string>>(new Set());
  const [proxyPaymentLoading, setProxyPaymentLoading] = useState(false);
  const [showProxyBanner, setShowProxyBanner] = useState(false);
  const currentProxyTarget = useMemo(
    () => proxyTarget ? accounts.find((account) => account.apiId === proxyTarget.apiId) ?? null : null,
    [accounts, proxyTarget],
  );

  function resetAddWizard() {
    setIsAddModal(false);
    setAddStep("proxy");
    setOnboarding(null);
    setGoldenKey("");
    setOwnedProxies([]);
    setExtProxy({ host: "", port: "8080", protocol: "HTTP", login: "", password: "" });
  }

  function openAddWizard() {
    setAddStep("proxy");
    setOnboarding(null);
    setGoldenKey("");
    setOwnedProxies([]);
    setIsAddModal(true);
  }

  function closeAddModal() {
    if (addingAccount || onboardingLoading) return;
    if (onboarding && onboarding.status !== "completed") {
      void accountOnboardingApi.cancel(onboarding.id).catch(() => {});
    }
    resetAddWizard();
  }

  async function changeOnboardingProxy() {
    if (onboarding && onboarding.status !== "completed") {
      await accountOnboardingApi.cancel(onboarding.id).catch(() => {});
    }
    setOnboarding(null);
    setGoldenKey("");
    setAddStep("proxy");
  }

  async function loadOwnedProxies() {
    setOwnedProxiesLoading(true);
    try {
      const response = await proxiesApi.listMine();
      setOwnedProxies((response.items || []).filter((item) => (
        item.is_active
        && !item.is_shared_free
        && !item.assigned_account_id
        && item.health_status !== "unhealthy"
        && item.health_status !== "expired"
      )));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить «Мои прокси»");
    } finally {
      setOwnedProxiesLoading(false);
    }
  }

  function closeProxyFlow() {
    setIsProxyModal(false);
    setIsExternalProxyModal(false);
    setProxyTarget(null);
  }

  async function refreshProxyTarget(): Promise<Account | null> {
    if (!proxyTarget) {
      closeProxyFlow();
      return null;
    }
    try {
      const freshAccounts = (await accountsApi.list()).map(mapApiAccount);
      setAccounts(freshAccounts);
      const freshTarget = freshAccounts.find((account) => account.apiId === proxyTarget.apiId) ?? null;
      if (!freshTarget) {
        toast.error("Аккаунт больше недоступен. Обновите список и выберите его снова.");
        closeProxyFlow();
        return null;
      }
      setProxyTarget(freshTarget);
      return freshTarget;
    } catch {
      toast.error("Не удалось обновить список аккаунтов. Попробуйте ещё раз.");
      return null;
    }
  }

  useEffect(() => {
    accountsApi.list()
      .then((list) => setAccounts(list.map(mapApiAccount)))
      .catch(() => {})
      .finally(() => setAccountsLoading(false));
  }, []);

  useEffect(() => {
    if (!proxyTarget) return;
    if (!currentProxyTarget) {
      setIsProxyModal(false);
      setIsExternalProxyModal(false);
      setProxyTarget(null);
      return;
    }
    if (currentProxyTarget !== proxyTarget) {
      setProxyTarget(currentProxyTarget);
    }
  }, [currentProxyTarget, proxyTarget]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const onboardingId = params.get("accountOnboarding");
    const proxyPayment = params.get("proxyPayment");
    const paymentId = params.get("paymentId");

    if (onboardingId) {
      let stopped = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      setIsAddModal(true);
      setAddStep("payment");

      const pollOnboarding = async (attempt = 0) => {
        if (stopped) return;
        if (attempt >= 40) {
          toast.error("Выдача прокси заняла больше времени. Прокси останется в «Моих прокси».");
          return;
        }
        try {
          const session = await accountOnboardingApi.get(onboardingId);
          if (stopped) return;
          setOnboarding(session);
          if (session.status === "ready") {
            setAddStep("key");
            toast.success("Прокси готов. Введите Golden Key.");
            window.setTimeout(() => window.history.replaceState(null, "", "/platform/accounts"), 50);
            return;
          }
          if (session.status === "completed") {
            const list = await accountsApi.list();
            if (!stopped) {
              setAccounts(list.map(mapApiAccount));
              resetAddWizard();
            }
            return;
          }
          if (session.status === "failed") {
            setAddStep("payment");
            toast.error("Оплата или выдача прокси не завершилась.");
            return;
          }
          if (session.status === "expired" || session.status === "cancelled") {
            toast.error("Сессия добавления аккаунта больше неактивна.");
            setAddStep("proxy");
            return;
          }
        } catch (error) {
          if (attempt === 0) {
            toast.error(error instanceof Error ? error.message : "Не удалось восстановить мастер");
          }
        }
        timer = setTimeout(() => void pollOnboarding(attempt + 1), 3000);
      };

      if (proxyPayment === "failed") {
        toast.error("Оплата прокси не прошла");
      } else {
        toast.message("Проверяем оплату и выдаём прокси…");
      }
      void pollOnboarding();
      return () => {
        stopped = true;
        if (timer) clearTimeout(timer);
      };
    }

    if (!proxyPayment || !paymentId) return;

    window.history.replaceState(null, "", "/platform/accounts");
    if (proxyPayment === "failed") {
      toast.error("Оплата прокси не прошла");
      return;
    }

    function pollProvision(pid: string, attempts = 0) {
      if (attempts >= 20) {
        toast.error("Прокси подключается дольше обычного. Обратитесь в @fpcloud_support");
        return;
      }
      billingApi.getProxyCheckoutStatus(pid)
        .then((status) => {
          if (status.status === "paid" && status.provision_status === "success") {
            toast.success("Прокси оплачен и подключён!");
            accountsApi.list().then((list) => setAccounts(list.map(mapApiAccount))).catch(() => {});
          } else if (status.status === "paid" && status.provision_status === "failed") {
            toast.error(status.provision_error || "Оплата прошла, но прокси не подключился. Напишите в @fpcloud_support");
          } else if (status.status === "failed") {
            toast.error("Оплата прокси не прошла");
          } else {
            // pending provision or pending payment — poll again
            setTimeout(() => pollProvision(pid, attempts + 1), 3000);
          }
        })
        .catch(() => {
          setTimeout(() => pollProvision(pid, attempts + 1), 3000);
        });
    }

    billingApi.getProxyCheckoutStatus(paymentId)
      .then((status) => {
        if (status.status === "failed") {
          toast.error("Оплата прокси не прошла");
        } else if (status.status === "paid" && status.provision_status === "success") {
          toast.success("Прокси оплачен и подключён!");
          accountsApi.list().then((list) => setAccounts(list.map(mapApiAccount))).catch(() => {});
        } else if (status.status === "paid" && status.provision_status === "failed") {
          toast.error(status.provision_error || "Оплата прошла, но прокси не подключился. Напишите в @fpcloud_support");
        } else {
          // paid but provision still pending, or status unknown — start polling
          toast.message("Оплата прошла, подключаем прокси...");
          setTimeout(() => pollProvision(paymentId, 1), 3000);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Не удалось проверить статус оплаты";
        toast.error(message);
      });
  }, []);

  async function createOnboarding(payload: Parameters<typeof accountOnboardingApi.create>[0]) {
    setOnboardingLoading(true);
    try {
      const session = await accountOnboardingApi.create(payload);
      setOnboarding(session);
      if (session.next_action === "pay" && session.checkout_url) {
        toast.success("Переходим к оплате T-Bank…");
        window.location.assign(session.checkout_url);
        return;
      }
      setAddStep(session.status === "ready" ? "key" : "payment");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось подготовить прокси");
    } finally {
      setOnboardingLoading(false);
    }
  }

  async function handleOnboardingProxyChoice(id: string) {
    if (id === "free") {
      await createOnboarding({ mode: "free" });
    } else if (id === "proxy_lite" || id === "proxy_pro") {
      await createOnboarding({ mode: "paid", product: id });
    } else {
      setAddStep("owned");
      await loadOwnedProxies();
    }
  }

  async function handleOwnedProxyChoice(proxyId: number) {
    await createOnboarding({ mode: "owned", proxy_id: proxyId });
  }

  async function handleCreateExternalOnboarding() {
    const port = Number(extProxy.port);
    if (!extProxy.host.trim() || !Number.isInteger(port) || port <= 0 || port > 65535) {
      toast.error("Укажите корректные хост и порт прокси.");
      return;
    }
    await createOnboarding({
      mode: "external",
      external_proxy: {
        host: extProxy.host.trim(),
        port,
        protocol: extProxy.protocol as "HTTP" | "HTTPS" | "SOCKS5",
        username: extProxy.login.trim() || undefined,
        password: extProxy.password || undefined,
      },
    });
  }

  async function handleCompleteOnboarding() {
    const normalizedKey = goldenKey.trim();
    if (!GOLDEN_KEY_PATTERN.test(normalizedKey)) {
      toast.error("Golden Key должен содержать от 20 до 64 латинских букв или цифр.");
      return;
    }
    if (!onboarding || onboarding.status !== "ready") {
      toast.error("Сначала выберите и дождитесь готовности прокси.");
      return;
    }
    setAddingAccount(true);
    try {
      await accountOnboardingApi.complete(onboarding.id, normalizedKey);
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      toast.success("Аккаунт успешно добавлен через выбранный прокси");
      setShowProxyBanner(false);
      resetAddWizard();
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast.error(apiError?.message || "Не удалось добавить аккаунт. Попробуйте ещё раз.");
      if (apiError?.code === "invalid_golden_key" || apiError?.code === "funpay_account_already_linked") {
        setGoldenKey("");
      }
    } finally {
      setAddingAccount(false);
    }
  }

  async function handleDeleteAccount(acc: Account) {
    try {
      await accountsApi.delete(acc.apiId);
      setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
      if (drawerAccount?.id === acc.id) setDrawerAccount(null);
      if (proxyTarget?.id === acc.id) closeProxyFlow();
      toast.success(`Аккаунт ${acc.username} удалён`);
    } catch {
      toast.error("Не удалось удалить аккаунт");
    }
  }

  async function handleStopRuntime(acc: Account) {
    try {
      await accountsApi.stopRuntime(acc.apiId);
      setAccounts((prev) => prev.map((a) => a.id === acc.id ? { ...a, runner: false } : a));
      if (drawerAccount?.id === acc.id) setDrawerAccount((d) => d ? { ...d, runner: false } : d);
      toast.success("Runner остановлен");
    } catch {
      toast.error("Не удалось остановить Runner");
    }
  }

  async function handleStartRuntime(acc: Account) {
    try {
      await accountsApi.startRuntime(acc.apiId);
      setAccounts((prev) => prev.map((a) => a.id === acc.id ? { ...a, runner: true } : a));
      if (drawerAccount?.id === acc.id) setDrawerAccount((d) => d ? { ...d, runner: true } : d);
      toast.success("Runner запущен");
    } catch {
      toast.error("Не удалось запустить Runner");
    }
  }

  async function handleToggleRaiser(acc: Account) {
    setRaiserTogglingIds((prev) => new Set(prev).add(acc.id));
    try {
      if (acc.raiser) {
        await accountsApi.stopRaiser(acc.apiId);
      } else {
        await accountsApi.startRaiser(acc.apiId);
      }
      const updated = { ...acc, raiser: !acc.raiser };
      setAccounts((prev) => prev.map((a) => a.id === acc.id ? updated : a));
      if (drawerAccount?.id === acc.id) setDrawerAccount(updated);
      toast.success(acc.raiser ? "Raiser остановлен" : "Raiser запущен");
    } catch {
      toast.error("Не удалось переключить Raiser");
    } finally {
      setRaiserTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(acc.id);
        return next;
      });
    }
  }

  async function handleConnectFreeProxy() {
    const target = await refreshProxyTarget();
    if (!target) return;
    try {
      await accountsApi.connectProxy(target.apiId, "free");
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      toast.success("Бесплатный прокси подключён");
    } catch {
      toast.error("Не удалось подключить прокси");
    }
    closeProxyFlow();
  }

  async function handlePaidProxyPayment(product: "proxy_lite" | "proxy_pro") {
    const target = await refreshProxyTarget();
    if (!target) return;
    setProxyPaymentLoading(true);
    try {
      const result = await billingApi.createProxyPayment({ account_id: target.apiId, product });
      toast.success("Переходим к оплате T-Bank...");
      if (result.checkout_url) {
        window.location.assign(result.checkout_url);
        return;
      }
      throw new Error("Банк не вернул ссылку на оплату");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось создать платеж";
      toast.error(message);
    } finally {
      setProxyPaymentLoading(false);
    }
  }

  async function handleConnectExternalProxy() {
    if (!extProxy.host || !extProxy.port) return;
    const target = await refreshProxyTarget();
    if (!target) return;
    try {
      await accountsApi.connectProxy(target.apiId, {
        mode: "external",
        protocol: extProxy.protocol as "HTTP" | "HTTPS" | "SOCKS5",
        host: extProxy.host,
        port: parseInt(extProxy.port),
        username: extProxy.login || undefined,
        password: extProxy.password || undefined,
      });
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      toast.success("Внешний прокси подключён");
    } catch {
      toast.error("Не удалось подключить прокси. Проверьте данные.");
    }
    closeProxyFlow();
  }

  async function handleStartAll() {
    setRunningAll(true);
    try {
      await accountsApi.startAllRuntime();
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      toast.success("Все Runner запущены");
    } catch {
      toast.error("Не удалось запустить все Runner");
    } finally {
      setRunningAll(false);
    }
  }

  async function handleStopAll() {
    setStoppingAll(true);
    try {
      await accountsApi.stopAllRuntime();
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      toast.success("Все Runner остановлены");
    } catch {
      toast.error("Не удалось остановить все Runner");
    } finally {
      setStoppingAll(false);
    }
  }

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((a) => !search || a.username.toLowerCase().includes(search.toLowerCase()))
      .filter((a) => !filterStatus || a.status === filterStatus);
  }, [accounts, search, filterStatus]);

  const stats = {
    total: accounts.length,
    runnerActive: accounts.filter((a) => a.runner).length,
    keeperOnline: accounts.filter((a) => a.keeper).length,
    raiserRunning: accounts.filter((a) => a.raiser).length,
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Аккаунты</h1>
          <p className="text-sm text-gray-500">Управление FunPay аккаунтами</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="whitespace-nowrap"
            onClick={handleStartAll}
            disabled={runningAll}
          >
            <Icon name="bolt" className="mr-2 h-4 w-4" />
            {runningAll ? "Запуск…" : "Запустить всё"}
          </Button>
          <Button
            variant="outline"
            className="whitespace-nowrap"
            onClick={handleStopAll}
            disabled={stoppingAll}
          >
            <Icon name="close" className="mr-2 h-4 w-4" />
            {stoppingAll ? "Остановка…" : "Остановить всё"}
          </Button>
          <Button variant="primary" className="whitespace-nowrap" onClick={openAddWizard}>
            <Icon name="plus" className="mr-2 h-4 w-4" />
            Добавить аккаунт
          </Button>
        </div>
      </div>

      {/* БАННЕР: подключите прокси после добавления аккаунта */}
      {showProxyBanner && (
        <div className="flex items-start gap-4 rounded-xl border border-warning-300 bg-warning-50 p-4 dark:border-warning-700/40 dark:bg-warning-950/20">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-500/10">
            <Icon name="alert" className="h-5 w-5 text-warning-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-warning-800 dark:text-warning-300">Аккаунт добавлен — подключите прокси</p>
            <p className="mt-0.5 text-sm text-warning-700/80 dark:text-warning-400/80">
              Без прокси воркер не запустится. Нажмите «Открыть» у аккаунта и выберите прокси — или сделайте это прямо сейчас.
            </p>
          </div>
          <button
            onClick={() => setShowProxyBanner(false)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-warning-400 hover:text-warning-600"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Аккаунтов</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</h3>
                <p className="mt-1 text-xs text-gray-400">Всего в управлении</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
                <Icon name="group" className="h-6 w-6 text-brand-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Runner активен</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{stats.runnerActive}</h3>
                <p className="mt-1 text-xs text-gray-400">Ловит события прямо сейчас</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-500/10">
                <Icon name="check-circle" className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Keeper онлайн</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{stats.keeperOnline}</h3>
                <p className="mt-1 text-xs text-gray-400">Сессии поддерживаются</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-500/10">
                <Icon name="bolt" className="h-6 w-6 text-warning-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Raiser запущен</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{stats.raiserRunning}</h3>
                <p className="mt-1 text-xs text-gray-400">Автоподнятие включено</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-500/10">
                <Icon name="arrow-up" className="h-6 w-6 text-error-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Список аккаунтов</CardTitle>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Поиск"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 min-w-0 flex-1 sm:flex-none sm:w-48 rounded-lg border border-gray-300 bg-white px-4 text-sm shadow-theme-xs outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
              <Select
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as "" | "online" | "offline")}
                className="flex-1 sm:flex-none sm:w-40"
              >
                <option value="">Все статусы</option>
                <option value="online">Онлайн</option>
                <option value="offline">Оффлайн</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {accountsLoading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 mb-4">
                <Icon name="plug-in" className="h-8 w-8 text-brand-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Добавьте первый аккаунт FunPay
              </h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Чтобы начать автоматизацию, введите Golden Key из настроек профиля на FunPay.
              </p>
              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
                <a
                  href="/blog/kak-naiti-golden-key-funpay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-500 underline underline-offset-2 hover:text-brand-600"
                >
                  Где найти Golden Key →
                </a>
                <Button variant="primary" onClick={() => setIsAddModal(true)}>
                  <Icon name="plus" className="mr-2 h-4 w-4" />
                  Добавить аккаунт
                </Button>
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Аккаунт</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Статусы</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Прокси</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Действия</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-500 text-sm font-semibold text-white">
                          {account.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{account.username}</p>
                          <div className="flex items-center gap-1.5">
                            {account.status === "online" ? (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-500" />
                              </span>
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                            )}
                            <p className="text-sm text-gray-400">{account.status === "online" ? "Онлайн" : "Оффлайн"}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${account.runner ? "bg-success-500/10 text-success-600" : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"}`}>
                          Runner
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${account.keeper ? "bg-success-500/10 text-success-600" : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"}`}>
                          Keeper
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${account.raiser ? "bg-success-500/10 text-success-600" : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"}`}>
                          Raiser
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {account.proxyConnected ? (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
                          </span>
                        ) : (
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning-400" />
                          </span>
                        )}
                        <span className={`text-sm ${account.proxyConnected ? "text-gray-700 dark:text-gray-300" : "text-warning-600 dark:text-warning-400"}`}>
                          {account.proxy}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDrawerAccount(account)}>
                          Открыть
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setProxyTarget(account); setIsProxyModal(true); }}>
                          Сменить прокси
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* ── MODAL: Proxy-first account onboarding ── */}
      <Modal
        isOpen={isAddModal}
        onClose={closeAddModal}
        showCloseButton={false}
        className="w-[min(980px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] overflow-y-auto p-5 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Новый аккаунт</h2>
            <p className="mt-1 text-sm text-gray-500">
              {addStep === "proxy" && "Шаг 1 из 2 · Выберите прокси для проверки Golden Key."}
              {(addStep === "owned" || addStep === "external") && "Шаг 1 из 2 · Подготовьте свой прокси."}
              {addStep === "payment" && "Ожидаем оплату и выдачу прокси."}
              {addStep === "key" && "Шаг 2 из 2 · Введите Golden Key."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Закрыть мастер"
            disabled={addingAccount || onboardingLoading}
            onClick={closeAddModal}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {addStep === "proxy" && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="onboarding-proxy-picker">
            {proxyOptions.map((opt) => (
              <button
                type="button"
                key={opt.id}
                disabled={onboardingLoading}
                onClick={() => void handleOnboardingProxyChoice(opt.id)}
                className="flex min-h-64 flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-400 hover:shadow-md disabled:cursor-wait disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
                  <Icon name={opt.icon} className="h-6 w-6 text-brand-500" />
                </div>
                <p className="mt-5 font-bold text-gray-900 dark:text-white">{opt.title}</p>
                <p className="mt-2 flex-1 text-sm text-gray-500">{opt.description}</p>
                <span className="mt-5 text-sm font-semibold text-brand-600">
                  {onboardingLoading ? "Подготовка…" : opt.action}
                </span>
              </button>
            ))}
          </div>
        )}

        {addStep === "owned" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Свободные прокси в вашем инвентаре</h3>
              <Button variant="outline" size="sm" onClick={() => setAddStep("external")}>
                <Icon name="plus" className="h-4 w-4" /> Добавить новый
              </Button>
            </div>
            <div className="mt-4 space-y-3" data-testid="owned-proxy-list">
              {ownedProxiesLoading && <p className="py-8 text-center text-sm text-gray-500">Загружаем прокси…</p>}
              {!ownedProxiesLoading && ownedProxies.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500">Свободных прокси нет.</p>
                  <Button variant="primary" size="sm" className="mt-4" onClick={() => setAddStep("external")}>
                    Добавить свой прокси
                  </Button>
                </div>
              )}
              {ownedProxies.map((proxy) => (
                <button
                  type="button"
                  key={proxy.id}
                  disabled={onboardingLoading}
                  onClick={() => void handleOwnedProxyChoice(proxy.id)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 text-left hover:border-brand-400 disabled:opacity-60 dark:border-gray-700"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{proxy.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{proxy.protocol} · {proxy.health_status === "healthy" ? "Готов" : "Требует проверки"}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-600">Выбрать</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setAddStep("proxy")}>Назад</Button>
              <Button variant="outline" onClick={closeAddModal}>Отмена</Button>
            </div>
          </div>
        )}

        {addStep === "external" && (
          <div className="mt-6 max-w-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white">Новый свой прокси</h3>
            <p className="mt-1 text-sm text-gray-500">Реквизиты проверяются и хранятся в зашифрованном виде.</p>
            <div className="mt-5 space-y-3">
              <select
                aria-label="Протокол прокси"
                value={extProxy.protocol}
                onChange={(e) => setExtProxy((p) => ({ ...p, protocol: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option>HTTP</option><option>HTTPS</option><option>SOCKS5</option>
              </select>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <input aria-label="Хост прокси" value={extProxy.host} onChange={(e) => setExtProxy((p) => ({ ...p, host: e.target.value }))} placeholder="host.com" autoComplete="off" className="rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                <input aria-label="Порт прокси" type="number" value={extProxy.port} onChange={(e) => setExtProxy((p) => ({ ...p, port: e.target.value }))} placeholder="8080" className="rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input aria-label="Логин прокси" value={extProxy.login} onChange={(e) => setExtProxy((p) => ({ ...p, login: e.target.value }))} placeholder="Логин (необязательно)" autoComplete="off" className="rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                <input aria-label="Пароль прокси" type="password" value={extProxy.password} onChange={(e) => setExtProxy((p) => ({ ...p, password: e.target.value }))} placeholder="Пароль (необязательно)" autoComplete="new-password" className="rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" disabled={onboardingLoading} onClick={() => setAddStep("owned")}>Назад</Button>
              <Button variant="primary" disabled={onboardingLoading || !extProxy.host || !extProxy.port} onClick={() => void handleCreateExternalOnboarding()}>
                {onboardingLoading ? "Проверяем…" : "Проверить и выбрать"}
              </Button>
            </div>
          </div>
        )}

        {addStep === "payment" && (
          <div className="mt-8 rounded-2xl border border-gray-200 p-8 text-center dark:border-gray-700">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10">
              <Icon name={onboarding?.status === "failed" ? "alert" : "bolt"} className="h-7 w-7 text-brand-500" />
            </div>
            <h3 className="mt-4 font-bold text-gray-900 dark:text-white">
              {onboarding?.status === "failed" ? "Прокси не был выдан" : "Готовим прокси"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {onboarding?.status === "failed"
                ? "Если оплата прошла, напишите в @fpcloud_support. Назначение аккаунту не выполнено."
                : "После выдачи мастер сам перейдёт к вводу Golden Key."}
            </p>
            {onboarding?.status === "failed" && (
              <Button variant="outline" className="mt-5" onClick={() => void changeOnboardingProxy()}>Выбрать другой прокси</Button>
            )}
          </div>
        )}

        {addStep === "key" && onboarding?.status === "ready" && (
          <div className="mt-6 max-w-xl">
            <input
              type="password"
              data-testid="golden-key-input"
              name="funpay-golden-key"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={goldenKey}
              onChange={(e) => setGoldenKey(e.target.value)}
              placeholder="Golden Key (20–64 символа)"
              className="w-full rounded-xl border border-brand-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none ring-2 ring-brand-500/20 focus:border-brand-400 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-400">Найти в настройках профиля на FunPay</p>
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/20" data-testid="selected-onboarding-proxy">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-500">Выбранный прокси</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{onboarding.proxy.label}</p>
              {onboarding.proxy.id && <p className="mt-1 text-xs text-gray-500">ID: {onboarding.proxy.id}</p>}
            </div>
            {addingAccount && (
              <div
                className="mt-5 rounded-xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-800 dark:bg-brand-950/20"
                data-testid="account-onboarding-wait"
                aria-live="polite"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-100">Ожидание ответа FunPay…</span>
                  <span className="shrink-0 text-xs text-gray-500">до 45 секунд</span>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-950"
                  role="progressbar"
                  aria-label="Ожидание ответа FunPay"
                  aria-valuemin={0}
                  aria-valuemax={45}
                >
                  <div
                    className="account-onboarding-progress h-full origin-left rounded-full bg-brand-500"
                    data-testid="account-onboarding-progress"
                    data-duration-ms="45000"
                  />
                </div>
                <style jsx>{`
                  .account-onboarding-progress {
                    animation: account-onboarding-progress 45s linear forwards;
                  }

                  @keyframes account-onboarding-progress {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                  }
                `}</style>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" disabled={addingAccount} onClick={() => void changeOnboardingProxy()}>Изменить прокси</Button>
              <Button variant="outline" disabled={addingAccount} onClick={closeAddModal}>Отмена</Button>
              <Button variant="primary" disabled={!GOLDEN_KEY_PATTERN.test(goldenKey.trim()) || addingAccount} onClick={() => void handleCompleteOnboarding()}>
                {addingAccount ? "Ожидание…" : "Добавить аккаунт"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: Proxy picker ── */}
      <Modal
        isOpen={isProxyModal}
        onClose={closeProxyFlow}
        className="w-[min(1120px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] overflow-y-auto p-5 sm:p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Выберите прокси</h2>
        <p className="mt-1 text-sm text-gray-500">
          Аккаунт:{" "}
          <span className="font-semibold text-gray-800 dark:text-white">
            {currentProxyTarget?.username ?? "—"}
          </span>
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {proxyOptions.map((opt) => (
            <div
              key={opt.id}
              className="relative flex min-h-[340px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
            >
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white leading-snug">{opt.title}</p>
                <p className="mt-2 text-sm text-gray-500">{opt.description}</p>
              </div>
              <div className="mt-8 flex justify-center py-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg">
                  <Icon name={opt.icon} className="h-10 w-10 text-white" />
                </div>
              </div>
              <button
                disabled={!opt.available || ((opt.id === "proxy_lite" || opt.id === "proxy_pro") && proxyPaymentLoading)}
                onClick={() => {
                  if (opt.id === "external") {
                    setIsProxyModal(false);
                    setIsExternalProxyModal(true);
                  } else if (opt.id === "free") {
                    handleConnectFreeProxy();
                  } else if (opt.id === "proxy_lite" || opt.id === "proxy_pro") {
                    handlePaidProxyPayment(opt.id);
                  } else {
                    closeProxyFlow();
                  }
                }}
                className={`mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium leading-tight transition-colors ${
                  opt.available && !((opt.id === "proxy_lite" || opt.id === "proxy_pro") && proxyPaymentLoading)
                    ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900"
                }`}
              >
                <Icon name="plug-in" className="h-4 w-4" />
                {(opt.id === "proxy_lite" || opt.id === "proxy_pro") && proxyPaymentLoading ? "Создаем..." : opt.action}
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── MODAL: External proxy ── */}
      <Modal isOpen={isExternalProxyModal} onClose={closeProxyFlow} className="max-w-lg p-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Настройка внешнего прокси</h2>
        <p className="mt-1 text-sm text-gray-500">
          Аккаунт: <span className="font-semibold text-gray-800 dark:text-white">{currentProxyTarget?.username ?? "—"}</span>
        </p>

        <div className="mt-6 space-y-3">
          {/* Protocol */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Протокол</label>
            <select
              value={extProxy.protocol}
              onChange={(e) => setExtProxy((p) => ({ ...p, protocol: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option>HTTP</option>
              <option>HTTPS</option>
              <option>SOCKS5</option>
            </select>
          </div>

          {/* Host + Port */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Хост / IP</label>
              <input
                type="text"
                value={extProxy.host}
                onChange={(e) => setExtProxy((p) => ({ ...p, host: e.target.value }))}
                placeholder="192.168.1.1 или host.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="w-28">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Порт</label>
              <input
                type="number"
                value={extProxy.port}
                onChange={(e) => setExtProxy((p) => ({ ...p, port: e.target.value }))}
                placeholder="8080"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Login + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Логин (опц.)</label>
              <input
                type="text"
                value={extProxy.login}
                onChange={(e) => setExtProxy((p) => ({ ...p, login: e.target.value }))}
                placeholder="username"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Пароль (опц.)</label>
              <input
                type="password"
                value={extProxy.password}
                onChange={(e) => setExtProxy((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" onClick={closeProxyFlow}>
            Отмена
          </Button>
          <Button
            variant="primary"
            disabled={!extProxy.host || !extProxy.port}
            onClick={handleConnectExternalProxy}
          >
            Подтвердить
          </Button>
        </div>
      </Modal>

      {/* ── DRAWER: Account detail ── */}
      {drawerAccount && (
        <>
          <div
            className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setDrawerAccount(null)}
          />
          <div className="fixed right-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-full flex-col overflow-y-auto bg-white shadow-2xl dark:bg-gray-900 sm:w-[420px]">

            {/* Close */}
            <div className="flex justify-end p-4">
              <button
                onClick={() => setDrawerAccount(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 pb-8">

              {/* Account header */}
              <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-500 text-xl font-bold text-white">
                  {drawerAccount.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{drawerAccount.username}</p>
                  <p className="text-sm text-gray-400">FunPay ID: {drawerAccount.funpayId}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {drawerAccount.status === "online" ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
                        </span>
                        <span className="text-sm font-medium text-success-600">Онлайн</span>
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-400" />
                        </span>
                        <span className="text-sm font-medium text-gray-400">Оффлайн</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Предупреждение если нет прокси */}
              {!drawerAccount.proxyConnected && (
                <div className="flex items-start gap-3 rounded-xl border border-warning-300 bg-warning-50 p-4 dark:border-warning-700/40 dark:bg-warning-950/20">
                  <Icon name="alert" className="h-5 w-5 shrink-0 text-warning-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-warning-800 dark:text-warning-300">Прокси не подключён</p>
                    <p className="mt-0.5 text-xs text-warning-700/80 dark:text-warning-400/80">
                      Воркер не запустится без прокси. Подключите прокси ниже.
                    </p>
                  </div>
                </div>
              )}

              {/* Workers */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Воркеры</p>
                <div className="space-y-3">

                  {/* Runner */}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 dark:text-white">Runner</p>
                      <span className={`text-sm font-medium ${drawerAccount.runner ? "text-success-500" : "text-gray-400"}`}>
                        {drawerAccount.runner ? "Активен" : "Остановлен"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Событий сегодня: {drawerAccount.eventsToday}</p>
                    <p className="text-sm text-gray-500">
                      Последнее событие:{" "}
                      <span className="text-error-500">{drawerAccount.lastEvent}</span>
                    </p>
                  </div>

                  {/* Keeper */}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 dark:text-white">Keeper</p>
                      <span className={`text-sm font-medium ${drawerAccount.keeper ? "text-success-500" : "text-gray-400"}`}>
                        {drawerAccount.keeper ? "Онлайн" : "Оффлайн"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Сессия обновлена: {drawerAccount.sessionUpdated}</p>
                  </div>

                  {/* Raiser */}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 dark:text-white">Raiser</p>
                      <span className={`text-sm font-medium ${drawerAccount.raiser ? "text-success-500" : "text-gray-400"}`}>
                        {drawerAccount.raiser ? "Активен" : "Остановлен"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Автоподнятие: {drawerAccount.raiser ? "включено" : "выключено"}
                    </p>
                    <button
                      onClick={() => handleToggleRaiser(drawerAccount)}
                      disabled={raiserTogglingIds.has(drawerAccount.id)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Icon name="arrow-right" className="h-4 w-4" />
                      {drawerAccount.raiser ? "Остановить Raiser" : "Запуск Raiser"}
                    </button>
                  </div>

                </div>
              </div>

              {/* Proxy */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Прокси</p>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {drawerAccount.proxyConnected ? (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
                      </span>
                    ) : (
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-400" />
                      </span>
                    )}
                    <span className="font-medium text-gray-800 dark:text-white">{drawerAccount.proxy}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    {drawerAccount.proxyConnected
                      ? "Все запросы аккаунта идут через прокси."
                      : "Прокси не подключён. Рекомендуем подключить для защиты аккаунта."}
                  </p>
                  <button
                    onClick={() => { setProxyTarget(drawerAccount); setDrawerAccount(null); setIsProxyModal(true); }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Icon name="plug-in" className="h-4 w-4" />
                    Сменить прокси
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Действия</p>
                <div className="space-y-2">
                  <button
                    disabled={!drawerAccount.proxyConnected && !drawerAccount.runner}
                    onClick={() => drawerAccount.runner ? handleStopRuntime(drawerAccount) : handleStartRuntime(drawerAccount)}
                    title={!drawerAccount.proxyConnected && !drawerAccount.runner ? "Сначала подключите прокси" : undefined}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors ${
                      !drawerAccount.proxyConnected && !drawerAccount.runner
                        ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                        : drawerAccount.runner
                        ? "bg-error-500/10 text-error-500 hover:bg-error-500/20"
                        : "bg-success-500/10 text-success-600 hover:bg-success-500/20"
                    }`}>
                    <Icon name={drawerAccount.runner ? "close" : "check-circle"} className="h-4 w-4" />
                    {drawerAccount.runner ? "Остановить Runner" : "Запустить Runner"}
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(drawerAccount)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-error-500/10 py-3 text-sm font-medium text-error-500 hover:bg-error-500/20 transition-colors">
                    <Icon name="trash" className="h-4 w-4" />
                    Удалить аккаунт
                  </button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
