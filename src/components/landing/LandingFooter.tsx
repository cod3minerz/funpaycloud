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
            </a>
            <p className="ft-about">Облачная платформа автоматизации продаж для профессиональных продавцов FunPay.</p>
          </div>

          <div className="ft-col">
            <h5>Продукт</h5>
            <ul>
              <li><a href="/funpay-automation">Автоматизация FunPay</a></li>
              <li><a href="/funpay-bot">Облачный бот FunPay</a></li>
              <li><a href="/funpay-plugins">Плагины</a></li>
              <li><a href="/blog">Обновления</a></li>
              <li><a href="/status">Статус системы</a></li>
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
              <li><a href="/#features">О нас</a></li>
              <li><a href="/blog">Блог</a></li>
              <li><a href="mailto:partners@funpay.cloud">Партнёрство</a></li>
              <li><a href="/legal/privacy-policy">Политика конфиденциальности</a></li>
              <li><a href="/legal/terms-of-service">Условия использования</a></li>
              <li><a href="/legal/disclaimer">Отказ от ответственности</a></li>
              <li><a href="/legal/personal-data-consent">Согласие на обработку данных</a></li>
              <li><a href="/legal/cookie-policy">Политика cookie</a></li>
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
