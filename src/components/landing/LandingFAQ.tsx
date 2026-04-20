'use client';

import { useState } from 'react';

const faq = [
  {
    question: 'Нужно ли держать компьютер включённым?',
    answer:
      'Нет. FunPay Cloud работает полностью в облаке на наших серверах. Ты можешь выключить компьютер, уехать в отпуск или просто лечь спать — бот продолжает работать 24/7 без твоего участия.',
  },
  {
    question: 'Безопасно ли для моего аккаунта FunPay?',
    answer:
      'Да. Каждому клиенту выделяется отдельный IPv4-адрес, встроена антибан-логика и соблюдаются лимиты площадки. Тысячи продавцов работают через FunPay Cloud месяцами без блокировок.',
  },
  {
    question: 'Сложно ли настроить? Я не технарь',
    answer:
      'Нет. Онбординг занимает 10 минут, мы ведём за руку на каждом шаге. Если что-то непонятно — команда поддержки поможет настроить всё за тебя в рамках бесплатного онбординга.',
  },
  {
    question: 'Что такое AI-автоответчик и как он работает?',
    answer:
      'Нейросеть понимает контекст диалога, отвечает клиентам как живой человек, обрабатывает типовые вопросы и возражения. Сложные случаи передаёт тебе. Ты задаёшь тон и шаблоны, а ассистент подстраивается.',
  },
  {
    question: 'Можно ли управлять несколькими аккаунтами?',
    answer:
      'Да. На тарифе Pro — до 5 аккаунтов, на Ultra — без ограничений. Единая панель показывает все аккаунты сразу, с общей аналитикой и ролями для команды.',
  },
  {
    question: 'Что если у меня вопросы после оплаты?',
    answer:
      'Приоритетная поддержка в Telegram с временем ответа до 15 минут в рабочее время. На тарифе Ultra — персональный менеджер и приоритетные тикеты 24/7.',
  },
  {
    question: 'Чем FunPay Cloud лучше других ботов для FunPay?',
    answer:
      'Облачный запуск вместо ПК, полноценный веб-дашборд, AI-ответы с пониманием контекста, выделенный IPv4, мультиаккаунт и глубокая аналитика. См. таблицу сравнения выше.',
  },
  {
    question: 'Есть ли пробный период?',
    answer:
      'Да, 7 дней бесплатно без привязки карты. Полный доступ к функциям тарифа Pro, чтобы ты оценил реальный эффект на своём магазине.',
  },
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section id="faq">
      <div className="wrap">
        <div className="faq-wrap">
          <div>
            <div className="sec-eyebrow">Частые вопросы</div>
            <h2 className="sec-title faq-title">Всё, что ты хотел спросить</h2>
            <div className="faq-foot">
              Не нашёл ответа? <a href="https://t.me/funpaycloud_support" target="_blank" rel="noreferrer">Напиши нам в Telegram →</a>
            </div>
          </div>

          <div className="faq-list">
            {faq.map((item, index) => {
              const open = openIndex === index;
              return (
                <div key={item.question} className={`faq ${open ? 'open' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? -1 : index)}
                    className="faq-summary"
                    aria-expanded={open}
                  >
                    <span>{item.question}</span>
                    <span className="faq-sign">{open ? '–' : '+'}</span>
                  </button>
                  {open ? <div className="ans">{item.answer}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
