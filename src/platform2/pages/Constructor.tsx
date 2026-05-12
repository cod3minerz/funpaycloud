"use client";
import { useState, useEffect } from "react";
import Icon from "@/platform2/icons";
import { accountsApi, scenariosApi, ApiAccount, ApiScenario } from "@/lib/api";

type PaletteGroup = {
  id: string;
  label: string;
  icon: string;
  color: string;
  items: string[];
};

const palette: PaletteGroup[] = [
  {
    id: "triggers",
    label: "Триггеры",
    icon: "bolt",
    color: "text-orange-500",
    items: ["Новое сообщение", "Новый заказ", "Оценка получена", "Сделка закрыта"],
  },
  {
    id: "conditions",
    label: "Условия",
    icon: "check-circle",
    color: "text-orange-400",
    items: ["Тип клиента", "Ключевое слово", "Количество заказов", "Время суток"],
  },
  {
    id: "actions",
    label: "Действия",
    icon: "arrow-right",
    color: "text-blue-500",
    items: ["Отправить сообщение", "Отправить файл", "Добавить задержку", "Пометить чат"],
  },
  {
    id: "ai",
    label: "AI Узлы",
    icon: "cpu",
    color: "text-purple-500",
    items: ["AI ответ", "AI анализ", "AI классификация"],
  },
];

export default function ConstructorPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [account, setAccount] = useState<string>("");
  const [apiScenarios, setApiScenarios] = useState<ApiScenario[]>([]);
  const [scenario, setScenario] = useState<string>("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    accountsApi.list().then((list) => {
      setAccounts(list);
      if (list.length > 0) setAccount(String(list[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!account) return;
    scenariosApi.list(account).then((list) => {
      setApiScenarios(list);
      if (list.length > 0) setScenario(list[0].id);
    }).catch(() => {});
  }, [account]);

  function toggleGroup(id: string) {
    setOpenGroup((prev) => (prev === id ? null : id));
  }

  return (
    /* Escape the layout padding with negative margins */
    <div className="-mx-4 -my-4 md:-mx-6 md:-my-6 relative flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 4rem)" }}
    >

      {/* ── TOP TOOLBAR ── */}
      <div className="relative z-20 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-4 py-2.5 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
        {/* Left: account + scenario */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {accounts.map((a) => (
                <option key={a.id} value={String(a.id)}>{a.username ?? `#${a.id}`}</option>
              ))}
            </select>
            <Icon name="chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {apiScenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Icon name="chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <Icon name="time" className="h-4 w-4" />
            История
          </button>
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <Icon name="plus" className="h-4 w-4" />
            Создать
          </button>
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <Icon name="trash" className="h-4 w-4" />
            Удалить
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Icon name="check-line" className="h-4 w-4" />
            Сохранить
          </button>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div
        className="relative flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950"
        style={{
          backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onClick={() => setOpenGroup(null)}
      >
        {/* Empty state hint */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <Icon name="wrench" className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
              Добавьте узлы из панели внизу
            </p>
            <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">
              Скоро здесь будет React Flow
            </p>
          </div>
        </div>

        {/* ── ZOOM CONTROLS ── */}
        <div className="absolute bottom-24 left-4 z-10 flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {[
            { icon: "plus", title: "Zoom in" },
            { icon: "close", title: "Zoom out" },
            { icon: "chevron-up", title: "Fit" },
            { icon: "table", title: "Grid" },
          ].map((btn) => (
            <button
              key={btn.icon + btn.title}
              title={btn.title}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Icon name={btn.icon} className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* ── BOTTOM PALETTE ── */}
        <div
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dropup menus */}
          <div className="relative flex items-end justify-center gap-2">
            {palette.map((group) => (
              <div key={group.id} className="relative">
                {/* Dropdown items */}
                {openGroup === group.id && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 rounded-2xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <p className="px-3 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Icon name={group.icon} className={`h-3.5 w-3.5 ${group.color}`} />
                        {item}
                      </button>
                    ))}
                  </div>
                )}

                {/* Palette button */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
                    openGroup === group.id
                      ? "border-brand-400 bg-brand-500 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  <Icon name={group.icon} className={`h-4 w-4 ${openGroup === group.id ? "text-white" : group.color}`} />
                  {group.label}
                  <Icon
                    name="chevron-up"
                    className={`h-3.5 w-3.5 transition-transform ${openGroup === group.id ? "rotate-180 text-white" : "text-gray-400"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
