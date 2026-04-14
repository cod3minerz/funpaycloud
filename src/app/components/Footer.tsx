import { BrandLogo } from "./BrandLogo";

export function Footer() {
  const cols = [
    {
      title: "Продукт",
      links: ["Возможности", "Тарифы", "Плагины", "Обновления", "Статус системы"],
    },
    {
      title: "Поддержка",
      links: ["Документация", "База знаний", "Telegram-поддержка", "Онбординг", "Сообщество"],
    },
    {
      title: "Компания",
      links: ["О нас", "Блог", "Партнёрство", "Политика конфиденциальности", "Условия использования"],
    },
  ];

  return (
    <footer className="relative" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <a href="#" aria-label="FunPay Cloud" className="inline-block mb-5">
              <BrandLogo className="h-8 md:h-9" compact />
            </a>
            <p
              className="text-[#525266] text-sm leading-relaxed mb-6"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Облачная платформа автоматизации продаж для профессиональных продавцов FunPay.
            </p>
            <div className="flex gap-3">
              {["TG", "VK", "YT"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#525266] hover:text-white hover:bg-white/[0.08] transition-all text-xs font-bold"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Cols */}
          {cols.map((col) => (
            <div key={col.title}>
              <div
                className="text-white font-semibold mb-5 text-sm"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {col.title}
              </div>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[#525266] hover:text-[#A8A8B3] text-sm transition-colors"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p
            className="text-[#525266] text-sm"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            © 2026 FunPay Cloud. Все права защищены.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span
              className="text-[#525266] text-sm"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Все системы работают
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
