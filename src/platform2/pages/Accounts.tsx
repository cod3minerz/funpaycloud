"use client";
import { useState, useEffect, useMemo, useRef } from "react";
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
  AsyncOperationStart,
  BackgroundOperation,
  FreeProxyTrial,
  MyProxyItem,
  operationsApi,
} from "@/lib/api";
import { isOperationTerminal, operationFailure, waitForBackgroundOperation } from "@/lib/backgroundOperations";
import BlockingOperationOverlay from "@/platform2/components/BlockingOperationOverlay";
import { toast } from "sonner";

type Account = {
  id: string;
  apiId: number;
  username: string;
  funpayId: string;
  status: "online" | "offline";
  runner: boolean;
  keeper: boolean;
  proxy: string;
  proxyType: ApiAccount["proxy_type"];
  proxyConnected: boolean;
  eventsToday: number;
  lastEvent: string;
  sessionUpdated: string;
};

type ProxyFlowStep = "catalog" | "own-choice" | "owned" | "external";

const GOLDEN_KEY_PATTERN = /^[A-Za-z0-9]{20,64}$/;
const ACCOUNT_OPERATION_STORAGE_KEY = "fpcloud:accounts:active-operation";
const OPERATION_OVERLAY_MIN_VISIBLE_MS = 900;
const DEFAULT_FREE_PROXY_CHANNEL_URL = "https://t.me/funpay_cloud";

function formatProxyExpiry(value?: string | null) {
  if (!value) return "Без срока";
  return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const ASSIGNABLE_PROXY_PRODUCTS = ["free_shared", "proxy_lite", "proxy_pro", "external_custom"];

function isProxyUnavailable(proxy: MyProxyItem) {
  return !proxy.is_active || proxy.health_status === "unhealthy" || proxy.health_status === "expired";
}

function canSelectOwnedProxy(proxy: MyProxyItem, targetAccountId?: number) {
  if (isProxyUnavailable(proxy)) return false;
  if (!proxy.assigned_account_id) return true;
  if (targetAccountId && proxy.assigned_account_id === targetAccountId) return false;
  return proxy.is_shared_free || proxy.product === "free_shared";
}

function ownedProxyAction(proxy: MyProxyItem, targetAccountId?: number) {
  if (targetAccountId && proxy.assigned_account_id === targetAccountId) return "Подключён";
  if (isProxyUnavailable(proxy)) return "Недоступен";
  if (proxy.assigned_account_id && !(proxy.is_shared_free || proxy.product === "free_shared")) return "Используется";
  if (proxy.assigned_account_id) return "Перенести";
  return "Выбрать";
}

function ownedProxyRank(proxy: MyProxyItem, targetAccountId?: number) {
  if (targetAccountId && proxy.assigned_account_id === targetAccountId) return 0;
  if (!isProxyUnavailable(proxy) && !proxy.assigned_account_id) return 1;
  if (!isProxyUnavailable(proxy) && (proxy.is_shared_free || proxy.product === "free_shared")) return 2;
  if (!isProxyUnavailable(proxy)) return 3;
  return 4;
}

function pendingOperation(kind: string): BackgroundOperation {
  const startedAt = new Date();
  return {
    id: `pending-${kind}`,
    kind,
    status: "running",
    attempt: 1,
    max_attempts: 3,
    attempt_started_at: startedAt.toISOString(),
    attempt_deadline_at: new Date(startedAt.getTime() + 45_000).toISOString(),
    result: {},
    created_at: startedAt.toISOString(),
    updated_at: startedAt.toISOString(),
  };
}

function mapApiAccount(a: ApiAccount): Account {
  return {
    id: String(a.id),
    apiId: a.id,
    username: a.username ?? `#${a.id}`,
    funpayId: String(a.funpay_user_id ?? ""),
    status: a.keeper_active ? "online" : "offline",
    runner: a.runner_active ?? false,
    keeper: a.keeper_active,
    proxy: a.proxy_label ?? (a.proxy_connected ? "Прокси подключён" : "Нет прокси"),
    proxyType: a.proxy_type ?? "none",
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
    description: "Получите платформенный прокси на 52 часа. Продление станет доступно через 48 часов.",
    action: "Получить",
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
  const [ownedProxiesError, setOwnedProxiesError] = useState("");
  const [freeProxyTrial, setFreeProxyTrial] = useState<FreeProxyTrial | null>(null);
  const [freeProxyChannelURL, setFreeProxyChannelURL] = useState(DEFAULT_FREE_PROXY_CHANNEL_URL);
  const [freeProxyClaimLoading, setFreeProxyClaimLoading] = useState(false);
  const [freeProxySubscriptionOpen, setFreeProxySubscriptionOpen] = useState(false);
  const [freeProxySubscriptionError, setFreeProxySubscriptionError] = useState("");
  const [freeProxySubscriptionErrorCode, setFreeProxySubscriptionErrorCode] = useState("");
  const [freeProxyNoticeOpen, setFreeProxyNoticeOpen] = useState(false);
  const [isProxyModal, setIsProxyModal] = useState(false);
  const [proxyFlowStep, setProxyFlowStep] = useState<ProxyFlowStep>("catalog");
  const [assigningProxyId, setAssigningProxyId] = useState<number | null>(null);
  const [externalProxyLoading, setExternalProxyLoading] = useState(false);
  const [drawerAccount, setDrawerAccount] = useState<Account | null>(null);
  const [goldenKey, setGoldenKey] = useState("");
  const [extProxy, setExtProxy] = useState({ host: "", port: "8080", protocol: "HTTP", login: "", password: "" });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [proxyTarget, setProxyTarget] = useState<Account | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInputUnlocked, setSearchInputUnlocked] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"" | "online" | "offline">("");
  const [runningAll, setRunningAll] = useState(false);
  const [stoppingAll, setStoppingAll] = useState(false);
  const [proxyPaymentLoading, setProxyPaymentLoading] = useState(false);
  const [showProxyBanner, setShowProxyBanner] = useState(false);
  const [activeOperation, setActiveOperation] = useState<BackgroundOperation | null>(null);
  const [operationTitle, setOperationTitle] = useState("");
  const operationRestoreStarted = useRef(false);
  const freeTrialLoadStarted = useRef(false);
  const operationOverlayShownAt = useRef(0);
  const assigningProxyRequest = useRef(false);
  const externalProxyRequest = useRef(false);
  const currentProxyTarget = useMemo(
    () => proxyTarget ? accounts.find((account) => account.apiId === proxyTarget.apiId) ?? null : null,
    [accounts, proxyTarget],
  );
  const hasAssignedFreeProxy = useMemo(
    () => accounts.some((account) => account.proxyType === "free_shared"),
    [accounts],
  );
  const freeProxyTrialStatus = freeProxyTrial?.status ?? (hasAssignedFreeProxy ? "active" : "available");
  const visibleProxyOptions = useMemo(() => proxyOptions.map((option) => {
    if (option.id !== "free" || freeProxyTrialStatus === "available") return option;
    return {
      ...option,
      title: "Выбрать прокси со склада",
      description: "Выберите свободный прокси из «Моих прокси».",
      action: "Выбрать",
      icon: "plug-in" as const,
    };
  }), [freeProxyTrialStatus]);
  const displayedOwnedProxies = useMemo(() => [...ownedProxies].sort((left, right) => (
    ownedProxyRank(left, currentProxyTarget?.apiId) - ownedProxyRank(right, currentProxyTarget?.apiId)
  )), [ownedProxies, currentProxyTarget?.apiId]);

  function resetAddWizard() {
    setIsAddModal(false);
    setAddStep("proxy");
    setOnboarding(null);
    setGoldenKey("");
    setOwnedProxies([]);
    setOwnedProxiesError("");
    setExtProxy({ host: "", port: "8080", protocol: "HTTP", login: "", password: "" });
  }

  function openAddWizard() {
    setAddStep("proxy");
    setOnboarding(null);
    setGoldenKey("");
    setOwnedProxies([]);
    setOwnedProxiesError("");
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
    setOwnedProxiesError("");
    try {
      const response = await proxiesApi.listMine();
      if (response.free_trial) setFreeProxyTrial(response.free_trial);
      if (response.free_proxy_channel_url) setFreeProxyChannelURL(response.free_proxy_channel_url);
      setOwnedProxies((response.items || []).filter((item) => (
        item.is_active
        && ASSIGNABLE_PROXY_PRODUCTS.includes(item.product)
        && (!item.expires_at || new Date(item.expires_at).getTime() > Date.now())
      )));
    } catch (error) {
      setOwnedProxies([]);
      setOwnedProxiesError(error instanceof Error ? error.message : "Не удалось загрузить «Мои прокси»");
    } finally {
      setOwnedProxiesLoading(false);
    }
  }

  async function refreshFreeProxyTrial() {
    try {
      const response = await proxiesApi.listMine();
      if (response.free_trial) setFreeProxyTrial(response.free_trial);
      if (response.free_proxy_channel_url) setFreeProxyChannelURL(response.free_proxy_channel_url);
    } catch {
      // Состояние аккаунтов остаётся совместимым fallback для старого backend.
    }
  }

  function openProxyFlow(account: Account) {
    setProxyTarget(account);
    setProxyFlowStep("catalog");
    setOwnedProxies([]);
    setOwnedProxiesError("");
    setAssigningProxyId(null);
    setExternalProxyLoading(false);
    setExtProxy({ host: "", port: "8080", protocol: "HTTP", login: "", password: "" });
    setIsProxyModal(true);
  }

  function closeProxyFlow() {
    setIsProxyModal(false);
    setProxyFlowStep("catalog");
    setOwnedProxies([]);
    setOwnedProxiesError("");
    setAssigningProxyId(null);
    setExternalProxyLoading(false);
    setExtProxy({ host: "", port: "8080", protocol: "HTTP", login: "", password: "" });
    setProxyTarget(null);
  }

  function requestCloseProxyFlow() {
    if (assigningProxyRequest.current || externalProxyRequest.current || proxyPaymentLoading) return;
    closeProxyFlow();
  }

  async function showPendingOperation(title: string, kind: string) {
    operationOverlayShownAt.current = Date.now();
    setOperationTitle(title);
    setActiveOperation(pendingOperation(kind));

    // Wait through one complete paint before starting the HTTP request. Without
    // this, a fast terminal response can be batched with the cleanup and the
    // user never sees the waiting state at all.
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
    });
  }

  async function hideOperationOverlay() {
    const shownAt = operationOverlayShownAt.current;
    const remaining = OPERATION_OVERLAY_MIN_VISIBLE_MS - (Date.now() - shownAt);
    if (shownAt > 0 && remaining > 0) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
    }
    setActiveOperation(null);
    setOperationTitle("");
    operationOverlayShownAt.current = 0;
  }

  async function monitorOperation(initial: BackgroundOperation, title: string, overlayVisible = false) {
    setOperationTitle(title);
    setActiveOperation(initial);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ACCOUNT_OPERATION_STORAGE_KEY, JSON.stringify({ id: initial.id, title }));
    }
    try {
      return await waitForBackgroundOperation(initial, operationsApi.get, setActiveOperation);
    } finally {
      if (overlayVisible) {
        await hideOperationOverlay();
      } else {
        setActiveOperation(null);
        setOperationTitle("");
      }
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(ACCOUNT_OPERATION_STORAGE_KEY);
      }
    }
  }

  async function startAndMonitorOperation(
    title: string,
    kind: string,
    start: () => Promise<AsyncOperationStart>,
  ) {
    await showPendingOperation(title, kind);
    let serverOperationStarted = false;
    try {
      const started = await start();
      serverOperationStarted = true;
      return await monitorOperation(started.operation, title, true);
    } finally {
      if (!serverOperationStarted) {
        await hideOperationOverlay();
      }
    }
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
    if (freeTrialLoadStarted.current) return;
    freeTrialLoadStarted.current = true;
    void refreshFreeProxyTrial();
  }, []);

  useEffect(() => {
    if (operationRestoreStarted.current || typeof window === "undefined") return;
    operationRestoreStarted.current = true;
    const raw = window.sessionStorage.getItem(ACCOUNT_OPERATION_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { id?: string; title?: string };
      if (!saved.id) {
        window.sessionStorage.removeItem(ACCOUNT_OPERATION_STORAGE_KEY);
        return;
      }
      operationsApi.get(saved.id)
        .then((operation) => monitorOperation(operation, saved.title || "Выполняем операцию"))
        .then(async (operation) => {
          const list = await accountsApi.list();
          setAccounts(list.map(mapApiAccount));
          if (operation.kind === "free_proxy_telegram_claim") {
            if (operation.status === "succeeded") {
              const result = operation.result as Partial<{ free_trial: FreeProxyTrial }> | undefined;
              if (result?.free_trial) setFreeProxyTrial(result.free_trial);
              setFreeProxySubscriptionOpen(false);
              setFreeProxyNoticeOpen(true);
            } else {
              setFreeProxySubscriptionOpen(true);
              setFreeProxySubscriptionErrorCode(operation.error_code || "");
              setFreeProxySubscriptionError(operation.error_message || "Не удалось проверить подписку. Попробуйте ещё раз.");
            }
            return;
          }
          if (operation.status === "succeeded") {
            if (operation.kind === "account_onboarding_complete") {
              setSearch("");
              setFilterStatus("");
            }
            toast.success("Операция успешно завершена");
          }
          else if (operation.error_code === "proxy_assigned_runtime_failed") toast.warning(operation.error_message || "Прокси назначен, но воркеры не запустились");
          else if (operation.status === "partially_succeeded") toast.warning(operation.error_message || "Операция завершена частично");
          else toast.error(operation.error_message || "Операция не выполнена");
        })
        .catch((error) => {
          window.sessionStorage.removeItem(ACCOUNT_OPERATION_STORAGE_KEY);
          toast.error(error instanceof Error ? error.message : "Не удалось восстановить операцию");
        });
    } catch {
      window.sessionStorage.removeItem(ACCOUNT_OPERATION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!proxyTarget) return;
    if (!currentProxyTarget) {
      setIsProxyModal(false);
      setProxyFlowStep("catalog");
      setOwnedProxies([]);
      setOwnedProxiesError("");
      setAssigningProxyId(null);
      setExternalProxyLoading(false);
      setExtProxy({ host: "", port: "8080", protocol: "HTTP", login: "", password: "" });
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
      if (freeProxyTrialStatus !== "available") {
        setAddStep("owned");
        await loadOwnedProxies();
        return;
      }
      openFreeProxySubscription();
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
      const completed = await startAndMonitorOperation(
        "Добавляем аккаунт",
        "account_onboarding_complete",
        () => accountOnboardingApi.complete(onboarding.id, normalizedKey),
      );
      if (!isOperationTerminal(completed) || completed.status !== "succeeded") {
        throw operationFailure(completed);
      }
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      await refreshFreeProxyTrial();
      setSearch("");
      setFilterStatus("");
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
      const started = await accountsApi.startRuntime(acc.apiId);
      const completed = await monitorOperation(started.operation, "Запускаем Runner");
      if (completed.status !== "succeeded") throw operationFailure(completed);
      const list = await accountsApi.list();
      const mapped = list.map(mapApiAccount);
      setAccounts(mapped);
      if (drawerAccount?.id === acc.id) setDrawerAccount(mapped.find((item) => item.id === acc.id) ?? null);
      toast.success("Runner запущен");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось запустить Runner");
    }
  }

  function openFreeProxySubscription() {
    setFreeProxySubscriptionError("");
    setFreeProxySubscriptionErrorCode("");
    setFreeProxySubscriptionOpen(true);
  }

  function closeFreeProxySubscription() {
    if (freeProxyClaimLoading) return;
    setFreeProxySubscriptionOpen(false);
    setFreeProxySubscriptionError("");
    setFreeProxySubscriptionErrorCode("");
  }

  async function handleClaimFreeProxy() {
    if (freeProxyClaimLoading) return;
    setFreeProxyClaimLoading(true);
    setFreeProxySubscriptionError("");
    setFreeProxySubscriptionErrorCode("");
    try {
      const completed = await startAndMonitorOperation(
        "Проверяем подписку на Telegram",
        "free_proxy_telegram_claim",
        proxiesApi.checkSubscriptionAndClaimFree,
      );
      if (completed.status !== "succeeded") throw operationFailure(completed);
      const result = completed.result as Partial<{ action: string; free_trial: FreeProxyTrial }> | undefined;
      if (!result?.free_trial) throw new ApiError("Проверка завершилась без результата. Попробуйте ещё раз.");
      setFreeProxyTrial(result.free_trial);
      setFreeProxySubscriptionOpen(false);
      setFreeProxyNoticeOpen(true);
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setFreeProxySubscriptionErrorCode(apiError?.code || "");
      setFreeProxySubscriptionError(apiError?.message || "Не удалось проверить подписку. Попробуйте ещё раз.");
    } finally {
      setFreeProxyClaimLoading(false);
    }
  }

  async function continueFromFreeProxyNotice() {
    setFreeProxyNoticeOpen(false);
    if (isProxyModal) setProxyFlowStep("owned");
    if (isAddModal) setAddStep("owned");
    await loadOwnedProxies();
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
    if (externalProxyRequest.current) return;
    const host = extProxy.host.trim();
    const port = Number(extProxy.port);
    if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) {
      toast.error("Укажите корректные хост и порт прокси.");
      return;
    }
    externalProxyRequest.current = true;
    setExternalProxyLoading(true);
    try {
      const target = await refreshProxyTarget();
      if (!target) return;
      await accountsApi.connectProxy(target.apiId, {
        mode: "external",
        protocol: extProxy.protocol as "HTTP" | "HTTPS" | "SOCKS5",
        host,
        port,
        username: extProxy.login.trim() || undefined,
        password: extProxy.password || undefined,
      });
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      toast.success("Внешний прокси подключён");
      closeProxyFlow();
    } catch (error) {
      if (error instanceof ApiError && error.status === 502) {
        try {
          const list = await accountsApi.list();
          setAccounts(list.map(mapApiAccount));
        } catch {
          // The original proxy error is more useful than a refresh error here.
        }
      }
      toast.error(error instanceof Error ? error.message : "Не удалось подключить прокси. Проверьте данные.");
    } finally {
      externalProxyRequest.current = false;
      setExternalProxyLoading(false);
    }
  }

  async function handleAssignOwnedProxy(proxyId: number) {
    if (assigningProxyRequest.current) return;
    assigningProxyRequest.current = true;
    setAssigningProxyId(proxyId);
    try {
      const target = await refreshProxyTarget();
      if (!target) return;
      const completed = await startAndMonitorOperation(
        "Назначаем и проверяем прокси",
        "proxy_assign_and_restart",
        () => proxiesApi.assignMine(proxyId, { account_id: target.apiId }),
      );
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      if (completed.status !== "succeeded") {
        if (completed.error_code === "proxy_assigned_runtime_failed") {
          toast.warning(completed.error_message || "Прокси назначен, но воркеры не запустились");
          closeProxyFlow();
          return;
        }
        throw operationFailure(completed);
      }
      toast.success("Прокси из «Моих прокси» подключён");
      closeProxyFlow();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось назначить прокси");
      await loadOwnedProxies();
    } finally {
      assigningProxyRequest.current = false;
      setAssigningProxyId(null);
    }
  }

  async function handleStartAll() {
    setRunningAll(true);
    try {
      const started = await accountsApi.startAllRuntime();
      const completed = await monitorOperation(started.operation, "Запускаем все Runner");
      const list = await accountsApi.list();
      setAccounts(list.map(mapApiAccount));
      if (completed.status === "failed" || completed.status === "interrupted") throw operationFailure(completed);
      if (completed.status === "partially_succeeded") {
        const result = completed.result || {};
        const failed = result.failed && typeof result.failed === "object" ? Object.keys(result.failed).length : 0;
        toast.warning(`Runner запущены частично. Ошибок: ${failed}`);
      } else {
        toast.success("Все Runner запущены");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось запустить все Runner");
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
  };

  return (
    <div className="space-y-6">

      {activeOperation && <BlockingOperationOverlay operation={activeOperation} title={operationTitle} />}

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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Список аккаунтов</CardTitle>
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                name="funpay-account-search"
                placeholder="Поиск"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPointerDown={() => setSearchInputUnlocked(true)}
                onFocus={() => setSearchInputUnlocked(true)}
                onBlur={() => setSearchInputUnlocked(false)}
                readOnly={!searchInputUnlocked}
                autoComplete="off"
                spellCheck={false}
                aria-label="Поиск аккаунтов"
                data-testid="account-search-input"
                data-1p-ignore="true"
                data-lpignore="true"
                data-form-type="other"
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
                        <Button variant="outline" size="sm" onClick={() => openProxyFlow(account)}>
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
            {visibleProxyOptions.map((opt) => (
              <button
                type="button"
                key={opt.id}
                data-testid={`onboarding-proxy-option-${opt.id}`}
                disabled={onboardingLoading || freeProxyClaimLoading}
                onClick={() => void handleOnboardingProxyChoice(opt.id)}
                className="flex min-h-64 flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-400 hover:shadow-md disabled:cursor-wait disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
                  <Icon name={opt.icon} className="h-6 w-6 text-brand-500" />
                </div>
                <p className="mt-5 font-bold text-gray-900 dark:text-white">{opt.title}</p>
                <p className="mt-2 flex-1 text-sm text-gray-500">{opt.description}</p>
                <span className="mt-5 text-sm font-semibold text-brand-600">
                  {onboardingLoading || (opt.id === "free" && freeProxyClaimLoading) ? "Подготовка…" : opt.action}
                </span>
              </button>
            ))}
          </div>
        )}

        {addStep === "owned" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Прокси в вашем инвентаре</h3>
              <Button variant="outline" size="sm" onClick={() => setAddStep("external")}>
                <Icon name="plus" className="h-4 w-4" /> Добавить новый
              </Button>
            </div>
            <div className="mt-4 space-y-3" data-testid="owned-proxy-list">
              {ownedProxiesLoading && <p className="py-8 text-center text-sm text-gray-500">Загружаем прокси…</p>}
              {!ownedProxiesLoading && ownedProxiesError && (
                <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-900/40 dark:bg-error-900/10">
                  <p className="text-sm text-error-600 dark:text-error-400">{ownedProxiesError}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => void loadOwnedProxies()}>
                    Повторить
                  </Button>
                </div>
              )}
              {!ownedProxiesLoading && !ownedProxiesError && ownedProxies.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500">Доступных прокси нет.</p>
                  <Button variant="primary" size="sm" className="mt-4" onClick={() => setAddStep("external")}>
                    Добавить свой прокси
                  </Button>
                </div>
              )}
              {displayedOwnedProxies.map((proxy) => (
                <button
                  type="button"
                  key={proxy.id}
                  disabled={onboardingLoading || !canSelectOwnedProxy(proxy)}
                  onClick={() => void handleOwnedProxyChoice(proxy.id)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 text-left hover:border-brand-400 disabled:opacity-60 dark:border-gray-700"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{proxy.display_name || proxy.label}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {proxy.label} · {proxy.protocol} · {proxy.health_status === "healthy" ? "Готов" : proxy.health_status === "degraded" ? "Требует проверки" : "Не работает"}
                      {proxy.expires_at ? ` · до ${formatProxyExpiry(proxy.expires_at)}` : ""}
                      {proxy.assigned_username ? ` · аккаунт ${proxy.assigned_username}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-600">{ownedProxyAction(proxy)}</span>
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
        onClose={requestCloseProxyFlow}
        className={`${proxyFlowStep === "catalog" ? "w-[min(1120px,calc(100vw-2rem))]" : proxyFlowStep === "owned" ? "max-w-3xl" : "max-w-2xl"} max-h-[calc(100vh-3rem)] overflow-y-auto p-5 sm:p-8`}
      >
        <h2 className="pr-12 text-2xl font-bold text-gray-900 dark:text-white">
          {proxyFlowStep === "catalog" && "Выберите прокси"}
          {proxyFlowStep === "own-choice" && "Свой прокси"}
          {proxyFlowStep === "owned" && "Выберите существующий прокси"}
          {proxyFlowStep === "external" && "Настройка внешнего прокси"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Аккаунт:{" "}
          <span className="font-semibold text-gray-800 dark:text-white">
            {currentProxyTarget?.username ?? "—"}
          </span>
        </p>
        {proxyFlowStep === "catalog" && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="change-proxy-catalog">
          {visibleProxyOptions.map((opt) => (
            <div
              key={opt.id}
              data-testid={`change-proxy-option-${opt.id}`}
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
                disabled={!opt.available || (opt.id === "free" && freeProxyClaimLoading) || ((opt.id === "proxy_lite" || opt.id === "proxy_pro") && proxyPaymentLoading)}
                onClick={() => {
                  if (opt.id === "external") {
                    setProxyFlowStep("own-choice");
                  } else if (opt.id === "free") {
                    if (freeProxyTrialStatus !== "available") {
                      setProxyFlowStep("owned");
                      void loadOwnedProxies();
                    } else {
                      openFreeProxySubscription();
                    }
                  } else if (opt.id === "proxy_lite" || opt.id === "proxy_pro") {
                    void handlePaidProxyPayment(opt.id);
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
                {opt.id === "free" && freeProxyClaimLoading
                  ? "Получаем…"
                  : (opt.id === "proxy_lite" || opt.id === "proxy_pro") && proxyPaymentLoading
                    ? "Создаем..."
                    : opt.action}
              </button>
            </div>
          ))}
        </div>
        )}

        {proxyFlowStep === "own-choice" && (
          <div className="mt-6" data-testid="own-proxy-actions">
            <p className="text-sm text-gray-500">Используйте свободный прокси из «Моих прокси» или добавьте новые реквизиты.</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setProxyFlowStep("owned");
                  void loadOwnedProxies();
                }}
                className="flex min-h-40 flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/10">
                  <Icon name="plug-in" className="h-5 w-5 text-brand-500" />
                </span>
                <span className="mt-4 font-semibold text-gray-900 dark:text-white">Выбрать из существующих</span>
                <span className="mt-1 text-sm text-gray-500">Подключить купленный или ранее добавленный свободный прокси.</span>
              </button>
              <button
                type="button"
                onClick={() => setProxyFlowStep("external")}
                className="flex min-h-40 flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/10">
                  <Icon name="plus" className="h-5 w-5 text-brand-500" />
                </span>
                <span className="mt-4 font-semibold text-gray-900 dark:text-white">Добавить свой новый</span>
                <span className="mt-1 text-sm text-gray-500">Ввести адрес, порт и данные авторизации другого прокси.</span>
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setProxyFlowStep("catalog")}>Назад</Button>
              <Button variant="outline" onClick={closeProxyFlow}>Отмена</Button>
            </div>
          </div>
        )}

        {proxyFlowStep === "owned" && (
          <div className="mt-6" data-testid="change-proxy-owned-list">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">Показываются все действующие прокси из «Моих прокси».</p>
              <Button variant="outline" size="sm" onClick={() => setProxyFlowStep("external")}>
                <Icon name="plus" className="h-4 w-4" /> Добавить свой новый
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {ownedProxiesLoading && <p className="py-10 text-center text-sm text-gray-500">Загружаем прокси…</p>}
              {!ownedProxiesLoading && ownedProxiesError && (
                <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-700/30 dark:bg-error-900/20">
                  <p className="text-sm text-error-600 dark:text-error-400">{ownedProxiesError}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => void loadOwnedProxies()}>Повторить</Button>
                </div>
              )}
              {!ownedProxiesLoading && !ownedProxiesError && ownedProxies.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500">Доступных прокси нет.</p>
                  <Button variant="primary" size="sm" className="mt-4" onClick={() => setProxyFlowStep("external")}>
                    Добавить свой новый
                  </Button>
                </div>
              )}
              {displayedOwnedProxies.map((proxy) => (
                <button
                  type="button"
                  key={proxy.id}
                  disabled={assigningProxyId !== null || !canSelectOwnedProxy(proxy, currentProxyTarget?.apiId)}
                  onClick={() => void handleAssignOwnedProxy(proxy.id)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand-400 disabled:cursor-wait disabled:opacity-60 dark:border-gray-700"
                >
                  <span>
                    <span className="block font-semibold text-gray-900 dark:text-white">{proxy.display_name || proxy.label}</span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {proxy.label} · {proxy.protocol} · {proxy.health_status === "healthy" ? "Готов" : proxy.health_status === "degraded" ? "Требует проверки" : "Не работает"} · ID {proxy.id}
                      {proxy.expires_at ? ` · до ${formatProxyExpiry(proxy.expires_at)}` : ""}
                      {proxy.assigned_username ? ` · аккаунт ${proxy.assigned_username}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-brand-600">
                    {assigningProxyId === proxy.id ? "Назначаем…" : ownedProxyAction(proxy, currentProxyTarget?.apiId)}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" disabled={assigningProxyId !== null} onClick={() => setProxyFlowStep("own-choice")}>Назад</Button>
              <Button variant="outline" disabled={assigningProxyId !== null} onClick={closeProxyFlow}>Отмена</Button>
            </div>
          </div>
        )}

        {proxyFlowStep === "external" && (
          <div className="mt-6" data-testid="change-proxy-external-form">
            <p className="text-sm text-gray-500">Реквизиты проверяются сервером и хранятся в зашифрованном виде.</p>
            <div className="mt-5 space-y-3">
              <div>
                <label htmlFor="change-proxy-protocol" className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Протокол</label>
                <select id="change-proxy-protocol" aria-label="Протокол нового прокси" value={extProxy.protocol} onChange={(e) => setExtProxy((p) => ({ ...p, protocol: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  <option>HTTP</option><option>HTTPS</option><option>SOCKS5</option>
                </select>
              </div>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <div>
                  <label htmlFor="change-proxy-host" className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Хост / IP</label>
                  <input id="change-proxy-host" aria-label="Хост нового прокси" type="text" autoComplete="off" value={extProxy.host} onChange={(e) => setExtProxy((p) => ({ ...p, host: e.target.value }))} placeholder="192.168.1.1 или host.com" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="change-proxy-port" className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Порт</label>
                  <input id="change-proxy-port" aria-label="Порт нового прокси" type="number" value={extProxy.port} onChange={(e) => setExtProxy((p) => ({ ...p, port: e.target.value }))} placeholder="8080" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="change-proxy-login" className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Логин (опц.)</label>
                  <input id="change-proxy-login" aria-label="Логин нового прокси" type="text" autoComplete="off" value={extProxy.login} onChange={(e) => setExtProxy((p) => ({ ...p, login: e.target.value }))} placeholder="username" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="change-proxy-password" className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Пароль (опц.)</label>
                  <input id="change-proxy-password" aria-label="Пароль нового прокси" type="password" autoComplete="new-password" value={extProxy.password} onChange={(e) => setExtProxy((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <Button variant="outline" disabled={externalProxyLoading} onClick={() => setProxyFlowStep("own-choice")}>Назад</Button>
              <Button variant="outline" disabled={externalProxyLoading} onClick={closeProxyFlow}>Отмена</Button>
              <Button variant="primary" disabled={externalProxyLoading || !extProxy.host || !extProxy.port} onClick={() => void handleConnectExternalProxy()}>
                {externalProxyLoading ? "Проверяем…" : "Подтвердить"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={freeProxySubscriptionOpen}
        onClose={closeFreeProxySubscription}
        showCloseButton={!freeProxyClaimLoading}
        className="w-[min(560px,calc(100vw-2rem))] p-6 sm:p-8"
      >
        <div data-testid="free-proxy-subscription-modal">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <Icon name="paper-plane" className="h-7 w-7" />
          </div>
          <h2 className="mt-5 pr-10 text-2xl font-bold text-gray-900 dark:text-white">Подпишитесь на Telegram-канал</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
            Чтобы получить бесплатный прокси, Telegram-аккаунт, привязанный к FP Cloud, должен быть подписан на наш канал.
          </p>
          <div className="mt-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4 text-sm leading-6 text-gray-700 dark:text-gray-200">
            Сначала откройте канал и подпишитесь. Затем вернитесь сюда и нажмите «Проверить подписку».
          </div>
          {freeProxySubscriptionError && (
            <div className="mt-4 rounded-2xl border border-error-500/20 bg-error-500/10 p-4 text-sm text-error-600 dark:text-error-300" role="alert" data-testid="free-proxy-subscription-error">
              {freeProxySubscriptionError}
              {freeProxySubscriptionErrorCode === "telegram_not_linked" && (
                <a href="/platform/integrations#telegram" className="mt-2 block font-semibold text-brand-600 hover:underline">
                  Перейти к привязке Telegram
                </a>
              )}
            </div>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={freeProxyChannelURL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Icon name="paper-plane" className="h-4 w-4" />
              Подписаться на канал
            </a>
            <Button className="flex-1" disabled={freeProxyClaimLoading} onClick={() => void handleClaimFreeProxy()}>
              {freeProxyClaimLoading ? "Проверяем…" : "Проверить подписку"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={freeProxyNoticeOpen}
        onClose={() => setFreeProxyNoticeOpen(false)}
        className="w-[min(560px,calc(100vw-2rem))] p-6 sm:p-8"
      >
        <div data-testid="free-proxy-claimed-notice">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-500/10 text-success-600">
            <Icon name="check-circle" className="h-7 w-7" />
          </div>
          <h2 className="mt-5 pr-10 text-2xl font-bold text-gray-900 dark:text-white">Бесплатный прокси получен</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
            Прокси выдан на 52 часа и добавлен в «Мои прокси».
          </p>
          <div className="mt-4 rounded-2xl border border-warning-500/20 bg-warning-500/10 p-4 text-sm leading-6 text-warning-700 dark:text-warning-300">
            Через 48 часов появится кнопка продления. Нажмите её в течение четырёх часов, иначе прокси будет отключён и вернётся в общий пул.
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => void continueFromFreeProxyNotice()}>
              Выбрать со склада
            </Button>
            <Button className="flex-1" onClick={() => window.location.assign("/platform/proxies")}>
              Перейти в Мои прокси
            </Button>
          </div>
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
                    onClick={() => { openProxyFlow(drawerAccount); setDrawerAccount(null); }}
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
