# DS DIGITAL — сайт международной Digital Development Studio

BUILD. AUTOMATE. SCALE.

Проект создан с нуля по комплекту документов в `D:\RideFlowCRM\DS_DIGITAL_TZ\`
(Док.1 Аудит · Док.2 Финальное ТЗ · Док.3 Архитектура · Док.4 План · Док.5 Чек-лист).

## Текущий статус (21.11.2026)

**Этапы 0–3 плана выполнены, этап 4 — в работе (CRM заявок, каркас админки, CRUD услуг/отзывов/FAQ), этап 5 начат: главная собрана по прототипу `molnii` и дополнена недостающими блоками ТЗ §6.**

### Этап 5: 16 блоков главной (21.11.2026)

Сверка с ТЗ Док.2 §6 — порядок и состав блоков в `app/[locale]/page.tsx`:

- Preloader (§7.5) — `components/site/Preloader.tsx`: ≤600 мс, один раз за сессию (sessionStorage), инлайн-скрипт до отрисовки + JS-фолбэк скрытия, `pointer-events: none`, `aria-hidden`, выключен при `prefers-reduced-motion` и в Static-режиме; без JS исчезает по CSS-анимации.
- Hero → **About DS DIGITAL** (тексты из `SITE.about`, ссылка на `/about`) → Services → Featured Projects → **KarmaRent CRM** (выделенный блок с реальными скриншотами из `public/cases/rideflow/` и ссылками на живые площадки `rideflow.ac.vn`, `karmarentsite.duckdns.org`; скриншоты — демо-данные) → **Technologies** (5 групп: Frontend/Backend/AI/Integrations/Infra, только реально используемый стек) → Process → **Why Choose DS DIGITAL** (6 проверяемых преимуществ, без пустых обещаний) → Reviews → FAQ → **Calculator** (перенесён на позицию §6.13) → **AI Consultant** (§6.14, кнопка открывает плавающий виджет через событие `ds:ai-open`; секция рендерится только при `aiEnabled`) → Contact → форма заявки → Footer.
- Навигация (§3.2): добавлен **About** (`/ru|en/about`) в шапку и бургер-меню.
- Блоки **Preloader/About/Technologies/Why/AI** добавлены в `lib/content/site.ts` (RU+EN) и стилизованы в `app/proto.css`; адаптив `about-grid` ≤900px.
- Проверено на `localhost:3001` (Docker): порядок `about > services > projects > karma > technologies > process > why > reviews > faq > calc > ai > contact > lead`, EN-версия отдаётся, горизонтальной прокрутки нет, консоль без ошибок, первый визит показывает/скрывает прелоадер, повторный — пропускает, кнопка AI открывает виджет.
- Supabase: health `{"status":"ok","db":"ok"}`, данные из БД (7 услуг, 38 правил калькулятора), вход в админку как OWNER работает, форма AI-провайдера отображается, `/api/admin/ai-provider` и `/test` отвечают (тест с невалидным ключом Google корректно вернул 502).
- `npm run typecheck`, `npm run lint`, `npm test -- --run` (**64/64**) и `npm run build` — чисто.

### AI-ассистент: подключение API из админки (21.11.2026)

- `/admin/settings` → секция «AI-ассистент: подключение API» (`components/admin/AiProviderForm.tsx`). Провайдеры: **скрипт без внешнего API** (по умолчанию, бесплатно), **Google Gemini** (OpenAI-совместимый endpoint, бесплатный ключ Google AI Studio) и **свой/OpenAI-совместимый API** (Ollama, LM Studio, vLLM и т.п. на своём ПК). Есть поле базового URL, модели, ключа, температуры и кнопка «Проверить подключение» до сохранения.
- API: `GET/PUT /api/admin/ai-provider` и `POST /api/admin/ai-provider/test` (право `settings`). API-ключ хранится в отдельном ключе `Setting.ai-provider`, в ответах админки заменяется маской (`••••abcd`) и **не попадает** в публичный `getSiteSettings()`.
- `/api/ai/consult`: внешняя LLM вызывается только **после согласия** и только чтобы переформулировать ответ детерминированного сценария; шаги, согласие и создание заявки остаются на сервере. Системный промпт запрещает выдумывать цены, сроки, гарантии и кейсы. Таймаут 20 с, при любой ошибке — фолбэк на сценарий (`mode: "fallback"`). Запрещённых данных до согласия во внешний API не уходят.
- Рабочая модель: `gemini-3-flash-preview` (Google обновил бесплатные модели — `gemini-2.0-flash` и `2.5-flash` больше недоступны новым пользователям, `3.8-flash` отдавал 503). Ключ вставлен в кабинете и сохранён в `Setting.ai-provider`.
- **Индикатор связи**: `GET /api/admin/ai-provider/status` делает реальный тестовый запрос к провайдеру и отдает `connected`/`detail`. Бейдж на дашборде (`components/admin/AiStatusBadge.tsx`) и блок в форме настроек показывают «связь есть / нет связи» с причиной; обновление раз в 2 минуты.
- Маркировка «AI-ассистент» сохранена в виджете и на главной; текст обновлён под обе возможности (скрипт / подключённая модель).

### Блог SEO-статей (этап 9, 21.11.2026)

- Раздел `/ru/blog`, `/en/blog` и статьи `/{locale}/blog/{slug}`; контент хранится в `Article`/`ArticleTranslation` и правится в `/admin/articles` **без программиста** (RU/EN, статус, FAQ, SEO-поля). Пункт «SEO-статьи» в меню админки.
- Первые 5 статей (RU+EN): `site-development-cost`, `how-to-choose-a-developer`, `crm-for-small-business`, `ai-solutions-for-business`, `telegram-bot-for-leads`. Сид: `npm run seed:articles`. Все факты — только с сайта; там, где факта нет, стоит пометка «Проверить перед публикацией».
- Статическая витрина для GitHub Pages: `npm run pages:build` → `docs/`; Pages включён на `main:/docs`, адрес **https://sddigital26.github.io/DS-DIGITAL/** (проверено: `/ru/`, `/ru/blog/`, статьи, картинки и CSS → 200). Репозиторий публичный (GitHub Pages недоступен для приватных репозиториев на free-плане). В корне `docs/` есть `.nojekyll` — иначе Jekyll игнорирует папку `_next` и CSS отдаёт 404. На Pages нет API/БД, поэтому JS убирается, формы и админка работают только на полной версии. При добавлении новых статей нужно расширить список `ROUTES` в `scripts/build-gh-pages.mjs` и пересобрать витрину.
- FAQ Articles: `Article` + `ArticleTranslation` (миграция `add_articles`). В sitemap статьи добавлены с hreflang только по реально существующим переводам. На странице статьи — `Article` + `FAQPage` JSON-LD, canonical/hreflang/OG.

### Telegram-бот для заявок (21.11.2026)

- `/admin/settings` → секция «Telegram-бот для заявок» (`components/admin/TelegramBotForm.tsx`): токен бота, Chat ID/канал, включение бота и флаг уведомления о новых заявках, кнопка «Отправить тест».
- API: `GET/PUT /api/admin/telegram`, `POST /api/admin/telegram/test` (право `settings`). Токен хранится в `Setting.telegram`, в ответах — маска; приоритет БД над env (`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`), так что бот настраивается без деплоя.
- `lib/notifications.ts`: при новой заявке Telegram ставится в очередь только если бот включён и уведомления разрешены; иначе канал помечается `failed` с причиной. Заявка сохраняется независимо от доступности бота (best effort, ТЗ §14.3).

### Supabase (подготовка, 21.11.2026)

- Подключено 21.11.2026. Прямой хост `db.jgpzbbzaaklodpbyhpji.supabase.co` в этой сети недоступен (только IPv6 AAAA), поэтому используется **IPv4-сессионный пулер** `aws-1-ap-southeast-1.pooler.supabase.com:5432`, пользователь `postgres.jgpzbbzaaklodpbyhpji`, база `postgres`. Пароль хранится только в `.env` (в `.gitignore`).
- `lib/db.ts`: для supabase-хостов адаптер `PrismaPg` получает `ssl: { rejectUnauthorized: false }` — пулер отдаёт самоподписанный сертификат; для локального PostgreSQL это не включается.
- `docker-compose.yml` использует `DATABASE_URL_DOCKER` из `.env`, если он задан (иначе локальный PostgreSQL). Отдельная переменная нужна, потому что внутри контейнера `localhost` — сам контейнер.
- Выполнено: `npx prisma migrate deploy` (2 миграции), `npm run seed:content` (7 услуг RU+EN), `npm run seed:calculator` (38 правил RU+EN), `npm run seed:owner` (OWNER `d9955055556@gmail.com`).
- При сбросе/смене пароля БД: обновить обе строки в `.env`, затем `docker compose up -d --build`.

### Проверка после доработок (21.11.2026)

- Проверено локально: `npm run typecheck`, `npm run lint`, `npm test -- --run` (**64/64**), `npx prisma validate` и `npm run build` проходят. Legacy entrypoint мигрирован на `proxy.ts` для Next.js 16.
- AI-консультант остаётся бесплатным детерминированным сценарием без внешней LLM/API. Согласие спрашивается до ввода; ввод до согласия заменяется безопасным маркером, а подтверждение нормализуется до «да/yes». История после согласия восстанавливается по серверным сообщениям в БД; браузер использует случайную HttpOnly-cookie, в БД хранится её SHA-256. Создана миграция unique session key, но она **не применялась**; перед применением нужно проверить, что в целевой БД нет дубликатов `AiConversation.sessionKey`.
- Добавлены `/sitemap-index.xml`, `/sitemap-ru.xml`, `/sitemap-en.xml`; индекс ссылается на карты языков, которые строятся по опубликованным услугам/проектам и учитывают per-page `noindex`. `robots.txt` указывает на индекс.
- На страницах услуг добавлены breadcrumbs, локализованные названия секций и реальная ContactForm с выбранной услугой; ссылка на Privacy Policy добавлена рядом с обязательным согласием.
- Глобальный `noindex` по умолчанию включён, пока домен не согласован. Параметр можно изменить в настройках после принятия решения о домене.
- Эти локальные проверки не заменяют проверку миграции на staging, тест с реальной БД/уведомлениями, browser/mobile/Lighthouse QA и согласования владельца. Сайт не публиковался.

### Первый экран по прототипу `molnii` (20.11.2026)

Источник: `DS DIGITAL molnii— прототип первого экрана.html` (прислан заказчиком).
Перенесён 1:1 по структуре и эффектам; палитра не менялась.

- Hero: звёздный фон, 3D-орбита из трёх CSS-колец с параллаксом от курсора, печатающийся терминал в центре, слоган-тег, заголовок, подзаголовок, кнопки «Начать проект» / «Смотреть услуги», подсказка «Листайте вниз».
- Молния за курсором (`components/site/Lightning.tsx`): толстая цветная линия + тонкая белая, случайные ветвления, автоупрощение на медленных кадрах, только desktop, отключается при `prefers-reduced-motion`; на тач-устройствах — короткие импульсы.
- Карточки услуг (`components/site/ServiceCards.tsx`): 7 направлений, мини-визуализации (bars / messages / CRM / AI / flow / bot / api), 3D-наклон, раскрытие примера по клику и наведению, появление при прокрутке.
- Секция KarmaRent — честная заглушка (скриншотов и разрешения пока нет — `[С]`).
- Контакты: Telegram / WhatsApp / Email как в прототипе (без выдуманных ссылок) + кнопка «Оставить заявку» на реальную форму `/contact`.
- Шрифт прототипа Space Grotesk — self-hosted (`@fontsource-variable/space-grotesk`), без Google Fonts.
- Декоративные «призраки» кода (`components/site/GhostCode.tsx`) — aria-hidden, отключаются при reduced-motion и на слабых устройствах.

### Этапы 0–2

- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS 4.
- Дизайн-токены из ТЗ §5.1 (`app/globals.css`): `#080B14`, `#111827`, `#176BFF`, `#8B5CFF`, `#35D8FF`, `#A8B4C9` + рабочий токен `#4D8FFF` для мелкого текста (контраст — см. аудит P1-3, оттенок требует согласования).
- Многоязычность RU/EN: `/ru/…`, `/en/…`, автоопределение по Accept-Language при первом визите, сохранение выбора в cookie `ds_locale`, без повторного авто-переключения (ТЗ §15).
- Структура страниц: главная (Hero + 7 услуг + заготовки секций), обзор услуг, страницы услуг, портфолио, о студии, процесс, FAQ, контакты, калькулятор, privacy, terms, кастомная 404.
- SEO: canonical + hreflang + x-default, `robots.txt`, `sitemap-index.xml` с отдельными RU/EN sitemap и legacy `sitemap.xml`, OG-меты, title-шаблон.
- Пустые разделы — честные заглушки «контент готовится», без выдуманного контента (ТЗ §4).
- **Доступность (20.11.2026):** Lighthouse `/ru` и `/en` — Accessibility 100, Best Practices 100, SEO 100, без замечаний. **Категория Performance в этом прогоне не собиралась** (метрики LCP/INP/CLS ещё не замерялись — этап 9 плана). Исправлены два дефекта аудита P1-3/axe: логотип «DS DIGITAL» увеличен до 20px bold (крупный текст, порог контраста 3:1 вместо 4.5:1 — оттенок `#176BFF` не менялся, согласование `[С]` не требуется), у ссылки логотипа убран дублирующий `aria-label` (label-content-name-mismatch). Проверено: переполнения нет на 360/390/430 px.
- Docker: multi-stage Dockerfile (standalone output), `docker-compose.yml` (web + PostgreSQL 17).

### Этап 3 — backend / БД

- **Prisma 7.10.1 + PostgreSQL 17**: схема `prisma/schema.prisma` (контент, кейсы, услуги, FAQ, SEO, настройки, калькулятор, лиды, комментарии/история статусов, очередь уведомлений, AI-диалоги, пользователи/сессии/audit, rate limit). Миграция `prisma/migrations/20261119162931_init` применена. Prisma 7 подключается через driver adapter `@prisma/adapter-pg`.
- **`POST /api/leads`**: серверная валидация Zod → honeypot (тихий 202, ничего не сохраняется) → rate limit 5/мин по IP (PostgreSQL, не in-memory) → идемпотентность по заголовку `Idempotency-Key` (повтор возвращает тот же `id` + `duplicate: true`) → создание лида → **после коммита** постановка уведомлений.
- **Очередь уведомлений** (`lib/notifications.ts` + `NotificationLog`): все два канала фиксируются всегда — настроенный `pending`, ненастроенный `failed` с причиной (видно в CRM, что команда не получила уведомление). Retry — exponential backoff 1→2→4→8→16 мин, максимум 5 попыток, затем `failed`.
- **Адаптеры** `lib/integrations/{email,telegram}.ts`: ключи только серверные (никогда `NEXT_PUBLIC_*`), без провайдера — деградация с причиной, заявка при этом **всегда сохраняется**. Сам провайдер — пункт согласования `[С]`.
- **`GET /api/health`**: реальная проверка PostgreSQL (`SELECT 1`), 200/503, без раскрытия версий. Подключён как Docker healthcheck (на `127.0.0.1` — `localhost` резолвится в `::1` и даёт connection refused).
- **`POST /api/cron/notifications`**: обработка очереди, защищена `CRON_SECRET` (Bearer / `x-cron-secret`), без секрета — 401.
- **Авторизация** (`lib/auth.ts`): сессии в таблице `Session` + opaque HttpOnly-cookie `ds_session` (не JWT — выход отзывает немедленно), пароли scrypt + соль (`lib/password.ts`), блокировка после 5 неудачных попыток на 15 минут, роли `OWNER | ADMIN | EDITOR | MANAGER` с рейтингом. `POST /api/auth/login` (rate limit 5/мин, ответы не уточняют существование email) и `POST /api/auth/logout`.
- **Сидирование владельца**: `npm run seed:owner` — почта/пароль берутся только из окружения (`OWNER_EMAIL`, `OWNER_PASSWORD`), без `OWNER_PASSWORD` пароль генерируется и показывается один раз. Скрипт идемпотентен, при существующем OWNER ничего не меняет.
- **Тесты**: vitest, 64 теста — валидация сущностей, хеши паролей, матрица прав (§18), CSV-экспорт, калькулятор и AI fallback/consent.

### Этап 4 (частично): каркас админки + CRM заявок

Сделано (проверено фактическими запросами с реальной сессией):

- **Каркас**: `/admin/login` (форма входа, ошибки однотипны, rate limit 5/мин) и панель `/admin` с проверкой сессии в layout (PostgreSQL), внешним редиректом 307 в `proxy.ts` без cookie, навигацией с фильтром по правам, «скоро»-пунктами для нереализованных разделов, выходом (отзыв сессии). Интерфейс на русском, `robots noindex`.
- **Права по ТЗ §18** (`lib/permissions-matrix.ts` — чистый модуль, `lib/permissions.ts` — гарды): OWNER — всё; ADMIN — всё кроме пользователей; EDITOR — дашборд/контент/медиа; MANAGER — дашборд + заявки (просмотр/комментарии/статусы/экспорт). **Проверяется на сервере** — в layout каждой страницы и в каждом API (не только скрытие меню). Подтверждено: EDITOR получает 403 на смену статуса/комментарий/ретрай/экспорт, 401 без cookie.
- **Дашборд** `/admin`: заявки по статусам, всего, последние 6, счётчик недоставленных уведомлений.
- **Заявки** `/admin/leads`: список с фильтрами (статус/услуга/источник/поиск/даты), пагинация, экспорт CSV (тот же фильтр), ссылка в карточку.
- **Карточка** `/admin/leads/[id]`: контакты/параметры/UTM, описание, снимок калькулятора и диалог AI (если есть), смена статуса (с записью `LeadStatusHistory` и `AuditLog`), комментарии (автор/время), уведомления (статус, попытки, причина, кнопка ручного ретрая — 409, если провайдер не настроен), история статусов.
- **API**: `GET /api/admin/leads/export` (CSV, BOM для Excel, защита от CSV-инъекции, аудит `leads.export`), `PATCH /api/admin/leads/[id]`, `POST .../comments`, `POST .../notifications`.
- Все мутации пишут `AuditLog` без PII.

**Услуги — контент из БД (проверено: правка в админке → публичная страница обновилась без деплоя):**

- `npm run seed:content` заводит 7 направлений из брифа (`lib/services.ts` — структурный список, не контент); дальше источник истины — `Service` + `ServiceTranslation` в PostgreSQL.
- Админка: `/admin/services` (список, «Новая услуга») и `/admin/services/[id]` / `new` — форма с RU/EN-блоками (title, hero, problem, solution, benefits по строкам, SEO title/desc), slug, иконка, порядок, черновик/публикация. Право — `content`.
- API: `GET/POST /api/admin/services`, `GET/PATCH/DELETE /api/admin/services/[id]` (Zod-валидация slug/длин/языков, уникальность slug, upsert переводов, аудит `service.create/update/delete`, `revalidatePath` публичных страниц).
- Публичные страницы `/ru|en/services` и `/ru|en/services/[slug]` читают БД; черновики не показываются; страница услуги содержит данные из перевода, breadcrumbs, CTA, предзаполненную форму и переключатель доступных языков. Полный 12-блочный шаблон ещё не закрыт.
- Известное ограничение (осознанное): на динамических маршрутах (`/admin/*`, `/services/*`) Next 16 с `cacheComponents` отдаёт HTTP 200 с корректной 404-страницей в теле при неизвестном slug — статус 404 здесь недоступен без отказа от PPR/динамики. Произвольные пути (`/ru/bad-page`) по-прежнему дают настоящий 404. Точное решение — на этапе производительности (кэширование/ISR).

**Калькулятор, проекты и AI-консультант (20.11.2026, рабочее дерево):**

- Калькулятор: `/calculator` + секция на главной, правила в БД (`CalculatorRule`), редактор `/admin/calculator`, API `POST /api/calculator` (валидация selection, расчёт на сервере). Цены по умолчанию — `[С]`: без согласования калькулятор показывает «—» и не выдумывает суммы; наполнение — `npm run seed:calculator` после согласования.
- Проекты: `/projects` и `/projects/[slug]` читают опубликованные кейсы из БД; админка `/admin/projects`, API `/api/admin/projects`.
- Консультант: `app/api/ai/consult`, `lib/ai/fallback.ts` — бесплатный пошаговый сценарий без внешней LLM/API и токенных расходов. Согласие требуется до ввода данных, до этого введённый текст не сохраняется. В админке выключатель блокирует также прямые API-запросы. Это сценарный помощник, не генеративная модель; внешнего провайдера не используем. Серверная cookie-сессия и replay истории требуют применения новой миграции перед тестом на целевой БД.

Ещё не сделано (этап 4): разделы **Pages / Media / SEO / Users** — пункты в меню помечены «скоро».

**Отзывы (проверено фактическими запросами):**

- `/admin/testimonials` — список со статусами «опубликован / нет согласия / черновик», форма с языком, автором, текстом, аватаром, порядком.
- Жёсткий инвариант ТЗ §4.6/C-2 на сервере: публикация только при `approved = true` **и** зафиксированной дате согласия автора (`consentAt`). Проверено: `PATCH` с `approved: true, consentAt: null` → **400** с понятным сообщением; с датой → 200 и отзыв появился на `/ru/reviews`; снятие одобрения → отзыв исчез, вернулась честная заглушка; `DELETE` → 200. EN-страница не показывает RU-отзыв.
- Публичная `/ru|en/reviews` (в навигации и sitemap) — только отзывы с согласием; пустое состояние «выдуманные отзывы не размещаем».
- Права: MANAGER получает **403** на API (`/api/admin/testimonials`, `/api/admin/faq`, `/api/admin/services`), 401 без cookie; ссылки в его меню отсутствуют. Данные в HTML не утекают — в теле только `NEXT_REDIRECT;replace;/admin`.

**FAQ из БД (проверено):**

- `/admin/faq` — список и форма (язык, секция, вопрос, ответ, порядок, публикация); API `GET/POST /api/admin/faq`, `GET/PATCH/DELETE /api/admin/faq/[id]`, аудит `faq.create/update/delete`, `revalidatePath`.
- Публичная `/ru|en/faq` читает БД (`<details>`-аккордеон), черновики скрыты, пустое состояние — честная заглушка. Проверено: создание → вопрос/ответ на странице; `published: false` → вопрос скрыт, заглушка вернулась; пустой ответ → **400**; `DELETE` → 200.
- Общий модуль `lib/revalidate.ts` (услуги, отзывы, FAQ) вместо дублирования `revalidatePath` в роутах.

## Запуск (Docker)

```bash
cd D:\DS_DIGITAL
docker compose up -d --build
```

- Сайт: **http://localhost:3001** (порт 3000 занят другим dev-сервером — не трогать)
- PostgreSQL: `localhost:5433` (логин `ds` / пароль `ds_pass` / БД `ds_digital`)

Первичная инициализация БД (один раз; миграции применяются с хоста, где лежит `.env`):

```bash
npm run db:migrate        # применить миграции Prisma
npm run seed:owner        # создать первого OWNER (OWNER_EMAIL=... [OWNER_PASSWORD=...] npm run seed:owner)
npm run seed:content      # завести 7 услуг из брифа (идемпотентно; дальше правим в админке)
```

Проверка:

```bash
curl -I http://localhost:3001/          # 307 → /en (или /ru по cookie/Accept-Language)
curl -I http://localhost:3001/ru        # 200
curl -I http://localhost:3001/ru/bad-page  # 404 (кастомная)
curl -s http://localhost:3001/api/health    # {"status":"ok","db":"ok"}
docker compose ps                       # оба контейнера healthy
```

## Запуск (разработка без Docker)

```bash
npm install
npm run dev        # http://localhost:3000
```

## Скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | dev-сервер (порт 3000; если занят — `npm run dev -- -p 3002`) |
| `npm run build` | production-сборка |
| `npm run start` | запуск production-сборки |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript без emit |
| `npm test` | vitest (валидация лида, хеши паролей, матрица прав, CSV) |
| `npm run db:generate` | генерация Prisma-клиента (`lib/generated/`, не коммитится) |
| `npm run db:migrate` | применение миграций (прод) |
| `npm run db:migrate:dev` | миграции в dev-режиме |
| `npm run db:validate` | проверка схемы |
| `npm run seed:owner` | создание первого OWNER (креды только из окружения) |
| `npm run seed:content` | завести 7 услуг из брифа в БД (идемпотентно) |

## Структура

```
app/[locale]/        # ru | en: страницы, layout с hreflang
app/admin/           # логин + панель (дашборд, заявки)
app/api/leads        # POST — приём формы заявки
app/api/auth         # login/logout
app/api/admin/       # смена статуса, комментарии, ретрай, CSV-экспорт
app/api/cron         # обработка очереди уведомлений (CRON_SECRET)
app/api/health       # healthcheck (200/503 по доступности БД)
app/robots.ts        # robots.txt → sitemap-index.xml
app/sitemap.ts       # legacy sitemap.xml (оба языка)
app/sitemap-index.xml/ # sitemap index
app/sitemap-ru.xml/  # RU sitemap
app/sitemap-en.xml/  # EN sitemap
components/layout/   # PagePrimitives (заголовки/заглушки)
components/site/     # первый экран: шапка, hero-орбита, терминал, молния, карточки, призраки
components/sections/ # SectionPage (шаблоны секций)
components/admin/    # LoginForm, меню, формы статус/комментарий/ретрай
lib/content/site.ts  # тексты первого экрана + карточки услуг (из прототипа)
lib/i18n/            # config, словари ru/en, get-dictionary
lib/db.ts            # Prisma singleton (adapter @prisma/adapter-pg)
lib/roles.ts         # роли (чистая логика)
lib/permissions-matrix.ts # матрица прав (чистая логика, тестируется)
lib/permissions.ts   # гарды страниц/API (ТЗ §18)
lib/lead-filters.ts  # фильтры списка заявок (список + CSV)
lib/csv.ts           # CSV с BOM + защита от CSV-инъекции
lib/auth.ts          # сессии, вход/выход
lib/session-cookie.ts# имя сессионной cookie
lib/password.ts      # scrypt-хеши (используются и вне Next)
lib/rate-limit.ts    # окно rate limit на PostgreSQL
lib/notifications.ts # очередь уведомлений + exponential backoff
lib/integrations/    # адаптеры email / telegram (ключи серверные)
lib/validation/      # Zod-схемы (лид, услуга, отзыв, FAQ)
lib/revalidate.ts    # сброс кэша публичных страниц после правок в админке
lib/services.ts      # 7 направлений из брифа (источник для seed:content)
prisma/schema.prisma # схема PostgreSQL + миграции
scripts/seed-owner.ts# создание первого OWNER
scripts/seed-content.ts # первичное наполнение услуг (7 направлений)
tests/               # vitest
proxy.ts             # редиректы языка, 307 на /admin без cookie, определение locale
Dockerfile           # multi-stage, standalone
docker-compose.yml   # web:3001 + postgres:5433 (healthcheck на обоих)
.env.example         # шаблон переменных (секреты не коммитятся)
```

## API

| Метод | Путь | Назначение |
|---|---|---|
| `POST` | `/api/leads` | заявка: Zod → honeypot → rate limit 5/мин → идемпотентность → лид → очередь уведомлений |
| `POST` | `/api/auth/login` | вход в админку (rate limit 5/мин) |
| `POST` | `/api/auth/logout` | отзыв сессии |
| `PATCH` | `/api/admin/leads/[id]` | смена статуса (нужно право `leads`) |
| `POST` | `/api/admin/leads/[id]/comments` | комментарий (право `leads`) |
| `POST` | `/api/admin/leads/[id]/notifications` | ручной ретрай уведомлений (право `leads`) |
| `GET` | `/api/admin/leads/export` | CSV-экспорт с текущими фильтрами (право `leads_export`) |
| `GET` / `POST` | `/api/admin/services` | список / создание услуги (право `content`) |
| `GET` / `PATCH` / `DELETE` | `/api/admin/services/[id]` | карточка / правка / удаление услуги (право `content`) |
| `GET` / `POST` | `/api/admin/testimonials` | список / создание отзыва (право `content`) |
| `GET` / `PATCH` / `DELETE` | `/api/admin/testimonials/[id]` | карточка / правка / удаление отзыва (право `content`) |
| `GET` / `POST` | `/api/admin/faq` | список / создание вопроса FAQ (право `content`) |
| `GET` / `PATCH` / `DELETE` | `/api/admin/faq/[id]` | карточка / правка / удаление вопроса (право `content`) |
| `POST` | `/api/cron/notifications` | обработка очереди (нужен `CRON_SECRET`) |
| `GET` | `/api/health` | проверка процесса и PostgreSQL |

## Следующие этапы (Док.4)

- **Этап 4 (продолжение):** CRUD оставшихся разделов админки — Pages / Media / SEO / Users; для Media сначала согласовать хранилище.
- **Этап 5 (продолжение):** 12-блочный шаблон страницы услуги (сейчас закрыто ~6 блоков); внести только подтверждённый контент/кейсы, затем подготовить изолированное демо после разрешения. Из главной остались заглушки по согласованиям: KarmaRent-скриншоты, цены калькулятора, контакты.
- **Этап 6:** приёмочное тестирование уже реализованных молнии/3D и режимов Full/Lite/Static на браузерах и устройствах, включая reduced motion и performance budgets.
- **Этап 7:** калькулятор (нужны стартовые цены — согласование).
- **Этап 8:** AI-консультант работает в бесплатном scripted fallback; проверка хранения/TTL и consent на целевой БД ещё нужна.

## Открытые вопросы (пометки [С] в ТЗ)

Полный список — Док.1 §7. Блокирующие для этапов 4+:
почтовый провайдер и Telegram-бот ·
цены калькулятора · контактные данные · реквизиты и юртексты · список реальных кейсов ·
согласие на публичную демонстрацию KarmaRent · оттенок синего для мелкого текста.
Внешний AI-провайдер и бюджет не нужны для согласованного бесплатного scripted fallback; вернуться к этому вопросу только если владелец отдельно захочет генеративную LLM.

OWNER-аккаунт DS DIGITAL создан (email у пользователя), пароль показан один раз при создании.
