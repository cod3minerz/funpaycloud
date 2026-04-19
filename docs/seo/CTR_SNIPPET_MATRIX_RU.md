# CTR & Snippet Matrix (RU, Yandex-first)

## 1) Правила
- `Title`: 45-65 символов, ключ ближе к началу, один явный benefit, без переспама.
- `Meta description`: 120-170 символов, pain + решение + proof + CTA.
- Один URL = один основной интент = один шаблон title.
- Для money-страниц не дублировать формулировки блоговых how-to.

## 2) Шаблоны по типам страниц

### Landing (`/`)
- Title template: `FunPay Cloud — {главная ценность} без VPS и технички`
- Meta template: `Автоподнятие, автовыдача и AI-ответы для продавцов FunPay. Облачный сервис 24/7 без VPS, прокси и сложной настройки. Запуск за 10 минут.`
- CTR hooks: `без VPS`, `24/7`, `запуск за 10 минут`, `без карты/пробный период`.

### Feature pages (`/auto-raise-lots-funpay`, `/auto-delivery-funpay`, `/funpay-auto-reply`)
- Title template: `{Feature} на FunPay — {result} | FunPay Cloud`
- Meta template: `Настройте {feature} на FunPay: {3 коротких выгоды}. Облачно, без сервера и ручной рутины. Подходит продавцам любого масштаба.`
- CTR hooks: `ошибки/потери/скорость`, `без сервера`, `пошагово`.

### Comparison/Alternative (`/funpay-cardinal-alternative`)
- Title template: `{A} или {B} — что выбрать продавцу FunPay в 2026`
- Meta template: `Сравнили {A} и {B}: стабильность, запуск, поддержка, масштабирование и риски. Практические рекомендации под ваш формат магазина.`
- CTR hooks: `сравнение`, `таблица`, `что выбрать`, `в 2026`.

### Commercial generic (`/funpay-bot`, `/funpay-automation`, `/cloud-funpay-bot`)
- Title template: `{Main query} — облачный сервис для продавцов | FunPay Cloud`
- Meta template: `{Main query} без VPS и сложной настройки. Автоподнятие, автовыдача, AI-ответы, аналитика и мультиаккаунт в одной платформе.`
- CTR hooks: `облачный`, `без VPS`, `в одной платформе`.

### Blog hub (`/blog`)
- Title template: `Блог FunPay Cloud — гайды по автоматизации FunPay`
- Meta template: `Практические статьи для продавцов FunPay: автоподнятие, автовыдача, AI-ответы, сравнения решений и чеклисты роста продаж.`

### Blog article (`/blog/[slug]`)
- Title template: `{How-to / pain point}: {конкретный результат} | Блог FunPay Cloud`
- Meta template: `{Короткий pain}. Разбираем {N шагов}: {выгода 1}, {выгода 2}, {выгода 3}. Плюс шаблоны и чеклист внедрения.`
- CTR hooks: `пошагово`, `чеклист`, `шаблон`, `ошибки`.

### Legal pages (`/legal/*`)
- Title template: `{Название документа} — FunPay Cloud`
- Meta template: `Официальный документ FunPay Cloud: {кратко о предмете}. Актуальная версия с датой обновления и контактами для обращений.`

## 3) Анти-примеры
- `"Бот FunPay, бот фанпей, автоматизация funpay"` в одном title.
- Кликбейт без интента: `"ШОК! Лучший бот"`.
- Дубли: одинаковые title у `/funpay-bot` и `/funpay-automation`.

## 4) Шаблоны для итераций CTR (раз в 14 дней)
- Вариант A: benefit-first (`без VPS`, `24/7`).
- Вариант B: speed-first (`запуск за 10 минут`).
- Вариант C: outcome-first (`меньше рутины, больше продаж`).

Победитель фиксируется по `CTR uplift` при сопоставимых позициях (Yandex Webmaster/GSC).
