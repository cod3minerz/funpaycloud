import type { AsyncOperationStart, BackgroundOperation } from "@/lib/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://api.funpay.cloud").replace(/\/+$/, "");

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

export class MiniAppApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
  }
}

async function miniFetch<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      mode: "cors",
      credentials: "omit",
    });
  } catch {
    throw new MiniAppApiError("API временно недоступен");
  }

  let envelope: Envelope<T> = { success: false, error: "Ошибка запроса" };
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    // ignore
  }
  if (!response.ok || !envelope.success) {
    throw new MiniAppApiError(envelope.error || "Ошибка запроса", response.status, envelope.code);
  }
  return (envelope.data ?? ({} as T)) as T;
}

export type MiniAppUser = {
  id: number;
  email: string;
  name: string;
  telegram_username?: string;
  telegram_photo_url?: string;
  plan: string;
  subscription_status: string;
  subscription_days_left?: number | null;
  subscription_expired?: boolean;
};

export type MiniAppSession = {
  linked: boolean;
  token?: string;
  expires_at?: string;
  user?: MiniAppUser;
  telegram_user?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  };
};

export type MiniAppAccount = {
  id: number;
  username: string;
  runner_active: boolean;
  keeper_active: boolean;
  raiser_active: boolean;
  runtime_active: boolean;
  last_event_at?: string | null;
  proxy_label: string;
  proxy_connected: boolean;
};

export type MiniAppProxy = {
  id: number;
  product: string;
  label: string;
  display_name: string;
  is_shared_free: boolean;
  health_status: string;
  expires_at?: string | null;
  assigned_username?: string;
  confirm_required?: boolean;
  confirm_deadline_at?: string | null;
};

export type MiniAppAttentionItem = {
  id: string;
  type: string;
  severity: "warning" | "critical" | string;
  title: string;
  message: string;
  action: string;
  account_id?: number;
  proxy_id?: number;
};

export type MiniAppPulse = {
  status: "ok" | "warning" | "critical" | string;
  message: string;
  accounts_total: number;
  accounts_running: number;
  attention_count: number;
  orders_total: number;
  unread_chats: number;
  subscription: {
    plan: string;
    status: string;
    days_left?: number | null;
    expires_at?: string | null;
  };
  accounts: MiniAppAccount[];
  proxies: MiniAppProxy[];
  attention_items: MiniAppAttentionItem[];
};

export type MiniAppBonuses = {
  subscription: {
    plan: string;
    status: string;
    days_left?: number | null;
    expires_at?: string | null;
    is_expired?: boolean;
  };
  promo_items: Array<Record<string, unknown>>;
  referral?: {
    referral_code?: string;
    referrals?: Array<Record<string, unknown>>;
    total_earned?: number;
  };
  ai?: { used?: number; limit?: number; remaining?: number };
  daily?: { checked_today?: boolean; streak?: number };
};

export const miniAppApi = {
  session: (initData: string) =>
    miniFetch<MiniAppSession>("/api/miniapp/session", undefined, {
      method: "POST",
      body: JSON.stringify({ init_data: initData }),
    }),
  pulse: (token: string) => miniFetch<MiniAppPulse>("/api/miniapp/pulse", token),
  attention: (token: string) => miniFetch<{ items: MiniAppAttentionItem[] }>("/api/miniapp/attention", token),
  accounts: (token: string) => miniFetch<{ items: MiniAppAccount[] }>("/api/miniapp/accounts", token),
  proxies: (token: string) => miniFetch<{ items: MiniAppProxy[] }>("/api/miniapp/proxies", token),
  bonuses: (token: string) => miniFetch<MiniAppBonuses>("/api/miniapp/bonuses", token),
  startRuntime: (token: string, accountId: number) =>
    miniFetch<AsyncOperationStart>(`/api/miniapp/accounts/${accountId}/runtime/start`, token, {
      method: "POST",
      headers: { Prefer: "respond-async" },
    }),
  operation: (token: string, id: string) =>
    miniFetch<BackgroundOperation>(`/api/miniapp/operations/${encodeURIComponent(id)}`, token),
  stopRuntime: (token: string, accountId: number) =>
    miniFetch<{ message?: string }>(`/api/miniapp/accounts/${accountId}/runtime/stop`, token, { method: "POST" }),
  confirmFreeProxy: (token: string, proxyId: number) =>
    miniFetch<{ message?: string }>(`/api/miniapp/proxies/${proxyId}/confirm-free`, token, { method: "POST" }),
  redeemPromo: (token: string, code: string) =>
    miniFetch<{ result?: Record<string, unknown> }>("/api/miniapp/promo/redeem", token, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};
