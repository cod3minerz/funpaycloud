import Image from 'next/image';
import styles from './maintenance.module.css';

export function MaintenancePage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Image
          className={styles.logo}
          src="/branding/full_logo.svg"
          alt="FunPay Cloud"
          width={2265}
          height={257}
          priority
        />

        <div className={styles.message}>
          <h1>
            <span>FUNPAY CLOUD v2.0.</span>
            <span>Скоро</span>
          </h1>
          <p>Переписываем ядро FunPay Cloud и готовим запуск новой версии. Скоро расскажем подробности.</p>
        </div>

        <nav className={styles.actions} aria-label="Связаться с FunPay Cloud">
          <a className={styles.action} href="https://t.me/fpcloud_support">
            <span>Поддержка</span>
          </a>
          <a className={styles.action} href="https://t.me/funpay_cloud">
            <span>Наш канал</span>
          </a>
        </nav>
      </div>
    </main>
  );
}
