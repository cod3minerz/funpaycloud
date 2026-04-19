# SEO Domination Plan — FunPay Cloud (Yandex-first, RU-only)

## 1) Executive Summary
- **Цель на 90 дней**: занять ТОП-1/ТОП-3 по ключевым коммерческим кластерам (`бот funpay`, `автоматизация funpay`, `автоподнятие`, `автовыдача`, `автоответы`, `аналог cardinal`) и масштабировать информационный long-tail.
- **Основная модель роста**:
  1. убрать технические барьеры индексации,
  2. развести интенты в отдельные money pages,
  3. построить контент-хабы и агрессивную перелинковку в коммерцию,
  4. еженедельно оптимизировать CTR по данным Yandex Webmaster/GSC.
- **Позиционирование**: не «бот-скрипт», а **облачная SaaS-платформа для продавцов FunPay**, где не нужны VPS, прокси и инженерная поддержка со стороны клиента.

## 2) Critical Issues (P0/P1/P2)

### P0 (исправлено в этой итерации)
1. `robots.txt` был слишком открытым (`Allow: /`) без защиты закрытых зон и query-мусора.
2. `sitemap.xml` покрывал только `/`, `/blog` и `/blog/*`, не покрывая legal и новые money/support URL.
3. Закрытые зоны (`/auth`, `/admin`, `/platform`, `/login`) не имели явного `noindex`.
4. `Article` JSON-LD ссылался на рискованный publisher logo URL (`/logo.png`).

### P1 (следующая очередь)
1. Перейти на sitemap index (`/sitemap.xml` -> `sitemap-main`, `sitemap-blog`, `sitemap-legal`, `sitemap-pages`).
2. Добавить image sitemap для масштабируемых изображений.
3. Укрепить шаблоны title/meta на всех типах страниц по единой матрице интентов.
4. Добавить Breadcrumb schema на блог и новые money pages в едином формате.

### P2 (итеративные улучшения)
1. Внедрить HTML sitemap-политику и автоматическую проверку orphan pages.
2. Запустить регулярные A/B итерации title/meta для CTR.
3. Углубить cluster pages (case studies, use-case landing pages по нишам товара).

## 3) Competitor Map (RU ниша FunPay automation)

## Источники
- https://funpaybot.com
- https://funpaybot.com/sitemap.xml
- https://funpay-helper.ru
- https://github.com/sidor0912/FunPayCardinal
- https://pypi.org/project/FunPayAPI/

### Срез
1. **funpaybot.com**
- Сильная сторона: большой индексный footprint (много plugin landing pages, отдельные URL под функционал).
- Слабая сторона: перегруженный коммерческий лендинг, смешение интентов, риск каннибализации и тонкой дифференциации запросов.

2. **funpay-helper.ru**
- Сильная сторона: раннее бренд-присутствие в нише.
- Слабая сторона: слабая глубина структуры, почти нет контентного покрытия.

3. **Cardinal ecosystem (OSS/сообщества)**
- Сильная сторона: сильный DIY-интент и бренд узнаваемости в технической аудитории.
- Слабая сторона: высокий порог входа (VPS/прокси/настройка), что даёт нам сильный SaaS-angle.

### Где FunPay Cloud может обгонять быстрее
- Коммерческие страницы с чётким интентом (`автоподнятие`, `автовыдача`, `автоответы`, `облако vs vps`, `альтернатива cardinal`).
- Контент «без технички»: как продавцу запуститься без серверов и инженерии.
- Контент-кластеры по pain points с явным CTA в регистрацию.

## 4) Semantic Core & Clustering (RU-first)

Формат: `cluster | query | freq band | intent | target URL | page type | priority`

### A. Commercial high intent
| cluster | query | freq band | intent | target URL | page type | priority |
|---|---|---:|---|---|---|---|
| A | бот funpay | high | buy | /funpay-bot | money | P0 |
| A | funpay бот | high | buy | /funpay-bot | money | P0 |
| A | автоматизация funpay | high | buy | /funpay-automation | money | P0 |
| A | автоматизация фанпей | high | buy | /funpay-automation | money | P0 |
| A | облачный бот funpay | mid | buy | /cloud-funpay-bot | money | P0 |
| A | автоподнятие лотов funpay | high | buy | /auto-raise-lots-funpay | money | P0 |
| A | автовыдача funpay | high | buy | /auto-delivery-funpay | money | P0 |
| A | автоответы funpay | high | buy | /funpay-auto-reply | money | P0 |
| A | плагины funpay | mid | buy | /funpay-plugins | money | P1 |
| A | сервис для продавцов funpay | mid | buy | /for-sellers | money | P1 |

### B. Commercial mid intent
| cluster | query | freq band | intent | target URL | page type | priority |
|---|---|---:|---|---|---|---|
| B | инструмент для funpay продавца | mid | eval | /for-sellers | feature | P1 |
| B | программа для продавцов funpay | mid | eval | /for-sellers | feature | P1 |
| B | funpay cloud automation | low | eval | /funpay-automation | feature | P1 |
| B | SaaS для funpay | low | eval | /cloud-funpay-bot | feature | P1 |

### C. Informational / how-to
| cluster | query | freq band | intent | target URL | page type | priority |
|---|---|---:|---|---|---|---|
| C | как автоматизировать funpay | mid | info | /blog/kak-avtomatizirovat-funpay | article | P0 |
| C | как настроить автовыдачу funpay | mid | info | /blog/avtovydacha-na-funpay-bez-vps | article | P1 |
| C | как поднимать лоты funpay автоматически | mid | info | /blog/kak-rabotaet-avtopodnyatie-na-funpay | article | P1 |
| C | как отвечать клиентам на funpay | low | info | /blog/ai-avtootvety-dlya-funpay | article | P1 |

### D. Comparison / alternatives
| cluster | query | freq band | intent | target URL | page type | priority |
|---|---|---:|---|---|---|---|
| D | cardinal funpay аналог | mid | compare | /funpay-cardinal-alternative | comparison | P0 |
| D | чем заменить cardinal | mid | compare | /funpay-cardinal-alternative | comparison | P0 |
| D | облако vs vps funpay | low | compare | /cloud-funpay-bot | comparison | P1 |

### E. Brand
| cluster | query | freq band | intent | target URL | page type | priority |
|---|---|---:|---|---|---|---|
| E | funpay cloud | high | nav | / | brand | P0 |
| E | funpay cloud блог | low | nav | /blog | hub | P1 |
| E | funpay cloud тарифы | low | nav | /pricing | support | P1 |

### F/G/H (pain-point + long-tail + entities)
- `бот funpay без vps`, `автоматизация funpay без прокси`, `funpay 24/7 без компьютера`, `автовыдача ключей funpay`, `поднятие лотов без рутины`, `инструмент для магазина funpay`, `управление заказами funpay`.

## 5) New SEO Architecture (Implemented + planned)

### Money pages (уже добавлены)
- `/funpay-bot`
- `/funpay-automation`
- `/cloud-funpay-bot`
- `/auto-raise-lots-funpay`
- `/auto-delivery-funpay`
- `/funpay-auto-reply`
- `/funpay-plugins`
- `/funpay-cardinal-alternative`
- `/for-sellers`

### Supporting pages (добавлены)
- `/how-it-works`
- `/pricing`
- `/security`
- `/status`
- `/integrations`
- `/docs`
- `/site-map`

### Existing hubs
- `/` (главный коммерческий хаб)
- `/blog` (информационный хаб)
- `/blog/[slug]` (supporting articles)
- `/blog/category/[category]` (category clusters)

### Legal/trust
- `/legal`
- `/legal/privacy-policy`
- `/legal/terms-of-service`
- `/legal/disclaimer`
- `/legal/personal-data-consent`
- `/legal/cookie-policy`

## 6) Landing Rewrite Blueprint (SEO + CRO)

### Что должен закрывать лендинг
- Head-intent: `бот funpay`, `автоматизация funpay`, `облачный funpay bot`.
- Value proposition: облако, без VPS, без прокси, 24/7, быстрое внедрение.

### Что нельзя смешивать в одну страницу (вынесено на отдельные URL)
- `cardinal альтернатива` (comparison intent)
- `автоподнятие`, `автовыдача`, `автоответы` (feature intent)
- `плагины` (plugin intent)

### Обязательные блоки лендинга
1. Hero + clear offer.
2. Pain-points (ручная рутина/простой/пропуски заказов).
3. Cloud vs local/VPS comparison.
4. Feature matrix (raise/delivery/reply/analytics).
5. FAQ под PAA-сценарии.
6. Social proof + trust/legal statement.
7. Multi-CTA (register + pricing + blog guides).

## 7) Blog SEO Blueprint

### Шаблон статьи (обязательно)
- Title: 55–65 символов.
- Description: 140–170.
- H1: один, точный интент.
- Intro: 80–140 слов с раскрытием боли.
- TOC, H2/H3, списки/таблицы.
- Article JSON-LD + BreadcrumbList.
- CTA в середине + в конце статьи.
- Блок «Похожие статьи» (2–3) + блок «Следующий шаг» в money page.

### Политика индексации блога
- Индексировать: `/blog`, `/blog/[slug]`, `/blog/category/[category]`.
- Не создавать тонкие tag pages без плотности.
- Любая категория < 3 релевантных статей — либо объединяется, либо noindex,follow.

## 8) Content Plan (40 статей)

### BOFU (12)
1. Как выбрать бот для FunPay в 2026
2. Облачный бот FunPay vs локальный: финальный выбор
3. Автовыдача на FunPay без VPS: практический гайд
4. Автоподнятие лотов: оптимальные интервалы
5. Как сократить время ответа в чатах FunPay
6. Настройка AI-автоответов под продажи
7. Как перевести магазин с ручного режима на автоматизацию
8. Что выбрать: SaaS или self-hosted для FunPay
9. Как увеличить выручку без роста времени в операционке
10. 10 ошибок при автоматизации FunPay
11. Безопасная настройка выдачи цифровых товаров
12. ROI автоматизации FunPay за 30 дней

### MOFU (10)
13. Как работает автоподнятие и почему влияет на заказы
14. Скрипт, бот или облачный сервис: что выбрать продавцу
15. Как устроен склад товаров для автовыдачи
16. Как собирать FAQ для AI-ассистента
17. Как не терять клиентов в ночные часы
18. Как запускать автоматизацию без технической команды
19. Чеклист перед запуском автопродаж
20. Метрики продавца: что смотреть каждую неделю
21. Сценарии автоматизации для разных ниш товаров
22. Как масштабировать магазин на FunPay

### TOFU (8)
23. Что такое автоматизация продаж на FunPay
24. Что такое golden key и как его использовать безопасно
25. Что такое автовыдача и когда она нужна
26. Что такое автоответчик для продавца
27. Как работает облачный SaaS для маркетплейсов
28. Почему ручной режим тормозит рост магазина
29. Что важно учитывать при выборе инструмента продавца
30. Типовые боли продавцов FunPay и как их решать

### Comparison/Alternative (6)
31. Чем заменить Cardinal: обзор вариантов
32. Cardinal vs облачный сервис: честное сравнение
33. VPS-бот vs облако: TCO за 12 месяцев
34. Бесплатные решения vs SaaS: где скрытые издержки
35. Плагины vs встроенные функции платформы
36. Автоматизация самостоятельно или «под ключ»

### Trust/Safety (4)
37. Безопасность аккаунта при автоматизации: мифы и практика
38. Политика данных и что реально хранит сервис
39. Антибан-подходы: что важно продавцу
40. Что делать при сбоях: план восстановления

## 9) Technical SEO Backlog (Developer-ready)

| problem | why it matters | priority | exact fix | validation |
|---|---|---|---|---|
| robots allow-all | индексный мусор, crawl waste | P0 | disallow private zones + query patterns | `curl /robots.txt` + Webmaster robots tester |
| узкий sitemap | слабая discoverability | P0 | добавить money/support/legal/blog category URLs | `curl /sitemap.xml` + Webmaster sitemap report |
| indexable auth/admin/platform | мусорные сниппеты | P0 | `noindex,follow` через head/layout | inspect source + URL inspection |
| invalid article logo URL | риск проблем rich results | P0 | заменить publisher logo на валидный абсолютный ассет | Rich Results Test |
| нет sitemap index | рост блога ухудшит manageability | P1 | внедрить `sitemap index` с сегментами | проверка всех sitemap subfiles |
| нет image sitemap | хуже image discovery | P2 | image sitemap для blog/media | image index coverage |
| нет canonical policy matrix | дубль-сигналы | P1 | унифицировать генерацию canonical в templates | spot check across page types |
| нет regex policy для параметров | дубль URL | P1 | параметрические noindex/canonical правила | crawl diff before/after |
| нет авто-проверки broken links | утечка crawl budget | P1 | CI check broken internal links | CI report |

## 10) On-Page Templates

### Landing / money page
- **Title**: 52–64 символа, 1 primary + value + brand.
- **Meta**: 135–165 символов, pain + solution + differentiator.
- **H1**: интент + результат.
- **H2**: pain → mechanism → outcomes → objections.
- **FAQ**: 3–6 вопросов только по фактическому контенту.

### Comparison page
- Заголовок с явным сравнением (`X vs Y` / `альтернатива`)
- Таблица критериев (внедрение, стабильность, TCO, поддержка, риски)
- Блок “кому подходит” для обеих сторон

### Blog article
- Problem-first intro
- PAA-friendly H2/H3 (`Как...`, `Почему...`, `Что делать если...`)
- Списки, чеклисты, сравнительные таблицы
- CTA в середине и в финале

### Anti-patterns
- Дубли title/h1 на разных URL.
- Doorway pages под микро-синонимы без новой ценности.
- Переоптимизированные exact-match анкоры sitewide.

## 11) Internal Linking Map (Hub/Spoke)

### Commercial hub
- `/` -> все money pages.

### Feature hubs
- `/funpay-automation` -> `/auto-raise-lots-funpay`, `/auto-delivery-funpay`, `/funpay-auto-reply`, `/funpay-plugins`.
- `/funpay-bot` -> `/cloud-funpay-bot`, `/funpay-cardinal-alternative`, `/pricing`.

### Comparison hub
- `/funpay-cardinal-alternative` <-> `/cloud-funpay-bot` <-> comparison articles.

### Blog support flow
- BOFU статьи -> соответствующая money page.
- TOFU/MOFU -> BOFU + money page.
- Category pages -> flagship статьи + money anchors.

### Anchor policy
- 20–30% exact-match.
- 40–50% partial-match.
- 20–30% natural/brand anchors.

## 12) Measurement Plan

### Инструменты
- Yandex Webmaster (primary)
- Google Search Console (secondary)
- GA4 + server events
- Yandex Metrika

### KPI
1. Non-brand clicks (Яндекс) по кластерам.
2. Visibility by cluster (Top-3/Top-10 share).
3. CTR by template type (money/comparison/blog).
4. Blog -> money assisted conversions.
5. Organic signup CVR.

### Cadence
- **Daily**: 5xx, robots/crawl anomalies, резкие просадки index coverage.
- **Weekly**: CTR/позиции по кластерам, новые query gaps, internal link health.
- **Monthly**: вклад кластеров в регистрации, ROI контента, roadmap reprioritization.

## 13) Roadmap 30/60/90

### 0–30 дней (Foundation)
- Техфиксы индексации + canonical + schema.
- Запуск money/support URL.
- Обновление sitemap/robots.
- Шаблоны мета/контента.

### 31–60 дней (Expansion)
- Публикация 12–18 статей (приоритет BOFU/MOFU).
- Построение hub-spoke перелинковки.
- Первые циклы оптимизации CTR.

### 61–90 дней (Scale)
- Доведение контент-пула до 30–50 статей.
- Усиление comparison moat.
- Итерирование по данным Webmaster/GSC.

## 14) Concrete Tasks for Developer
1. Внедрить sitemap index + сегментацию.
2. Добавить CI-проверку broken internal links.
3. Реализовать автоматический контроль дублей title/meta.
4. Вынести canonical policy в единый utility.
5. Добавить image sitemap при росте медиа-контента.
6. Внедрить автогенерацию breadcrumb schema на article/category/money pages.
7. Ограничить indexation query-параметров на уровне edge/middleware при необходимости.

## 15) Concrete Tasks for Content Team
1. Запустить публикационный календарь 3 статьи/неделю (12 в месяц).
2. Переписать лендинг-тексты под интентные блоки (pain-solution-proof).
3. Делать каждую статью с CTA в релевантную money page.
4. Для каждой статьи готовить:
- FAQ блок,
- таблицу/чеклист,
- 2–3 внутренние ссылки на кластер,
- 1 ссылку на trust/legal при релевантности.
5. Еженедельно обновлять 3 старые статьи по данным запросов из Webmaster.

---

## Implemented in this iteration (code)
- robots policy hardened (`/robots.txt`).
- sitemap coverage expanded (`/sitemap.xml`) including money/support/legal/category/blog URLs.
- noindex heads added for `/auth/*`, `/admin/*`, `/platform/*`, `/login`.
- article JSON-LD publisher logo fixed to valid absolute asset.
- canonical added/standardized for legal pages and homepage.
- added structured data (`Organization`, `WebSite`) on homepage.
- launched static SEO pages architecture with dedicated slugs for commercial/support clusters.

