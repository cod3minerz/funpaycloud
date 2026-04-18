export default function LandingFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="ft-grid">
          <div>
            <a className="logo" href="/">
              <span className="logo-mark" aria-hidden>
                <span className="logo-mark-bar logo-mark-bar-1" />
                <span className="logo-mark-bar logo-mark-bar-2" />
              </span>
              <span>FunPay Cloud</span>
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
      </div>
    </footer>
  );
}
