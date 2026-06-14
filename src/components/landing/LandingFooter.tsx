import Image from 'next/image';

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const VkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C5.29 10.766 4.647 8.69 4.647 8.266c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.745-.576.745z"/>
  </svg>
);

const SupportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default function LandingFooter() {
  return (
    <footer>
      <div className="wrap">

        {/* ─── Top CTA strip ─── */}
        <div className="ft-top-cta">
          <div className="ft-top-cta-text">
            <h3>Начните автоматизацию уже сегодня</h3>
            <p>Первые 7 дней бесплатно — без карты и обязательств</p>
          </div>
          <a href="/auth/register" className="btn btn-accent btn-lg">
            Попробовать бесплатно
            <ArrowRightIcon />
          </a>
        </div>

        {/* ─── Column grid ─── */}
        <div className="ft-grid">
          <div>
            <a className="logo" href="/">
              <Image
                src="/branding/logo_full_new.svg"
                alt="FunPay Cloud"
                width={715}
                height={113}
                className="landing-logo-full landing-logo-full-footer"
              />
            </a>
            <p className="ft-about">Облачная платформа автоматизации продаж для профессиональных продавцов FunPay.</p>
            <div className="ft-socials">
              <a href="https://t.me/funpay_cloud" target="_blank" rel="noreferrer" className="ft-social-btn" aria-label="Telegram @funpay_cloud">
                <TelegramIcon />
                <span>@funpay_cloud</span>
              </a>
              <a href="https://vk.com/funpaycloud" target="_blank" rel="noreferrer" className="ft-social-btn" aria-label="ВКонтакте">
                <VkIcon />
                <span>ВКонтакте</span>
              </a>
              <a href="https://t.me/fpcloud_support" target="_blank" rel="noreferrer" className="ft-social-btn ft-social-btn--support" aria-label="Поддержка @fpcloud_support">
                <SupportIcon />
                <span>Поддержка</span>
              </a>
            </div>
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
              <li><a href="https://t.me/fpcloud_support" target="_blank" rel="noreferrer">Поддержка</a></li>
              <li><a href="/auth/register">Онбординг</a></li>
              <li><a href="https://t.me/funpay_cloud" target="_blank" rel="noreferrer">Сообщество @funpay_cloud</a></li>
            </ul>
          </div>

          <div className="ft-col">
            <h5>Компания</h5>
            <ul>
              <li><a href="/about">О компании</a></li>
              <li><a href="/blog">Блог</a></li>
              <li><a href="mailto:partners@funpay.cloud">Партнёрство</a></li>
              <li><a href="/legal/privacy">Политика конфиденциальности</a></li>
              <li><a href="/legal/terms">Условия использования</a></li>
            </ul>
          </div>
        </div>

        {/* ─── Bottom row ─── */}
        <div className="ft-bottom">
          <div>© 2026 FunPay Cloud. Все права защищены.</div>
          <span className="ft-status">
            <span className="ft-status-dot" />
            All systems operational
          </span>
        </div>

        <div className="ft-disclaimer">
          FunPay Cloud не аффилирован с FunPay и не является официальным инструментом или продуктом FunPay.
        </div>
      </div>
    </footer>
  );
}
