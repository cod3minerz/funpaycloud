"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppRoot,
  Badge,
  Button,
  Cell,
  FixedLayout,
  Input,
  Placeholder,
  Section,
  Skeleton,
  Tabbar,
  Text,
  Title,
} from "@telegram-apps/telegram-ui";
import PulseCloud from "./PulseCloud";
import BlockingOperationOverlay from "@/platform2/components/BlockingOperationOverlay";
import type { AsyncOperationStart, BackgroundOperation } from "@/lib/api";
import { operationFailure, waitForBackgroundOperation } from "@/lib/backgroundOperations";
import {
  MiniAppAccount,
  MiniAppAttentionItem,
  MiniAppBonuses,
  MiniAppProxy,
  MiniAppPulse,
  MiniAppSession,
  miniAppApi,
} from "./api";
import {
  getTelegramHashInitData,
  getTelegramWebApp,
  haptic,
  openTelegramLink,
  hasTelegramLaunchParams,
  setupTelegramViewport,
} from "./telegram";

type TabID = "pulse" | "attention" | "accounts" | "proxies" | "bonuses";

const tabs: Array<{ id: TabID; text: string; glyph: string }> = [
  { id: "pulse", text: "Пульс", glyph: "●" },
  { id: "attention", text: "Внимание", glyph: "!" },
  { id: "accounts", text: "Аккаунты", glyph: "A" },
  { id: "proxies", text: "Прокси", glyph: "P" },
  { id: "bonuses", text: "Бонусы", glyph: "B" },
];

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "fpc1oudbot";
const TELEGRAM_BOT_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}`;
const MINIAPP_OPERATION_STORAGE_KEY = "fpcloud:miniapp:active-operation";

function platformURL(path: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `https://funpay.cloud${path}`;
}

function dateLabel(value?: string | null) {
  if (!value) return "Без срока";
  return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function statusText(status: string) {
  if (status === "healthy") return "Работает";
  if (status === "degraded") return "Проверить";
  if (status === "unhealthy") return "Проблема";
  return status || "Неизвестно";
}

function useTelegramBoot() {
  const [checked, setChecked] = useState(false);
  const [initData, setInitData] = useState("");
  const [hasWebApp, setHasWebApp] = useState(false);
  const [webAppMeta, setWebAppMeta] = useState<{ platform?: string; version?: string }>({});

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const boot = () => {
      if (cancelled) return;
      const webApp = getTelegramWebApp();
      const nextInitData = webApp?.initData || getTelegramHashInitData();
      if (webApp) {
        setupTelegramViewport();
        setHasWebApp(true);
        setWebAppMeta({ platform: webApp.platform, version: webApp.version });
      } else if (hasTelegramLaunchParams()) {
        setHasWebApp(true);
        setWebAppMeta({ platform: "telegram-webview" });
      }
      if (nextInitData) {
        setInitData(nextInitData);
        setChecked(true);
        return;
      }
      attempts += 1;
      if (attempts >= 30) {
        setChecked(true);
        return;
      }
      window.setTimeout(boot, 100);
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return { checked, initData, hasWebApp, hasInitData: Boolean(initData), webAppMeta };
}

export default function MiniApp() {
  const { checked, initData, hasWebApp, hasInitData, webAppMeta } = useTelegramBoot();
  const [activeTab, setActiveTab] = useState<TabID>("pulse");
  const [session, setSession] = useState<MiniAppSession | null>(null);
  const [pulse, setPulse] = useState<MiniAppPulse | null>(null);
  const [accounts, setAccounts] = useState<MiniAppAccount[]>([]);
  const [proxies, setProxies] = useState<MiniAppProxy[]>([]);
  const [attention, setAttention] = useState<MiniAppAttentionItem[]>([]);
  const [bonuses, setBonuses] = useState<MiniAppBonuses | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [activeOperation, setActiveOperation] = useState<BackgroundOperation | null>(null);
  const [operationTitle, setOperationTitle] = useState("");
  const operationRestoreStarted = useRef(false);

  const token = session?.token || "";
  useEffect(() => {
    latestMiniAppToken = token;
  }, [token]);

  async function loadAll(nextToken = token) {
    if (!nextToken) return;
    setLoading(true);
    setMessage("");
    try {
      const [pulseData, attentionData, accountData, proxyData, bonusData] = await Promise.all([
        miniAppApi.pulse(nextToken),
        miniAppApi.attention(nextToken),
        miniAppApi.accounts(nextToken),
        miniAppApi.proxies(nextToken),
        miniAppApi.bonuses(nextToken),
      ]);
      setPulse(pulseData);
      setAttention(attentionData.items ?? []);
      setAccounts(accountData.items ?? []);
      setProxies(proxyData.items ?? []);
      setBonuses(bonusData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить данные");
      haptic("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checked || !hasInitData || !initData) return;
    let cancelled = false;
    setLoading(true);
    miniAppApi.session(initData)
      .then((nextSession) => {
        if (cancelled) return;
        setSession(nextSession);
        if (nextSession.token) {
          void loadAll(nextSession.token);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "Telegram авторизация недоступна");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [checked, hasInitData, initData]);

  const cloudStatus = useMemo(() => {
    if (loading) return "loading";
    return pulse?.status || "loading";
  }, [loading, pulse?.status]);

  async function monitorOperation(initial: BackgroundOperation, title: string) {
    setOperationTitle(title);
    setActiveOperation(initial);
    window.sessionStorage.setItem(MINIAPP_OPERATION_STORAGE_KEY, JSON.stringify({ id: initial.id, title }));
    try {
      return await waitForBackgroundOperation(initial, (id) => miniAppApi.operation(token, id), setActiveOperation);
    } finally {
      setActiveOperation(null);
      setOperationTitle("");
      window.sessionStorage.removeItem(MINIAPP_OPERATION_STORAGE_KEY);
    }
  }

  useEffect(() => {
    if (!token || operationRestoreStarted.current) return;
    operationRestoreStarted.current = true;
    const raw = window.sessionStorage.getItem(MINIAPP_OPERATION_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { id?: string; title?: string };
      if (!saved.id) return;
      miniAppApi.operation(token, saved.id)
        .then((operation) => monitorOperation(operation, saved.title || "Запускаем Runner"))
        .then((operation) => {
          if (operation.status === "failed" || operation.status === "interrupted") throw operationFailure(operation);
          setMessage("Аккаунт запущен");
          return loadAll();
        })
        .catch((error) => setMessage(error instanceof Error ? error.message : "Не удалось восстановить операцию"));
    } catch {
      window.sessionStorage.removeItem(MINIAPP_OPERATION_STORAGE_KEY);
    }
  }, [token]);

  async function runAction(id: string, action: () => Promise<unknown>, success: string, asyncTitle?: string) {
    if (!token) return;
    setBusy(id);
    setMessage("");
    haptic("light");
    try {
      const response = await action();
      if (asyncTitle && response && typeof response === "object" && "operation" in response) {
        const completed = await monitorOperation((response as AsyncOperationStart).operation, asyncTitle);
        if (completed.status === "failed" || completed.status === "interrupted") throw operationFailure(completed);
      }
      haptic("success");
      setMessage(success);
      await loadAll();
    } catch (error) {
      haptic("error");
      setMessage(error instanceof Error ? error.message : "Действие не выполнено");
    } finally {
      setBusy(null);
    }
  }

  async function redeemPromo() {
    const code = promoCode.trim();
    if (!code) return;
    await runAction("promo", () => miniAppApi.redeemPromo(token, code), "Промокод применён");
    setPromoCode("");
  }

  if (!checked) {
    return <MiniAppShell><CenteredView><LoadingView /></CenteredView></MiniAppShell>;
  }

  if (!hasWebApp) {
    return (
      <MiniAppShell>
        <CenteredView>
          <Placeholder
            header="Откройте в Telegram"
            description="Mini App работает только внутри Telegram. Откройте бота FunPay Cloud и запустите приложение из меню."
            action={<Button stretched onClick={() => openTelegramLink(TELEGRAM_BOT_URL)}>Открыть Telegram</Button>}
          >
            <PulseCloud status="loading" />
          </Placeholder>
        </CenteredView>
      </MiniAppShell>
    );
  }

  if (!hasInitData) {
    return (
      <MiniAppShell>
        <CenteredView>
          <Placeholder
            header="Откройте через Mini App"
            description={`Telegram WebView найден${webAppMeta.platform ? ` (${webAppMeta.platform})` : ""}, но не передал initData. Обычно так бывает, если в боте стоит обычная URL-кнопка вместо Web App/Mini App-кнопки.`}
            action={<Button stretched onClick={() => openTelegramLink(TELEGRAM_BOT_URL)}>Открыть бота</Button>}
          >
            <PulseCloud status="warning" />
          </Placeholder>
        </CenteredView>
      </MiniAppShell>
    );
  }

  if (session && !session.linked) {
    return (
      <MiniAppShell>
        <CenteredView>
          <Placeholder
            header="Telegram не привязан"
            description="Мы видим ваш Telegram, но не нашли связанный аккаунт FunPay Cloud. Привяжите Telegram в настройках платформы."
            action={<Button stretched onClick={() => openTelegramLink(platformURL("/platform/settings?telegram=link"))}>Авторизоваться на сайте</Button>}
          >
            <PulseCloud status="warning" />
          </Placeholder>
        </CenteredView>
      </MiniAppShell>
    );
  }

  return (
    <MiniAppShell>
      {activeOperation && <BlockingOperationOverlay operation={activeOperation} title={operationTitle} />}
      <main className="miniapp-content">
        {message && (
          <Section>
            <Cell multiline>{message}</Cell>
          </Section>
        )}
        {activeTab === "pulse" && <PulseView loading={loading} pulse={pulse} runAction={runAction} />}
        {activeTab === "attention" && <AttentionView items={attention} busy={busy} runAction={runAction} />}
        {activeTab === "accounts" && <AccountsView accounts={accounts} busy={busy} runAction={runAction} />}
        {activeTab === "proxies" && <ProxiesView proxies={proxies} busy={busy} runAction={runAction} />}
        {activeTab === "bonuses" && (
          <BonusesView
            bonuses={bonuses}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            redeemPromo={redeemPromo}
            busy={busy}
          />
        )}
      </main>
      <FixedLayout vertical="bottom">
        <Tabbar>
          {tabs.map((tab) => (
            <Tabbar.Item key={tab.id} selected={activeTab === tab.id} text={tab.text} onClick={() => setActiveTab(tab.id)}>
              <span className="miniapp-tab-icon">{tab.glyph}</span>
            </Tabbar.Item>
          ))}
        </Tabbar>
      </FixedLayout>
    </MiniAppShell>
  );
}

function MiniAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppRoot appearance="dark" platform="base" className="miniapp-root">
      {children}
    </AppRoot>
  );
}

function CenteredView({ children }: { children: React.ReactNode }) {
  return <main className="miniapp-gate">{children}</main>;
}

function LoadingView() {
  return (
    <div className="miniapp-loading">
      <Section>
        <Skeleton visible className="miniapp-skeleton-hero" />
        <Skeleton visible className="miniapp-skeleton-line" />
        <Skeleton visible className="miniapp-skeleton-line short" />
      </Section>
    </div>
  );
}

function PulseView({ loading, pulse, runAction }: {
  loading: boolean;
  pulse: MiniAppPulse | null;
  runAction: (id: string, action: () => Promise<unknown>, success: string, asyncTitle?: string) => Promise<void>;
}) {
  const status = loading ? "loading" : pulse?.status || "loading";
  const statusLabel = status === "ok" ? "OK" : status === "critical" ? "Проблема" : status === "warning" ? "Внимание" : "Загрузка";
  const statusMode = status === "critical" ? "critical" : status === "ok" ? "primary" : "secondary";
  return (
    <>
      <section className="miniapp-hero">
        <PulseCloud status={status} />
        <Badge type="number" mode={statusMode}>{statusLabel}</Badge>
        <Title level="2" weight="2">{pulse?.message || "Проверяем платформу"}</Title>
        <Text>{pulse ? `${pulse.accounts_running}/${pulse.accounts_total} аккаунтов работают` : "Собираем актуальный пульс"}</Text>
      </section>
      <Section header="Сегодня">
        <Cell subhead="Аккаунты" after={<Badge type="number" mode={pulse?.accounts_running ? "primary" : "critical"}>{pulse?.accounts_running ?? "…"}</Badge>}>
          Работают сейчас
        </Cell>
        <Cell subhead="Внимание" after={<Badge type="number" mode={pulse?.attention_count ? "critical" : "secondary"}>{pulse?.attention_count ?? "…"}</Badge>}>
          События
        </Cell>
        <Cell subhead="Чаты" hint={String(pulse?.unread_chats ?? 0)}>Непрочитанные</Cell>
        <Cell subhead="Заказы" hint={String(pulse?.orders_total ?? 0)}>Всего в базе</Cell>
      </Section>
      <Section>
        <Button stretched size="l" onClick={() => runAction("refresh", async () => undefined, "Пульс обновлён")}>Проверить всё</Button>
        <Button stretched mode="gray" onClick={() => openTelegramLink(platformURL("/platform/dashboard"))}>Открыть платформу</Button>
      </Section>
    </>
  );
}

function AttentionView({ items, busy, runAction }: {
  items: MiniAppAttentionItem[];
  busy: string | null;
  runAction: (id: string, action: () => Promise<unknown>, success: string, asyncTitle?: string) => Promise<void>;
}) {
  if (!items.length) {
    return (
      <Placeholder header="Всё спокойно" description="Нет задач, которые требуют вашего внимания. Можно просто выдохнуть.">
        <PulseCloud status="ok" />
      </Placeholder>
    );
  }
  return (
    <Section header="Требует внимания">
      {items.map((item) => (
        <Cell
          key={item.id}
          multiline
          subhead={item.title}
          description={item.message}
          after={
            item.account_id ? (
              <Button size="s" loading={busy === item.id} onClick={() => runAction(item.id, () => miniAppApi.startRuntime(getToken(), item.account_id!), "Аккаунт запущен", "Запускаем Runner")}>
                {item.action}
              </Button>
            ) : item.proxy_id ? (
              <Button size="s" loading={busy === item.id} onClick={() => runAction(item.id, () => miniAppApi.confirmFreeProxy(getToken(), item.proxy_id!), "Прокси подтверждён")}>
                {item.action}
              </Button>
            ) : (
              <Button size="s" mode="gray" onClick={() => openTelegramLink(platformURL("/platform/subscription"))}>{item.action}</Button>
            )
          }
        >
          {item.severity === "critical" ? "Критично" : "Внимание"}
        </Cell>
      ))}
    </Section>
  );
}

let latestMiniAppToken = "";
function getToken() {
  return latestMiniAppToken;
}

function AccountsView({ accounts, busy, runAction }: {
  accounts: MiniAppAccount[];
  busy: string | null;
  runAction: (id: string, action: () => Promise<unknown>, success: string, asyncTitle?: string) => Promise<void>;
}) {
  if (!accounts.length) {
    return (
      <Placeholder
        header="Аккаунтов пока нет"
        description="Добавление аккаунтов остаётся на платформе."
        action={<Button stretched onClick={() => openTelegramLink(platformURL("/platform/accounts"))}>Открыть аккаунты</Button>}
      />
    );
  }
  return (
    <Section header="Аккаунты">
      {accounts.map((account) => (
        <Cell
          key={account.id}
          multiline
          subhead={account.runtime_active ? "Работает" : "Остановлен"}
          subtitle={account.proxy_label}
          description={`Runner ${account.runner_active ? "on" : "off"} · Keeper ${account.keeper_active ? "on" : "off"} · Raiser ${account.raiser_active ? "on" : "off"}`}
          after={
            account.runtime_active ? (
              <Button size="s" mode="gray" loading={busy === `stop:${account.id}`} onClick={() => runAction(`stop:${account.id}`, () => miniAppApi.stopRuntime(getToken(), account.id), "Аккаунт остановлен")}>Стоп</Button>
            ) : (
              <Button size="s" loading={busy === `start:${account.id}`} onClick={() => runAction(`start:${account.id}`, () => miniAppApi.startRuntime(getToken(), account.id), "Аккаунт запущен", "Запускаем Runner")}>Старт</Button>
            )
          }
        >
          {account.username || `Аккаунт #${account.id}`}
        </Cell>
      ))}
    </Section>
  );
}

function ProxiesView({ proxies, busy, runAction }: {
  proxies: MiniAppProxy[];
  busy: string | null;
  runAction: (id: string, action: () => Promise<unknown>, success: string, asyncTitle?: string) => Promise<void>;
}) {
  if (!proxies.length) {
    return (
      <Placeholder
        header="Прокси не назначены"
        description="Подключение и настройка прокси остаются на платформе."
        action={<Button stretched onClick={() => openTelegramLink(platformURL("/platform/proxies"))}>Открыть прокси</Button>}
      />
    );
  }
  return (
    <Section header="Прокси">
      {proxies.map((proxy) => (
        <Cell
          key={proxy.id}
          multiline
          subhead={statusText(proxy.health_status)}
          subtitle={proxy.assigned_username || "Не назначен"}
          description={proxy.is_shared_free ? "Ресурс сервиса без раскрытия доступа" : `Срок: ${dateLabel(proxy.expires_at)}`}
          after={
            proxy.confirm_required ? (
              <Button size="s" loading={busy === `proxy:${proxy.id}`} onClick={() => runAction(`proxy:${proxy.id}`, () => miniAppApi.confirmFreeProxy(getToken(), proxy.id), "Прокси оставлен")}>Оставить</Button>
            ) : (
              <Badge type="number" mode={proxy.health_status === "healthy" ? "primary" : "critical"}>{proxy.health_status === "healthy" ? "OK" : "!"}</Badge>
            )
          }
        >
          {proxy.display_name}
        </Cell>
      ))}
      <Cell after={<Button size="s" mode="gray" onClick={() => openTelegramLink(platformURL("/platform/proxies"))}>Открыть</Button>}>
        Управлять прокси
      </Cell>
    </Section>
  );
}

function BonusesView({ bonuses, promoCode, setPromoCode, redeemPromo, busy }: {
  bonuses: MiniAppBonuses | null;
  promoCode: string;
  setPromoCode: (value: string) => void;
  redeemPromo: () => Promise<void>;
  busy: string | null;
}) {
  return (
    <>
      <Section header="Подписка">
        <Cell subhead={bonuses?.subscription?.status || "Загрузка"} hint={bonuses?.subscription?.days_left == null ? "—" : `${bonuses.subscription.days_left} дн.`}>
          {bonuses?.subscription?.plan || "Проверяем тариф"}
        </Cell>
        <Cell after={<Button size="s" onClick={() => openTelegramLink(platformURL("/platform/subscription"))}>Продлить</Button>}>
          Управление подпиской
        </Cell>
      </Section>
      <Section header="Промокод">
        <Input header="Код" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="FP-CLOUD" />
        <Button stretched loading={busy === "promo"} disabled={!promoCode.trim()} onClick={redeemPromo}>Применить</Button>
      </Section>
      <Section header="Бонусы">
        <Cell hint={String(bonuses?.ai?.remaining ?? "—")}>AI сообщения</Cell>
        <Cell hint={bonuses?.referral?.referral_code || "—"}>Реферальный код</Cell>
        <Cell hint={String(bonuses?.daily?.streak ?? 1)}>Пульс проверен сегодня</Cell>
      </Section>
    </>
  );
}
