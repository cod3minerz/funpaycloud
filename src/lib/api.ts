import { clearAdminToken, logout } from './auth';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.funpay.cloud').replace(/\/+$/, '');

const PUBLIC_AUTH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/verify/resend',
  '/api/auth/password/forgot',
  '/api/auth/password/verify-code',
  '/api/auth/password/reset',
  '/api/auth/refresh',
  '/api/auth/csrf',
]);
let refreshInFlight: Promise<boolean> | null = null;

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

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
  _retryAttempted?: boolean;
  _csrfRetryAttempted?: boolean;
};

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const row = document.cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.split('=').slice(1).join('=')) : '';
}

function isStateChangingMethod(method?: string): boolean {
  const normalized = (method || 'GET').toUpperCase();
  return normalized !== 'GET' && normalized !== 'HEAD' && normalized !== 'OPTIONS';
}

async function ensureCsrfToken(): Promise<string> {
  let token = getCookie('fp_csrf');
  if (token) return token;

  try {
    const response = await fetch(`${BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
    });
    if (!response.ok) {
      return '';
    }
    const payload = (await response.json()) as ApiEnvelope<{ csrf_token?: string }>;
    token = payload?.data?.csrf_token || getCookie('fp_csrf');
    return token || '';
  } catch {
    return '';
  }
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const csrf = await ensureCsrfToken();
    try {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        },
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (!path.startsWith('/api/')) {
    throw new ApiError(`Неверный путь API: ${path}`);
  }

  const { timeoutMs = 15000, _retryAttempted = false, _csrfRetryAttempted = false, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (isStateChangingMethod(method)) {
    const csrf = await ensureCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
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
      credentials: 'include',
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
    if (!isPublic && path !== '/api/auth/refresh' && !_retryAttempted) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiRequest<T>(path, { ...options, _retryAttempted: true });
      }
      logout();
    }
    throw new ApiError(envelope.error || 'Сессия истекла. Войдите снова.', 401);
  }

  if (response.status === 403 && !_csrfRetryAttempted && isStateChangingMethod(method)) {
    const errorText = (envelope.error || '').toLowerCase();
    if (errorText.includes('csrf')) {
      await ensureCsrfToken();
      return apiRequest<T>(path, { ...options, _csrfRetryAttempted: true });
    }
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

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    response = await fetch(path, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'include',
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

export type AuthResult = { token?: string; user?: Record<string, unknown> };

export type AuthMeData = {
  id: number;
  email: string;
  plan: string;
  subscription_status?: 'active_trial' | 'active_paid' | 'expired_trial' | 'expired_paid' | string;
  trial_expires_at?: string | null;
  trial_expired?: boolean;
  subscription_expires_at?: string | null;
  subscription_days_left?: number | null;
  subscription_expired?: boolean;
  status_code?: 'trial_expired' | 'subscription_expired' | string;
  accounts_count?: number;
  ai_bonus_messages?: number;
  plan_limits?: Record<string, unknown>;
  referral_code?: string;
};

export const authApi = {
  register: (
    email: string,
    password: string,
    payload?: { referral_code?: string; promo_code?: string },
  ) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        ...(payload?.referral_code ? { referral_code: payload.referral_code } : {}),
        ...(payload?.promo_code ? { promo_code: payload.promo_code } : {}),
      }),
    }),

  verify: (email: string, code: string) =>
    apiRequest<AuthResult>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resendCode: (email: string, mode: 'register' | 'reset' = 'register') =>
    apiRequest('/api/auth/verify/resend', {
      method: 'POST',
      body: JSON.stringify({ email, mode }),
    }),

  login: (email: string, password: string) =>
    apiRequest<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    apiRequest('/api/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetCode: (email: string, code: string) =>
    apiRequest<{ reset_token: string }>('/api/auth/password/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resetPassword: (reset_token: string, password: string) =>
    apiRequest('/api/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ reset_token, password }),
    }),

  me: () => apiRequest<AuthMeData>('/api/auth/me'),
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
  proxy_connected?: boolean;
  proxy_healthy?: boolean;
  proxy_type?: 'none' | 'free_shared' | 'individual' | string;
  proxy_label?: string;
  proxy_shared_number?: number | null;
  proxy_used_accounts?: number;
  proxy_max_accounts?: number;
};

export type ConnectProxyPayload =
  | { mode: 'free' | 'individual' }
  | {
      mode: 'external';
      protocol: 'HTTP' | 'HTTPS' | 'SOCKS5';
      host: string;
      port: number;
      username?: string;
      password?: string;
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
  stopRuntime: (id: number | string) =>
    apiRequest<{ message?: string }>(`/api/accounts/${id}/runtime/stop`, {
      method: 'POST',
    }),
  startRuntime: (id: number | string) =>
    apiRequest<{ message?: string }>(`/api/accounts/${id}/runtime/start`, {
      method: 'POST',
    }),
  stopAllRuntime: () =>
    apiRequest<{ affected: number }>('/api/accounts/runtime/stop-all', {
      method: 'POST',
    }),
  startAllRuntime: () =>
    apiRequest<{ started: number; failed: Record<string, string> }>('/api/accounts/runtime/start-all', {
      method: 'POST',
    }),
  connectProxy: (id: number | string, payload: ConnectProxyPayload | 'free' | 'individual') =>
    apiRequest<{
      proxy_id: number;
      shared_number?: number;
      label: string;
      used_accounts?: number;
      max_accounts?: number;
      support_url?: string;
      is_shared_free?: boolean;
      protocol?: string;
      host?: string;
      port?: number;
    }>(`/api/accounts/${id}/proxy/connect`, {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { mode: payload } : payload),
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
  node_type?: 'lots' | 'chips' | string;
  image_url?: string;
  external_url?: string;
  edit_url?: string;
  amount?: number;
  price: number;
  is_active: boolean;
  params?: ApiLotParam[];
};

export type ApiLotCategorySubcategory = {
  id: number;
  name: string;
  url?: string;
  node_type: 'lots' | 'chips' | string;
};

export type ApiLotCategory = {
  game_id: number;
  game_title: string;
  variant_name?: string;
  title_url?: string;
  title_node_id?: number;
  title_node_type?: 'lots' | 'chips' | string;
  sort_letter?: string;
  subcategories: ApiLotCategorySubcategory[];
};

export type ApiLotEditableField = {
  label: string;
  type: string;
  name: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
  required: boolean;
  placeholder?: string;
};

export type ApiLotEditValues = Record<string, string | boolean | string[]>;
export type ApiLotCreateField = ApiLotEditableField;
export type ApiLotCreateValues = Record<string, string | boolean | string[]>;

export type ApiLotEditForm = {
  lot: {
    id: string;
    lot_id: string;
    title: string;
    description?: string;
    price?: number;
    amount?: number;
    is_active?: boolean;
    category_name?: string;
    category_id?: number;
    funpay_account_id: number;
    account_username: string;
    node_id?: number;
    node_type?: 'lots' | 'chips' | string;
    external_url?: string;
    edit_url?: string;
  };
  schema: ApiLotEditableField[];
  values: ApiLotEditValues;
  meta: {
    node_id?: number;
    node_type?: 'lots' | 'chips' | string;
    edit_url?: string;
    source_url?: string;
    loaded_at?: string;
    field_count?: number;
  };
};

export type ApiLotCreateForm = {
  schema: ApiLotCreateField[];
  schema_status: 'ready' | 'missing';
  schema_source?: 'stored' | 'live_synced' | string;
  sync_error?: string;
  category?: {
    title?: string;
    variant_name?: string;
  };
  subcategory?: {
    id?: number;
    name?: string;
  };
  meta: {
    node_id?: number;
    node_type?: 'lots' | 'chips' | string;
    source_url?: string;
    subcategory_id?: number;
    category_title?: string;
    subcategory_name?: string;
    variant_name?: string;
    loaded_at?: string;
    field_count?: number;
  };
};

export const lotsApi = {
  listByAccount: (accountId: number | string, options?: { refresh?: boolean }) => {
    const query = new URLSearchParams();
    if (options?.refresh) query.set('refresh', '1');
    const suffix = query.toString();
    return apiRequest<ApiLot[]>(`/api/accounts/${accountId}/lots${suffix ? `?${suffix}` : ''}`);
  },
  categories: (accountId: number | string) =>
    apiRequest<ApiLotCategory[]>(`/api/accounts/${accountId}/lots/categories`),
  getCreateForm: (accountId: number | string, nodeId: number, nodeType: string) =>
    apiRequest<ApiLotCreateForm>(`/api/accounts/${accountId}/lots/create-form?node_id=${nodeId}&node_type=${encodeURIComponent(nodeType)}`),
  create: (
    accountId: number | string,
    payload:
      | { node_id: number; node_type?: string; title: string; description: string; price: number; amount: number }
      | {
          mode: 'schema';
          node_id: number;
          node_type: string;
          values: ApiLotCreateValues;
          warehouse_items?: string[];
          auto_delivery_enabled?: boolean;
          auto_delivery_template?: string;
        },
  ) =>
    apiRequest<{ id?: string }>(`/api/accounts/${accountId}/lots`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getEditForm: (accountId: number | string, lotId: number | string) =>
    apiRequest<ApiLotEditForm>(`/api/accounts/${accountId}/lots/${lotId}/edit-form`),
  update: (
    accountId: number | string,
    lotId: number | string,
    payload:
      | { title: string; description: string; price: number; amount: number; is_active: boolean }
      | { mode: 'schema'; values: ApiLotEditValues },
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
  cursor_message_id?: number | null;
  author_id?: number;
  author_name: string;
  text: string;
  is_my_msg: boolean;
  source?: string | null;
  ingest_kind?: string | null;
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
  reconcileDelivery: (id: number | string) =>
    apiRequest(`/api/orders/${id}/reconcile-delivery`, {
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

// ── Scenarios ─────────────────────────────────────────────────────────────────

export type ApiScenario = {
  id: string;
  user_id: number;
  funpay_account_id: number;
  name: string;
  trigger_type: string;
  flow_data: string; // JSON string
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiScenarioLog = {
  id: string;
  scenario_id: string;
  funpay_account_id: number;
  status: string;
  started_at: string;
  completed_at: string;
  error_message: string;
  execution_path: string;
};

export const scenariosApi = {
  list: (accountId: number | string) => apiRequest<ApiScenario[]>(`/api/accounts/${accountId}/scenarios`),
  create: (
    accountId: number | string,
    data: { name: string; trigger_type: string; flow_data: string; is_active: boolean },
  ) =>
    apiRequest<{ id: string }>(`/api/accounts/${accountId}/scenarios`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (id: string) => apiRequest<ApiScenario>(`/api/scenarios/${id}`),
  update: (id: string, data: { name: string; flow_data: string; is_active: boolean }) =>
    apiRequest<{ updated: boolean }>(`/api/scenarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest<{ deleted: boolean }>(`/api/scenarios/${id}`, { method: 'DELETE' }),
  getLogs: (id: string) => apiRequest<ApiScenarioLog[]>(`/api/scenarios/${id}/logs`),
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

export type ApiConfigField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  default: string;
  options: string[] | null;
};

export type ApiStatField = {
  key: string;
  label: string;
  icon: string;
};

export type ApiPluginSchema = {
  config_schema: ApiConfigField[];
  stats_schema: ApiStatField[];
};

export type ApiPluginLog = {
  id: number;
  level: 'info' | 'error' | 'debug';
  event: string;
  payload: Record<string, unknown>;
  created_at: string;
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
  schema: (slug: string, account_id: number | string) =>
    apiRequest<ApiPluginSchema>(`/api/plugins/${slug}/schema?account_id=${account_id}`),
  getConfig: (slug: string, account_id: number | string) =>
    apiRequest<Record<string, string>>(`/api/plugins/${slug}/config?account_id=${account_id}`),
  saveConfig: (slug: string, account_id: number | string, config: Record<string, string>) =>
    apiRequest(`/api/plugins/${slug}/config?account_id=${account_id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  logs: (slug: string, account_id: number | string, limit = 50) =>
    apiRequest<ApiPluginLog[]>(`/api/plugins/${slug}/logs?account_id=${account_id}&limit=${limit}`),
  stats: (slug: string, account_id: number | string, days = 7) =>
    apiRequest<Record<string, number>>(`/api/plugins/${slug}/stats?account_id=${account_id}&days=${days}`),
};

// ── Settings ──────────────────────────────────────────────────────────────────

export type ProfileData = {
  login?: string;
  email?: string;
  telegram?: string;
  telegram_linked?: boolean;
  telegram_id?: number | null;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  telegram_photo_url?: string;
  telegram_notifications_enabled?: boolean;
  timezone?: string;
};

export type SubscriptionData = {
  plan?: string;
  subscription_status?: 'active_trial' | 'active_paid' | 'expired_trial' | 'expired_paid' | string;
  expires_at?: string | null;
  days_left?: number | null;
  trial_expired?: boolean;
  subscription_expired?: boolean;
  status_code?: 'trial_expired' | 'subscription_expired' | string;
  ai_bonus_count?: number;
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
  available: boolean;
  bot_id?: number;
  bot_username?: string;
  login_domain?: string;
  linked?: boolean;
};

export type TelegramAuthPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export type PromoRedemptionItem = {
  id: number;
  code: string;
  reward_type: 'plan' | 'ai_messages' | string;
  reward_plan?: string | null;
  reward_ai_messages: number;
  duration_days: number;
  redeemed_at: string;
};

export type PromoRedeemResult = {
  code: string;
  reward_type: 'plan' | 'ai_messages' | string;
  reward_plan?: string;
  reward_ai_messages?: number;
  duration_days?: number;
};

export type AIConfig = {
  account_id: number;
  is_enabled: boolean;
  tone: 'formal' | 'neutral' | 'friendly' | string;
  system_prompt: string;
  delay_seconds: number;
  show_ai_signature: boolean;
  chat_mode?: 'assistant' | 'constructor' | string;
  constructor_scenario_id?: string | null;
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
  effective_mode?: 'assistant' | 'constructor' | string;
  trace?: Array<Record<string, unknown>>;
};

export type AITestConfigOverride = {
  tone?: string;
  system_prompt?: string;
  delay_seconds?: number;
  show_ai_signature?: boolean;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
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
    apiRequest<NotificationSettings>('/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getTelegramLink: () => apiRequest<TelegramLinkData>('/api/settings/telegram/link'),
  linkTelegram: (data: TelegramAuthPayload) =>
    apiRequest<{ linked: boolean }>('/api/telegram/link', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  unlinkTelegram: () =>
    apiRequest<{ linked: boolean }>('/api/telegram/unlink', {
      method: 'POST',
    }),
  getReferral: () =>
    apiRequest<{ referral_code: string; referrals: Array<Record<string, unknown>>; total_earned: number }>(
      '/api/settings/referral',
    ),
};

export const promoApi = {
  my: () =>
    apiRequest<{
      items: PromoRedemptionItem[];
      ai: { used: number; limit: number; remaining: number };
    }>('/api/promo/my'),
  redeem: (code: string) =>
    apiRequest<{
      result: PromoRedeemResult;
      meta?: { ai_used?: number; ai_limit?: number; ai_remaining?: number };
    }>('/api/promo/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

export const aiApi = {
  getConfig: (accountId: number | string) =>
    apiRequest<AIConfig>(`/api/ai/config/${accountId}`),
  saveConfig: (
    accountId: number | string,
    payload: {
      is_enabled: boolean;
      tone: string;
      system_prompt: string;
      delay_seconds: number;
      show_ai_signature: boolean;
      chat_mode?: 'assistant' | 'constructor' | string;
      constructor_scenario_id?: string;
    },
  ) =>
    apiRequest<AIConfig>(`/api/ai/config/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateMode: (
    accountId: number | string,
    payload: {
      chat_mode: 'assistant' | 'constructor';
      constructor_scenario_id?: string;
    },
  ) =>
    apiRequest<AIConfig>(`/api/ai/config/${accountId}/mode`, {
      method: 'PATCH',
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
  test: (payload: {
    account_id: number;
    message: string;
    history: AITestHistoryItem[];
    config_override?: {
      tone?: string;
      system_prompt?: string;
      show_ai_signature?: boolean;
    };
  }) =>
    apiRequest<AITestResponse>('/api/ai/test', {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 30000,
    }),
  testChat: (payload: {
    account_id: number;
    message: string;
    history: AITestHistoryItem[];
    auto_mode: boolean;
    override_mode?: 'assistant' | 'constructor';
    scenario_id?: string;
    config_override?: AITestConfigOverride;
  }) =>
    apiRequest<AITestResponse>('/api/ai/test-chat', {
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
  listMine: () => apiRequest<{ items: MyProxyItem[] }>('/api/proxies/my'),
  getCredentials: (id: number | string) =>
    apiRequest<MyProxyCredentials>(`/api/proxies/my/${id}/credentials`, {
      method: 'POST',
    }),
  assignMine: (id: number | string, payload: { account_id: number }) =>
    apiRequest<{ ok?: boolean }>(`/api/proxies/my/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  releaseMine: (id: number | string) =>
    apiRequest<{ ok?: boolean }>(`/api/proxies/my/${id}/release`, {
      method: 'POST',
    }),
  createExternal: (payload: {
    host: string;
    port: number;
    protocol: 'HTTP' | 'HTTPS' | 'SOCKS5';
    username?: string;
    password?: string;
  }) =>
    apiRequest<{ id: number }>('/api/proxies/my/external', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkMine: (id: number | string) =>
    apiRequest<{ status: string; error?: string }>(`/api/proxies/my/${id}/check`, {
      method: 'POST',
    }),
  confirmFree: (id: number | string) =>
    apiRequest<{ ok?: boolean }>(`/api/proxies/my/${id}/confirm-free`, {
      method: 'POST',
    }),
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

export type SubscriptionPaymentHistoryItem = {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  type: 'subscription' | string;
  plan: string;
  period_days: number;
  provider: string;
  provider_payment_id: string;
  payment_id: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled' | string;
  created_at: string;
  paid_at?: string | null;
  failed_at?: string | null;
};

export type CreateSubscriptionPaymentResponse = {
  payment_id: number;
  status: string;
  plan: string;
  period_days: number;
  amount: number;
  currency: string;
  checkout_url: string;
  idempotency_key: string;
};

export type SubscriptionCheckoutStatus = {
  id: number;
  status: string;
  plan: string;
  period_days: number;
  amount: number;
  currency: string;
  created_at: string;
  paid_at?: string | null;
  failed_at?: string | null;
};

export type CreateProxyPaymentResponse = {
  payment_id: number;
  status: string;
  product?: 'proxy_lite' | 'proxy_pro' | string;
  amount: number;
  currency: string;
  checkout_url: string;
  idempotency_key: string;
};

export type ProxyCheckoutStatus = {
  id: number;
  status: string;
  amount: number;
  currency: string;
  type: string;
  product?: string;
  provision_status?: 'pending' | 'success' | 'failed' | string;
  provision_error?: string;
  created_at: string;
  paid_at?: string | null;
  failed_at?: string | null;
};

export type MyProxyItem = {
  id: number;
  product: 'free_shared' | 'proxy_lite' | 'proxy_pro' | 'external_custom' | string;
  label: string;
  display_name?: string;
  host: string;
  port: number;
  protocol: string;
  is_shared_free: boolean;
  shared_number?: number | null;
  has_credentials: boolean;
  is_active: boolean;
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'expired' | string;
  fail_count: number;
  last_error?: string;
  last_checked_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  assigned_account_id?: number | null;
  assigned_username?: string | null;
  confirm_required?: boolean;
  confirm_deadline_at?: string | null;
};

export type MyProxyCredentials = {
  username: string;
  password: string;
};

export const financesApi = {
  get: (params: { account_id?: number | string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.account_id !== undefined) query.set('account_id', String(params.account_id));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    return apiRequest<FinancesData>(`/api/finances?${query.toString()}`);
  },
};

export const billingApi = {
  listSubscriptionHistory: (limit = 50) =>
    apiRequest<{ items: SubscriptionPaymentHistoryItem[] }>(`/api/billing/subscriptions/history?limit=${limit}`),
  createSubscriptionPayment: (payload: {
    plan: 'lite' | 'pro' | 'ultra';
    period_days?: number;
    idempotency_key?: string;
    provider?: string;
  }) =>
    apiRequest<CreateSubscriptionPaymentResponse>('/api/billing/subscriptions/create-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCheckoutStatus: (paymentId: number | string) =>
    apiRequest<SubscriptionCheckoutStatus>(`/api/billing/subscriptions/checkout-status/${paymentId}`),
  createProxyPayment: (payload: {
    account_id: number;
    product: 'proxy_lite' | 'proxy_pro';
    idempotency_key?: string;
  }) =>
    apiRequest<CreateProxyPaymentResponse>('/api/billing/proxies/create-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createIndividualProxyPayment: (payload: { account_id: number; idempotency_key?: string }) =>
    apiRequest<CreateProxyPaymentResponse>('/api/billing/proxies/individual/create-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getProxyCheckoutStatus: (paymentId: number | string) =>
    apiRequest<ProxyCheckoutStatus>(`/api/billing/proxies/checkout-status/${paymentId}`),
};

// ── Warehouse ─────────────────────────────────────────────────────────────────

export type ApiWarehouseItem = {
  id: string;
  value: string;
  status: 'available' | 'delivered';
  delivered_at?: string;
};

export type ApiLotParam = {
  label: string;
  value: string;
};

export type ApiWarehouseLot = {
  id: number;
  funpay_account_id: number;
  account_username: string;
  lot_id: string;
  title: string;
  description?: string;
  currency?: string;
  category_name?: string;
  category_id?: number;
  node_id?: number;
  node_type?: 'lots' | 'chips' | string;
  image_url?: string;
  external_url?: string;
  edit_url?: string;
  params?: ApiLotParam[];
  amount?: number;
  price?: number;
  is_active?: boolean;
  auto_delivery_enabled: boolean;
  auto_delivery_template: string;
  stock_items: ApiWarehouseItem[];
};

export const warehouseApi = {
  list: (account_id?: number | string, options?: { refresh?: boolean }) => {
    const query = new URLSearchParams();
    if (account_id !== undefined) query.set('account_id', String(account_id));
    if (options?.refresh) query.set('refresh', '1');
    const suffix = query.toString();
    return apiRequest<ApiWarehouseLot[]>(`/api/warehouse/lots${suffix ? `?${suffix}` : ''}`);
  },
  details: (accountId: number | string, lotId: number | string) =>
    apiRequest<ApiWarehouseLot>(`/api/accounts/${accountId}/lots/${lotId}`),
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

export async function createAccountWebSocket(
  accountId: number | string,
  onMessage: (event: { type: string; data: Record<string, unknown> }) => void,
): Promise<WebSocket> {
  const ticketResponse = await apiRequest<{ ticket: string }>('/api/ws/token', {
    method: 'POST',
    body: JSON.stringify({ account_id: Number(accountId) }),
  });
  const ws = new WebSocket(`${WS_BASE}/ws/${accountId}?ticket=${encodeURIComponent(ticketResponse.ticket)}`);

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

export type AdminSharedProxy = {
  id: number;
  shared_number: number;
  host: string;
  port: number;
  protocol: string;
  is_active: boolean;
  health_state?: 'healthy' | 'degraded' | 'unhealthy' | string;
  fail_count?: number;
  last_error?: string;
  max_accounts: number;
  used_accounts: number;
  created_at: string;
  expires_at?: string | null;
};

export type AdminPromoCode = {
  id: number;
  code: string;
  reward_type: 'plan' | 'ai_messages' | string;
  reward_plan?: string | null;
  reward_ai_messages: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  expires_at?: string | null;
  deactivated_at?: string | null;
  redeemed_by_user_id?: number | null;
  redeemed_by_email?: string | null;
  redeemed_at?: string | null;
  status: 'active' | 'deactivated' | 'expired' | 'used' | string;
};

export type AdminChatRuntime = {
  runtime: {
    active_accounts: number;
    runner_total: number;
    runner_alive: number;
    stale_runner_ids: number[];
  };
  pipeline: {
    pending_messages_total: number;
    pending_queue_total: number;
    failed_last_hour: number;
    stale_pending_total: number;
    oldest_pending_age_sec: number;
    oldest_queue_age_sec: number;
  };
  ws: {
    connects_5m: number;
    disconnects_5m: number;
    rejects_5m: number;
    connections_open: number;
    accounts_open: number;
  };
  alerts: Array<{
    level: 'critical' | 'warning' | 'info' | string;
    code: string;
    message: string;
  }>;
  checked_at: string;
};

export type AdminMonitoring = {
  server: {
    cpu_percent: number;
    ram_percent: number;
    disk_percent: number;
    uptime_seconds: number;
  };
  requests: {
    total_last_hour: number;
    errors_last_hour: number;
    avg_response_time_ms: number;
  };
  timestamp: string;
};

export const adminApi = {
  login: (email: string, password: string, totp: string) =>
    adminApiRequest<{ user: { id: number; email: string } }>('/admin-api/auth/login', {
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
  monitoring: () => adminApiRequest<AdminMonitoring>('/admin-api/monitoring'),
  chatRuntime: () => adminApiRequest<AdminChatRuntime>('/admin-api/chat-runtime'),
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
      credentials: 'include',
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
  startAllRunners: () =>
    adminApiRequest<{ started: number; failed: Record<string, string> }>('/admin-api/runners/start-all', { method: 'POST' }),
  sharedProxies: () =>
    adminApiRequest<{ items: AdminSharedProxy[]; total: number }>('/admin-api/proxies/shared'),
  addSharedProxy: (payload: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    protocol?: 'HTTP' | 'HTTPS' | 'SOCKS5';
    max_accounts?: number;
    expires_at?: string;
  }) =>
    adminApiRequest<AdminSharedProxy>('/admin-api/proxies/shared', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  promoCodes: () =>
    adminApiRequest<{ items: AdminPromoCode[]; total: number }>('/admin-api/promo-codes'),
  createPromoCode: (payload: {
    code?: string;
    generate?: boolean;
    reward_type: 'plan' | 'ai_messages';
    reward_plan?: 'lite' | 'pro' | 'ultra';
    reward_ai_messages?: number;
    duration_days?: number;
    validity_preset?: 'day' | 'week' | 'month' | 'custom';
    expires_at?: string;
  }) =>
    adminApiRequest<AdminPromoCode>('/admin-api/promo-codes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deactivatePromoCode: (id: number | string) =>
    adminApiRequest(`/admin-api/promo-codes/${id}/deactivate`, {
      method: 'POST',
    }),
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
