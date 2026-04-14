import { Cloud, Zap, Smartphone, Brain, BarChart2, Shield } from "lucide-react";

const features = [
  {
    icon: Cloud,
    color: "from-blue-500 to-blue-400",
    iconBg: "rgba(59,130,246,0.12)",
    iconColor: "text-blue-400",
    badge: "Ядро платформы",
    badgeColor: "text-blue-400",
    badgeBg: "rgba(59,130,246,0.1)",
    title: "Облачная автономность",
    desc: "Платформа живёт в облаке — не на твоём ПК. Она продаёт, отвечает и поднимает лоты 24 часа в сутки, 7 дней в неделю. Даже если ты в отпуске, спишь или просто отошёл.",
    items: ["Нет зависимости от компьютера", "Аптайм 99.9% на выделенных серверах", "Отдельный IPv4 против банов", "Мгновенный рестарт при ошибках"],
    glow: "rgba(59,130,246,0.2)",
    border: "rgba(59,130,246,0.15)",
  },
  {
    icon: Zap,
    color: "from-blue-500 to-indigo-500",
    iconBg: "rgba(59,130,246,0.12)",
    iconColor: "text-blue-300",
    badge: "Скорость и деньги",
    badgeColor: "text-blue-300",
    badgeBg: "rgba(59,130,246,0.1)",
    title: "Автовыдача и автоподнятие",
    desc: "Товар выдаётся клиенту за 0.3 секунды после оплаты. Лоты поднимаются по гибкому расписанию. Ты всегда в топе выдачи — без ручных кликов.",
    items: ["Выдача текста и файлов из базы", "Умное расписание подъёмов", "Антибан-логика для безопасности", "Контроль остатков и уведомления"],
    glow: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.15)",
  },
  {
    icon: Smartphone,
    color: "from-blue-500 to-indigo-400",
    iconBg: "rgba(37,99,235,0.12)",
    iconColor: "text-blue-300",
    badge: "Мобильное управление",
    badgeColor: "text-blue-300",
    badgeBg: "rgba(37,99,235,0.1)",
    title: "Контроль из Telegram",
    desc: "Получай уведомления о каждом заказе, управляй ботом командами, смотри статистику — всё прямо в Telegram. Твой бизнес в кармане.",
    items: ["Push-уведомления о заказах", "Команды управления ботом", "Статистика и отчёты на ходу", "Быстрые действия без ПК"],
    glow: "rgba(37,99,235,0.2)",
    border: "rgba(37,99,235,0.15)",
  },
  {
    icon: Brain,
    color: "from-blue-400 to-blue-500",
    iconBg: "rgba(96,165,250,0.12)",
    iconColor: "text-blue-300",
    badge: "AI-интеллект",
    badgeColor: "text-blue-300",
    badgeBg: "rgba(96,165,250,0.1)",
    title: "Умный автоответчик",
    desc: "AI на базе GPT-4o сам отвечает клиентам, закрывает типовые вопросы, обрабатывает возражения и передаёт сложные случаи тебе. Без задержек, без раздражения.",
    items: ["GPT-4o для умных ответов", "Шаблоны под разные сценарии", "Обработка возражений и FAQ", "Автоматическая смена тона"],
    glow: "rgba(96,165,250,0.15)",
    border: "rgba(96,165,250,0.15)",
  },
  {
    icon: BarChart2,
    color: "from-blue-400 to-blue-600",
    iconBg: "rgba(59,130,246,0.12)",
    iconColor: "text-blue-300",
    badge: "Аналитика и рост",
    badgeColor: "text-blue-300",
    badgeBg: "rgba(59,130,246,0.1)",
    title: "Аналитика, которая объясняет",
    desc: "Не просто цифры — понятные выводы. Видишь, какой лот приносит больше, в какое время покупают активнее, где теряешь клиентов и что нужно изменить.",
    items: ["Выручка по дням и неделям", "Эффективность каждого лота", "Аналитика конверсии ответов", "Сравнение периодов"],
    glow: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.15)",
  },
  {
    icon: Shield,
    color: "from-slate-400 to-slate-500",
    iconBg: "rgba(148,163,184,0.1)",
    iconColor: "text-slate-300",
    badge: "Безопасность",
    badgeColor: "text-slate-300",
    badgeBg: "rgba(148,163,184,0.08)",
    title: "Безопасность и надёжность",
    desc: "Отдельный IP-адрес на каждого клиента, антибан-механики, соблюдение лимитов FunPay. Работаем так, чтобы твой аккаунт жил долго.",
    items: ["Выделенный IPv4 на аккаунт", "Антибан-логика встроена", "Соблюдение лимитов площадки", "Шифрование данных"],
    glow: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.1)",
  },
];

export function Features() {
  return (
    <section id="features" className="py-28 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(59,130,246,0.6) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div
            className="inline-block mb-4 text-sm font-semibold text-blue-300 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Модули системы
          </div>
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "clamp(30px, 5vw, 52px)",
              letterSpacing: "-1.5px",
              lineHeight: 1.15,
            }}
          >
            Комплексная автоматизация{" "}
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #60A5FA, #3B82F6, #1D4ED8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              в одной платформе
            </span>
          </h2>
          <p
            className="max-w-[560px] mx-auto"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "17px",
              color: "#A8A8B3",
              lineHeight: 1.7,
            }}
          >
            Не набор разрозненных инструментов, а единая система, где каждый модуль усиливает другой.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="relative rounded-2xl p-6 group hover:scale-[1.015] transition-transform duration-300 cursor-default"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${f.border}`,
                boxShadow: `0 12px 30px ${f.glow}`,
              }}
            >
              {/* Corner glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none rounded-tr-2xl overflow-hidden"
                style={{
                  background: `radial-gradient(circle at top right, ${f.glow.replace("0.15", "0.6").replace("0.2", "0.6")}, transparent 70%)`,
                }}
              />

              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: f.iconBg }}
                >
                  <f.icon size={22} className={f.iconColor} />
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.badgeColor}`}
                  style={{ background: f.badgeBg, fontFamily: "var(--font-sans)" }}
                >
                  {f.badge}
                </span>
              </div>

              <h3
                className="text-white mb-3"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: "20px",
                  lineHeight: 1.3,
                }}
              >
                {f.title}
              </h3>
              <p
                className="mb-5"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  color: "#A8A8B3",
                  lineHeight: 1.7,
                }}
              >
                {f.desc}
              </p>

              <ul className="flex flex-col gap-2">
                {f.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: f.iconBg }}
                    >
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path
                          d="M1 3L3 5L7 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={f.iconColor}
                        />
                      </svg>
                    </div>
                    <span
                      className="text-sm text-[#A8A8B3]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
