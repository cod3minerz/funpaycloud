import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Возможности", href: "#features" },
    { label: "Тарифы", href: "#pricing" },
    { label: "Кейсы", href: "#usecases" },
    { label: "Как работает", href: "#howitworks" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(2,8,23,0.84)] backdrop-blur-sm border-b border-slate-200/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-[78px] grid grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-8">
          <a href="#" aria-label="FunPay Cloud" className="justify-self-start">
            <BrandLogo className="h-8 md:h-9" compact />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center justify-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-blue-300/80 after:transition-transform hover:after:scale-x-100"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-4 justify-self-end">
            <a
              href="#"
              className="text-slate-300 hover:text-white text-sm font-semibold transition-colors"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Войти
            </a>
            <a
              href="#pricing"
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl block hover:opacity-95 transition-opacity border border-blue-200/20"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Начать бесплатно
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 justify-self-end"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200/10 bg-[rgba(2,8,23,0.96)]">
          <div className="px-6 pb-6 pt-3">
            <div className="flex flex-col">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-sm font-medium text-slate-300 hover:text-white border-b border-slate-200/10 transition-colors"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-5">
              <a
                href="#"
                className="text-white text-sm font-semibold text-center py-2.5 border border-slate-200/20 rounded-xl"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Войти
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileOpen(false)}
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold text-sm py-3 rounded-xl text-center border border-blue-200/20"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Начать бесплатно
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
