import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Юридические документы | FunPay Cloud',
  description: 'Юридическая информация FunPay Cloud: политика конфиденциальности, условия использования и отказ от ответственности.',
};

const documents = [
  {
    href: '/legal/privacy-policy',
    title: 'Политика конфиденциальности',
    description: 'Как мы собираем, храним и защищаем персональные данные пользователей.',
  },
  {
    href: '/legal/terms-of-service',
    title: 'Условия использования',
    description: 'Правила использования сервиса, права и обязанности сторон.',
  },
  {
    href: '/legal/disclaimer',
    title: 'Отказ от ответственности',
    description: 'Ограничения ответственности и важные юридические оговорки.',
  },
  {
    href: '/legal/personal-data-consent',
    title: 'Согласие на обработку данных',
    description: 'Условия и объём согласия на обработку персональных данных (152-ФЗ).',
  },
  {
    href: '/legal/cookie-policy',
    title: 'Политика cookie',
    description: 'Какие файлы cookie используются на сайте и как ими управлять.',
  },
];

export default function LegalIndexPage() {
  return (
    <section className="legal-index">
      <div className="legal-index-head">
        <span className="legal-chip">Документы</span>
        <h1>Юридическая информация</h1>
        <p>Официальные документы FunPay Cloud. Рекомендуем ознакомиться перед использованием сервиса.</p>
      </div>
      <div className="legal-grid">
        {documents.map((doc) => (
          <Link key={doc.href} href={doc.href} className="legal-card">
            <h2>{doc.title}</h2>
            <p>{doc.description}</p>
            <span>Открыть документ →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

