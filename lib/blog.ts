import type { Locale } from "@/lib/i18n/config";

/**
 * Минимальный рендерер Markdown для статей блога (этап 9).
 * Поддерживает: ## H2, ### H3, - списки, **жирный**, [текст](ссылка), абзацы.
 * HTML экранируется — контент правила администратор, но XSS исключён.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => {
      const safe = /^(https?:\/\/|\/|#)/.test(href) ? href : "#";
      return `<a href="${safe.replace(/"/g, "&quot;")}">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderArticleBody(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      out.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("- ")) {
      list.push(line.slice(2));
    } else {
      flushList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  return out.join("\n");
}

/** FAQPage JSON-LD (ТЗ: микроразметка FAQ где возможно). */
export function faqJsonLd(faq: { q: string; a: string }[], locale: Locale, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    inLanguage: locale,
    mainEntity: faq
      .filter((item) => item.q && item.a)
      .map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  url: string;
  datePublished: string | null;
  locale: Locale;
  siteUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: input.url,
    inLanguage: input.locale,
    datePublished: input.datePublished ?? undefined,
    author: { "@type": "Organization", name: "DS DIGITAL", url: input.siteUrl },
    publisher: { "@type": "Organization", name: "DS DIGITAL", url: input.siteUrl },
  };
}
