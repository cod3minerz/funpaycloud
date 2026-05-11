import type { Metadata } from 'next';
import LegalArticle from '@/components/legal/LegalArticle';

export const metadata: Metadata = {
  title: 'О компании | FunPay Cloud',
  description:
    'Сведения об операторе и реквизиты FunPay Cloud. ИП Кривонос Кирилл Николаевич.',
  alternates: {
    canonical: 'https://funpay.cloud/about',
  },
};

export default function AboutPage() {
  return (
    <LegalArticle
      title="О компании"
      description="FunPay Cloud — облачная платформа автоматизации продаж для профессиональных продавцов FunPay. Работаем с 2024 года."
      updatedAt="11 мая 2026"
    >
      <section>
        <h2>1. Сведения об операторе</h2>
        <p>Сервис FunPay Cloud разработан и эксплуатируется индивидуальным предпринимателем:</p>
        <table>
          <tbody>
            <tr>
              <td><strong>Наименование</strong></td>
              <td>Индивидуальный предприниматель Кривонос Кирилл Николаевич</td>
            </tr>
            <tr>
              <td><strong>ИНН</strong></td>
              <td>233709973634</td>
            </tr>
            <tr>
              <td><strong>ОГРНИП</strong></td>
              <td>326237500203594</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>2. Контактные данные</h2>
        <table>
          <tbody>
            <tr>
              <td><strong>Веб-сайт</strong></td>
              <td><a href="https://funpay.cloud">funpay.cloud</a></td>
            </tr>
            <tr>
              <td><strong>Электронная почта</strong></td>
              <td><a href="mailto:support@funpay.cloud">support@funpay.cloud</a></td>
            </tr>
            <tr>
              <td><strong>Юридические вопросы</strong></td>
              <td><a href="mailto:legal@funpay.cloud">legal@funpay.cloud</a></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. О сервисе</h2>
        <p>
          FunPay Cloud — облачная платформа, которая позволяет продавцам маркетплейса FunPay автоматизировать
          ключевые бизнес-процессы: автоподнятие лотов, автовыдачу товаров, обработку заказов и общение
          с покупателями с помощью ИИ-ассистента.
        </p>
        <p>
          Сервис работает 24/7 в облаке без необходимости держать включённый компьютер. Все данные
          передаются и хранятся в зашифрованном виде с использованием симметричного шифрования AES-256.
        </p>
      </section>

      <section>
        <h2>4. Правовые документы</h2>
        <ul>
          <li><a href="/legal/terms">Публичная оферта (условия использования)</a></li>
          <li><a href="/legal/privacy">Политика конфиденциальности и обработки персональных данных</a></li>
        </ul>
      </section>
    </LegalArticle>
  );
}
