# DS DIGITAL — сайт международной Digital Development Studio

BUILD. AUTOMATE. SCALE.

Проект создан с нуля по комплекту документов в `D:\RideFlowCRM\DS_DIGITAL_TZ\`
(Док.1 Аудит · Док.2 Финальное ТЗ · Док.3 Архитектура · Док.4 План · Док.5 Чек-лист).

## Текущий статус (19.11.2026)

**Этапы 0–2 плана выполнены** (инфраструктура · дизайн-система · каркас):

- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS 4.
- Дизайн-токены из ТЗ §5.1 (`app/globals.css`): `#080B14`, `#111827`, `#176BFF`, `#8B5CFF`, `#35D8FF`, `#A8B4C9` + рабочий токен `#4D8FFF` для мелкого текста (контраст — см. аудит P1-3, оттенок требует согласования).
- Многоязычность RU/EN: `/ru/…`, `/en/…`, автоопределение по Accept-Language при первом визите, сохранение выбора в cookie `ds_locale`, без повторного авто-переключения (ТЗ §15).
- Структура страниц: главная (Hero + 7 услуг + заготовки секций), обзор услуг, 7 страниц услуг, портфолио, о студии, процесс, FAQ, контакты, калькулятор, privacy, terms, кастомная 404.
- SEO: canonical + hreflang + x-default, `robots.txt`, `sitemap.xml` (34 URL), OG-меты, title-шаблон.
- Пустые разделы — честные заглушки «контент готовится», без выдуманного контента (ТЗ §4).
- Docker: multi-stage Dockerfile (standalone output), `docker-compose.yml` (web + PostgreSQL 17).
- Проверено локально: `npm run lint`, `npm run typecheck`, `npm run build` — чисто.

## Запуск (Docker)

```bash
cd D:\DS_DIGITAL
docker compose up -d --build
```

- Сайт: **http://localhost:3001** (порт 3000 занят другим dev-сервером — не трогать)
- PostgreSQL: `localhost:5433` (логин `ds` / пароль `ds_pass` / БД `ds_digital`)

Проверка:

```bash
curl -I http://localhost:3001/          # 307 → /en (или /ru по cookie/Accept-Language)
curl -I http://localhost:3001/ru        # 200
curl -I http://localhost:3001/ru/bad-page  # 404 (кастомная)
```

## Запуск (разработка без Docker)

```bash
npm install
npm run dev        # http://localhost:3000
```

## Скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run build` | production-сборка |
| `npm run start` | запуск production-сборки |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript без emit |
| `npm test` | тесты (заглушка: тестов пока нет) |

## Структура

```
app/[locale]/        # ru | en: страницы, layout с hreflang
app/robots.ts        # robots.txt
app/sitemap.ts       # sitemap.xml (оба языка)
components/layout/   # Header, Footer, LocaleSwitcher, PagePrimitives
components/sections/ # SectionPage (шаблоны секций)
lib/i18n/            # config, словари ru/en, get-dictionary
lib/services.ts      # 7 направлений (ТЗ §8)
middleware.ts        # редиректы языка, определение locale
Dockerfile           # multi-stage, standalone
docker-compose.yml   # web:3001 + postgres:5433
.env.example         # шаблон переменных (секреты не коммитятся)
```

## Следующие этапы (Док.4)

- **Этап 3:** Prisma-схема, авторизация, API лидов, уведомления (после согласования почты/Telegram).
- **Этап 4:** админка `/admin`.
- **Этап 5:** контент главной/услуг/кейсов + демо.
- **Этап 6:** молния за курсором, 3D, режимы Full/Lite/Static.
- **Этап 7:** калькулятор (нужны стартовые цены — согласование).
- **Этап 8:** AI-консультант (нужен провайдер — согласование).

## Открытые вопросы (пометки [С] в ТЗ)

Полный список — Док.1 §7. Блокирующие для этапов 3+:
почтовый провайдер и Telegram-бот · AI-провайдер и бюджет · цены калькулятора ·
контактные данные · реквизиты и юртексты · список реальных кейсов ·
согласие на публичную демонстрацию KarmaRent · оттенок синего для мелкого текста.
