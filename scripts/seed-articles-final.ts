import "dotenv/config";
import { db } from "../lib/db";

/** Остальные статьи этапа 9 ТЗ: всего должно быть 10 публикаций RU+EN. */

type T = {
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDesc: string;
  faq: { q: string; a: string }[];
};
type Seed = { slug: string; sort: number; ru: T; en: T };

const SEEDS: Seed[] = [
  {
    slug: "website-or-web-app",
    sort: 6,
    ru: {
      title: "Сайт или веб-приложение: как понять, что нужно именно вам",
      excerpt: "Чем сайт отличается от веб-приложения, какие задачи решает каждое решение и как выбрать без лишних затрат.",
      seoTitle: "Сайт или веб-приложение — DS DIGITAL",
      seoDesc: "Разбираем разницу между сайтом и веб-приложением: задачи, пользователи, стоимость и сроки. Поможем выбрать формат.",
      body: `## В чём разница

Сайт в первую очередь **рассказывает**: представляет компанию, услуги, кейсы и контакты. Веб-приложение в первую очередь **делает**: пользователь логинится, вводит данные, получает результат — например, личный кабинет, CRM или сервис записи.

Граница размытая: современный сайт может быть интерактивным, а веб-приложение — иметь публичную витрину. Но по главной задаче различие остаётся.

## Когда достаточно сайта

- вам нужно присутствие в поиске и понятный путь к заявке;
- контент меняется редко (услуги, цены, кейсы, контакты);
- никаких 개인ных кабинетов и сложных сценариев пока нет;
- важны скорость запуска и предсказуемый бюджет.

В DS DIGITAL такие проекты собираются на современном стеке: Next.js, React, TypeScript, с адаптивной вёрсткой и понятной структурой разделов. Подробнее — [разработка сайтов](/ru/services/web-development).

## Когда нужно веб-приложение

- у пользователей есть аккаунты и разные роли;
- нужно хранить и обрабатывать данные (заявки, заказы, документы);
- сценарий повторяется каждый день, а не раз в полгода;
- required интеграции с платёжными системами, API или CRM.

Пример — [CRM-системы](/ru/services/crm-development): заявки, клиенты, финансы и уведомления в одном месте. Такое решение нельзя заменить статичной страницей.

## Гибрид: сайт + приложение

Часто разумнее начать с сайта с формой заявки и подключить CRM на бэкенде: посетитель оставляет заявку, она попадает в систему, команда получает уведомление в Telegram. Это даёт основную пользу приложения без полной сложности на старте.

## Как выбрать

Ответьте на три вопроса:

1. Что пользователь должен **сделать** на странице — оставить заявку или выполнить повторяющееся действие?
2. Нужны ли аккаунты и разделение прав?
3. Какие данные придётся хранить и кто их будет обновлять?

Если на все три вопроса «простой ответ» — начинайте с сайта. Если есть роли, данные и повторяющиеся сценарии — проектируйте приложение.

## Стоимость и сроки

Точную стоимость фиксируем после обсуждения состава работ. Для ориентира используйте [калькулятор](/ru/calculator), затем [напишите нам](/ru/contact) с описанием задачи.`,
      faq: [
        { q: "Чем веб-приложение отличается от сайта?", a: "Сайт в основном информирует, приложение позволяет пользователю выполнять повторяющиеся действия: входить в аккаунт, вводить данные и получать результат." },
        { q: "Можно ли начать с сайта, а потом добавить приложение?", a: "Да. Обычно начинают с сайта и формы заявки, а затем подключают CRM и личный кабинет по мере появления задач." },
        { q: "Нужна ли CRM небольшой компании?", a: "Если заявки приходят из нескольких каналов и важно не терять историю — да. Иначе достаточно сайта с формой и уведомлениями." },
        { q: "Как узнать стоимость?", a: "Используйте калькулятор для ориентира и опишите задачу через форму обратной связи — точное предложение готовим после обсуждения." },
      ],
    },
    en: {
      title: "Website or web app: how to choose the right format",
      excerpt: "How a website differs from a web app, which problems each solves, and how to choose without overspending.",
      seoTitle: "Website or web app — DS DIGITAL",
      seoDesc: "We compare websites and web apps: goals, users, cost and timeline. DS DIGITAL helps you pick the right format.",
      body: `## The difference

A website primarily **informs**: it presents a company, services, cases and contacts. A web app primarily **does**: a user signs in, enters data and gets a result — a dashboard, CRM or booking service.

The line is blurry: a modern site can be interactive and an app can have a public landing page. But the main purpose stays different.

## When a website is enough

- you need search visibility and a clear path to an enquiry;
- content changes rarely (services, prices, cases, contacts);
- no accounts or complex scenarios yet;
- speed of launch and a predictable budget matter.

At DS DIGITAL such projects are built with a modern stack — Next.js, React, TypeScript — with responsive layout and a clear structure. See [web development](/en/services/web-development).

## When you need a web app

- users have accounts and different roles;
- you need to store and process data (leads, orders, documents);
- the same scenario repeats daily, not twice a year;
- you need integrations with payments, APIs or CRM.

A good example is [CRM development](/en/services/crm-development): leads, clients, finances and notifications in one place. A static page cannot replace it.

## Hybrid: site plus app

Often it is smarter to start with a site and a lead form, with a CRM on the backend: a visitor submits the form, the lead is stored and the team gets a Telegram notification. You get the main benefit of an app without the full complexity at launch.

## How to choose

Answer three questions:

1. What should the user **do** — leave an enquiry or perform a repeatable action?
2. Do you need accounts and permissions?
3. What data must be stored and who updates it?

If all answers are simple, start with a website. If you have roles, data and repeatable workflows — design an app.

## Cost and timeline

We fix the exact price after discussing the scope. Use the [calculator](/en/calculator) for an estimate, then [contact us](/en/contact) with a short description.`,
      faq: [
        { q: "What is the difference between a web app and a website?", a: "A website mainly informs, while an app lets users perform repeatable actions: sign in, enter data and get a result." },
        { q: "Can we start with a site and add an app later?", a: "Yes. Most teams start with a site and lead form, then add CRM and a dashboard as needs appear." },
        { q: "Does a small business need CRM?", a: "If leads come from several channels and you need to keep history — yes. Otherwise a site with a form and notifications may be enough." },
        { q: "How much does it cost?", a: "Use the calculator for an estimate and send a short brief via the contact form — we prepare an exact quote after discussion." },
      ],
    },
  },
  {
    slug: "mvp-launch",
    sort: 7,
    ru: {
      title: "MVP: как запустить продукт быстро и не переплатить",
      excerpt: "Что такое MVP на практике, как выбрать обязательный функционал и какие ошибки чаще всего увеличивают бюджет.",
      seoTitle: "MVP: быстрый запуск продукта — DS DIGITAL",
      seoDesc: "Как запустить MVP, выбрать обязательный функционал и проверить гипотезу без лишних затрат. Разбор от DS DIGITAL.",
      body: `## MVP — это не «плохой продукт»

Минимально жизнеспособный продукт содержит ровно то, что нужно, чтобы проверить главную гипотезу. Он не должен быть красивым во всех деталях, но должен **работать** и давать измеримый результат.

Цель MVP — ответить на вопрос: будут ли пользователи реально пользоваться решением и платить за него. Всё остальное — потом.

## С чего начать

Сформулируйте гипотезу одним предложением: «Если мы сделаем X, то пользователи смогут Y». Затем определите метрику: заявки, повторные визиты, количество созданных записей.

Дальше опишите самый короткий путь пользователя от входа до результата. Всё, что не участвует в этом пути, в первую версию не попадает.

## Как урезать scope без вреда

- замените авторизацию через сложную систему на простой вход на первом этапе;
- используйте готовые сервисы для email и уведомлений вместо собственных модулей;
- оставьте ручную обработку там, где объём небольшой;
- не делайте личный кабинет, если достаточно одной формы.

Важно: «урезать» нельзя качество кода и безопасность. Экономия на архитектуре оборачивается дорогой переделкой.

## Пример из практики

Наш проект [RIDEFLOW](/ru/projects) — CRM для управления арендой. В ней календарь занятости, оплаты и залоги, договоры, аналитика, GPS-мониторинг и Telegram-бот. Это рабочий продукт со снимками интерфейса на демонстрационных данных.

Мы не выдумываем функции «на будущее»: в публикациях описывается только то, что реально работает.

## Что делать после запуска

Соберите обратную связь, посмотрите метрику и решите: развивать гипотезу или менять её. Хороший MVP не старается угодить всем — он даёт быстрое и честное «да» или «нет».

## Стоимость

Точная стоимость зависит от состава работ и фиксируется до старта. Ориентир даёт [калькулятор](/ru/calculator), детальный разговор — через [контакты](/ru/contact).`,
      faq: [
        { q: "Что входит в MVP?", a: "Только функционал, необходимый для проверки главной гипотезы, и измеримая метрика успеха." },
        { q: "Можно ли потом дорабатывать продукт?", a: "Да. Код и архитектуру сразу делают расширяемыми, чтобы новые функции добавлялись без полной переделки." },
        { q: "Экономит ли MVP деньги?", a: "Да, если не экономить на качестве: вы проверяете идею до того, как вкладываетесь в полный функционал." },
        { q: "Сколько стоит MVP?", a: "Зависит от сценария. Ориентир — калькулятор, точную цифру называем после обсуждения задачи." },
      ],
    },
    en: {
      title: "MVP: how to launch fast without overspending",
      excerpt: "What an MVP really is, how to cut scope and which mistakes most often inflate the budget.",
      seoTitle: "MVP: fast product launch — DS DIGITAL",
      seoDesc: "Learn how to launch an MVP, choose must-have features and test a hypothesis without extra spend. By DS DIGITAL.",
      body: `## MVP is not a "bad product"

A minimum viable product contains exactly what is needed to test the core hypothesis. It does not have to be perfect in every detail, but it must **work** and produce a measurable result.

The goal is to answer one question: will people actually use the solution and pay for it? Everything else comes later.

## Where to start

Write the hypothesis in one sentence: "If we build X, users will be able to Y". Then define a metric: enquiries, repeat visits, records created.

Next, describe the shortest user path from entry to result. Anything outside that path does not go into the first version.

## How to cut scope safely

- replace a complex login with a simple one at the first stage;
- use ready-made services for email and notifications instead of custom modules;
- keep manual processing where volume is small;
- skip the dashboard if one form is enough.

What you must not cut is code quality and security. Saving on architecture turns into an expensive rewrite later.

## A real example

Our project [RIDEFLOW](/en/projects) is a CRM for rental management: occupancy calendar, payments and deposits, contracts, analytics, GPS tracking and a Telegram booking bot. It is a working product with interface screenshots on demo data.

We do not invent "future" features: our publications describe only what actually works.

## After launch

Collect feedback, check the metric, then decide: develop the hypothesis or change it. A good MVP does not try to please everyone — it gives a fast, honest yes or no.

## Cost

The exact price depends on scope and is fixed before the start. Use the [calculator](/en/calculator) for an estimate and [contact us](/en/contact) for details.`,
      faq: [
        { q: "What goes into an MVP?", a: "Only the features needed to test the main hypothesis, plus a measurable success metric." },
        { q: "Can the product be extended later?", a: "Yes. Code and architecture are built to be extendable so new features do not require a full rewrite." },
        { q: "Does an MVP save money?", a: "Yes, if you do not save on quality: you test the idea before investing in the full feature set." },
        { q: "How much does an MVP cost?", a: "It depends on the scenario. The calculator gives an estimate; we name the exact figure after discussing the task." },
      ],
    },
  },
  {
    slug: "ux-for-conversion",
    sort: 8,
    ru: {
      title: "UX, который продаёт: 7 правил интерфейса для сайта компании",
      excerpt: "Как упростить путь посетителя к заявке: структура, скорость, формы, мобильная версия и понятные тексты.",
      seoTitle: "UX для сайта компании — DS DIGITAL",
      seoDesc: "Семь практических правил UX, которые помогают посетителю быстрее оставить заявку. Разбор от DS DIGITAL.",
      body: `## 1. Одно главное действие на экране

Первый экран должен отвечать на три вопроса: что вы делаете, кому помогаете и что делать дальше. Одна заметная кнопка («Обсудить проект») работает лучше пяти равнозначных ссылок.

## 2. Короткий путь к заявке

Форма из трёх полей конвертирует лучше, чем из десяти. Оставьте имя, контакт и короткое описание задачи. Всё остальное можно уточнить в переписке.

## 3. Мобильная версия — не «уменьшенная»

На телефоне важно не только уменьшить шрифт: кнопки должны быть не мельче 44 px, отступы — комфортными, а меню — простым. Мы проверяем сайт на реальных устройствах и убираем горизонтальную прокрутку.

## 4. Скорость — часть UX

Тяжёлые анимации и большие изображения заставляют посетителя уйти. Фон-эффекты должны быть лёгкими: мы ограничиваем частоту кадров, выключаем их вне вьюпорта и не гоняем тяжёлые фильтры на мобильных.

## 5. Понятные тексты вместо канцелярита

«Заполните форму для связи» хуже, чем «Расскажите о задаче — ответим в течение дня». Глаголы и конкретика работают лучше общих слов.

## 6. Доказательства рядом с решением

Кейсы, отзывы и скриншоты интерфейса располагайте рядом с описанием услуги. Важно публиковать только реальные проекты и получать согласие на показ.

## 7. Доступность

Контраст текста, видимый фокус, семантическая разметка и корректные атрибуты форм нужны не только для людей с ограничениями — они улучшают сайт для всех и помогают поисковикам.

## Проверка перед запуском

Пройдите путь посетителя сами: зайдите на сайт с телефона, найдите услугу, отправьте заявку. Если на каком-то шаге приходится думать — значит, этот шаг нужно упростить.

Подробнее о разработке — [создание сайтов](/ru/services/web-development), для ориентира по бюджету — [калькулятор](/ru/calculator).`,
      faq: [
        { q: "Сколько полей должно быть в форме заявки?", a: "Оптимально три: имя, контакт и краткое описание задачи. Остальное уточняется в переписке." },
        { q: "Почему важна скорость сайта?", a: "Медленная загрузка и тяжёлые эффекты увеличивают отказ: посетитель уходит до того, как увидит предложение." },
        { q: "Что проверять в мобильной версии?", a: "Размеры кнопок, отсутствие горизонтальной прокрутки, читаемость текста и удобство меню." },
        { q: "Помогает ли UX конверсии?", a: "Да: чем короче путь к заявке и понятнее тексты, тем больше посетителей превращаются в обращения." },
      ],
    },
    en: {
      title: "UX that converts: 7 interface rules for a company website",
      excerpt: "How to shorten the path to an enquiry: structure, speed, forms, mobile layout and clear copy.",
      seoTitle: "UX for a company website — DS DIGITAL",
      seoDesc: "Seven practical UX rules that help visitors submit an enquiry faster. By DS DIGITAL.",
      body: `## 1. One primary action per screen

The first screen should answer three questions: what you do, who you help and what to do next. One prominent button ("Discuss a project") works better than five equal links.

## 2. A short path to enquiry

A three-field form converts better than a ten-field one. Keep name, contact and a short description. Everything else can be clarified in conversation.

## 3. Mobile is not a "shrunk" version

On a phone it is not enough to reduce the font: buttons should be at least 44 px, spacing comfortable and the menu simple. We test on real devices and remove horizontal scrolling.

## 4. Speed is part of UX

Heavy animations and large images make visitors leave. Background effects must be light: we cap frame rate, pause them off-screen and avoid heavy filters on mobile.

## 5. Clear copy instead of jargon

"Tell us about your task — we'll reply within a day" works better than "Submit the contact form". Verbs and specifics beat generic phrases.

## 6. Proof next to the claim

Place cases, testimonials and interface screenshots next to the service description. Publish only real projects and get consent for showing them.

## 7. Accessibility

Text contrast, visible focus, semantic markup and correct form attributes help not only people with limitations — they improve the site for everyone and help search engines.

## Pre-launch check

Walk the visitor path yourself: open the site on a phone, find a service, send an enquiry. If you have to think at any step, simplify it.

More about development — [web development](/en/services/web-development); for a budget estimate — [calculator](/en/calculator).`,
      faq: [
        { q: "How many fields should a contact form have?", a: "Three is optimal: name, contact and a short description. The rest is clarified in conversation." },
        { q: "Why does site speed matter?", a: "Slow loading and heavy effects increase drop-off: visitors leave before seeing the offer." },
        { q: "What to check in the mobile version?", a: "Button sizes, no horizontal scrolling, readable text and an easy menu." },
        { q: "Does UX affect conversion?", a: "Yes: the shorter the path to enquiry and the clearer the copy, the more visitors become leads." },
      ],
    },
  },
  {
    slug: "api-integrations-guide",
    sort: 9,
    ru: {
      title: "Интеграции API: как связать сайт, CRM и внешние сервисы",
      excerpt: "Какие задачи решают интеграции, как подготовить данные и почему важны логи и обработка ошибок.",
      seoTitle: "API-интеграции для бизнеса — DS DIGITAL",
      seoDesc: "Как связать сайт, CRM и внешние сервисы через API: этапы, риски и проверки. Разбор от DS DIGITAL.",
      body: `## Зачем нужны интеграции

Интеграция убирает ручное копирование данных. Заявка с сайта попадает в CRM, CRM отправляет уведомление в Telegram, а статус заказа синхронизируется с внешним сервисом. Каждая лишняя ручная операция — это время и ошибки.

## Какие бывают сценарии

- **Сайт → CRM**: заявка из формы сразу становится лидом.
- **CRM → мессенджер**: уведомление команде о новой заявке.
- **Сайт → платёжный сервис**: создание платежа и получение статуса.
- **CRM → аналитика**: выгрузка данных для отчётов.

Направление [API-интеграций](/ru/services/api-integrations) в DS DIGITAL включает подключение внешних сервисов и внутренних систем.

## Подготовка: что решить до разработки

1. Какие данные передаются и в каком формате?
2. Что делать, если сервис недоступен?
3. Кто владеет ключами доступа и где они хранятся?
4. Нужна ли проверка подписи или IP-адреса отправителя?

Токены и пароли хранятся только на сервере и никогда не попадают в публичный код страницы.

## Надёжность важнее скорости

Хорошая интеграция:
- повторяет запрос при временной ошибке;
- пишет лог неудачной отправки;
- показывает оператору, что заявка сохранена, даже если уведомление не дошло;
- не блокирует страницу сайта, если внешний сервис медленно отвечает.

В админке DS DIGITAL можно указать токен бота, чат и кнопку тестовой отправки — изменения применяются без деплоя. Ключ остаётся на сервере и не отображается на сайте.

## Проверка перед запуском

Отправьте тестовую заявку с сайта, проверьте создание записи в CRM, получение уведомления и корректность полей. Затем проверьте случай ошибки: отключите канал и убедитесь, что данные не потерялись.

## Стоимость

Состав работ фиксируется после обсуждения. Ориентир — [калькулятор](/ru/calculator), подробности — [контакты](/ru/contact).`,
      faq: [
        { q: "Что даёт интеграция сайта с CRM?", a: "Заявка попадает в систему автоматически, без ручного копирования, и команда сразу получает уведомление." },
        { q: "Что будет, если внешний сервис недоступен?", a: "Заявка сохраняется, неудачная отправка попадает в лог, а система показывает статус оператору." },
        { q: "Где хранятся ключи доступа?", a: "Только на сервере. В публичный код и разметку страницы они не попадают." },
        { q: "Как проверить интеграцию перед запуском?", a: "Отправить тестовую заявку и отдельно проверить сценарий ошибки — данные должны сохраняться даже без уведомления." },
      ],
    },
    en: {
      title: "API integrations: connecting a site, CRM and external services",
      excerpt: "Which problems integrations solve, how to prepare data and why logs and error handling matter.",
      seoTitle: "API integrations for business — DS DIGITAL",
      seoDesc: "How to connect a website, CRM and external services via API: steps, risks and checks. By DS DIGITAL.",
      body: `## Why integrate

Integration removes manual copying. A form lead goes straight into CRM, CRM sends a Telegram notification and order status syncs with an external service. Every extra manual step costs time and creates errors.

## Common scenarios

- **Site → CRM**: a form submission becomes a lead immediately.
- **CRM → messenger**: the team is notified about a new lead.
- **Site → payment provider**: payment creation and status updates.
- **CRM → analytics**: data export for reports.

DS DIGITAL's [API integrations](/en/services/api-integrations) cover external services and internal systems.

## Preparation: decide before development

1. What data is transferred and in which format?
2. What happens if the service is down?
3. Who owns access keys and where are they stored?
4. Is signature or IP verification needed?

Tokens and passwords live on the server only and never appear in public page code.

## Reliability over speed

A good integration:
- retries a request on a temporary error;
- logs a failed delivery;
- tells the operator the lead was saved even if the notification failed;
- does not block the site page when a third-party service is slow.

In the DS DIGITAL admin panel you can set the bot token, chat and a test-send button — changes apply without deployment. The key stays on the server and is not shown on the site.

## Pre-launch check

Send a test enquiry from the site, verify the CRM record, the notification and the field values. Then test the failure case: disable the channel and make sure data is not lost.

## Cost

Scope is fixed after discussion. Use the [calculator](/en/calculator) for an estimate and [contact us](/en/contact) for details.`,
      faq: [
        { q: "What does a site-to-CRM integration give?", a: "Enquiries are stored automatically with no manual copying, and the team is notified immediately." },
        { q: "What if an external service is down?", a: "The lead is saved, the failed send is logged and the operator sees the status." },
        { q: "Where are access keys stored?", a: "On the server only. They never appear in public code or page markup." },
        { q: "How to test before launch?", a: "Send a test enquiry and separately test the failure case — data must be kept even without notification." },
      ],
    },
  },
  {
    slug: "site-support-after-launch",
    sort: 10,
    ru: {
      title: "Поддержка сайта после запуска: что входит и зачем она нужна",
      excerpt: "Обновления, мониторинг, резервные копии и правки контента — что делать с сайтом после релиза.",
      seoTitle: "Поддержка сайта после запуска — DS DIGITAL",
      seoDesc: "Что входит в поддержку сайта: мониторинг, бэкапы, обновления и правки. Практические советы от DS DIGITAL.",
      body: `## Запуск — не конец

Сайт работает в изменяющейся среде: обновляются браузеры, библиотеки и требования поисковиков. Без регулярного внимания даже хороший проект постепенно стареет.

## Что делает поддержка

- **Мониторинг**: доступность, ошибки, время ответа.
- **Обновления**: зависимости и исправления безопасности.
- **Резервные копии**: база данных и файлы, с возможностью восстановления.
- **Правки контента**: новые кейсы, цены, тексты — в админке без деплоя.
- **Мелкие доработки**: формы, интерактивные блоки, исправления вёрстки.

## Контент и код — разные задачи

В DS DIGITAL проекты, отзывы, FAQ, статьи, правила калькулятора и настройки'effects меняются из кабинета администратора: это не требует пересборки. Изменения в логике и дизайне— задача разработки, и они проходят через проверки и выкладку.

Такое разделение удобно: контент обновляется быстро, а код остаётся управляемым.

## Почему важны бэкапы

Ошибка в базе, неудачное обновление или человеческий фактор — всё это восстанавливается гораздо быстрее, если есть свежая копия и отработанный план восстановления. Проверяйте восстановление, а не только создание копий.

## Признаки, что пора заняться сайтом

- страницы открываются дольше, чем раньше;
- в консоли браузера появляются ошибки;
- форма заявки иногда не отправляет данные;
- мобильная версия «поехала» после обновления контента.

## Что можно сделать сейчас

Проверьте [калькулятор](/ru/calculator), форму контакта и мобильную версию. Если замечаете проблемы — [напишите нам](/ru/contact) с описанием: по схеме «где», «когда», «что произошло».

Точная стоимость поддержки зависит от состава работ и фиксируется после обсуждения.`,
      faq: [
        { q: "Что входит в поддержку сайта?", a: "Мониторинг, обновления, бэкапы, правки контента и мелкие доработки по согласованному списку." },
        { q: "Можно ли менять тексты без разработчика?", a: "Да. Проекты, отзывы, FAQ, статьи и настройки меняются в админке без пересборки сайта." },
        { q: "Зачем нужны резервные копии?", a: "Они позволяют быстро восстановить сайт после ошибки в данных или неудачного обновления." },
        { q: "Как сообщить о проблеме?", a: "Опишите, где и когда она возникает и что проявляется — через форму контакта." },
      ],
    },
    en: {
      title: "Website support after launch: what it includes and why it matters",
      excerpt: "Updates, monitoring, backups and content edits — what to do with a site after release.",
      seoTitle: "Website support after launch — DS DIGITAL",
      seoDesc: "What website support includes: monitoring, backups, updates and content edits. Practical advice from DS DIGITAL.",
      body: `## Launch is not the end

A website runs in a changing environment: browsers, libraries and search requirements update. Even a good project ages without regular attention.

## What support covers

- **Monitoring**: availability, errors, response time.
- **Updates**: dependencies and security fixes.
- **Backups**: database and files, with a restore path.
- **Content edits**: new cases, prices, texts — in the admin panel without deployment.
- **Small improvements**: forms, interactive blocks, layout fixes.

## Content and code are different jobs

At DS DIGITAL, projects, testimonials, FAQ, articles, calculator rules and effects settings are edited in the admin panel — no rebuild needed. Changes to logic and design are development tasks that go through checks and deployment.

This split is convenient: content updates fast while code stays controlled.

## Why backups matter

A database error, a failed update or human mistake is recovered much faster when you have a fresh copy and a rehearsed restore plan. Test restoring, not just creating backups.

## Signs it is time to act

- pages load slower than before;
- browser console shows errors;
- the contact form sometimes fails to submit;
- mobile layout broke after a content update.

## What you can do now

Check the [calculator](/en/calculator), the contact form and the mobile version. If you notice problems, [contact us](/en/contact) with a short description: where, when and what happened.

The exact support cost depends on scope and is fixed after discussion.`,
      faq: [
        { q: "What does website support include?", a: "Monitoring, updates, backups, content edits and small improvements from an agreed list." },
        { q: "Can I edit texts without a developer?", a: "Yes. Projects, testimonials, FAQ, articles and settings are edited in the admin panel without a rebuild." },
        { q: "Why do I need backups?", a: "They let you restore the site quickly after a data error or a failed update." },
        { q: "How do I report a problem?", a: "Describe where and when it happens and what you see — via the contact form." },
      ],
    },
  },
];

async function main() {
  for (const seed of SEEDS) {
    const existing = await db.article.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    const common = { status: "published" as const, publishedAt: new Date("2026-11-22T09:00:00Z"), sort: seed.sort };
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
    console.error("[seed:articles-final]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
