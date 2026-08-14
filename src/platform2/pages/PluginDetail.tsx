"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { accountsApi, ApiAccount } from "@/lib/api";
import { Card, CardContent } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";

// ── Shared primitives ───────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="ml-0.5 text-error-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const lotRaiserPluginEnabled = false;

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

// ── Plugin definitions ───────────────────────────────────────────────────────

const PLUGINS: Record<string, { name: string; icon: string; color: string; settingsTab: React.FC }> = {
  telegram: {
    name: "Telegram Notify",
    icon: "paper-plane",
    color: "bg-blue-500/10 text-blue-500",
    settingsTab: TelegramSettings,
  },
  "vip-risk": {
    name: "VIP Risk Guard",
    icon: "lock",
    color: "bg-red-500/10 text-red-500",
    settingsTab: VipRiskSettings,
  },
  autoreply: {
    name: "Автоответчик",
    icon: "chat",
    color: "bg-purple-500/10 text-purple-500",
    settingsTab: AutoreplySettings,
  },
  ...(lotRaiserPluginEnabled
    ? {
        "smart-raiser": {
          name: "Умный Райзер",
          icon: "arrow-up",
          color: "bg-green-500/10 text-green-500",
          settingsTab: SmartRaiserSettings,
        },
      }
    : {}),
};

// ── Telegram ─────────────────────────────────────────────────────────────────

function TelegramSettings() {
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [notifs, setNotifs] = useState({ newOrder: true, newMessage: true, orderComplete: true, review: false });

  const toggle = (k: keyof typeof notifs) => setNotifs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 p-6">
          <Field label="Bot token" required>
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="1234567890:ABCdef..." className={inputCls} />
            <p className="mt-1.5 text-xs text-gray-400">
              Создайте бота через <a href="#" className="text-brand-500 hover:underline">@BotFather</a> и скопируйте токен
            </p>
          </Field>
          <Field label="Chat ID" required>
            <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="-100123456789" className={inputCls} />
            <p className="mt-1.5 text-xs text-gray-400">ID вашего чата или канала куда приходят уведомления</p>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-white">Типы уведомлений</p>
          <p className="mb-3 text-xs text-gray-400">Выберите, о чём получать уведомления в Telegram</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <Toggle on={notifs.newOrder} onChange={() => toggle("newOrder")} label="Новый заказ" />
            <Toggle on={notifs.newMessage} onChange={() => toggle("newMessage")} label="Новое сообщение в чате" />
            <Toggle on={notifs.orderComplete} onChange={() => toggle("orderComplete")} label="Заказ завершён" />
            <Toggle on={notifs.review} onChange={() => toggle("review")} label="Новый отзыв" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <button className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
          Тест уведомления
        </button>
        <Button variant="primary">Сохранить настройки</Button>
      </div>
    </div>
  );
}

// ── VIP Risk Guard ────────────────────────────────────────────────────────────

function VipRiskSettings() {
  const [threshold, setThreshold] = useState(65);
  const [action, setAction] = useState<"warn" | "block">("warn");
  const [checks, setChecks] = useState({ newAccount: true, noReviews: true, highAmount: false, foreignIp: true });
  const toggle = (k: keyof typeof checks) => setChecks((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Порог риска</p>
            <span className="rounded-lg bg-brand-500/10 px-2.5 py-1 text-sm font-bold text-brand-500">{threshold}%</span>
          </div>
          <input type="range" min={10} max={100} value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-full accent-brand-500" />
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>Низкий риск</span>
            <span>Высокий риск</span>
          </div>
          <p className="mt-3 text-xs text-gray-400">Заказы с риском выше {threshold}% будут {action === "warn" ? "помечаться" : "блокироваться"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Действие при превышении порога</p>
          <div className="grid grid-cols-2 gap-3">
            {(["warn", "block"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setAction(opt)}
                className={`rounded-xl border p-4 text-left transition-colors ${action === opt ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-700"}`}
              >
                <p className={`font-semibold ${action === opt ? "text-brand-600" : "text-gray-800 dark:text-white"}`}>
                  {opt === "warn" ? "Предупреждение" : "Блокировка"}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {opt === "warn" ? "Помечаем заказ и уведомляем" : "Автоматически отклоняем заказ"}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-white">Критерии оценки риска</p>
          <p className="mb-3 text-xs text-gray-400">Какие факторы учитываются при подсчёте риска</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <Toggle on={checks.newAccount} onChange={() => toggle("newAccount")} label="Новый аккаунт покупателя (< 30 дней)" />
            <Toggle on={checks.noReviews} onChange={() => toggle("noReviews")} label="Нет отзывов или меньше 3" />
            <Toggle on={checks.highAmount} onChange={() => toggle("highAmount")} label="Сумма заказа выше среднего × 3" />
            <Toggle on={checks.foreignIp} onChange={() => toggle("foreignIp")} label="IP из другой страны" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary">Сохранить настройки</Button>
      </div>
    </div>
  );
}

// ── Autoreply ─────────────────────────────────────────────────────────────────

function AutoreplySettings() {
  const [delay, setDelay] = useState(5);
  const [templates, setTemplates] = useState([
    { id: "1", trigger: "привет", reply: "Здравствуйте! Чем могу помочь?" },
    { id: "2", trigger: "цена", reply: "Цена указана в объявлении. Скидок нет." },
  ]);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Задержка ответа</p>
            <span className="text-sm font-bold text-brand-500">{delay} сек</span>
          </div>
          <input type="range" min={0} max={30} value={delay} onChange={(e) => setDelay(+e.target.value)} className="mt-3 w-full accent-brand-500" />
          <div className="mt-1 flex justify-between text-xs text-gray-400"><span>Мгновенно</span><span>30 сек</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Шаблоны ответов</p>
              <p className="text-xs text-gray-400">Ответ отправляется если сообщение содержит триггер</p>
            </div>
            <button
              onClick={() => setTemplates((p) => [...p, { id: Date.now().toString(), trigger: "", reply: "" }])}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Icon name="plus" className="h-3.5 w-3.5" /> Добавить
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {templates.map((t) => (
              <div key={t.id} className="px-5 py-4">
                {editing === t.id ? (
                  <div className="space-y-2">
                    <input defaultValue={t.trigger} onChange={(e) => setTemplates((p) => p.map((x) => x.id === t.id ? { ...x, trigger: e.target.value } : x))} placeholder="Триггер" className={inputCls} />
                    <textarea defaultValue={t.reply} onChange={(e) => setTemplates((p) => p.map((x) => x.id === t.id ? { ...x, reply: e.target.value } : x))} placeholder="Ответ" rows={2} className={`${inputCls} resize-none`} />
                    <button onClick={() => setEditing(null)} className="text-xs text-brand-500 hover:text-brand-600">Готово</button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{t.trigger || "—"}</span>
                      <p className="mt-1 text-sm text-gray-500">{t.reply || "—"}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => setEditing(t.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><Icon name="pencil" className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setTemplates((p) => p.filter((x) => x.id !== t.id))} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"><Icon name="trash" className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary">Сохранить настройки</Button>
      </div>
    </div>
  );
}

// Сохранено для последующего включения продукта; в текущем релизе плагин скрыт.
function SmartRaiserSettings() {
  const [interval, setInterval] = useState(60);
  const [mode, setMode] = useState<"schedule" | "smart">("smart");
  const [events, setEvents] = useState({ onNewOrder: true, onCompetitorRaise: true, onLowViews: false, onPriceDrop: false });
  const toggle = (key: keyof typeof events) => setEvents((previous) => ({ ...previous, [key]: !previous[key] }));
  const [scheduleHour, setScheduleHour] = useState("09:00");

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Режим поднятия</p>
          <div className="grid grid-cols-2 gap-3">
            {(["smart", "schedule"] as const).map((currentMode) => (
              <button
                key={currentMode}
                onClick={() => setMode(currentMode)}
                className={`rounded-xl border p-4 text-left transition-colors ${mode === currentMode ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-700"}`}
              >
                <p className={`font-semibold ${mode === currentMode ? "text-brand-600" : "text-gray-800 dark:text-white"}`}>
                  {currentMode === "smart" ? "Умный" : "По расписанию"}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {currentMode === "smart" ? "Реагирует на события и конкурентов" : "Фиксированный интервал и время"}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {mode === "schedule" && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Интервал поднятия</p>
              <span className="text-sm font-bold text-brand-500">{interval} мин</span>
            </div>
            <input type="range" min={5} max={360} step={5} value={interval} onChange={(event) => setInterval(+event.target.value)} className="w-full accent-brand-500" />
            <div className="mt-1 flex justify-between text-xs text-gray-400"><span>5 мин</span><span>6 ч</span></div>
            <Field label="Первое поднятие в">
              <input type="time" value={scheduleHour} onChange={(event) => setScheduleHour(event.target.value)} className={inputCls} />
            </Field>
          </CardContent>
        </Card>
      )}

      {mode === "smart" && (
        <Card>
          <CardContent className="p-6">
            <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-white">Триггеры поднятия</p>
            <p className="mb-3 text-xs text-gray-400">При каких событиях автоматически поднимать лот</p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <Toggle on={events.onNewOrder} onChange={() => toggle("onNewOrder")} label="После нового заказа" />
              <Toggle on={events.onCompetitorRaise} onChange={() => toggle("onCompetitorRaise")} label="Конкурент поднял лот" />
              <Toggle on={events.onLowViews} onChange={() => toggle("onLowViews")} label="Просмотры упали ниже среднего" />
              <Toggle on={events.onPriceDrop} onChange={() => toggle("onPriceDrop")} label="Конкурент снизил цену" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="primary">Сохранить настройки</Button>
      </div>
    </div>
  );
}

// ── Activity & Stats placeholders ─────────────────────────────────────────────

function ActivityTab({ pluginId }: { pluginId: string }) {
  const items = [
    { time: "Сегодня, 14:32", text: "Уведомление отправлено: новый заказ #8842301" },
    { time: "Сегодня, 11:15", text: "Уведомление отправлено: новое сообщение от PaidInFull" },
    { time: "Вчера, 22:48", text: "Уведомление отправлено: заказ #8831045 завершён" },
    { time: "Вчера, 09:00", text: "Плагин запущен для аккаунта tonminerz" },
  ];
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              <div>
                <p className="text-sm text-gray-800 dark:text-white">{item.text}</p>
                <p className="mt-0.5 text-xs text-gray-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatsTab({ pluginId }: { pluginId: string }) {
  const stats = [
    { label: "Всего событий", value: "1 248", change: "+12% за месяц" },
    { label: "Сегодня", value: "34", change: "" },
    { label: "Среднее в день", value: "41", change: "" },
    { label: "Ошибки", value: "2", change: "0.16%" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            {s.change && <p className="mt-1 text-xs text-gray-400">{s.change}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "settings" | "activity" | "stats";

export default function PluginSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("settings");
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [account, setAccount] = useState<string>("");

  useEffect(() => {
    accountsApi.list().then((list) => {
      setAccounts(list);
      if (list.length > 0) setAccount(String(list[0].id));
    }).catch(() => {});
  }, []);

  const plugin = PLUGINS[id];

  if (!plugin) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Icon name="plug-in" className="h-12 w-12 text-gray-300" />
        <p className="mt-3 text-sm text-gray-400">Плагин не найден</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-brand-500 hover:text-brand-600">← Назад</button>
      </div>
    );
  }

  const SettingsTab = plugin.settingsTab;

  const tabs: { id: Tab; label: string }[] = [
    { id: "settings", label: "Настройки" },
    { id: "activity", label: "Активность" },
    { id: "stats", label: "Статистика" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
        >
          <Icon name="arrow-left" className="h-4 w-4" />
          Плагины
        </button>
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${plugin.color}`}>
            <Icon name={plugin.icon} className="h-4 w-4" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{plugin.name}</h1>
        </div>
      </div>

      {/* Account selector */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {accounts.map((a) => (
                <option key={a.id} value={String(a.id)}>{a.username ?? `#${a.id}`}</option>
              ))}
            </select>
            <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 pb-3 pt-1 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-brand-500 text-brand-500"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "settings" && <SettingsTab />}
      {tab === "activity" && <ActivityTab pluginId={id} />}
      {tab === "stats" && <StatsTab pluginId={id} />}

    </div>
  );
}
