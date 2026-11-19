# DS DIGITAL — сайт международной Digital Development Studio

BUILD. AUTOMATE. SCALE.

Проект создан с нуля по комплекту документов в `D:\RideFlowCRM\DS_DIGITAL_TZ\`
(Док.1 Аудит · Док.2 Финальное ТЗ · Док.3 Архитектура · Док.4 План · Док.5 Чек-лист).

## Текущий статус (20.11.2026)

**Этапы 0–3 плана выполнены** (инфраструктура · дизайн-система · каркас · backend/БД).

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
- **Тесты**: vitest, 15 тестов — валидация лида (honeypot/согласие/контакт/длины) и хеширование паролей.

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
| `npm test` | vitest (валидация лида, хеши паролей) |
| `npm run db:generate` | генерация Prisma-клиента (`lib/generated/`, не коммитится) |
| `npm run db:migrate` | применение миграций (прод) |
| `npm run db:migrate:dev` | миграции в dev-режиме |
| `npm run db:validate` | проверка схемы |
| `npm run seed:owner` | создание первого OWNER (креды только из окружения) |

## Структура

```
app/[locale]/        # ru | en: страницы, layout с hreflang
app/api/leads        # POST — приём формы заявки
app/api/auth         # login/logout
app/api/cron         # обработка очереди уведомлений (CRON_SECRET)
app/api/health       # healthcheck (200/503 по доступности БД)
app/robots.ts        # robots.txt
app/sitemap.ts       # sitemap.xml (оба языка)
components/layout/   # Header, Footer, LocaleSwitcher, PagePrimitives
components/sections/ # SectionPage (шаблоны секций)
lib/i18n/            # config, словари ru/en, get-dictionary
lib/db.ts            # Prisma singleton (adapter @prisma/adapter-pg)
lib/auth.ts          # сессии, роли, вход/выход
lib/password.ts      # scrypt-хеши (используются и вне Next)
lib/rate-limit.ts    # окно rate limit на PostgreSQL
lib/notifications.ts # очередь уведомлений + exponential backoff
lib/integrations/    # адаптеры email / telegram (ключи серверные)
lib/validation/      # Zod-схемы
lib/services.ts      # 7 направлений (ТЗ §8)
prisma/schema.prisma # схема PostgreSQL + миграции
scripts/seed-owner.ts# создание первого OWNER
tests/               # vitest
middleware.ts        # редиректы языка, определение locale
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
| `POST` | `/api/cron/notifications` | обработка очереди (нужен `CRON_SECRET`) |
| `GET` | `/api/health` | проверка процесса и PostgreSQL |

## Следующие этапы (Док.4)

- **Этап 4:** админка `/admin` (список заявок, статусы, комментарии, контент).
- **Этап 5:** контент главной/услуг/кейсов + демо.
- **Этап 6:** молния за курсором, 3D, режимы Full/Lite/Static.
- **Этап 7:** калькулятор (нужны стартовые цены — согласование).
- **Этап 8:** AI-консультант (нужен провайдер — согласование).

## Открытые вопросы (пометки [С] в ТЗ)

Полный список — Док.1 §7. Блокирующие для этапов 4+:
учётная запись первого OWNER · почтовый провайдер и Telegram-бот ·
AI-провайдер и бюджет · цены калькулятора ·
контактные данные · реквизиты и юртексты · список реальных кейсов ·
согласие на публичную демонстрацию KarmaRent · оттенок синего для мелкого текста.
