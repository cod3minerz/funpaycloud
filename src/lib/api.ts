import { getToken, logout } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.funpay.cloud';

export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Сетевая ошибка. Проверьте подключение к интернету.');
  }

  if (response.status === 401) {
    logout();
    throw new ApiError('Сессия истекла. Войдите снова.', 401);
  }

  const data = await response.json();

  if (!data.success) {
    throw new ApiError(data.error || 'Ошибка запроса', response.status);
  }

  return data.data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type AuthResult = { token: string; user: Record<string, unknown> };

export const authApi = {
  register: (email: string, password: string, referral_code?: string) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...(referral_code ? { referral_code } : {}) }),
    }),

  verify: (email: string, code: string) =>
    apiRequest<AuthResult>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  login: (email: string, password: string) =>
    apiRequest<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiRequest<Record<string, unknown>>('/api/auth/me'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export type DashboardData = {
  total_balance: number;
  accounts_count: number;
  orders_today: number;
  orders_today_revenue: number;
  active_lots: number;
  unread_chats: number;
  recent_orders: Array<Record<string, unknown>>;
  recent_chats: Array<Record<string, unknown>>;
};

export const dashboardApi = {
  get: () => apiRequest<DashboardData>('/api/dashboard'),
};

// ── Accounts ──────────────────────────────────────────────────────────────────

export type ApiAccount = {
  id: number | string;
  username: string;
  keeper_active: boolean;
  raiser_active: boolean;
};

export const accountsApi = {
  list: () => apiRequest<ApiAccount[]>('/api/accounts'),
  add: (golden_key: string) =>
    apiRequest<ApiAccount>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ golden_key }),
    }),
  delete: (id: number | string) =>
    apiRequest(`/api/accounts/${id}`, { method: 'DELETE' }),
  lots: (id: number | string) =>
    apiRequest<Array<Record<string, unknown>>>(`/api/accounts/${id}/lots`),
  raiseLot: (id: number | string, lotId: number | string) =>
    apiRequest(`/api/accounts/${id}/lots/${lotId}/raise`, { method: 'POST' }),
  startRaiser: (id: number | string) =>
    apiRequest(`/api/accounts/${id}/raiser/start`, { method: 'POST' }),
  stopRaiser: (id: number | string) =>
    apiRequest(`/api/accounts/${id}/raiser/stop`, { method: 'POST' }),
};

// ── Chats ─────────────────────────────────────────────────────────────────────

export type ApiChat = {
  id: string | number;
  buyer: string;
  last_message?: string;
  last_time?: string;
  unread?: number;
};

export type ApiMessage = {
  id: string | number;
  text: string;
  from_user: boolean;
  time: string;
  read: boolean;
};

export const chatsApi = {
  history: (accountId: number | string) =>
    apiRequest<ApiChat[]>(`/api/accounts/${accountId}/chats/history`),
  messages: (chatId: number | string, limit = 50) =>
    apiRequest<ApiMessage[]>(`/api/chats/${chatId}/messages?limit=${limit}`),
  send: (accountId: number | string, chat_id: number | string, text: string) =>
    apiRequest(`/api/accounts/${accountId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ chat_id, text }),
    }),
};

// ── Orders ────────────────────────────────────────────────────────────────────

export type ApiOrder = {
  id: string | number;
  account_id?: number | string;
  buyer?: string;
  lot?: string;
  amount?: number;
  status?: number;
  created_at?: string;
  description?: string;
};

export type OrdersResponse = {
  data: ApiOrder[];
  total: number;
  page: number;
  limit: number;
};

export const ordersApi = {
  list: (params: { account_id?: number | string; status?: number; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.account_id !== undefined) query.set('account_id', String(params.account_id));
    if (params.status !== undefined) query.set('status', String(params.status));
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    return apiRequest<OrdersResponse>(`/api/orders?${query.toString()}`);
  },
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export type AnalyticsData = {
  revenue: number;
  orders_count: number;
  avg_check: number;
  conversion: number;
  chart: Array<{ date: string; revenue: number; orders: number }>;
  top_products: Array<{ name: string; value: number }>;
  hourly: Array<{ hour: number; level: number }>;
  top_buyers: Array<{ username: string; orders: number; total: number; last_order: string }>;
  by_accounts: Array<{ name: string; value: number }>;
};

export const analyticsApi = {
  get: (params: { period: string; account_id?: number | string }) => {
    const query = new URLSearchParams({ period: params.period });
    if (params.account_id !== undefined) query.set('account_id', String(params.account_id));
    return apiRequest<AnalyticsData>(`/api/analytics?${query.toString()}`);
  },
};

// ── Automation ────────────────────────────────────────────────────────────────

export type ApiAutomationRule = {
  id: string | number;
  name: string;
  enabled: boolean;
  trigger_type: string;
  trigger_value?: string;
  action_type: string;
  action_value?: string;
};

export const automationApi = {
  list: () => apiRequest<ApiAutomationRule[]>('/api/automation'),
  create: (data: {
    name: string;
    trigger_type: string;
    trigger_value?: string;
    action_type: string;
    action_value?: string;
  }) =>
    apiRequest<ApiAutomationRule>('/api/automation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: string | number,
    data: {
      name: string;
      trigger_type: string;
      trigger_value?: string;
      action_type: string;
      action_value?: string;
    },
  ) =>
    apiRequest<ApiAutomationRule>(`/api/automation/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string | number) =>
    apiRequest(`/api/automation/${id}`, { method: 'DELETE' }),
  toggle: (id: string | number) =>
    apiRequest<ApiAutomationRule>(`/api/automation/${id}/toggle`, { method: 'PATCH' }),
};

// ── Plugins ───────────────────────────────────────────────────────────────────

export type ApiPlugin = {
  id: string | number;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number | 'free';
  installed: boolean;
  rating: number;
  reviews?: number;
};

export const pluginsApi = {
  list: () => apiRequest<ApiPlugin[]>('/api/plugins'),
  install: (slug: string, account_id?: number | string) => {
    const query = account_id !== undefined ? `?account_id=${account_id}` : '';
    return apiRequest(`/api/plugins/${slug}/install${query}`, { method: 'POST' });
  },
  uninstall: (slug: string, account_id?: number | string) => {
    const query = account_id !== undefined ? `?account_id=${account_id}` : '';
    return apiRequest(`/api/plugins/${slug}${query}`, { method: 'DELETE' });
  },
};

// ── Settings ──────────────────────────────────────────────────────────────────

export type ProfileData = {
  login?: string;
  email?: string;
  telegram?: string;
  timezone?: string;
};

export const settingsApi = {
  getProfile: () => apiRequest<ProfileData>('/api/settings/profile'),
  updateProfile: (data: { login: string }) =>
    apiRequest('/api/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updatePassword: (data: { old_password: string; new_password: string }) =>
    apiRequest('/api/settings/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getSubscription: () => apiRequest<Record<string, unknown>>('/api/settings/subscription'),
  getReferral: () =>
    apiRequest<{ referral_code: string; referrals: number; total_earned: number }>(
      '/api/settings/referral',
    ),
};

// ── Proxies ───────────────────────────────────────────────────────────────────

export type ApiProxy = {
  id: string | number;
  ip: string;
  country: string;
  city: string;
  type: string;
  protocol: string;
  status: 'available' | 'leased';
  speed_ms?: number;
  price_month?: number;
};

export type ProxiesMarketResponse = {
  data: ApiProxy[];
  total: number;
  page: number;
  limit: number;
};

export const proxiesApi = {
  market: (params: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    return apiRequest<ProxiesMarketResponse>(`/api/proxies/market?${query.toString()}`);
  },
  rent: (id: number | string) =>
    apiRequest(`/api/proxies/${id}/rent`, { method: 'POST' }),
  release: (id: number | string) =>
    apiRequest(`/api/proxies/${id}/release`, { method: 'DELETE' }),
};

// ── WebSocket ─────────────────────────────────────────────────────────────────

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.funpay.cloud').replace(
  /^http/,
  'ws',
);

export function createAccountWebSocket(
  accountId: number | string,
  onMessage: (event: { type: string; payload: Record<string, unknown> }) => void,
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/${accountId}`);

  ws.addEventListener('message', e => {
    try {
      const parsed = JSON.parse(e.data as string);
      onMessage(parsed);
    } catch {
      // ignore malformed frames
    }
  });

  return ws;
}
