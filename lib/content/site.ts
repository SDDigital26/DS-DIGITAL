import type { Locale } from "@/lib/i18n/config";

/**
 * Контент первого экрана — перенесён из прототипа
 * `DS DIGITAL molnii— прототип первого экрана.html` 1:1.
 *
 * Запрет ТЗ §4 соблюдён: никаких вымышленных клиентов, отзывов и цифр.
 * Карточки услуг показывают пример интерфейса, а не реальный кейс.
 * Раздел RIDEFLOW показывает реальный публичный кейс; публикация согласована
 * заказчиком (22.11.2026). На скриншотах — демонстрационные данные.
 */

export type NavKey =
  | "services"
  | "projects"
  | "about"
  | "blog"
  | "calculator"
  | "process"
  | "reviews"
  | "faq"
  | "contacts";

export type ProcessStep = { title: string; text: string };

export type SiteContent = {
  skip: string;
  languageLabel: string;
  navLabel: string;
  menu: string;
  closeMenu: string;
  nav: {
    services: string;
    projects: string;
    about: string;
    blog: string;
    calculator: string;
    process: string;
    reviews: string;
    faq: string;
    contacts: string;
    letsTalk: string;
  };
  hero: {
    tag: string;
    title: string;
    sub: string;
    start: string;
    explore: string;
    scroll: string;
  };
  services: { title: string; lead: string; more: string };
  projects: { title: string; lead: string; empty: string; more: string };
  /** Выделенная презентация главного кейса (ТЗ §6.7), публикация согласована. */
  karma: {
    title: string;
    lead: string;
    features: string[];
    shots: { src: string; alt: string }[];
    links: { label: string; href: string }[];
    note: string;
    cta: string;
  };
  technologies: { title: string; lead: string; groups: { name: string; items: string[] }[] };
  why: { title: string; lead: string; items: { title: string; text: string }[] };
  aiSection: { title: string; lead: string; open: string; note: string; powered: string };
  calculator: { title: string; lead: string; disclaimer: string };
  process: { title: string; lead: string; steps: ProcessStep[] };
  reviews: { title: string; lead: string; empty: string };
  faq: { title: string; lead: string; empty: string };
  contact: {
    title: string;
    lead: string;
    channels: string[];
    /** Реальные ссылки; пустая строка — канал скрыт на сайте. */
    links: { telegram: string; whatsapp: string; email: string };
    formLink: string;
    note: string;
  };
  form: {
    title: string;
    lead: string;
  };
  cookies: {
    title: string;
    lead: string;
    essential: string;
    optional: string;
    accept: string;
    essentialOnly: string;
    policyLink: string;
    note: string;
    sections: { heading: string; text: string }[];
  };
  about: {
    title: string;
    lead: string;
    paragraphs: string[];
    focusTitle: string;
    focus: string[];
    more: string;
  };
  legal: {
    privacyTitle: string;
    privacyLead: string;
    privacy: { heading: string; text: string }[];
    termsTitle: string;
    termsLead: string;
    terms: { heading: string; text: string }[];
    contactNote: string;
  };
  footer: string;
  privacy: string;
  terms: string;
};

const RU: SiteContent = {
  skip: "К содержимому",
  languageLabel: "Язык",
  navLabel: "Основная навигация",
  menu: "Меню",
  closeMenu: "Закрыть меню",
  nav: {
    services: "Услуги",
    projects: "Проекты",
    about: "О студии",
    blog: "Блог",
    calculator: "Калькулятор",
    process: "Процесс",
    reviews: "Отзывы",
    faq: "FAQ",
    contacts: "Контакты",
    letsTalk: "Обсудить проект",
  },
  hero: {
    tag: "Digital Development Studio",
    title: "Создаём цифровые продукты, которые двигают бизнес вперёд",
    sub: "Разрабатываем сайты, веб-приложения, CRM и решения на базе ИИ, которые помогают бизнесу расти.",
    start: "Начать проект",
    explore: "Смотреть услуги",
    scroll: "BUILD. AUTOMATE. SCALE.",
  },
  services: {
    title: "Что мы создаём",
    lead: "Наведите курсор или нажмите на карточку, чтобы увидеть пример.",
    more: "Подробнее об услугах",
  },
  projects: {
    title: "Проекты",
    lead: "Реальные кейсы студии. Каждый проект опубликован только с подтверждением заказчика.",
    empty: "Кейсы публикуются только для реально существующих проектов.",
    more: "Все проекты",
  },
  karma: {
    title: "RIDEFLOW",
    lead: "CRM для проката байков, авто и недвижимости: вместо таблиц и тетрадей — видно, что свободно, кто и когда вернёт технику и сколько заработали.",
    features: [
      "Календарь занятости",
      "Оплаты и залоги",
      "Договоры с подписью гостя",
      "Аналитика и прибыль",
      "GPS-мониторинг техники",
      "Telegram-бот бронирования",
    ],
    shots: [
      { src: "/cases/rideflow/calendar.webp", alt: "Календарь занятости RIDEFLOW" },
      { src: "/cases/rideflow/rentals.webp", alt: "Список аренд с датами, оплатой и остатком" },
      { src: "/cases/rideflow/gps-map.jpg", alt: "GPS-мониторинг байка на карте" },
      { src: "/cases/rideflow/accountant-dashboard.webp", alt: "Кабинет бухгалтера: касса и сверка смен" },
      { src: "/cases/rideflow/analytics.webp", alt: "Финансовый обзор: выручка и чистая прибыль" },
      { src: "/cases/rideflow/contract.webp", alt: "Договор аренды с подписью гостя" },
    ],
    links: [
      { label: "RideFlow — сайт продукта", href: "https://rideflow.ac.vn/" },
    ],
    note: "На скриншотах — демонстрационные данные, не production.",
    cta: "Смотреть проекты",
  },
  technologies: {
    title: "Технологии",
    lead: "Стек, который мы реально используем в проектах.",
    groups: [
      { name: "Frontend", items: ["Next.js", "React", "TypeScript", "Tailwind CSS"] },
      { name: "Backend", items: ["Node.js", "PostgreSQL", "Prisma", "REST API"] },
      { name: "AI", items: ["Пошаговые AI-сценарии", "Готовность к подключению LLM-провайдера"] },
      { name: "Интеграции", items: ["Telegram Bot API", "Email-уведомления", "Внешние сервисы по API"] },
      { name: "Infra", items: ["Docker", "GitHub Actions", "PostgreSQL"] },
    ],
  },
  why: {
    title: "Почему DS DIGITAL",
    lead: "Преимущества, каждое из которых можно проверить.",
    items: [
      {
        title: "Рабочий результат, а не презентации",
        text: "Берём задачу целиком: от требований до запуска и передачи доступов с инструкциями.",
      },
      {
        title: "Прозрачный процесс",
        text: "Фиксируем состав работ, этапы и сроки до старта и показываем промежуточные результаты на каждом этапе.",
      },
      {
        title: "Честность вместо обещаний",
        text: "Не публикуем выдуманных клиентов, отзывов и цифр. Описания и стоимость обсуждаем до старта.",
      },
      {
        title: "Доступность и качество",
        text: "Сайт проверен на доступность (WCAG AA), работает на двух языках и без горизонтальной прокрутки.",
      },
      {
        title: "Автоматизация вместо рутины",
        text: "Формы, уведомления и процессы связываем так, чтобы заявки не терялись и не обрабатывались вручную.",
      },
      {
        title: "Поддержка после запуска",
        text: "Остаёмся на связи: правки, вопросы и развитие проекта не заканчиваются вместе с релизом.",
      },
    ],
  },
  aiSection: {
    title: "AI-консультант",
    lead: "Опишите задачу — пошаговый ассистент подберёт услугу и поможет оформить заявку. Работает на бесплатном сценарии; при подключённом API ответы уточняет языковая модель.",
    open: "Открыть AI-ассистент",
    note: "Ассистент маркирован как AI. Согласие, шаги и создание заявки выполняются на сервере; модель может только переформулировать ответы и не называет цены или сроки.",
    powered: "Подключение провайдера — в админке, раздел «Настройки сайта».",
  },
  calculator: {
    title: "Калькулятор стоимости",
    lead: "Выберите, что нужно, и получите примерную цену и срок.",
    disclaimer: "Расчёт предварительный. Окончательная стоимость и сроки определяются после обсуждения проекта.",
  },
  process: {
    title: "Как мы работаем",
    lead: "Пять шагов — от задачи до запуска. Сроки и состав работ фиксируются после обсуждения проекта.",
    steps: [
      { title: "Знакомство", text: "Обсуждаем задачу, цели и ограничения. Уточняем, что нужно на выходе." },
      { title: "ТЗ и план", text: "Фиксируем состав работ, этапы и сроки, согласовываем их с вами." },
      { title: "Дизайн", text: "Готовим структуру и интерфейс, показываем прототип и вносим правки." },
      { title: "Разработка", text: "Собираем продукт, подключаем данные и интеграции, проверяем каждую функцию." },
      { title: "Запуск", text: "Публикуем, проверяем ключевые сценарии и передаём доступы с инструкциями." },
    ],
  },
  reviews: {
    title: "Отзывы",
    lead: "Пока их нет — мы не публикуем выдуманные отзывы.",
    empty: "Отзывы появятся здесь после того, как клиенты дадут согласие на публикацию.",
  },
  faq: {
    title: "Частые вопросы",
    lead: "Ответы на вопросы о работе студии.",
    empty: "Вопросы и ответы готовятся и будут опубликованы после проверки фактов.",
  },
  contact: {
    title: "Готовы начать?",
    lead: "Расскажите о задаче, и мы предложим решение.",
    channels: ["Telegram", "WhatsApp", "Email"],
    links: { telegram: "", whatsapp: "", email: "" },
    formLink: "Оставить заявку",
    note: "Ссылки на контакты можно добавить в админке: Настройки сайта.",
  },
  form: {
    title: "Оставить заявку",
    lead: "Заполните форму — мы свяжемся с вами по указанному контакту.",
  },
  cookies: {
    title: "Использование cookie",
    lead: "Мы используем только необходимые cookie для работы сайта и сохранения языка. Аналитика подключается только после вашего согласия.",
    essential: "Необходимые",
    optional: "Аналитика (по согласию)",
    accept: "Принять все",
    essentialOnly: "Только необходимые",
    policyLink: "Политика cookie",
    note: "Вы можете изменить выбор в любой момент через политику cookie.",
    sections: [
      { heading: "Что такое cookie", text: "Cookie — небольшие файлы, которые сайт сохраняет в браузере. Они нужны, чтобы сайт работал и помнил ваши настройки." },
      { heading: "Необходимые cookie", text: "Сохраняют выбранный язык и сессию. Без них сайт не сможет работать корректно; они не передаются сторонним сервисам." },
      { heading: "Аналитика", text: "Для оценки посещений и скорости сайта мы используем Vercel Analytics и Speed Insights. Скрипты загружаются только после вашего согласия; без него собираются лишь необходимые данные." },
      { heading: "Как изменить выбор", text: "Управлять cookie можно в настройках браузера или повторно открыв это уведомление." },
    ],
  },
  about: {
    title: "О студии",
    lead: "DS DIGITAL — студия цифровой разработки: создаём продукты, автоматизируем процессы и запускаем то, что приносит заявки.",
    paragraphs: [
      "Мы работаем с бизнесом, которому нужен не «сайт ради сайта», а рабочий инструмент: сайт, который приводит клиентов, приложение, которое упрощает работу, или автоматизация, которая убирает рутину.",
      "Берём задачу целиком: обсуждаем требования, проектируем, разрабатываем, тестируем и запускаем. Показываем промежуточные результаты на каждом этапе, чтобы правки не копились к финалу.",
      "Не обещаем того, что нельзя проверить: описания, сроки и стоимость обсуждаем до старта и фиксируем в договорённостях.",
    ],
    focusTitle: "Что делаем",
    focus: [
      "Сайты и лендинги с заявками в CRM",
      "Веб-приложения и личные кабинеты",
      "CRM-системы под ваши процессы",
      "Telegram-боты и Mini Apps",
      "ИИ-решения и автоматизация рутины",
      "Интеграции с внешними сервисами по API",
    ],
    more: "Подробнее о студии",
  },
  legal: {
    privacyTitle: "Политика конфиденциальности",
    privacyLead: "Как мы обрабатываем данные, которые вы оставляете на сайте.",
    privacy: [
      {
        heading: "Какие данные мы собираем",
        text: "Данные, которые вы сами указываете в форме заявки: имя, контакт (Telegram, телефон или email), описание задачи и выбранная услуга. Дополнительно сохраняются технические сведения: страница, с которой отправлена заявка, и дата согласия.",
      },
      {
        heading: "Зачем они нужны",
        text: "Только чтобы связаться с вами по вашей заявке и обсудить задачу. Мы не продаём и не передаём эти данные третьим лицам для рекламы.",
      },
      {
        heading: "Правовое основание",
        text: "Ваше согласие, которое вы подтверждаете флажком перед отправкой формы. Без согласия заявка не отправляется.",
      },
      {
        heading: "Сколько храним",
        text: "Столько, сколько нужно для работы по заявке и выполнения требований закона. Вы можете попросить удалить свои данные — напишите нам через форму контактов.",
      },
      {
        heading: "Ваши права",
        text: "Вы можете запросить доступ к своим данным, их исправление или удаление, а также отозвать согласие на обработку.",
      },
      {
        heading: "Cookie",
        text: "Об использовании cookie рассказано в отдельной Политике cookie. До вашего согласия работают только необходимые cookie.",
      },
    ],
    termsTitle: "Условия использования",
    termsLead: "Правила работы с сайтом и материалами студии.",
    terms: [
      {
        heading: "Сайт и его содержимое",
        text: "Сайт носит информационный характер. Мы стараемся, чтобы информация была актуальной, но состав услуг, сроки и стоимость обсуждаются индивидуально для каждого проекта.",
      },
      {
        heading: "Заявки",
        text: "Отправляя заявку, вы подтверждаете, что указали достоверные контакты и согласны на связь по указанным данным.",
      },
      {
        heading: "Материалы",
        text: "Тексты, изображения и элементы интерфейса сайта принадлежат DS DIGITAL. Использовать их без разрешения нельзя.",
      },
      {
        heading: "Ответственность",
        text: "Мы не несём ответственности за перебои, вызванные работой хостинга, провайдеров связи или действиями третьих лиц.",
      },
      {
        heading: "Изменения",
        text: "Мы можем обновлять эти условия. Актуальная версия всегда опубликована на этой странице.",
      },
    ],
    contactNote: "По вопросам данных и условий работы напишите нам через форму на главной странице.",
  },
  footer: "© DS DIGITAL",
  privacy: "Политика конфиденциальности",
  terms: "Условия использования",
};

const EN: SiteContent = {
  skip: "Skip to content",
  languageLabel: "Language",
  navLabel: "Main navigation",
  menu: "Menu",
  closeMenu: "Close menu",
  nav: {
    services: "Services",
    projects: "Projects",
    about: "About",
    blog: "Blog",
    calculator: "Calculator",
    process: "Process",
    reviews: "Reviews",
    faq: "FAQ",
    contacts: "Contacts",
    letsTalk: "Let’s talk",
  },
  hero: {
    tag: "Digital Development Studio",
    title: "Building digital experiences that move business forward",
    sub: "We design and develop websites, web applications, CRM systems and AI-powered solutions that help businesses grow.",
    start: "Start a project",
    explore: "Explore services",
    scroll: "BUILD. AUTOMATE. SCALE.",
  },
  services: {
    title: "What we build",
    lead: "Hover or tap a card to see an example.",
    more: "More about services",
  },
  projects: {
    title: "Projects",
    lead: "Real studio case studies. Every project is published only with the client’s confirmation.",
    empty: "Case studies are published only for projects that actually exist.",
    more: "All projects",
  },
  karma: {
    title: "RIDEFLOW",
    lead: "A CRM for renting bikes, cars and property: instead of spreadsheets and notebooks you see what is free, who returns the vehicle and when, and how much you earned.",
    features: [
      "Occupancy calendar",
      "Payments and deposits",
      "Contracts with guest e-signature",
      "Analytics and profit",
      "GPS vehicle tracking",
      "Telegram booking bot",
    ],
    shots: [
      { src: "/cases/rideflow/calendar.webp", alt: "RIDEFLOW occupancy calendar" },
      { src: "/cases/rideflow/rentals.webp", alt: "Rental list with dates, payment and balance" },
      { src: "/cases/rideflow/gps-map.jpg", alt: "GPS tracking of a bike on the map" },
      { src: "/cases/rideflow/accountant-dashboard.webp", alt: "Accountant dashboard: cash desk and shift reconciliation" },
      { src: "/cases/rideflow/analytics.webp", alt: "Financial overview: revenue and net profit" },
      { src: "/cases/rideflow/contract.webp", alt: "Rental contract signed by the guest" },
    ],
    links: [
      { label: "RideFlow — product website", href: "https://rideflow.ac.vn/" },
    ],
    note: "The screenshots show demo data, not production.",
    cta: "View projects",
  },
  technologies: {
    title: "Technologies",
    lead: "The stack we actually use in projects.",
    groups: [
      { name: "Frontend", items: ["Next.js", "React", "TypeScript", "Tailwind CSS"] },
      { name: "Backend", items: ["Node.js", "PostgreSQL", "Prisma", "REST API"] },
      { name: "AI", items: ["Step-by-step AI scenarios", "Ready to connect an LLM provider"] },
      { name: "Integrations", items: ["Telegram Bot API", "Email notifications", "External services via API"] },
      { name: "Infra", items: ["Docker", "GitHub Actions", "PostgreSQL"] },
    ],
  },
  why: {
    title: "Why DS DIGITAL",
    lead: "Advantages you can verify.",
    items: [
      {
        title: "Working results, not slides",
        text: "We take the task end to end: from requirements to launch and handover with instructions.",
      },
      {
        title: "A transparent process",
        text: "We fix the scope, stages and timelines before the start and show intermediate results at every stage.",
      },
      {
        title: "Honesty over promises",
        text: "We do not publish invented clients, reviews or numbers. Scope and price are discussed before the start.",
      },
      {
        title: "Accessibility and quality",
        text: "The site is checked for accessibility (WCAG AA), works in two languages and has no horizontal scrolling.",
      },
      {
        title: "Automation instead of routine",
        text: "Forms, notifications and processes are wired so leads are neither lost nor handled manually.",
      },
      {
        title: "Support after launch",
        text: "We stay in touch: fixes, questions and project growth do not end with the release.",
      },
    ],
  },
  aiSection: {
    title: "AI consultant",
    lead: "Describe your task — a step-by-step assistant will pick a service and help you send a request. It runs on a free script; once an API is connected, a language model refines the replies.",
    open: "Open the AI assistant",
    note: "The assistant is labelled as AI. Consent, steps and request creation happen on the server; the model may only rephrase replies and never quotes prices or deadlines.",
    powered: "Connect a provider in the admin panel under “Site settings”.",
  },
  calculator: {
    title: "Cost calculator",
    lead: "Pick what you need and get an indicative price and timeline.",
    disclaimer: "This is a preliminary estimate. The final cost and timeline are agreed after discussing the project.",
  },
  process: {
    title: "How we work",
    lead: "Five steps — from the task to launch. Scope and timelines are fixed after we discuss the project.",
    steps: [
      { title: "Discovery", text: "We discuss the task, goals and constraints, and clarify the expected result." },
      { title: "Scope & plan", text: "We fix the scope, stages and timelines and agree them with you." },
      { title: "Design", text: "We prepare the structure and interface, show a prototype and apply your feedback." },
      { title: "Development", text: "We build the product, connect data and integrations, and test every feature." },
      { title: "Launch", text: "We publish it, check key scenarios and hand over access with instructions." },
    ],
  },
  reviews: {
    title: "Reviews",
    lead: "There are none yet — we do not publish invented reviews.",
    empty: "Reviews will appear here once clients agree to publish them.",
  },
  faq: {
    title: "Frequently asked questions",
    lead: "Answers about working with the studio.",
    empty: "Questions and answers are being prepared and will be published after fact-checking.",
  },
  contact: {
    title: "Ready to start?",
    lead: "Tell us about your task and we will suggest a solution.",
    channels: ["Telegram", "WhatsApp", "Email"],
    links: { telegram: "", whatsapp: "", email: "" },
    formLink: "Leave a request",
    note: "Contact links can be added in the admin panel: Site settings.",
  },
  form: {
    title: "Leave a request",
    lead: "Fill in the form and we will contact you using the details you provided.",
  },
  cookies: {
    title: "Use of cookies",
    lead: "We use only essential cookies to run the site and remember your language. Analytics is enabled only after your consent.",
    essential: "Essential",
    optional: "Analytics (with consent)",
    accept: "Accept all",
    essentialOnly: "Essential only",
    policyLink: "Cookie policy",
    note: "You can change your choice at any time via the cookie policy.",
    sections: [
      { heading: "What cookies are", text: "Cookies are small files a site stores in your browser. They help the site work and remember your settings." },
      { heading: "Essential cookies", text: "They store the selected language and session. The site cannot work correctly without them; they are not shared with third parties." },
      { heading: "Analytics", text: "We use Vercel Analytics and Speed Insights to measure visits and site speed. Their scripts load only after your consent; without it, only essential data is collected." },
      { heading: "Changing your choice", text: "You can manage cookies in your browser settings or reopen this notice." },
    ],
  },
  about: {
    title: "About the studio",
    lead: "DS DIGITAL is a digital development studio: we build products, automate processes and launch things that bring leads.",
    paragraphs: [
      "We work with businesses that need a working tool rather than “a website for the sake of a website”: a site that brings clients, an app that simplifies work, or automation that removes routine.",
      "We take the task end to end: discuss requirements, design, develop, test and launch. We show intermediate results at every stage so feedback does not pile up at the end.",
      "We do not promise what cannot be verified: scope, timelines and price are discussed before the start and fixed in our agreements.",
    ],
    focusTitle: "What we do",
    focus: [
      "Websites and landing pages with leads into a CRM",
      "Web applications and user accounts",
      "CRM systems tailored to your process",
      "Telegram bots and Mini Apps",
      "AI solutions and routine automation",
      "Integrations with external services via API",
    ],
    more: "More about the studio",
  },
  legal: {
    privacyTitle: "Privacy policy",
    privacyLead: "How we process the data you leave on this site.",
    privacy: [
      {
        heading: "What data we collect",
        text: "Data you enter in the request form: name, contact (Telegram, phone or email), task description and the selected service. We also store technical details: the page the request came from and the consent date.",
      },
      {
        heading: "Why we need it",
        text: "Only to contact you about your request and discuss the task. We do not sell this data or share it with third parties for advertising.",
      },
      {
        heading: "Legal basis",
        text: "Your consent, confirmed by the checkbox before sending the form. Without consent the request is not sent.",
      },
      {
        heading: "How long we keep it",
        text: "As long as needed to work on the request and meet legal requirements. You can ask us to delete your data via the contact form.",
      },
      {
        heading: "Your rights",
        text: "You can request access to your data, correct or delete it, and withdraw your consent to processing.",
      },
      {
        heading: "Cookies",
        text: "Cookie use is described in the separate Cookie policy. Only essential cookies work before your consent.",
      },
    ],
    termsTitle: "Terms of use",
    termsLead: "Rules for using the site and the studio's materials.",
    terms: [
      {
        heading: "The site and its content",
        text: "The site is informational. We keep information up to date, but the scope of services, timelines and price are agreed individually for each project.",
      },
      {
        heading: "Requests",
        text: "By sending a request you confirm that the contact details are accurate and that you agree to be contacted using them.",
      },
      {
        heading: "Materials",
        text: "Texts, images and interface elements of this site belong to DS DIGITAL. They may not be used without permission.",
      },
      {
        heading: "Liability",
        text: "We are not responsible for disruptions caused by hosting, telecom providers or third-party actions.",
      },
      {
        heading: "Changes",
        text: "We may update these terms. The current version is always published on this page.",
      },
    ],
    contactNote: "For questions about data or terms, write to us via the form on the main page.",
  },
  footer: "© DS DIGITAL",
  privacy: "Privacy policy",
  terms: "Terms of use",
};

export const SITE: Record<Locale, SiteContent> = { ru: RU, en: EN };

/** Подписи реальной формы заявки (страница /contact). */
export const FORM_LABELS: Record<
  Locale,
  {
    name: string;
    contact: string;
    service: string;
    message: string;
    consent: string;
    other: string;
    send: string;
    sending: string;
    fillAll: string;
    tooShort: string;
    badContact: string;
    consentRequired: string;
    sent: string;
    sentNote: string;
    failed: string;
  }
> = {
  ru: {
    name: "Имя",
    contact: "Telegram, телефон или email",
    service: "Услуга",
    message: "Что нужно сделать",
    consent: "Согласен на обработку данных для связи со мной",
    other: "Другое",
    send: "Отправить заявку",
    sending: "Отправляем…",
    fillAll: "Заполните имя, контакт и описание задачи.",
    tooShort: "Опишите задачу хотя бы в двух словах — например: «нужен сайт для студии».",
    badContact: "Укажите рабочий контакт: email, Telegram (@ник) или телефон.",
    consentRequired: "Нужно согласие на связь.",
    sent: "Заявка отправлена",
    sentNote: "Мы ответим по указанному контакту.",
    failed: "Не удалось отправить заявку. Попробуйте ещё раз.",
  },
  en: {
    name: "Name",
    contact: "Telegram, phone or email",
    service: "Service",
    message: "What do you need",
    consent: "I agree to be contacted about my request",
    other: "Other",
    send: "Send request",
    sending: "Sending…",
    fillAll: "Fill in your name, a contact and a short description.",
    tooShort: "Describe the task in a few words — for example: “I need a website for my studio”.",
    badContact: "Add a valid contact: email, Telegram (@handle) or phone.",
    consentRequired: "Please confirm you agree to be contacted.",
    sent: "Request sent",
    sentNote: "We will reply using the contact you provided.",
    failed: "Could not send the request. Try again.",
  },
};

export type DemoKind = "bars" | "messages" | "crm" | "ai" | "flow" | "bot" | "api";
export type VizKind = "h" | "g" | "eq" | "d" | "f" | "b" | "a";

export type ServiceCard = {
  title: string;
  description: string;
  /** SVG-пути иконки (24×24) — из прототипа. */
  icon: string;
  demo: DemoKind;
  viz: { kind: VizKind; count: number };
};

export const SERVICES: Record<Locale, ServiceCard[]> = {
  ru: [
    {
      title: "Сайты",
      description: "Быстрые сайты, которые приводят клиентов",
      icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>',
      demo: "bars",
      viz: { kind: "h", count: 3 },
    },
    {
      title: "Веб-приложения",
      description: "Сервисы и кабинеты для вашей работы",
      icon: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="M17 13v8M13 17h8"/>',
      demo: "messages",
      viz: { kind: "g", count: 6 },
    },
    {
      title: "CRM-системы",
      description: "Заявки, клиенты и продажи в одном месте",
      icon: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M17 6v6M14 9h6"/>',
      demo: "crm",
      viz: { kind: "eq", count: 5 },
    },
    {
      title: "ИИ-решения",
      description: "Нейросети для ответов и анализа",
      icon: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
      demo: "ai",
      viz: { kind: "d", count: 3 },
    },
    {
      title: "Автоматизация",
      description: "Рутина делается без людей",
      icon: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.5 6.5l7 4M8.5 17.5l7-4"/>',
      demo: "flow",
      viz: { kind: "f", count: 3 },
    },
    {
      title: "Telegram-боты",
      description: "Бот отвечает клиентам 24/7",
      icon: '<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/>',
      demo: "bot",
      viz: { kind: "b", count: 2 },
    },
    {
      title: "Интеграции API",
      description: "Ваши сервисы работают вместе",
      icon: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
      demo: "api",
      viz: { kind: "a", count: 2 },
    },
  ],
  en: [
    {
      title: "Websites",
      description: "Fast sites that bring in clients",
      icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>',
      demo: "bars",
      viz: { kind: "h", count: 3 },
    },
    {
      title: "Web applications",
      description: "Services and dashboards for your work",
      icon: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="M17 13v8M13 17h8"/>',
      demo: "messages",
      viz: { kind: "g", count: 6 },
    },
    {
      title: "CRM systems",
      description: "Leads, clients and sales in one place",
      icon: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M17 6v6M14 9h6"/>',
      demo: "crm",
      viz: { kind: "eq", count: 5 },
    },
    {
      title: "AI solutions",
      description: "Neural networks for answers and analysis",
      icon: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
      demo: "ai",
      viz: { kind: "d", count: 3 },
    },
    {
      title: "Automation",
      description: "Routine work done without people",
      icon: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.5 6.5l7 4M8.5 17.5l7-4"/>',
      demo: "flow",
      viz: { kind: "f", count: 3 },
    },
    {
      title: "Telegram bots",
      description: "A bot that answers clients 24/7",
      icon: '<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/>',
      demo: "bot",
      viz: { kind: "b", count: 2 },
    },
    {
      title: "API integrations",
      description: "Your services work together",
      icon: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
      demo: "api",
      viz: { kind: "a", count: 2 },
    },
  ],
};

/** Терминал в центре орбиты — строки печатаются по очереди. */
export const TERMINAL_LINES = [
  "$ ds init crm-app --template business --lang ts",
  "> scaffolding project structure ............ ok",
  "> installing dependencies .................. ok",
  "> connecting postgres database ............. ok",
  "",
  'const lead = await crm.create({ name: form.name,',
  '  source: "site", utm: session.utm, status: "new" });',
  'await telegram.notify(lead, { channel: "sales" });',
  "// lead saved, manager notified",
  "",
  "$ ds automate --flow lead-to-crm",
  "> form -> validate -> crm -> telegram -> email",
  "✓ automation active, 4 steps connected",
  "",
  "async function estimate(features, rate) {",
  "  const hours = sum(features.map(f => f.hours));",
  "  return { hours, price: hours * rate };",
  "}",
  "",
  "$ ds test --all",
  "✓ all tests passed",
  "",
  "$ ds deploy --prod",
  "> building application .................... done",
  "> running migrations ....................... done",
  "✓ live in production",
  "",
];

/** «Призраки» кода на фоне главной — только декорация, aria-hidden. */
export const GHOST_SNIPPETS = [
  [
    "// bot.js",
    'bot.on("message", async msg => {',
    "  const lead = await crm.create(msg);",
    '  await bot.reply("Request received");',
    "});",
  ],
  [
    "$ ds deploy --prod",
    "> building application ... done",
    "> running migrations ... done",
    "✓ live in production",
  ],
  ["GET /api/leads/42", "> 200 OK", '{ "status": "qualified" }'],
  ["SELECT name, status", "FROM leads", 'WHERE source = "site";'],
  [
    "const price = hours * rate;",
    "return { from: price * 0.9,",
    "  to: price * 1.25 };",
  ],
  [
    "// automation",
    "on(\"form.submit\", lead => {",
    "  crm.save(lead);",
    "  telegram.notify(lead);",
    "});",
  ],
  ["$ npm run build", "✓ compiled", "✓ images optimized", "✓ ready"],
  [
    "await ai.answer(question, {",
    "  context: knowledgeBase,",
    "});",
  ],
  ['git commit -m "launch"', "git push origin main", "✓ deployed"],
];
