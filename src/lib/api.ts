import { clearAdminToken, getAdminToken, getToken, logout } from './auth';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.funpay.cloud').replace(/\/+$/, '');

const PUBLIC_AUTH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
]);

export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
  ) {
    super(message);
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type ApiRequestOptions = RequestInit & { timeoutMs?: number };

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (!path.startsWith('/api/')) {
    throw new ApiError(`Неверный путь API: ${path}`);
  }

  const { timeoutMs = 15000, ...fetchOptions } = options;

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      mode: 'cors',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Сервер долго не отвечает. Попробуйте снова через несколько секунд.');
    }
    throw new ApiError(
      `Не удалось связаться с API (${BASE_URL}). Проверьте интернет или доступность сервера.`,
    );
  } finally {
    clearTimeout(timeout);
  }

  let envelope: ApiEnvelope<T> = { success: false, error: 'Ошибка запроса' };
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // ignore non-json bodies
  }

  if (response.status === 401) {
    const isPublic = PUBLIC_AUTH_PATHS.has(path);
    if (!isPublic && token) {
      logout();
    }
    throw new ApiError(envelope.error || 'Сессия истекла. Войдите снова.', 401);
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError(envelope.error || 'Ошибка запроса', response.status);
  }

  return (envelope.data as T) ?? ({} as T);
}

export async function adminApiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!path.startsWith('/admin-api/')) {
    throw new ApiError(`Неверный путь Admin API: ${path}`);
  }

  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    response = await fetch(path, {
      ...options,
      headers,
      signal: controller.signal,
      // Admin auth is header-based; do not send browser cookies to keep headers compact.
      credentials: 'omit',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Сервер долго не отвечает. Попробуйте снова через несколько секунд.');
    }
    throw new ApiError('Не удалось связаться с Admin API.');
  } finally {
    clearTimeout(timeout);
  }

  let envelope: ApiEnvelope<T> = { success: false, error: 'Ошибка запроса' };
  let rawBody = '';
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    try {
      rawBody = (await response.text()).trim();
    } catch {
      // ignore
    }
  }

  if (response.status === 401 || response.status === 403) {
    clearAdminToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
      window.location.href = '/admin/login';
    }
    throw new ApiError(envelope.error || 'Доступ запрещён', response.status);
  }

  if (!response.ok || !envelope.success) {
    const fallback = rawBody
      ? `Ошибка admin-запроса (${response.status}): ${rawBody.slice(0, 180)}`
      : `Ошибка admin-запроса (${response.status})`;
    throw new ApiError(envelope.error || fallback, response.status);
  }

  return (envelope.data as T) ?? ({} as T);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type AuthResult = { token: string; user?: Record<string, unknown> };

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
  runner_active?: boolean;
  keeper_active?: boolean;
  raiser_active?: boolean;
  runner_active_count?: number;
  keeper_active_count?: number;
  raiser_active_count?: number;
  total_balance: number;
  accounts_count: number;
  orders_today: number;
  orders_today_revenue: number;
  active_lots: number;
  unread_chats: number;
  recent_orders: ApiOrder[];
  recent_chats: ApiChat[];
};

export const dashboardApi = {
  get: () => apiRequest<DashboardData>('/api/dashboard'),
};

// ── Accounts ──────────────────────────────────────────────────────────────────

export type ApiAccount = {
  id: number;
  funpay_user_id?: number;
  username?: string;
  runner_active?: boolean;
  runner_events_today?: number;
  runner_last_event_at?: string | null;
  keeper_active: boolean;
  raiser_active: boolean;
  raiser_time?: string;
  raiser_timezone?: string;
  active_lots_count?: number;
};

export const accountsApi = {
  list: () => apiRequest<ApiAccount[]>('/api/accounts'),
  add: (golden_key: string) =>
    apiRequest<{ id: number }>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ golden_key }),
    }),
  delete: (id: number | string) =>
    apiRequest(`/api/accounts/${id}`, { method: 'DELETE' }),
  startRaiser: (id: number | string) =>
    apiRequest(`/api/accounts/${id}/raiser/start`, { method: 'POST' }),
  stopRaiser: (id: number | string) =>
    apiRequest(`/api/accounts/${id}/raiser/stop`, { method: 'POST' }),
  updateRaiserSchedule: (id: number | string, time: string, timezone: string) =>
    apiRequest(`/api/accounts/${id}/raiser/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ time, timezone }),
    }),
};

// ── Lots ──────────────────────────────────────────────────────────────────────

export type ApiLot = {
  id: string;
  db_id?: number;
  funpay_account_id: number;
  account_username: string;
  lot_id: string;
  title: string;
  description?: string;
  currency?: string;
  category_name: string;
  category_id?: number;
  node_id?: number;
  image_url?: string;
  amount?: number;
  price: number;
  is_active: boolean;
};

export const lotsApi = {
  listByAccount: (accountId: number | string) =>
    apiRequest<ApiLot[]>(`/api/accounts/${accountId}/lots`),
  categories: (accountId: number | string) =>
    apiRequest<Array<{
      game_id: number;
      game_title: string;
      subcategories: Array<{ id: number; name: string }>;
    }>>(`/api/accounts/${accountId}/lots/categories`),
  create: (
    accountId: number | string,
    payload: { node_id: number; title: string; description: string; price: number; amount: number },
  ) =>
    apiRequest<{ id?: string }>(`/api/accounts/${accountId}/lots`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (
    accountId: number | string,
    lotId: number | string,
    payload: { title: string; description: string; price: number; amount: number; is_active: boolean },
  ) =>
    apiRequest(`/api/accounts/${accountId}/lots/${lotId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (accountId: number | string, lotId: number | string) =>
    apiRequest(`/api/accounts/${accountId}/lots/${lotId}`, { method: 'DELETE' }),
  listAll: () => apiRequest<ApiLot[]>('/api/lots'),
  raiseLot: (accountId: number | string, lotId: number | string) =>
    apiRequest(`/api/accounts/${accountId}/lots/${lotId}/raise`, { method: 'POST' }),
};

// ── Chats ─────────────────────────────────────────────────────────────────────

export type ApiChat = {
  id: number;
  funpay_account_id?: number;
  node_id: string;
  with_user: string;
  last_message: string;
  unread: boolean;
  updated_at: string;
  created_at?: string;
};

export type ApiMessage = {
  id: number;
  chat_id?: number;
  temp_id?: number;
  funpay_message_id?: number;
  author_id?: number;
  author_name: string;
  text: string;
  is_my_msg: boolean;
  status?: 'pending' | 'delivered' | 'failed';
  created_at: string;
};

export type SendMessageResponse = {
  temp_id: number;
  text: string;
  is_my_msg: boolean;
  status: 'pending' | 'delivered' | 'failed';
  created_at: string;
};

export const chatsApi = {
  history: (accountId: number | string) =>
    apiRequest<ApiChat[]>(`/api/accounts/${accountId}/chats/history`),
  messages: (chatId: number | string, limit = 50, beforeId = 0) =>
    apiRequest<ApiMessage[]>(`/api/chats/${chatId}/messages?limit=${limit}&before_id=${beforeId}`),
  send: (accountId: number | string, chat_id: string, text: string) =>
    apiRequest<SendMessageResponse>(`/api/accounts/${accountId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ chat_id, text }),
    }),
};

// ── Orders ────────────────────────────────────────────────────────────────────

export type ApiOrder = {
  id: number;
  funpay_account_id: number;
  funpay_order_id: string;
  description: string;
  price: number;
  buyer_username: string;
  buyer_id: number;
  status: number;
  created_at: string;
  delivered_at?: string | null;
  delivered_via?: string;
  delivered_item?: string;
};

export type OrdersResponse = {
  orders: ApiOrder[];
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
  deliver: (id: number | string) =>
    apiRequest(`/api/orders/${id}/deliver`, {
      method: 'POST',
    }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export type AnalyticsData = {
  revenue: number;
  orders_count: number;
  avg_check: number;
  conversion: number;
  chart: Array<{ date: string; revenue: number }>;
  top_products: Array<{ name: string; revenue: number }>;
  hourly: Array<{ hour: number; orders: number }>;
  top_buyers: Array<{ username: string; orders: number; revenue: number; last_order: string }>;
  by_accounts: Array<{ account_id: number; username: string; revenue: number }>;
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
  id: number;
  name: string;
  enabled: boolean;
  trigger_type: string;
  trigger_value?: string;
  action_type: string;
  action_value?: string;
  funpay_account_id: number;
};

export const automationApi = {
  list: () => apiRequest<ApiAutomationRule[]>('/api/automation'),
  create: (data: {
    name: string;
    trigger_type: string;
    trigger_value?: string;
    action_type: string;
    action_value?: string;
    funpay_account_id: number;
  }) =>
    apiRequest<ApiAutomationRule>('/api/automation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: number | string,
    data: {
      name: string;
      trigger_type: string;
      trigger_value?: string;
      action_type: string;
      action_value?: string;
      funpay_account_id: number;
    },
  ) =>
    apiRequest<ApiAutomationRule>(`/api/automation/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number | string) =>
    apiRequest(`/api/automation/${id}`, { method: 'DELETE' }),
  toggle: (id: number | string) =>
    apiRequest<ApiAutomationRule>(`/api/automation/${id}/toggle`, { method: 'PATCH' }),
};

// ── Plugins ───────────────────────────────────────────────────────────────────

export type ApiPlugin = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  category: string;
  price_month: number;
  rating: number;
  reviews_count: number;
  available: boolean;
  installed: boolean;
};

export const pluginsApi = {
  list: (account_id?: number | string) => {
    const query = account_id !== undefined ? `?account_id=${account_id}` : '';
    return apiRequest<ApiPlugin[]>(`/api/plugins${query}`);
  },
  installed: (account_id: number | string) =>
    apiRequest<ApiPlugin[]>(`/api/plugins/installed?account_id=${account_id}`),
  install: (slug: string, account_id: number | string) =>
    apiRequest(`/api/plugins/${slug}/install?account_id=${account_id}`, { method: 'POST' }),
  uninstall: (slug: string, account_id: number | string) =>
    apiRequest(`/api/plugins/${slug}?account_id=${account_id}`, { method: 'DELETE' }),
};

// ── Settings ──────────────────────────────────────────────────────────────────

export type ProfileData = {
  login?: string;
  email?: string;
  telegram?: string;
  telegram_username?: string;
  timezone?: string;
};

export type SubscriptionData = {
  plan?: string;
  expires_at?: string | null;
  days_left?: number;
};

export type NotificationSettings = {
  enabled: boolean;
  new_order: boolean;
  new_message: boolean;
  login: boolean;
  weekly_report: boolean;
  subscription: boolean;
};

export type TelegramLinkData = {
  code: string;
  link: string;
};

export type AIConfig = {
  account_id: number;
  is_enabled: boolean;
  tone: 'formal' | 'neutral' | 'friendly' | string;
  system_prompt: string;
  delay_seconds: number;
  used_messages: number;
  limit_messages: number;
  remaining_messages: number;
};

export type AIFaqItem = {
  id: number;
  question: string;
  answer: string;
  created_at: string;
};

export type AITestHistoryItem = {
  role: 'user' | 'assistant' | 'ai';
  text: string;
};

export type AITestResponse = {
  reply: string;
  tokens_used: number;
  remaining_limit: number;
  used_messages?: number;
  limit_messages?: number;
};

export const settingsApi = {
  getProfile: () => apiRequest<ProfileData>('/api/settings/profile'),
  updateProfile: (data: { login: string; timezone?: string; telegram?: string }) =>
    apiRequest('/api/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updatePassword: (data: { old_password: string; new_password: string }) =>
    apiRequest('/api/settings/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getSubscription: () => apiRequest<SubscriptionData>('/api/settings/subscription'),
  getNotifications: () => apiRequest<NotificationSettings>('/api/settings/notifications'),
  updateNotifications: (data: NotificationSettings) =>
    apiRequest('/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getTelegramLink: () => apiRequest<TelegramLinkData>('/api/settings/telegram/link'),
  getReferral: () =>
    apiRequest<{ referral_code: string; referrals: Array<Record<string, unknown>>; total_earned: number }>(
      '/api/settings/referral',
    ),
};

export const aiApi = {
  getConfig: (accountId: number | string) =>
    apiRequest<AIConfig>(`/api/ai/config/${accountId}`),
  saveConfig: (
    accountId: number | string,
    payload: { is_enabled: boolean; tone: string; system_prompt: string; delay_seconds: number },
  ) =>
    apiRequest<AIConfig>(`/api/ai/config/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getFaq: (accountId: number | string) =>
    apiRequest<AIFaqItem[]>(`/api/ai/faq/${accountId}`),
  addFaq: (accountId: number | string, payload: { question: string; answer: string }) =>
    apiRequest<AIFaqItem>(`/api/ai/faq/${accountId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteFaq: (accountId: number | string, faqId: number | string) =>
    apiRequest(`/api/ai/faq/${accountId}/${faqId}`, {
      method: 'DELETE',
    }),
  test: (payload: { account_id: number; message: string; history: AITestHistoryItem[] }) =>
    apiRequest<AITestResponse>('/api/ai/test', {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 30000,
    }),
};

// ── Proxies ───────────────────────────────────────────────────────────────────

export type ApiProxy = {
  id: number;
  host: string;
  port: number;
  country: string;
  city: string;
  type: string;
  protocol: string;
  speed_ms: number;
  price_month: number;
  is_active: boolean;
};

export type ProxiesMarketResponse = {
  proxies: ApiProxy[];
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
  rent: (id: number | string, account_id: number | string) =>
    apiRequest(`/api/proxies/${id}/rent`, {
      method: 'POST',
      body: JSON.stringify({ account_id: Number(account_id) }),
    }),
  release: (id: number | string) =>
    apiRequest(`/api/proxies/${id}/release`, { method: 'DELETE' }),
};

// ── Finances ──────────────────────────────────────────────────────────────────

export type FinancesData = {
  total_revenue: number;
  total_orders: number;
  accounts_count: number;
  transactions: Array<{
    id: number;
    funpay_account_id: number;
    account_username: string;
    date: string;
    type: string;
    description: string;
    amount: number;
  }>;
};

export const financesApi = {
  get: (params: { account_id?: number | string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.account_id !== undefined) query.set('account_id', String(params.account_id));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    return apiRequest<FinancesData>(`/api/finances?${query.toString()}`);
  },
};

// ── Warehouse ─────────────────────────────────────────────────────────────────

export type ApiWarehouseItem = {
  id: string;
  value: string;
  status: 'available' | 'delivered';
  delivered_at?: string;
};

export type ApiWarehouseLot = {
  id: number;
  funpay_account_id: number;
  account_username: string;
  lot_id: string;
  title: string;
  auto_delivery_enabled: boolean;
  auto_delivery_template: string;
  stock_items: ApiWarehouseItem[];
};

export const warehouseApi = {
  list: (account_id?: number | string) => {
    const query = account_id !== undefined ? `?account_id=${account_id}` : '';
    return apiRequest<ApiWarehouseLot[]>(`/api/warehouse/lots${query}`);
  },
  addItems: (warehouseLotID: number | string, items: string[]) =>
    apiRequest(`/api/warehouse/lots/${warehouseLotID}/items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  updateSettings: (
    warehouseLotID: number | string,
    data: { auto_delivery_enabled: boolean; auto_delivery_template: string },
  ) =>
    apiRequest(`/api/warehouse/lots/${warehouseLotID}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getStock: (accountId: number | string, lotId: number | string) =>
    apiRequest<ApiWarehouseLot>(`/api/accounts/${accountId}/lots/${lotId}/stock`),
  addStock: (accountId: number | string, lotId: number | string, items: string[]) =>
    apiRequest(`/api/accounts/${accountId}/lots/${lotId}/stock`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  deleteStockItem: (accountId: number | string, lotId: number | string, itemIndex: number) =>
    apiRequest(`/api/accounts/${accountId}/lots/${lotId}/stock/${itemIndex}`, {
      method: 'DELETE',
    }),
  updateStockByLotID: (
    accountId: number | string,
    lotId: number | string,
    data: { auto_delivery_enabled: boolean; auto_delivery_template: string },
  ) =>
    apiRequest(`/api/accounts/${accountId}/lots/${lotId}/stock/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── WebSocket ─────────────────────────────────────────────────────────────────

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.funpay.cloud').replace(
  /^http/,
  'ws',
);

export function createAccountWebSocket(
  accountId: number | string,
  onMessage: (event: { type: string; data: Record<string, unknown> }) => void,
): WebSocket {
  const token = getToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  const ws = new WebSocket(`${WS_BASE}/ws/${accountId}${query}`);

  ws.addEventListener('message', e => {
    try {
      const parsed = JSON.parse(e.data as string) as { type: string; data?: Record<string, unknown>; payload?: Record<string, unknown> };
      onMessage({
        type: parsed.type,
        data: parsed.data ?? parsed.payload ?? {},
      });
    } catch {
      // ignore malformed frames
    }
  });

  return ws;
}

// ── Admin ────────────────────────────────────────────────────────────────────

export type AdminLog = {
  id: number;
  user_id?: number | null;
  funpay_account_id?: number | null;
  category: string;
  action: string;
  level: 'info' | 'warning' | 'error' | string;
  message: string;
  payload?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
};

export type AdminMetric = {
  id: number;
  cpu_usage?: number | null;
  ram_used_mb: number;
  ram_total_mb: number;
  goroutines: number;
  api_requests_per_min: number;
  errors_per_min: number;
  active_users: number;
  recorded_at: string;
};

export type AdminUser = {
  id: number;
  email: string;
  plan: string;
  accounts_count: number;
  created_at: string;
  last_login?: string | null;
};

export type AdminRunner = {
  account_id: number;
  username: string;
  user_id: number;
  started_at?: string | null;
  last_event_at?: string | null;
  keeper_active: boolean;
  raiser_active: boolean;
  runner_active: boolean;
};

export type AdminBan = {
  id: number;
  type: string;
  value: string;
  reason?: string;
  banned_by?: number | null;
  created_at: string;
};

export type AdminStats = {
  users_total: number;
  users_by_plan: Record<string, number>;
  accounts_total: number;
  orders_today: number;
  messages_today: number;
  errors_last_hour: number;
  active_goroutines: number;
};

export const adminApi = {
  login: (email: string, password: string, totp: string) =>
    adminApiRequest<{ token: string; user: { id: number; email: string } }>('/admin-api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, totp }),
    }),
  logout: () =>
    adminApiRequest('/admin-api/auth/logout', {
      method: 'POST',
    }),
  me: () => adminApiRequest<{ id: number; email: string; plan: string }>('/admin-api/auth/me'),
  stats: () => adminApiRequest<AdminStats>('/admin-api/stats'),
  metrics: (period: '1h' | '24h' | '7d' = '24h') =>
    adminApiRequest<{ current: AdminMetric; history: AdminMetric[]; period: string }>(`/admin-api/metrics?period=${period}`),
  logs: (params: { category?: string; level?: string; user_id?: number; account_id?: number; from?: string; to?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.level) query.set('level', params.level);
    if (params.user_id !== undefined) query.set('user_id', String(params.user_id));
    if (params.account_id !== undefined) query.set('account_id', String(params.account_id));
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    return adminApiRequest<{ logs: AdminLog[]; total: number; page: number; limit: number }>(`/admin-api/logs?${query.toString()}`);
  },
  logsCsv: (params: { category?: string; level?: string; user_id?: number; account_id?: number; from?: string; to?: string }) => {
    const query = new URLSearchParams({ format: 'csv' });
    if (params.category) query.set('category', params.category);
    if (params.level) query.set('level', params.level);
    if (params.user_id !== undefined) query.set('user_id', String(params.user_id));
    if (params.account_id !== undefined) query.set('account_id', String(params.account_id));
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    return fetch(`/admin-api/logs?${query.toString()}`, {
      headers: (() => {
        const token = getAdminToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      })(),
      credentials: 'omit',
    });
  },
  users: (params: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    return adminApiRequest<{ users: AdminUser[]; total: number; page: number; limit: number; search: string }>(`/admin-api/users?${query.toString()}`);
  },
  userDetail: (id: number | string) =>
    adminApiRequest<{ user: AdminUser; accounts: Array<Record<string, unknown>>; logs: AdminLog[] }>(`/admin-api/users/${id}`),
  updatePlan: (id: number | string, plan: string) =>
    adminApiRequest(`/admin-api/users/${id}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    }),
  banUser: (id: number | string, reason: string) =>
    adminApiRequest(`/admin-api/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  unbanUser: (id: number | string) =>
    adminApiRequest(`/admin-api/users/${id}/ban`, {
      method: 'DELETE',
    }),
  runners: () => adminApiRequest<AdminRunner[]>('/admin-api/runners'),
  stopRunner: (accountId: number | string) =>
    adminApiRequest(`/admin-api/runners/${accountId}/stop`, { method: 'POST' }),
  restartRunner: (accountId: number | string) =>
    adminApiRequest(`/admin-api/runners/${accountId}/restart`, { method: 'POST' }),
  stopAllRunners: () =>
    adminApiRequest<{ stopped: number }>('/admin-api/runners/stop-all', { method: 'POST' }),
  bans: (params: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    return adminApiRequest<{ items: AdminBan[]; total: number; page: number; limit: number }>(`/admin-api/bans?${query.toString()}`);
  },
  addBan: (payload: { type: string; value: string; reason?: string }) =>
    adminApiRequest('/admin-api/bans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteBan: (id: number | string) =>
    adminApiRequest(`/admin-api/bans/${id}`, {
      method: 'DELETE',
    }),
};
