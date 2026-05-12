// ===================
// ОБЩИЕ ТИПЫ
// ===================

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

// ===================
// АККАУНТЫ
// ===================

export interface Account {
  id: string;
  username: string;
  platform: "funpay" | "plati";
  status: "online" | "offline";
  runnerActive: boolean;
  keeperActive: boolean;
  raiserActive: boolean;
  proxy: {
    id: string;
    name: string;
    address: string;
  } | null;
  createdAt: string;
}

export interface AccountStats {
  total: number;
  runnerActive: number;
  keeperOnline: number;
  raiserRunning: number;
}

// ===================
// ЗАКАЗЫ
// ===================

export interface Order {
  id: string;
  funpayId: string;
  buyer: string;
  description: string;
  account: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  issuedAt: string | null;
  date: string;
}

// ===================
// ЛОТЫ
// ===================

export interface Lot {
  id: string;
  name: string;
  category: string;
  account: string;
  price: number;
  quantity: number;
  status: "active" | "inactive";
}

// ===================
// СКЛАД
// ===================

export interface WarehouseItem {
  id: string;
  lotId: string;
  content: string;
  reserved: boolean;
  createdAt: string;
}

// ===================
// ЧАТЫ
// ===================

export interface ChatConversation {
  id: string;
  accountUsername: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "user" | "customer";
  text: string;
  sentAt: string;
}

// ===================
// АНАЛИТИКА
// ===================

export interface AnalyticsStats {
  revenue: number;
  revenueChange: string;
  orders: number;
  ordersChange: string;
  avgCheck: number;
  avgCheckChange: string;
  conversion: number;
  conversionChange: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

// ===================
// КОНСТРУКТОР
// ===================

export interface FlowNode {
  id: string;
  type: "trigger" | "condition" | "action";
  data: {
    label: string;
    config: Record<string, unknown>;
  };
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// ===================
// AI-АССИСТЕНТ
// ===================

export interface AIAssistantConfig {
  mode: "bot" | "scenario";
  accountId: string;
  tone: "official" | "neutral" | "friendly";
  responseDelay: number;
  instruction: string;
}

// ===================
// ПЛАГИНЫ
// ===================

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number | null;
  isInstalled: boolean;
}

// ===================
// ФИНАНСЫ
// ===================

export interface FinancialStats {
  totalRevenue: number;
  orders: number;
  withdrawals: number;
  operations: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  account: string;
  amount: number;
}

// ===================
// РЕФЕРАЛЬНАЯ ПРОГРАММА
// ===================

export interface ReferralStats {
  invited: number;
  earned: number;
  commission: number;
}

export interface Referral {
  id: string;
  email: string;
  registeredAt: string;
  status: "active" | "inactive";
  earned: number;
}
