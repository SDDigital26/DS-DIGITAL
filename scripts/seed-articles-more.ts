import "dotenv/config";
import { db } from "../lib/db";

/** Остальные статьи из первых пяти (этап 9): CRM, AI, Telegram-боты. */

type T = { title: string; excerpt: string; body: string; seoTitle: string; seoDesc: string; faq: { q: string; a: string }[] };
type Seed = { slug: string; sort: number; ru: T; en: T };

const SEEDS: Seed[] = [
  {
    slug: "crm-for-small-business",
    sort: 3,
    ru: {
      title: "CRM для малого бизнеса: зачем она нужна и как выбрать",
      excerpt: "Когда таблиц уже недостаточно: как CRM помогает учитывать заявки, клиентов и финансы — на примере реального проекта.",
      seoTitle: "CRM для малого бизнеса — DS DIGITAL",
      seoDesc: "Узнайте, зачем малому бизнесу CRM и как выбрать систему. Пример реальной CRM от DS DIGITAL. Обсудите задачу.",
      body: `## CRM для малого бизнеса: зачем она нужна

CRM для малого бизнеса нужна в момент, когда данные о клиентах перестают помещаться в таблице и голове. Заявки теряются, никто не помнит, кто и когда вернёт технику, а выручку считают вручную. В DS DIGITAL мы разрабатываем CRM-системы под бизнес-процессы компании — направление [CRM Development](/ru/services/crm-development).

## Признаки, что пора внедрять CRM

- заявки приходят из нескольких каналов и не все попадают в учёт;
- повторные обращения требуют долгих поисков истории;
- финансы и аренда считаются в разных файлах;
- сотрудники тратят время на рутинное заполнение таблиц.

## Что даёт CRM на примере KarmaRent

Наш реальный проект — [KarmaRent CRM / RIDEFLOW](/ru/projects): CRM для управления арендой. В ней есть календарь занятости, оплаты и залоги, договоры с подписью гостя, аналитика и прибыль, GPS-мониторинг техники и Telegram-бот бронирования. Это не презентация — на сайте опубликованы скриншоты интерфейса на демонстрационных данных.

## Как выбрать CRM

Сначала опишите процесс: что вы продаёте, как приходят заявки, какие данные нужно хранить. Затем сравните готовые решения и разработку под заказ. Готовое решение быстрее, но не всегда подходит под ваши процессы — тогда мы собираем систему под задачу.

## Интеграции

CRM полезна только тогда, когда данные попадают в неё автоматически. Мы подключаем формы сайта, уведомления в email и Telegram, а также внешние сервисы через API. Подробнее — [API-интеграции](/ru/services/api-integrations).

## Сколько стоит внедрение

Точную стоимость мы фиксируем после обсуждения состава работ. Для ориентира используйте [калькулятор](/ru/calculator), затем [напишите нам](/ru/contact) с описанием процесса.

_______

**Проверить перед публикацией:** разрешение на публичный показ кейса KarmaRent; состав функций CRM — только по факту работающего продукта.`,
      faq: [
        { q: "Когда малому бизнесу нужна CRM?", a: "Когда заявки приходят из нескольких каналов, история клиентов теряется, а учёт ведётся в таблицах." },
        { q: "Какая CRM есть у DS DIGITAL?", a: "Мы разрабатываем CRM под процессы компании. Пример — KarmaRent CRM / RIDEFLOW для управления арендой." },
        { q: "Можно ли подключить сайт к CRM?", a: "Да, формы сайта и уведомления связываются с CRM через API и Telegram-бота." },
        { q: "Как узнать стоимость?", a: "Используйте калькулятор для ориентира и напишите нам с описанием процесса для точного предложения." },
      ],
    },
    en: {
      title: "CRM for small business: why you need it and how to choose",
      excerpt: "When spreadsheets are no longer enough: how CRM helps track leads, clients and finances — with a real project example.",
      seoTitle: "CRM for small business — DS DIGITAL",
      seoDesc: "Learn why a small business needs CRM and how to choose one. See a real CRM built by DS DIGITAL. Get in touch.",
      body: `## CRM for small business: why it matters

CRM for small business becomes necessary when customer data no longer fits in a spreadsheet and your head. Leads get lost, nobody remembers who returns the vehicle and when, and revenue is counted manually. At DS DIGITAL we build CRM systems tailored to company processes — see [CRM Development](/en/services/crm-development).

## Signs it is time to adopt CRM

- leads arrive from several channels and not all are recorded;
- repeat enquiries require a long search through history;
- finances and rentals are tracked in different files;
- staff spend time filling in spreadsheets.

## What CRM delivers: the KarmaRent example

Our real project — [KarmaRent CRM / RIDEFLOW](/en/projects): a CRM for rental management. It includes an occupancy calendar, payments and deposits, contracts with guest e-signature, analytics and profit, GPS vehicle tracking and a Telegram booking bot. This is not a presentation — the site publishes interface screenshots on demo data.

## How to choose a CRM

First describe the process: what you sell, how leads arrive, what data must be stored. Then compare off-the-shelf solutions with custom development. A ready-made product is faster, but may not fit your processes — then we build a system around the task.

## Integrations

A CRM is useful only when data flows into it automatically. We connect site forms, email and Telegram notifications, and external services via API. See [API integrations](/en/services/api-integrations).

## Implementation cost

The exact price is fixed after we agree the scope. Use the [calculator](/en/calculator) for an estimate, then [contact us](/en/contact) with a description of your process.

_______

**Check before publication:** permission for public display of the KarmaRent case; feature list — only from the actually working product.`,
      faq: [
        { q: "When does a small business need CRM?", a: "When leads arrive from several channels, customer history is lost and accounting is done in spreadsheets." },
        { q: "What CRM has DS DIGITAL built?", a: "We build CRM systems tailored to company processes. One example is KarmaRent CRM / RIDEFLOW for rental management." },
        { q: "Can our website be connected to the CRM?", a: "Yes, site forms and notifications are wired to the CRM via API and a Telegram bot." },
        { q: "How much does it cost?", a: "Use the calculator for an estimate and contact us with your process description for an exact proposal." },
      ],
    },
  },
  {
    slug: "ai-solutions-for-business",
    sort: 4,
    ru: {
      title: "ИИ-решения для бизнеса: где они реально помогают",
      excerpt: "Где ИИ полезен, а где достаточно обычной автоматизации. Честный разбор без обещаний и выдуманных цифр.",
      seoTitle: "ИИ-решения для бизнеса — DS DIGITAL",
      seoDesc: "Разберитесь, где ИИ помогает бизнесу, а где хватит автоматизации. Обсудите задачу с DS DIGITAL и рассчитайте стоимость.",
      body: `## ИИ-решения для бизнеса: без магии и обещаний

ИИ-решения для бизнеса сегодня обсуждают везде, но владельцу компании важно простое: что это даёт и сколько стоит. В DS DIGITAL мы подходим к ИИ как к инструменту — направление [AI Solutions](/ru/services/ai-solutions). Мы не обещаем заменить сотрудников и не публикуем выдуманных цифр.

## Где ИИ действительно полезен

ИИ полезен там, где нужно обработать много однотипной информации: классификация заявок, подготовка ответов, поиск по документам, помощь клиенту с выбором услуги. Всё это можно связать с вашими процессами и формами.

## Где достаточно автоматизации

Если задача сводится к фиксированным правилам — например, заявка из формы должна попасть в CRM и уведомление в Telegram — языковая модель не нужна. Эту работу надёжнее делает [автоматизация бизнес-процессов](/ru/services/business-automation).

## Наш подход к AI-ассистенту

На сайте DS DIGITAL работает AI-ассистент. По умолчанию он использует бесплатный пошаговый сценарий без внешних сервисов. При желании в админке можно подключить провайдера через API — например, Google Gemini или свой OpenAI-совместимый сервер. Важно: согласие, шаги и создание заявки выполняются на сервере, а модель может только переформулировать ответы и не называет цены и сроки.

## Безопасность и честность

Мы не передаём данные во внешний API до согласия пользователя. Если провайдер недоступен, ассистент возвращается к сценарию. Это позволяет использовать ИИ без риска для заявок.

## Как начать

Опишите задачу и скажите, какие данные нужно обработать. Мы поможем выбрать: сценарий, ИИ или обычная интеграция. Для ориентира — [калькулятор стоимости](/ru/calculator), для обсуждения — [контакты](/ru/contact).

_______

**Проверить перед публикацией:** состав подключённых ИИ-провайдеров и условия их использования — только по факту настроенного подключения.`,
      faq: [
        { q: "Заменяет ли ИИ сотрудников?", a: "Нет, мы рассматриваем ИИ как инструмент для рутинных задач: классификация, черновики ответов, помощь клиенту." },
        { q: "Нужен ли ИИ для связки формы и CRM?", a: "Обычно нет — достаточно автоматизации по правилам. ИИ имеет смысл при обработке неструктурированной информации." },
        { q: "Передаёте ли вы данные в сторонние API?", a: "Только после согласия пользователя и только при подключённом провайдере. До согласия работает локальный сценарий." },
        { q: "Как обсудить ИИ-задачу?", a: "Напишите нам описание задачи — мы подскажем, какой подход подходит: сценарий, ИИ или интеграция." },
      ],
    },
    en: {
      title: "AI solutions for business: where they actually help",
      excerpt: "Where AI is useful and where plain automation is enough. An honest breakdown with no promises or invented numbers.",
      seoTitle: "AI solutions for business — DS DIGITAL",
      seoDesc: "See where AI helps business and where automation is enough. Discuss your task with DS DIGITAL and estimate the cost.",
      body: `## AI solutions for business: no magic, no promises

AI solutions for business are discussed everywhere, but what matters to an owner is simple: what it delivers and what it costs. At DS DIGITAL we treat AI as a tool — see [AI Solutions](/en/services/ai-solutions). We do not promise to replace staff or publish invented numbers.

## Where AI genuinely helps

AI helps when there is a lot of repetitive information to process: lead classification, draft replies, document search, helping a client pick a service. All of this can be wired into your processes and forms.

## Where automation is enough

If the task follows fixed rules — for example, a form submission must enter the CRM and trigger a Telegram notification — a language model is unnecessary. [Business automation](/en/services/business-automation) handles it more reliably.

## Our approach to the AI assistant

The DS DIGITAL site has an AI assistant. By default it runs a free step-by-step script with no external services. Optionally, an admin can connect a provider via API — for example Google Gemini or your own OpenAI-compatible server. Consent, steps and request creation happen on the server; the model may only rephrase replies and never quotes prices or deadlines.

## Safety and honesty

We do not send data to an external API before user consent. If the provider is unavailable, the assistant falls back to the script. That lets you use AI without risking leads.

## How to start

Describe the task and the data involved. We will help choose: a script, AI or a plain integration. For an estimate use the [cost calculator](/en/calculator); to discuss — [contact us](/en/contact).

_______

**Check before publication:** the list of connected AI providers and their usage terms — only from actually configured connections.`,
      faq: [
        { q: "Does AI replace staff?", a: "No, we treat AI as a tool for routine tasks: classification, reply drafts and helping clients choose." },
        { q: "Do I need AI to connect a form to a CRM?", a: "Usually not — rule-based automation is enough. AI makes sense for unstructured information." },
        { q: "Do you send data to third-party APIs?", a: "Only after user consent and only with a connected provider. Before consent, a local script runs." },
        { q: "How do I discuss an AI task?", a: "Contact us with a task description — we will advise whether a script, AI or an integration fits." },
      ],
    },
  },
  {
    slug: "telegram-bot-for-leads",
    sort: 5,
    ru: {
      title: "Telegram-бот для заявок: зачем бизнесу и как подключить",
      excerpt: "Как бот принимает заявки и отправляет уведомления в канал, чтобы лиды не терялись. Без обещаний и выдуманных цифр.",
      seoTitle: "Telegram-бот для заявок — DS DIGITAL",
      seoDesc: "Узнайте, зачем бизнесу Telegram-бот для заявок и как подключить уведомления в канал. Обсудите задачу с DS DIGITAL.",
      body: `## Telegram-бот для заявок: простыми словами

Telegram-бот для заявок нужен, чтобы лиды не терялись. Когда форма на сайте отправляет сообщение в чат или канал, команда видит обращение сразу и не зависит от почты. В DS DIGITAL направление [Telegram Bots & Mini Apps](/ru/services/telegram-bots) включает ботов и мини-приложения.

## Как это работает

Последовательность простая: посетитель заполняет форму → заявка сохраняется в CRM → уведомление уходит в Telegram и на email. Мы связываем формы, уведомления и процессы так, чтобы заявки не терялись и не обрабатывались вручную. Если канал недоступен, заявка всё равно остаётся в системе — уведомления работают по принципу best effort.

## Где использовать бота

Бот подходит для уведомлений команды о новых заявках, для связи с клиентами и для бронирования. В уже упомянутом проекте [KarmaRent CRM / RIDEFLOW](/ru/projects) есть Telegram-бот бронирования — это реальная функция работающего продукта.

## Настройка без программиста

В админке DS DIGITAL есть раздел с настройками Telegram-бота: токен, чат или канал, включение и отправка тестового сообщения. Изменения применяются сразу, без деплоя. Токен хранится на сервере и не показывается на сайте.

## Что важно проверить

Убедитесь, что бот добавлен в канал администратором и что уведомления о заявках включены. Если канал не настроен, в CRM будет видно, что уведомление не доставлено — но сама заявка сохранится.

## Стоимость

Точная стоимость зависит от состава работ и фиксируется до старта. Для ориентира — [калькулятор](/ru/calculator). Чтобы обсудить задачу — [напишите нам](/ru/contact).

_______

**Проверить перед публикацией:** факт наличия и условия использования Telegram-бота в кейсе KarmaRent; токен и канал — только по факту настроенного подключения.`,
      faq: [
        { q: "Что делает Telegram-бот для заявок?", a: "Отправляет уведомление о новой заявке в чат или канал, чтобы команда видела обращение сразу." },
        { q: "Теряются ли заявки, если бот недоступен?", a: "Нет — заявка сохраняется в CRM, а уведомление помечается как недоставленное." },
        { q: "Можно ли настроить бота самому?", a: "Да, в админке есть поля для токена, чата и тестовой отправки; изменения применяются без деплоя." },
        { q: "Есть ли бот в ваших проектах?", a: "Да, в KarmaRent CRM / RIDEFLOW есть Telegram-бот бронирования — по факту работающего продукта." },
      ],
    },
    en: {
      title: "Telegram bot for leads: why you need it and how to connect",
      excerpt: "How a bot receives leads and sends notifications to a channel so nothing gets lost. No promises, no invented numbers.",
      seoTitle: "Telegram bot for leads — DS DIGITAL",
      seoDesc: "Learn why a business needs a Telegram bot for leads and how to connect channel notifications. Talk to DS DIGITAL.",
      body: `## Telegram bot for leads, in plain words

A Telegram bot for leads keeps enquiries from getting lost. When a site form sends a message to a chat or channel, the team sees the enquiry immediately and does not depend on email. At DS DIGITAL, [Telegram Bots & Mini Apps](/en/services/telegram-bots) covers bots and mini apps.

## How it works

The flow is simple: a visitor fills the form → the lead is saved in the CRM → a notification goes to Telegram and email. We wire forms, notifications and processes so leads are neither lost nor handled manually. If a channel is unavailable, the lead still stays in the system — notifications work on a best-effort basis.

## Where to use a bot

A bot works for team notifications about new leads, customer communication and booking. In the already mentioned [KarmaRent CRM / RIDEFLOW](/en/projects) case there is a Telegram booking bot — a real feature of a working product.

## Setup without a programmer

The DS DIGITAL admin panel has a Telegram bot section: token, chat or channel, enable flag and a test send button. Changes apply immediately, without deployment. The token is stored on the server and never shown on the site.

## What to check

Make sure the bot is added to the channel as admin and lead notifications are enabled. If the channel is not configured, the CRM will show that the notification was not delivered — but the lead itself is saved.

## Cost

The exact price depends on scope and is fixed before the start. For an estimate use the [calculator](/en/calculator); to discuss — [contact us](/en/contact).

_______

**Check before publication:** the fact and terms of the Telegram bot in the KarmaRent case; token and channel — only from actually configured connections.`,
      faq: [
        { q: "What does a Telegram lead bot do?", a: "It sends a notification about a new lead to a chat or channel so the team sees it immediately." },
        { q: "Are leads lost if the bot is down?", a: "No — the lead is saved in the CRM and the notification is marked as undelivered." },
        { q: "Can I set it up myself?", a: "Yes, the admin panel has fields for the token, chat and a test send; changes apply without deployment." },
        { q: "Do you have a bot in your projects?", a: "Yes, KarmaRent CRM / RIDEFLOW has a Telegram booking bot — based on the actually working product." },
      ],
    },
  },
];

async function main() {
  for (const seed of SEEDS) {
    const existing = await db.article.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    const common = { status: "published" as const, publishedAt: new Date("2026-11-21T09:00:00Z"), sort: seed.sort };
    if (existing) {
      await db.article.update({
        where: { id: existing.id },
        data: {
          ...common,
          translations: {
            upsert: (["ru", "en"] as const).map((locale) => {
              const s = seed[locale];
              return {
                where: { articleId_locale: { articleId: existing.id, locale } },
                create: { locale, ...s, faq: s.faq as never },
                update: { ...s, faq: s.faq as never },
              };
            }),
          },
        },
      });
      console.log(`[seed] обновлена: ${seed.slug}`);
    } else {
      await db.article.create({
        data: {
          slug: seed.slug,
          ...common,
          translations: {
            create: (["ru", "en"] as const).map((locale) => {
              const s = seed[locale];
              return { locale, ...s, faq: s.faq as never };
            }),
          },
        },
      });
      console.log(`[seed] создана: ${seed.slug}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("[seed:articles-more]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
