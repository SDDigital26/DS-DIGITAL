import Image from "next/image";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { SITE } from "@/lib/content/site";
import { db } from "@/lib/db";
import { PUBLIC_TESTIMONIAL_WHERE } from "@/lib/validation/testimonial";
import { GhostCode } from "@/components/site/GhostCode";
import { OrbitCanvas } from "@/components/site/OrbitCanvas";
import { DataGraph } from "@/components/site/DataGraph";
import { Terminal } from "@/components/site/Terminal";
import { ServiceCards } from "@/components/site/ServiceCards";
import { Calculator } from "@/components/site/Calculator";
import { ContactForm } from "@/components/site/ContactForm";
import { Preloader } from "@/components/site/Preloader";
import { OpenAiButton } from "@/components/site/OpenAiButton";
import { getSiteSettings, type SiteSettings } from "@/lib/site-settings";

// Проекты, отзывы и FAQ — из БД: правки в админке применяются без деплоя.
export const instant = false;

/** Как в прототипе: последние 2 слова заголовка — градиентный акцент. */
function heroTitle(title: string) {
  const words = title.split(" ");
  const k = Math.min(2, Math.max(0, words.length - 1));
  return (
    <>
      {words.slice(0, words.length - k).join(" ")}{" "}
      <em>{words.slice(words.length - k).join(" ")}</em>
    </>
  );
}

type HomeProject = {
  id: string;
  title: string;
  summary: string;
  tag: string;
  features: string[];
};

/** Опубликованные проекты для блока «Проекты» (locale с фолбэком на другой язык). */
async function loadProjects(locale: Locale): Promise<HomeProject[]> {
  const projects = await db.project.findMany({
    where: { published: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    take: 3,
    include: { translations: true },
  });

  return projects.flatMap((project) => {
    const t =
      project.translations.find((item) => item.locale === locale) ??
      project.translations[0];
    if (!t) return [];
    return [
      {
        id: project.id,
        title: t.title,
        summary: t.summary || t.description.slice(0, 160),
        tag: t.category || (locale === "ru" ? "Проект" : "Project"),
        features: Array.isArray(t.features) ? (t.features as string[]).slice(0, 4) : [],
      },
    ];
  });
}

type HomeTestimonial = { id: string; authorName: string; authorRole: string | null; text: string };

/** Только реальные отзывы с согласием автора (ТЗ §4.6, C-2). */
async function loadTestimonials(locale: Locale): Promise<HomeTestimonial[]> {
  return db.testimonial.findMany({
    where: { ...PUBLIC_TESTIMONIAL_WHERE, locale },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    take: 6,
    select: { id: true, authorName: true, authorRole: true, text: true },
  });
}

async function loadFaq(locale: Locale) {
  return db.faqItem.findMany({
    where: { locale, published: true },
    orderBy: [{ sort: "asc" }, { question: "asc" }],
    take: 8,
    select: { id: true, question: true, answer: true },
  });
}

type ContactLink = { key: "telegram" | "whatsapp" | "email"; label: string; href: string; external: boolean };

/**
 * Контакты берутся из настроек кабинета. Принимаем и ник, и полную ссылку,
 * чтобы владелец мог вписать что удобно; пустой канал не показываем.
 */
function contactLinks(settings: SiteSettings, locale: Locale): ContactLink[] {
  const labels =
    locale === "ru"
      ? { telegram: "Telegram", whatsapp: "WhatsApp", email: "Email" }
      : { telegram: "Telegram", whatsapp: "WhatsApp", email: "Email" };

  const telegram = settings.telegram.trim();
  const whatsapp = settings.whatsapp.trim().replace(/[^\d+]/g, "");
  const email = settings.email.trim();

  const links: ContactLink[] = [];
  if (telegram) {
    const href = /^https?:\/\//i.test(telegram)
      ? telegram
      : `https://t.me/${telegram.replace(/^@/, "")}`;
    links.push({ key: "telegram", label: labels.telegram, href, external: true });
  }
  if (whatsapp) {
    links.push({
      key: "whatsapp",
      label: labels.whatsapp,
      href: `https://wa.me/${whatsapp.replace(/^\+/, "")}`,
      external: true,
    });
  }
  if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    links.push({ key: "email", label: labels.email, href: `mailto:${email}`, external: false });
  }
  return links;
}

/**
 * Одна страница: hero по прототипу `molnii`, услуги, калькулятор, проекты,
 * процесс, отзывы, FAQ и форма заявки.
 * Никаких выдуманных кейсов, отзывов и цифр (ТЗ §4).
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  const t = SITE[l];
  const [projects, testimonials, faq, settings] = await Promise.all([
    loadProjects(l),
    loadTestimonials(l),
    loadFaq(l),
    getSiteSettings(),
  ]);

  return (
    <>
      <Preloader />
      <GhostCode />

      <div className="hero">
        <div className="stars" />
        <OrbitCanvas />
        <Terminal />

        <div className="scopy">
          <p className="stag">{t.hero.tag}</p>
          <h1>{heroTitle(t.hero.title)}</h1>
          <p className="sub">{t.hero.sub}</p>
          <div className="cta">
            <a className="sbtn p" href="#contact">
              {t.hero.start}
            </a>
            <a className="sbtn" href="#services">
              {t.hero.explore}
            </a>
          </div>
        </div>

        <div className="scroll">{t.hero.scroll}</div>
      </div>

      {/* ТЗ §6.4 — About DS DIGITAL: кто мы и что делаем, без выдуманных фактов. */}
      <section id="about">
        <div className="swrap">
          <h2>{t.about.title}</h2>
          <p className="slead">{t.about.lead}</p>
          <div className="about-grid">
            <div className="about-text">
              {t.about.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              <a className="sbtn" href={`/${l}/about`}>
                {t.about.more}
              </a>
            </div>
            <div>
              <h3>{t.about.focusTitle}</h3>
              <ul className="about-list">
                {t.about.focus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="services">
        <div className="swrap">
          <h2>{t.services.title}</h2>
          <p className="slead">{t.services.lead}</p>
          <ServiceCards locale={l} />
        </div>
      </section>

      <section id="projects">
        <div className="swrap">
          <h2>{t.projects.title}</h2>
          <p className="slead">{t.projects.lead}</p>
          {projects.length > 0 ? (
            <div>
              {projects.map((project) => (
                <article className="proj" key={project.id}>
                  <div>
                    <span className="tag">{project.tag}</span>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                    <ul className="feat">
                      {project.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mock" aria-hidden="true">
                    <div className="sb">
                      <s /><s /><s /><s /><s />
                    </div>
                    <div className="mn">
                      <div className="kp">
                        <s /><s /><s />
                      </div>
                      <div className="tb">
                        <s /><s /><s /><s /><s /><s /><s />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="sempty">{t.projects.empty}</p>
          )}
          <div className="smore">
            <a className="sbtn" href={`/${l}/projects`}>
              {t.projects.more}
            </a>
          </div>
        </div>
      </section>

      {/* ТЗ §6.7 — выделенный блок KarmaRent CRM: реальные скриншоты и живые площадки. */}
      <section id="karma" className="karma">
        <div className="swrap">
          <h2>{t.karma.title}</h2>
          <p className="slead">{t.karma.lead}</p>
          <ul className="karma-features">
            {t.karma.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <div className="karma-links">
            {t.karma.links.map((link) => (
              <a
                className="sbtn"
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <div className="karma-shots">
            {t.karma.shots.map((shot) => (
              <figure key={shot.src}>
                <Image src={shot.src} alt={shot.alt} fill sizes="(max-width: 600px) 100vw, 33vw" />
              </figure>
            ))}
          </div>
          <p className="snote">{t.karma.note}</p>
          <div className="cta">
            <a className="sbtn p" href={`/${l}/projects`}>
              {t.karma.cta}
            </a>
          </div>
        </div>
      </section>

      {/* ТЗ §6.8 — Technologies: только реально используемый стек. */}
      <section id="technologies">
        <div className="swrap">
          <h2>{t.technologies.title}</h2>
          <p className="slead">{t.technologies.lead}</p>
          <div className="tech-grid">
            {t.technologies.groups.map((group) => (
              <div className="tech-group" key={group.name}>
                <h3>{group.name}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DataGraph locale={l} />
        </div>
      </section>

      <section id="process">
        <div className="swrap">
          <h2>{t.process.title}</h2>
          <p className="slead">{t.process.lead}</p>
          <ol className="steps">
            {t.process.steps.map((step, index) => (
              <li key={step.title}>
                <span className="num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ТЗ §6.10 — Why Choose DS DIGITAL: только проверяемые преимущества. */}
      <section id="why">
        <div className="swrap">
          <h2>{t.why.title}</h2>
          <p className="slead">{t.why.lead}</p>
          <div className="why-grid">
            {t.why.items.map((item) => (
              <article className="why-item" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews">
        <div className="swrap">
          <h2>{t.reviews.title}</h2>
          <p className="slead">{t.reviews.lead}</p>
          {testimonials.length > 0 ? (
            <div className="revs">
              {testimonials.map((item) => (
                <figure key={item.id}>
                  <blockquote>{item.text}</blockquote>
                  <figcaption>
                    <strong>{item.authorName}</strong>
                    {item.authorRole ? <span>{item.authorRole}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="sempty">{t.reviews.empty}</p>
          )}
        </div>
      </section>

      <section id="faq">
        <div className="swrap">
          <h2>{t.faq.title}</h2>
          <p className="slead">{t.faq.lead}</p>
          {faq.length > 0 ? (
            <div className="faq">
              {faq.map((item) => (
                <details key={item.id}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          ) : (
            <p className="sempty">{t.faq.empty}</p>
          )}
        </div>
      </section>

      {/* ТЗ §6.13 — блок-обёртка калькулятора (полная версия — /calculator). */}
      <div id="calc" className="calc-home">
        <div className="swrap">
          <div className="head">
            <h2>{t.calculator.title}</h2>
            <p className="slead">{t.calculator.lead}</p>
          </div>
        </div>
        <Calculator locale={l} />
        <div className="swrap">
          <p className="snote">{t.calculator.notReady}</p>
        </div>
      </div>

      {/* ТЗ §6.14 — виджет AI-консультанта; маркировка «AI-ассистент» внутри виджета. */}
      {settings.aiEnabled ? (
        <section id="ai" className="ai-home">
          <div className="swrap">
            <h2>{t.aiSection.title}</h2>
            <p className="slead">{t.aiSection.lead}</p>
            <div className="cta">
              <OpenAiButton label={t.aiSection.open} />
            </div>
            <p className="snote">
              {t.aiSection.note} {t.aiSection.powered}
            </p>
          </div>
        </section>
      ) : null}

      <section id="contact" className="contact">
        <div className="swrap">
          <h2>{t.contact.title}</h2>
          <p className="slead">{t.contact.lead}</p>
          <div className="cta">
            {contactLinks(settings, l).map((channel) => (
              <a
                className={`sbtn${channel.key === "telegram" ? " p" : ""}`}
                key={channel.key}
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {channel.label}
              </a>
            ))}
            {contactLinks(settings, l).length === 0 ? (
              <a className="sbtn p" href="#lead">
                {t.contact.formLink}
              </a>
            ) : null}
          </div>
          <p className="snote">{t.contact.note}</p>
        </div>
      </section>

      {/* Реальная форма заявки: сохраняет лид в PostgreSQL (ТЗ §14). */}
      <section id="lead" className="lead">
        <div className="swrap">
          <h2>{t.form.title}</h2>
          <p className="slead">{t.form.lead}</p>
          <ContactForm locale={l} />
        </div>
      </section>
    </>
  );
}
