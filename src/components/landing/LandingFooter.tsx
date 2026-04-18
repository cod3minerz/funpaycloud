import Image from 'next/image';

export default function LandingFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="ft-grid">
          <div>
            <a className="logo" href="/">
              <Image
                src="/branding/logo_full_new.svg"
                alt="FunPay Cloud"
                width={1223}
                height={206}
                className="landing-logo-full landing-logo-full-footer"
              />
              <Image
                src="/branding/logo_short_new.svg"
                alt="FunPay Cloud"
                width={245}
                height={167}
                className="landing-logo-short landing-logo-short-footer"
              />
            </a>
            <p className="ft-about">Облачная платформа автоматизации продаж для профессиональных продавцов FunPay.</p>
          </div>

          <div className="ft-col">
            <h5>Продукт</h5>
            <ul>
              <li><a href="#features">Возможности</a></li>
              <li><a href="#pricing">Тарифы</a></li>
              <li><a href="/platform/plugins">Плагины</a></li>
              <li><a href="/blog">Обновления</a></li>
              <li><a href="/platform/dashboard">Статус системы</a></li>
            </ul>
          </div>

          <div className="ft-col">
            <h5>Поддержка</h5>
            <ul>
              <li><a href="/docs">Документация</a></li>
              <li><a href="#faq">База знаний</a></li>
              <li><a href="https://t.me/funpaycloud_support" target="_blank" rel="noreferrer">Telegram-поддержка</a></li>
              <li><a href="/auth/register">Онбординг</a></li>
              <li><a href="https://t.me/funpaycloud" target="_blank" rel="noreferrer">Сообщество</a></li>
            </ul>
          </div>

          <div className="ft-col">
            <h5>Компания</h5>
            <ul>
              <li><a href="/blog">О нас</a></li>
              <li><a href="/blog">Блог</a></li>
              <li><a href="/blog">Партнёрство</a></li>
              <li><a href="/blog">Политика конфиденциальности</a></li>
              <li><a href="/blog">Условия использования</a></li>
            </ul>
          </div>
        </div>

        <div className="ft-bottom">
          <div>© 2026 FunPay Cloud. Все права защищены.</div>
          <div className="mono">status: all systems operational ●</div>
        </div>

        <div className="ft-disclaimer">
          FunPay Cloud не аффилирован с FunPay и не является официальным инструментом или продуктом FunPay.
        </div>
      </div>
    </footer>
  );
}
