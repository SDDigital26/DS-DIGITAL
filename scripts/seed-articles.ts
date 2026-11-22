import "dotenv/config";
import { db } from "../lib/db";

/**
 * Сид SEO-статей (этап 9, Док.4). Первые 5 — самый высокий коммерческий потенциал.
 * Все факты — только с сайта DS DIGITAL; нет факта — пометка «проверить» (ТЗ Док.2 §4).
 * Повторный запуск обновляет существующие slug (источник правки — админка).
 */

type ArticleSeed = {
  slug: string;
  sort: number;
  ru: { title: string; excerpt: string; body: string; seoTitle: string; seoDesc: string; faq: { q: string; a: string }[] };
  en: { title: string; excerpt: string; body: string; seoTitle: string; seoDesc: string; faq: { q: string; a: string }[] };
};

const ARTICLES: ArticleSeed[] = [
  {
    slug: "site-development-cost",
    sort: 1,
    ru: {
      title: "Сколько стоит разработка сайта в 2026 году: честный разбор",
      excerpt: "Разбираем, из чего складывается стоимость сайта, что входит в работу и как получить точную цифру до старта проекта.",
      seoTitle: "Сколько стоит разработка сайта — DS DIGITAL",
      seoDesc: "Узнайте, из чего складывается стоимость сайта: состав работ, этапы и сроки. Рассчитайте бюджет в калькуляторе DS DIGITAL.",
      body: `## Сколько стоит разработка сайта: с чего начать оценку

Вопрос «сколько стоит разработка сайта» почти всегда означает одно: владелец бизнеса хочет понять, какой бюджет готовить и что получит за деньги. ������� ответ — без состава работ назвать цифру нельзя. В DS DIGITAL мы фиксируем состав, этапы и сроки до старта и показываем промежуточные результаты на каждом этапе. Ниже — прозрачная логика оценки, чтобы вы могли подготовиться к разговору с подрядчиком.

## Что влияет на стоимость сайта

Стоимость разработки сайта складывается из нескольких факторов. Мы не называем цены без согласования — точные правила расчёта выставляет калькулятор и в коммерческом предложении. Но сама структура одинакова для любого проекта.

### Тип сайта

Корпоративный сайт, лендинг и интернет-магазин — разные задачи. В DS DIGITAL к направлению [разработки сайтов](/ru/services/web-development) относят корпоративные сайты, лендинги и интернет-магазины. Чем больше типовых страниц и интеграций, тем больше работы.

### Объём контента и языков

Сайт работает на двух языках — RU и EN. Для каждого языка нужны переводы, мета-теги и проверка текстов. Если вы планируете публиковать статьи, учтите затраты на ведение блога: в нашей [админке](/ru/contact) статьи редактируются без программиста.

### Интеграции и заявки

Отдельная статья расходов — подключение форм к CRM и уведомлениям. Мы связываем формы, уведомления и процессы так, чтобы заявки не терялись и не обрабатывались вручную. Подробнее — в разделе [API-интеграций](/ru/services/api-integrations).

### Дизайн и эффекты

Стиль сайта задаётся дизайн-системой. В DS DIGITAL есть три режима эффектов: full, lite и static. Выбор режима влияет на трудоёмкость, но не на доступность: сайт проверен на WCAG AA и работает без горизонтальной прокрутки.

## Что входит в работу DS DIGITAL

Мы берём задачу целиком: от требований до запуска и передачи доступов с инструкциями. Процесс состоит из пяти шагов: знакомство, ТЗ и план, дизайн, разработка, запуск. На каждом этапе вы видите результат и можете вносить правки.

## Как получить точную цифру

Самый быстрый путь — открыть [калькулятор стоимости](/ru/calculator): он учитывает тип проекта, сложность и дополнительные опции. Калькулятор даёт ориентир, а точную стоимость фиксируем в предложении после обсуждения задачи.

Если хотите обсудить задачу напрямую — [напишите нам](/ru/contact). Опишите, что должен делать сайт и какие системы нужно подключить.

## Частые ошибки при оценке бюджета

Первая ошибка — ориентироваться на цену «шаблона» без учёта интеграций. Вторая — забыть про контент на двух языках. Третья — не заложить поддержку после запуска: мы остаёмся на связи, и правки не заканчиваются вместе с релизом.

## Почему не называем цену в статье

Потому что не хотим вводить в заблуждение. У нас нет подтверждённых публичных цен, и мы не публикуем выдуманные цифры. Вместо этого мы показываем структуру оценки и даём инструмент для расчёта. Это и есть честный подход, который мы применяем и в статье [«Как выбрать подрядчика»](/ru/blog/how-to-choose-a-developer).

_______

**Проверить перед публикацией:** конкретные цифры стоимости и сроков, указанные заказчиком (в тексте намеренно отсутствуют).`,
      faq: [
        { q: "Почему вы не указываете точную цену в статье?", a: "Потому что стоимость зависит от состава работ. Мы фиксируем состав, этапы и сроки до старта и указываем цену в предложении. Ориентир даёт калькулятор." },
        { q: "Что входит в разработку сайта?", a: "От требований до запуска и передачи доступов с инструкциями: знакомство, ТЗ и план, дизайн, разработка и запуск." },
        { q: "Можно ли вопросить сайт на двух языках?", a: "Да, сайт работает на RU и EN с отдельными мета-тегами и проверкой переводов." },
        { q: "Как быстро получить расчёт?", a: "Откройте калькулятор стоимости или напишите нам — мы подготовим предложение после обсуждения задачи." },
      ],
    },
    en: {
      title: "How much does website development cost in 2026: an honest breakdown",
      excerpt: "A clear look at what shapes the cost of a website, what the work includes and how to get an accurate figure before the project starts.",
      seoTitle: "Website development cost — DS DIGITAL",
      seoDesc: "See what shapes website development cost: scope, stages and timelines. Estimate your budget with the DS DIGITAL calculator.",
      body: `## How much does website development cost: where to start

The question “how much does website development cost” usually means one thing: a business owner wants to know the budget to set aside and what they get for it. The honest answer is that without a defined scope no one can name a number. At DS DIGITAL we fix the scope, stages and timelines before the start and show intermediate results at every stage. Below is a transparent evaluation framework to help you prepare for a conversation with any vendor.

## What shapes the cost of a website

Website development cost is built from several factors. We do not quote prices without approval — the exact rules are in our calculator and in the commercial proposal. The structure, however, is the same for every project.

### Type of website

A corporate site, a landing page and an online store are different tasks. At DS DIGITAL, [web development](/en/services/web-development) covers corporate sites, landing pages and online stores. More page types and integrations mean more work.

### Content volume and languages

The site works in two languages — RU and EN. Each language needs translations, meta tags and copy review. If you plan to publish articles, factor in blog maintenance: in our [admin panel](/en/contact) articles are edited without a programmer.

### Integrations and leads

A separate cost item is connecting forms to a CRM and notifications. We wire forms, notifications and processes so leads are neither lost nor handled manually. See [API integrations](/en/services/api-integrations).

### Design and effects

The visual style is set by the design system. DS DIGITAL has three effects modes: full, lite and static. The choice affects effort but not accessibility: the site is checked for WCAG AA and has no horizontal scrolling.

## What the work includes

We take the task end to end: from requirements to launch and handover with instructions. The process has five steps: discovery, spec and plan, design, development and launch. At every stage you see the result and can request changes.

## How to get an accurate figure

The fastest route is the [cost calculator](/en/calculator): it accounts for project type, complexity and extra options. The calculator gives an estimate; the exact price is fixed in the proposal after we discuss the task.

To discuss directly — [contact us](/en/contact). Describe what the site should do and which systems must be connected.

## Common budgeting mistakes

The first is relying on a “template” price without integrations. The second is forgetting two-language content. The third is skipping post-launch support: we stay in touch, and fixes do not end with the release.

## Why we do not quote a price in the article

Because we do not want to mislead. We have no confirmed public prices and we do not publish invented numbers. Instead we show the evaluation structure and give a calculation tool. That is the honest approach we also use in [“How to choose a developer”](/en/blog/how-to-choose-a-developer).

_______

**Check before publication:** any specific prices and timelines supplied by the client (intentionally omitted here).`,
      faq: [
        { q: "Why don't you give an exact price in the article?", a: "Because cost depends on scope. We fix scope, stages and timelines before the start and put the quote in the proposal. The calculator gives an estimate." },
        { q: "What is included in website development?", a: "End-to-end work: requirements to launch and handover with instructions — discovery, spec and plan, design, development and launch." },
        { q: "Can the site be bilingual?", a: "Yes, the site works in RU and EN with separate meta tags and copy review." },
        { q: "How quickly can I get an estimate?", a: "Open the cost calculator or contact us — we will prepare a proposal after discussing the task." },
      ],
    },
  },
  {
    slug: "how-to-choose-a-developer",
    sort: 2,
    ru: {
      title: "Как выбрать подрядчика для разработки: чек-лист для бизнеса",
      excerpt: "Пять признаков ответственного подрядчика: прозрачный процесс, честные кейсы, понятные этапы и поддержка после запуска.",
      seoTitle: "Как выбрать подрядчика по разработке — DS DIGITAL",
      seoDesc: "Чек-лист выбора подрядчика: процесс, кейсы, этапы и поддержка. Сравните предложения и обсудите задачу с DS DIGITAL.",
      body: `## Как выбрать подрядчика: на что смотреть в первую очередь

Выбор подрядчика — решение, которое определяет судьбу проекта. Хороший признак — компания говорит о процессе и результатах, а не о невероятных сроках. В DS DIGITAL мы публикуем только реальные проекты и не создаём выдуманных клиентов, отзывов и цифр. Этот чек-лист поможет сравнить предложенияobjectively.

## 1. Прозрачный процесс

Спросите, как устроена работа. У нас это пять шагов: знакомство, ТЗ и план, дизайн, разработка, запуск. Состав работ, этапы и сроки фиксируются до старта. Если подрядчик не может объяснить процесс — это повод насторожиться.

## 2. Реальные кейсы, а не презентации

Попросите показать работающий продукт. Пример из нашего портфолио — [KarmaRent CRM / RIDEFLOW](/ru/projects): CRM для управления арендой. На сайте доступны скриншоты календаря занятости, списка аренд, GPS-мониторинга и договоров. Данные на скриншотах — демонстрационные. Это честный способ показать возможности без раскрытия чужих данных.

## 3. Честность вместо обещаний

Обратите внимание, публикует ли студия выдуманные отзывы и цифры. Мы не публикуем таких материалов: отзывы появятся только после согласия авторов. Там, где факта нет, мы ставим пометку «проверить» — и в этой статье тоже.

## 4. Доступность и качество

Сайт должен работать на мобильных и не иметь горизонтальной прокрутки. Мы проверяем доступность по WCAG AA и тестируем ключевые сценарии перед запуском. Уточните у подрядчика, как проходит приёмка.

## 5. Поддержка после запуска

Релиз — не конец. Мы остаёмся на связи: правки, вопросы и развитие проекта продолжаются. Уточните, кто будет отвечать на вопросы через месяц после запуска.

## Дополнительно: автоматизация и интеграции

Если бизнесу нужна не просто витрина, а учёт заявок, спросите про интеграции. Мы связываем формы, уведомления и процессы: заявки попадают в CRM, а уведомления приходят в email и Telegram. См. [Telegram-ботов](/ru/services/telegram-bots) и [автоматизацию бизнес-процессов](/ru/services/business-automation).

## Как сравнить предложения

Сведите предложения к одной таблице: состав работ, этапы, сроки, поддержка, наличие реальных кейсов. Не сравнивайте только цену — сравнивайте то, что вы получите. Для ориентира используйте [калькулятор стоимости](/ru/calculator), затем [напишите нам](/ru/contact) с описанием задачи.

## Частый вопрос: можно ли начать с малого

Да. Мы фиксируем состав работ до старта, поэтому можно начать с первого этапа и развивать проект дальше. Главное — чтобы этапы были согласованы заранее.

_______

**Проверить перед публикацией:** данные отзывов (сейчас их нет).`,
      faq: [
        { q: "Как понять, что подрядчик ответственный?", a: "Он объясняет процесс, фиксирует состав работ и сроки до старта и показывает реальные продукты, а не презентации." },
        { q: "Публикуете ли вы отзывы клиентов?", a: "Пока нет — отзывы появятся после согласия авторов. Мы не публикуем выдуманные материалы." },
        { q: "Можно ли посмотреть пример вашей работы?", a: "Да, в разделе проектов представлен KarmaRent CRM / RIDEFLOW со скриншотами на демонстрационных данных." },
        { q: "Что делать после выбора подрядчика?", a: "Опишите задачу, согласуйте состав работ и сроки, затем используйте калькулятор для ориентира по бюджету." },
      ],
    },
    en: {
      title: "How to choose a development vendor: a business checklist",
      excerpt: "Five signs of a responsible vendor: a transparent process, honest cases, clear stages and support after launch.",
      seoTitle: "How to choose a development vendor — DS DIGITAL",
      seoDesc: "A vendor selection checklist: process, cases, stages and support. Compare proposals and discuss your task with DS DIGITAL.",
      body: `## How to choose a development vendor: what to look at first

Choosing a vendor is a decision that defines the fate of the project. A good sign is a company that talks about process and results rather than unbelievable deadlines. At DS DIGITAL we publish only real projects and create no invented clients, reviews or numbers. This checklist will help you compare proposals objectively.

## 1. A transparent process

Ask how the work is organised. Ours has five steps: discovery, spec and plan, design, development and launch. Scope, stages and timelines are fixed before the start. If a vendor cannot explain the process, that is a reason to be cautious.

## 2. Real cases, not slides

Ask to see a working product. An example from our [portfolio](/en/projects) is KarmaRent CRM / RIDEFLOW — a CRM for rental management. The site shows screenshots of the occupancy calendar, rental list, GPS tracking and contracts. The data on the screenshots is demo data. That is an honest way to show capabilities without exposing someone else's data.

## 3. Honesty over promises

Notice whether the studio publishes invented reviews and numbers. We do not: reviews will appear only after the authors consent. Where a fact is missing, we put a “check” note — including in this article.

## 4. Accessibility and quality

A site must work on mobile and have no horizontal scrolling. We check accessibility against WCAG AA and test key scenarios before launch. Ask the vendor about the acceptance process.

## 5. Support after launch

The release is not the end. We stay in touch: fixes, questions and product growth continue. Ask who will answer questions a month after launch.

## Beyond the basics: automation and integrations

If the business needs more than a brochure site — for example, lead accounting — ask about integrations. We wire forms, notifications and processes: leads go into the CRM and notifications arrive by email and Telegram. See [Telegram bots](/en/services/telegram-bots) and [business automation](/en/services/business-automation).

## How to compare proposals

Put the proposals into one table: scope, stages, timelines, support, real cases. Do not compare only price — compare what you get. Use the [cost calculator](/en/calculator) for an estimate, then [contact us](/en/contact) with your task description.

## Can we start small

Yes. We fix the scope before the start, so you can begin with the first stage and grow the project later. The important thing is to agree the stages in advance.

_______

**Check before publication:** the link to the specific KarmaRent case and permission for public display; review data (currently none).`,
      faq: [
        { q: "How can I tell a responsible vendor?", a: "They explain the process, fix scope and timelines before the start and show real products rather than presentations." },
        { q: "Do you publish client reviews?", a: "Not yet — reviews will appear after the authors consent. We do not publish invented material." },
        { q: "Can I see an example of your work?", a: "Yes, the projects section features KarmaRent CRM / RIDEFLOW with screenshots on demo data." },
        { q: "What should I do after choosing a vendor?", a: "Describe the task, agree scope and timelines, then use the calculator to estimate the budget." },
      ],
    },
  },
];

async function main() {
  for (const seed of ARTICLES) {
    const existing = await db.article.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    const common = {
      status: "published" as const,
      publishedAt: new Date("2026-11-21T09:00:00Z"),
      sort: seed.sort,
    };
    if (existing) {
      await db.article.update({
        where: { id: existing.id },
        data: {
          ...common,
          translations: {
            upsert: (["ru", "en"] as const).map((locale) => {
              const source = seed[locale];
              return {
                where: { articleId_locale: { articleId: existing.id, locale } },
                create: { locale, ...source, faq: source.faq as never },
                update: { ...source, faq: source.faq as never },
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
              const source = seed[locale];
              return { locale, ...source, faq: source.faq as never };
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
    console.error("[seed:articles]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
