import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, ShoppingBag, Clock, Zap, CheckCircle, Bell } from "lucide-react";

const revenueData = [
  { day: "Пн", val: 2400 },
  { day: "Вт", val: 3100 },
  { day: "Ср", val: 2800 },
  { day: "Чт", val: 4200 },
  { day: "Пт", val: 3800 },
  { day: "Сб", val: 5100 },
  { day: "Вс", val: 4700 },
];

const orders = [
  { id: "#8821", item: "Steam Gift Card 500₽", status: "Выдан", time: "00:12", amt: "497₽" },
  { id: "#8820", item: "Аккаунт Valorant Silver", status: "Выдан", time: "00:34", amt: "1 200₽" },
  { id: "#8819", item: "Ключ Windows 11 Pro", status: "Ожидание", time: "01:02", amt: "1 890₽" },
];

export function DashboardMockup() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_22px_70px_rgba(0,0,0,0.52)]"
      style={{ background: "rgba(13,14,22,0.95)" }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white/[0.06] rounded-md px-3 py-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-[#A8A8B3]" style={{ fontFamily: "Manrope, sans-serif" }}>
              funpaycloud.io/dashboard
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={14} className="text-[#A8A8B3]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-[7px] text-white flex items-center justify-center">2</span>
          </div>
        </div>
      </div>

      <div className="flex h-[380px]">
        {/* Sidebar */}
        <div className="w-[140px] border-r border-white/[0.05] flex flex-col gap-1 p-3 shrink-0">
          <div className="text-[9px] text-[#525266] uppercase tracking-widest mb-2 px-2" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Главное</div>
          {[
            { icon: "▣", label: "Дашборд", active: true },
            { icon: "◈", label: "Заказы" },
            { icon: "⬡", label: "Лоты" },
            { icon: "◎", label: "Аналитика" },
            { icon: "⊞", label: "Настройки" },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
                item.active
                  ? "bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-white"
                  : "text-[#525266] hover:text-[#A8A8B3]"
              }`}
            >
              <span className="text-[11px]">{item.icon}</span>
              <span className="text-[11px] font-medium" style={{ fontFamily: "Manrope, sans-serif" }}>
                {item.label}
              </span>
              {item.active && (
                <div className="ml-auto w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-blue-500" />
              )}
            </div>
          ))}

          <div className="mt-4 mx-2 p-2.5 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[9px] font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>БОТ АКТИВЕН</span>
            </div>
            <div className="text-[#A8A8B3] text-[8px]" style={{ fontFamily: "Manrope, sans-serif" }}>Аптайм: 99.9%</div>
            <div className="text-[#A8A8B3] text-[8px]" style={{ fontFamily: "Manrope, sans-serif" }}>IP: 185.xx.xx.xx</div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>Добро пожаловать 👋</div>
              <div className="text-[#525266] text-[10px]" style={{ fontFamily: "Manrope, sans-serif" }}>Сегодня ваш магазин уже заработал</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold text-sm" style={{ fontFamily: "Manrope, sans-serif" }}>+₽14 820</div>
              <div className="text-[#525266] text-[10px]" style={{ fontFamily: "Manrope, sans-serif" }}>за последние 24 часа</div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: ShoppingBag, label: "Заказов", value: "48", delta: "+12%", color: "text-blue-400", bg: "rgba(59,130,246,0.1)" },
              { icon: Zap, label: "Автовыдач", value: "46", delta: "96% авто", color: "text-blue-300", bg: "rgba(96,165,250,0.1)" },
              { icon: TrendingUp, label: "Выручка", value: "₽42K", delta: "+8%", color: "text-emerald-400", bg: "rgba(59,130,246,0.1)" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-3"
                style={{ background: stat.bg, border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <stat.icon size={12} className={stat.color} />
                  <span className="text-[#A8A8B3] text-[9px] font-medium" style={{ fontFamily: "Manrope, sans-serif" }}>{stat.label}</span>
                </div>
                <div className={`text-base font-bold ${stat.color}`} style={{ fontFamily: "Manrope, sans-serif" }}>{stat.value}</div>
                <div className="text-[#525266] text-[9px]" style={{ fontFamily: "Manrope, sans-serif" }}>{stat.delta}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-[10px] font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>Выручка за неделю</span>
              <span className="text-emerald-400 text-[9px]" style={{ fontFamily: "Manrope, sans-serif" }}>↑ Неделя</span>
            </div>
            <div className="h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#60A5FA"
                    strokeWidth={1.5}
                    fill="url(#revenueGrad)"
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1A1B26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "10px" }}
                    formatter={(v: number) => [`₽${v}`, ""]}
                    labelFormatter={(l: string) => l}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent orders */}
          <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="px-3 py-2 border-b border-white/[0.05] flex items-center justify-between">
              <span className="text-white text-[10px] font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>Последние заказы</span>
              <span className="text-blue-400 text-[9px]" style={{ fontFamily: "Manrope, sans-serif" }}>Все →</span>
            </div>
            {orders.map((o) => (
              <div key={o.id} className="flex items-center px-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className="w-1 h-1 rounded-full bg-emerald-400 mr-2 shrink-0" />
                <span className="text-[#525266] text-[9px] w-10 shrink-0" style={{ fontFamily: "Manrope, sans-serif" }}>{o.id}</span>
                <span className="text-[#A8A8B3] text-[9px] flex-1 truncate" style={{ fontFamily: "Manrope, sans-serif" }}>{o.item}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md mr-2 shrink-0 ${o.status === "Выдан" ? "text-emerald-400 bg-emerald-400/10" : "text-blue-300 bg-slate-500/20"}`} style={{ fontFamily: "Manrope, sans-serif" }}>{o.status}</span>
                <span className="text-white text-[9px] font-semibold shrink-0" style={{ fontFamily: "Manrope, sans-serif" }}>{o.amt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - lot statuses */}
        <div className="w-[130px] border-l border-white/[0.05] p-3 flex flex-col gap-2 shrink-0 overflow-hidden">
          <div className="text-[9px] text-[#525266] uppercase tracking-widest mb-1" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Лоты</div>
          {[
            { name: "Steam 500₽", status: "↑", raised: "3 мин назад", color: "text-emerald-400" },
            { name: "Win 11 Pro", status: "↑", raised: "8 мин назад", color: "text-emerald-400" },
            { name: "GTA V акк", status: "●", raised: "Пауза", color: "text-blue-300" },
            { name: "Valorant", status: "↑", raised: "15 мин назад", color: "text-emerald-400" },
          ].map((lot) => (
            <div
              key={lot.name}
              className="p-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white text-[9px] font-semibold truncate" style={{ fontFamily: "Manrope, sans-serif" }}>{lot.name}</span>
                <span className={`text-[10px] ${lot.color}`}>{lot.status}</span>
              </div>
              <div className="text-[#525266] text-[8px]" style={{ fontFamily: "Manrope, sans-serif" }}>{lot.raised}</div>
            </div>
          ))}
          <div className="mt-2 p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle size={9} className="text-blue-400" />
              <span className="text-blue-400 text-[8px] font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>Автоответчик</span>
            </div>
            <div className="text-[#525266] text-[8px]" style={{ fontFamily: "Manrope, sans-serif" }}>Отвечено: 12</div>
            <div className="text-[#525266] text-[8px]" style={{ fontFamily: "Manrope, sans-serif" }}>Ср. время: 0.3с</div>
          </div>
          <div className="p-2 rounded-lg" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)" }}>
            <div className="text-blue-300 text-[8px] font-semibold mb-0.5" style={{ fontFamily: "Manrope, sans-serif" }}>Telegram</div>
            <div className="text-[#525266] text-[8px]" style={{ fontFamily: "Manrope, sans-serif" }}>Уведомлений: 5</div>
            <div className="text-[#525266] text-[8px]" style={{ fontFamily: "Manrope, sans-serif" }}>Команд: 3</div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="px-5 py-2 border-t border-white/[0.06] flex items-center gap-4">
        {[
          { label: "Облако", value: "Активно", color: "text-emerald-400" },
          { label: "IPv4", value: "Защита вкл", color: "text-blue-400" },
          { label: "AI", value: "GPT-4o", color: "text-blue-300" },
          { label: "Плагины", value: "7 активных", color: "text-blue-300" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-[#525266] text-[9px]" style={{ fontFamily: "Manrope, sans-serif" }}>{s.label}:</span>
            <span className={`text-[9px] font-semibold ${s.color}`} style={{ fontFamily: "Manrope, sans-serif" }}>{s.value}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <Clock size={9} className="text-[#525266]" />
          <span className="text-[#525266] text-[9px]" style={{ fontFamily: "Manrope, sans-serif" }}>Работает 847 часов подряд</span>
        </div>
      </div>
    </div>
  );
}
