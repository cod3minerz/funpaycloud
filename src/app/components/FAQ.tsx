import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Нужно ли держать компьютер включённым?",
    a: "Нет. FunPay Cloud работает полностью в облаке на наших серверах. Ты можешь выключить компьютер, уехать в отпуск или просто лечь спать — бот продолжает работать 24/7 без твоего участия.",
  },
  {
    q: "Безопасно ли для моего аккаунта FunPay?",
    a: "Безопасность — наш приоритет. Каждому клиенту выдаётся отдельный выделенный IPv4-адрес. В системе встроена антибан-логика, соблюдение лимитов и интервалов FunPay. За всё время работы у наших клиентов не было ни одного бана, связанного с платформой.",
  },
  {
    q: "Сложно ли настроить? Я не технарь",
    a: "Всё специально сделано для не-технарей. Настройка занимает 10 минут: добавляешь аккаунт, загружаешь товары, ставишь расписание — и запускаешь. В каждом шаге есть подсказки. Если что-то непонятно — пишешь в поддержку, поможем.",
  },
  {
    q: "Что такое AI-автоответчик и как он работает?",
    a: "AI на базе GPT-4o автоматически отвечает на вопросы покупателей в чате FunPay. Он понимает контекст, использует твои шаблоны и базу знаний о твоих товарах. Типовые вопросы закрывает полностью, сложные случаи — пересылает тебе с уведомлением.",
  },
  {
    q: "Можно ли управлять несколькими аккаунтами?",
    a: "Да. В тарифе Профи доступно до 3 аккаунтов, в тарифе Командный — до 10. Все аккаунты управляются из единой панели. Ты видишь статистику, лоты и заказы по каждому аккаунту отдельно и в общем виде.",
  },
  {
    q: "Что если у меня вопросы после оплаты?",
    a: "Поддержка доступна через Telegram. Базовые тарифы — ответ в течение рабочего дня. В тарифе Командный — приоритетный канал с ответом до 2 часов. Мы реально заинтересованы в том, чтобы твой магазин работал хорошо.",
  },
  {
    q: "Чем FunPay Cloud лучше других ботов для FunPay?",
    a: "Мы не просто бот, а платформа с реальным веб-дашбордом, AI-ответами, выделенным IPv4, аналитикой и Telegram-управлением. Большинство конкурентов работают на VPS клиента или дают примитивный интерфейс. Мы дали это уже на уровне продукта.",
  },
  {
    q: "Есть ли пробный период?",
    a: "Да. При регистрации ты получаешь 7 дней бесплатного доступа к тарифу Профи без карты. Проверь все возможности в реальных условиях и только потом решай.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(37,99,235,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div
            className="inline-block mb-4 text-sm font-semibold text-blue-300 uppercase tracking-widest"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Частые вопросы
          </div>
          <h2
            className="text-white"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(28px, 5vw, 48px)",
              letterSpacing: "-1.5px",
              lineHeight: 1.2,
            }}
          >
            Всё, что ты хотел{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              спросить
            </span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden cursor-pointer group"
              style={{
                background: open === i ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
                border: open === i ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(255,255,255,0.07)",
              }}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex items-center justify-between px-6 py-5">
                <span
                  className="text-white font-semibold pr-4"
                  style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px" }}
                >
                  {faq.q}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-[#525266] transition-transform duration-300 ${open === i ? "rotate-180 text-blue-300" : ""}`}
                />
              </div>
              {open === i && (
                <div className="px-6 pb-5">
                  <p
                    className="leading-relaxed"
                    style={{ fontFamily: "Manrope, sans-serif", fontSize: "14px", color: "#A8A8B3", lineHeight: 1.7 }}
                  >
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-[#525266] text-sm" style={{ fontFamily: "Manrope, sans-serif" }}>
            Не нашёл ответа?{" "}
            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
              Напиши нам в Telegram
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
