"use client";
import { Card, CardContent } from "@/platform2/components/ui/card";
import Link from "next/link";

const phases = [
  {
    number: "1",
    name: "Gate",
    color: "bg-gray-500",
    title: "Нужно ли отвечать?",
    checks: [
      { icon: "🚫", label: "Системное сообщение FunPay", desc: "«Пользователь X оплатил» — AI пропускает" },
      { icon: "💬", label: "Small talk", desc: "«ок», «спасибо», 👍 — AI молчит если включён фильтр" },
      { icon: "⏳", label: "Ждёт продавца", desc: "После «позови продавца» — AI молчит пока вы не ответите" },
      { icon: "⏱️", label: "Продавец только что ответил", desc: "Если вы сами писали в последние 5 мин — AI не лезет" },
      { icon: "🔁", label: "Дебаунс", desc: "Одно сообщение не запускает AI дважды" },
      { icon: "🔔", label: "Позвать продавца", desc: "Фраза вида «позови продавца» → мгновенная эскалация без LLM" },
    ],
  },
  {
    number: "2",
    name: "Triggers",
    color: "bg-orange-500",
    title: "Есть готовый ответ?",
    checks: [
      { icon: "⚡", label: "Поиск триггерного слова", desc: "Проверяем все активные слова из раздела «Триггерные слова»" },
      { icon: "✅", label: "Совпадение найдено", desc: "Отправляем готовый ответ мгновенно — 0 токенов, 0 задержки" },
      { icon: "→", label: "Нет совпадения", desc: "Идём дальше к контексту и LLM" },
    ],
  },
  {
    number: "3",
    name: "Context",
    color: "bg-blue-500",
    title: "Собираем контекст",
    checks: [
      { icon: "📦", label: "Статус заказа", desc: "ОПЛАЧЕН / ВЫДАН / ПОДТВЕРЖДЁН / ВОЗВРАТ — AI знает фазу" },
      { icon: "🛍️", label: "Ассортимент", desc: "До 12 лотов с ценами и наличием" },
      { icon: "📝", label: "Инструкции по лоту", desc: "Кастомные правила для конкретного товара" },
      { icon: "🧠", label: "История чата", desc: "До 20 последних сообщений + сводка длинных диалогов" },
      { icon: "❓", label: "База знаний", desc: "Готовые ответы на частые вопросы" },
    ],
  },
  {
    number: "4",
    name: "LLM",
    color: "bg-brand-500",
    title: "Генерация ответа",
    checks: [
      { icon: "🌡️", label: "Temperature 0.35", desc: "Низкая температура — меньше самодеятельности, точнее следует инструкции" },
      { icon: "📏", label: "Max 500 токенов", desc: "Достаточно для полного ответа, не обрезается" },
      { icon: "🎨", label: "Тон общения", desc: "Официальный / Нейтральный / Дружелюбный по вашему выбору" },
    ],
  },
  {
    number: "5",
    name: "Send",
    color: "bg-success-500",
    title: "Отправка",
    checks: [
      { icon: "⏳", label: "Задержка", desc: "0–30 секунд — имитирует живого человека" },
      { icon: "✍️", label: "Подпись", desc: "«— Ассистент FunPay Cloud» если включено" },
      { icon: "📊", label: "Счётчик токенов", desc: "Учитываем использование месячного лимита" },
    ],
  },
];

const tips = [
  {
    emoji: "✍️",
    title: "Как писать инструкции",
    items: [
      "Пишите как для человека: «Отвечай вежливо и кратко»",
      "Укажите что запрещено: «Не давать скидки больше 10%»",
      "Добавьте стиль: «Используй только русский язык»",
      "Укажите особенности товара: «Выдача через 5–10 минут после подтверждения оплаты»",
    ],
  },
  {
    emoji: "⚡",
    title: "Триггеры vs База знаний",
    items: [
      "Триггеры: мгновенно, без LLM, экономят токены",
      "База знаний: AI адаптирует ответ под стиль и контекст",
      "Используйте триггеры для цен, сроков, реквизитов",
      "Базу знаний — для нестандартных вопросов",
    ],
  },
  {
    emoji: "🔔",
    title: "Эскалация к продавцу",
    items: [
      "Срабатывает на: «позови продавца», «нужен оператор» и похожие",
      "AI уведомит вас в Telegram с последним сообщением",
      "Пока вы не ответите — AI молчит в этом чате",
      "Когда вы напишете — AI снова включается",
    ],
  },
  {
    emoji: "📦",
    title: "Фазы заказа",
    items: [
      "ОПЛАЧЕН: AI не просит нажать «Подтвердить» — рано",
      "ВЫДАН: AI напоминает нажать «Подтвердить выполнение»",
      "ПОДТВЕРЖДЁН: AI только благодарит, не требует действий",
      "ВОЗВРАТ: AI вежлив, не обещает лишнего",
    ],
  },
];

export default function AIGuidePage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Как работает AI-ассистент</h1>
        <p className="mt-1 text-sm text-gray-500">Полное руководство по настройке — от инструкций до эскалации</p>
      </div>

      {/* PIPELINE */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Конвейер обработки сообщения</p>
        <div className="relative">
          {/* connector line */}
          <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-700 hidden sm:block" />
          <div className="space-y-3">
            {phases.map((phase) => (
              <Card key={phase.number}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${phase.color} text-sm font-bold text-white`}>
                      {phase.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono font-semibold text-gray-400 uppercase">{phase.name}</span>
                        <span className="text-base font-semibold text-gray-800 dark:text-white">{phase.title}</span>
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {phase.checks.map((check, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-base leading-none mt-0.5">{check.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{check.label}</p>
                              <p className="text-xs text-gray-400">{check.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* TIPS */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Советы по настройке</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {tips.map((tip) => (
            <Card key={tip.title}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{tip.emoji}</span>
                  <p className="font-semibold text-gray-800 dark:text-white">{tip.title}</p>
                </div>
                <ul className="space-y-1.5">
                  {tip.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Частые вопросы</p>
        <Card>
          <CardContent className="divide-y divide-gray-100 p-0 dark:divide-gray-800">
            {[
              {
                q: "Почему AI молчит?",
                a: "Проверьте: 1) включён ли автоответчик, 2) не ждёт ли AI продавца (эскалация), 3) не фильтруется ли сообщение как small talk или системное.",
              },
              {
                q: "Почему AI просит нажать подтверждение когда заказ уже подтверждён?",
                a: "Это было исправлено в AI 2.0 — теперь ассистент видит статус заказа и подстраивает инструкции под текущую фазу.",
              },
              {
                q: "Как сделать чтобы AI всегда отвечал на вопрос о цене?",
                a: "Добавьте триггер: ключевое слово «цена» → готовый ответ с ценой. Это сработает мгновенно без трат токенов.",
              },
              {
                q: "Продавец написал в чат — AI снова будет отвечать?",
                a: "Да. Как только вы напишете в чат, AI включается снова. Если была эскалация — флаг «ждёт продавца» сбрасывается после вашего ответа.",
              },
              {
                q: "Как настроить AI для разных товаров?",
                a: "В разделе «Инструкции по лотам» можно задать отдельные правила для каждого товара. Они добавляются в промпт рядом с описанием лота.",
              },
              {
                q: "Можно ли отключить автоответ только для одного лота?",
                a: "В инструкции для лота напишите: «Не отвечать автоматически — перенаправить на продавца». AI будет применять это правило для данного товара.",
              },
            ].map((item, i) => (
              <div key={i} className="px-5 py-4">
                <p className="font-medium text-gray-800 dark:text-white">{item.q}</p>
                <p className="mt-1 text-sm text-gray-500">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-lg font-bold text-gray-800 dark:text-white mb-1">Готовы настроить?</p>
          <p className="text-sm text-gray-500 mb-4">Перейдите в раздел AI-ассистента и настройте всё под свой магазин</p>
          <Link
            href="/platform/ai-assistant"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Открыть AI-ассистент
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
