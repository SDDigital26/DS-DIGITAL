# DS DIGITAL — сайт международной Digital Development Studio

BUILD. AUTOMATE. SCALE.

Проект создан с нуля по комплекту документов в `D:\RideFlowCRM\DS_DIGITAL_TZ\`
(Док.1 Аудит · Док.2 Финальное ТЗ · Док.3 Архитектура · Док.4 План · Док.5 Чек-лист).

## Текущий статус (20.11.2026)

**Этапы 0–3 плана выполнены, этап 4 — в работе (готов CRM заявок и каркас админки).**

### Этапы 0–2

- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS 4.
- Дизайн-токены из ТЗ §5.1 (`app/globals.css`): `#080B14`, `#111827`, `#176BFF`, `#8B5CFF`, `#35D8FF`, `#A8B4C9` + рабочий токен `#4D8FFF` для мелкого текста (контраст — см. аудит P1-3, оттенок требует согласования).
- Многоязычность RU/EN: `/ru/…`, `/en/…`, автоопределение по Accept-Language при первом визите, сохранение выбора в cookie `ds_locale`, без повторного авто-переключения (ТЗ §15).
- Структура страниц: главная (Hero + 7 услуг + заготовки секций), обзор услуг, 7 страниц услуг, портфолио, о студии, процесс, FAQ, контакты, калькулятор, privacy, terms, кастомная 404.
- SEO: canonical + hreflang + x-default, `robots.txt`, `sitemap.xml` (34 URL), OG-меты, title-шаблон.
- Пустые разделы — честные заглушки «контент готовится», без выдуманного контента (ТЗ §4).
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
- **Тесты**: vitest, 27 тестов — валидация лида, хеши паролей, матрица прав (§18), CSV-экспорт.

### Этап 4 (частично): каркас админки + CRM заявок

Сделано (проверено фактическими запросами с реальной сессией):

- **Каркас**: `/admin/login` (форма входа, ошибки однотипны, rate limit 5/мин) и панель `/admin` с проверкой сессии в layout (PostgreSQL), внешним редиректом 307 в middleware без cookie, навигацией с фильтром по правам, «скоро»-пунктами для нереализованных разделов, выходом (отзыв сессии). Интерфейс на русском, `robots noindex`.
- **Права по ТЗ §18** (`lib/permissions-matrix.ts` — чистый модуль, `lib/permissions.ts` — гарды): OWNER — всё; ADMIN — всё кроме пользователей; EDITOR — дашборд/контент/медиа; MANAGER — дашборд + заявки (просмотр/комментарии/статусы/экспорт). **Проверяется на сервере** — в layout каждой страницы и в каждом API (не только скрытие меню). Подтверждено: EDITOR получает 403 на смену статуса/комментарий/ретрай/экспорт, 401 без cookie.
- **Дашборд** `/admin`: заявки по статусам, всего, последние 6, счётчик недоставленных уведомлений.
- **Заявки** `/admin/leads`: список с фильтрами (статус/услуга/источник/поиск/даты), пагинация, экспорт CSV (тот же фильтр), ссылка в карточку.
- **Карточка** `/admin/leads/[id]`: контакты/параметры/UTM, описание, снимок калькулятора и диалог AI (если есть), смена статуса (с записью `LeadStatusHistory` и `AuditLog`), комментарии (автор/время), уведомления (статус, попытки, причина, кнопка ручного ретрая — 409, если провайдер не настроен), история статусов.
- **API**: `GET /api/admin/leads/export` (CSV, BOM для Excel, защита от CSV-инъекции, аудит `leads.export`), `PATCH /api/admin/leads/[id]`, `POST .../comments`, `POST .../notifications`.
- Все мутации пишут `AuditLog` без PII.

Ещё не сделано (этап 4): разделы **Projects / Services / Testimonials / Pages / Media / SEO / Settings / Users** — пункты в меню помечены «скоро», CRUD по этим сущностям появится следующими срезами.
- Ограничение сейчас осознанно: админка уже приносит пользу (заявка → обработка → экспорт), но это не весь объём §17.

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

## Структура

```
app/[locale]/        # ru | en: страницы, layout с hreflang
app/admin/           # логин + панель (дашборд, заявки)
app/api/leads        # POST — приём формы заявки
app/api/auth         # login/logout
app/api/admin/       # смена статуса, комментарии, ретрай, CSV-экспорт
app/api/cron         # обработка очереди уведомлений (CRON_SECRET)
app/api/health       # healthcheck (200/503 по доступности БД)
app/robots.ts        # robots.txt
app/sitemap.ts       # sitemap.xml (оба языка)
components/layout/   # Header, Footer, LocaleSwitcher, PagePrimitives
components/sections/ # SectionPage (шаблоны секций)
components/admin/    # LoginForm, меню, формы статус/комментарий/ретрай
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
lib/validation/      # Zod-схемы
lib/services.ts      # 7 направлений (ТЗ §8)
prisma/schema.prisma # схема PostgreSQL + миграции
scripts/seed-owner.ts# создание первого OWNER
tests/               # vitest
middleware.ts        # редиректы языка, 307 на /admin без cookie, определение locale
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
| `POST` | `/api/cron/notifications` | обработка очереди (нужен `CRON_SECRET`) |
| `GET` | `/api/health` | проверка процесса и PostgreSQL |

## Следующие этапы (Док.4)

- **Этап 4 (продолжение):** CRUD разделов админки — Projects / Services / Testimonials / Pages / Media / SEO / Settings / Users.
- **Этап 5:** контент главной/услуг/кейсов + демо.
- **Этап 6:** молния за курсором, 3D, режимы Full/Lite/Static.
- **Этап 7:** калькулятор (нужны стартовые цены — согласование).
- **Этап 8:** AI-консультант (нужен провайдер — согласование).

## Открытые вопросы (пометки [С] в ТЗ)

Полный список — Док.1 §7. Блокирующие для этапов 4+:
почтовый провайдер и Telegram-бот ·
AI-провайдер и бюджет · цены калькулятора ·
контактные данные · реквизиты и юртексты · список реальных кейсов ·
согласие на публичную демонстрацию KarmaRent · оттенок синего для мелкого текста.

OWNER-аккаунт DS DIGITAL создан (email у пользователя), пароль показан один раз при создании.
