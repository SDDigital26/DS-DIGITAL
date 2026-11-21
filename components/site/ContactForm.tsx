"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { FORM_LABELS, SERVICES } from "@/lib/content/site";

type Status = "idle" | "sending" | "sent" | "error";

type EstimateDetail = {
  text: string;
  snapshot?: unknown;
  serviceLabel?: string;
};

/** Свободный контакт → поля API (email / telegram / whatsapp). */
function contactFields(raw: string): Record<string, string> {
  const value = raw.trim();
  if (!value) return {};

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return { email: value };

  const telegram = value.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "").replace(/^@/, "");
  if (/^[A-Za-z0-9_]{4,32}$/.test(telegram)) return { telegram };

  if (/^[+\d][\d\s()-]{6,}$/.test(value)) return { whatsapp: value };

  return { telegram: value.slice(0, 64) };
}

/**
 * Реальная форма заявки на странице /contact: сохраняет лид в PostgreSQL
 * через POST /api/leads и делает его доступным в админке.
 */
export function ContactForm({ locale, defaultService }: { locale: Locale; defaultService?: string }) {
  const t = FORM_LABELS[locale];
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [service, setService] = useState(defaultService || SERVICES[locale][0].title);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  // Расчёт калькулятора прикладывается к заявке как снимок (ТЗ §12.5).
  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);

  useEffect(() => {
    function onEstimate(event: Event) {
      const detail = (event as CustomEvent<EstimateDetail>).detail;
      if (!detail || typeof detail.text !== "string" || !detail.text.trim()) return;
      setEstimate(detail);
      setMessage(detail.text);
      if (detail.serviceLabel) setService(detail.serviceLabel);
      setStatus("idle");
      setError(null);
    }
    window.addEventListener("ds:estimate", onEstimate);
    return () => window.removeEventListener("ds:estimate", onEstimate);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !contact.trim() || !message.trim()) {
      setError(t.fillAll);
      setStatus("error");
      return;
    }
    if (!consent) {
      setError(t.consentRequired);
      setStatus("error");
      return;
    }

    setStatus("sending");

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: message.trim(),
      service,
      language: locale,
      consent: true,
      consentText: t.consent,
      source: estimate ? "calculator" : "form",
      landingPath: window.location.pathname,
      website: "",
      ...(estimate?.snapshot ? { calculatorSnapshot: estimate.snapshot } : {}),
      ...contactFields(contact),
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("sent");
        setName("");
        setContact("");
        setMessage("");
        setConsent(false);
        setEstimate(null);
        return;
      }

      const body = (await res.json().catch(() => null)) as
        | { error?: string; issues?: Array<{ message: string }> }
        | null;
      setError(body?.issues?.length ? body.issues.map((i) => i.message).join("; ") : t.failed);
      setStatus("error");
    } catch {
      setError(t.failed);
      setStatus("error");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-base text-white outline-none focus:border-cyan min-h-12";
  const labelClass = "mb-2 block text-xs uppercase tracking-wider text-secondary";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto flex max-w-2xl flex-col gap-5 rounded-2xl border border-white/10 bg-surface/60 p-5 text-left sm:p-7"
    >
      <div>
        <label className={labelClass} htmlFor="lf_name">
          {t.name}
        </label>
        <input
          id="lf_name"
          className={inputClass}
          type="text"
          autoComplete="name"
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="lf_contact">
          {t.contact}
        </label>
        <input
          id="lf_contact"
          className={inputClass}
          type="text"
          autoComplete="off"
          value={contact}
          maxLength={120}
          onChange={(event) => setContact(event.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="lf_svc">
          {t.service}
        </label>
        <select
          id="lf_svc"
          className={inputClass}
          value={service}
          onChange={(event) => setService(event.target.value)}
        >
          {SERVICES[locale].map((item) => (
            <option key={item.title} value={item.title}>
              {item.title}
            </option>
          ))}
          {/* Услуга из калькулятора может не совпадать со статичным списком. */}
          {SERVICES[locale].some((item) => item.title === service) ? null : (
            <option value={service}>{service}</option>
          )}
          <option value={t.other}>{t.other}</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="lf_msg">
          {t.message}
        </label>
        <textarea
          id="lf_msg"
          className={`${inputClass} min-h-28`}
          value={message}
          maxLength={5000}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-secondary">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[#176BFF]"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          {t.consent}{" "}
          <a href={`/${locale}/privacy`} className="underline underline-offset-2 hover:text-white">
            {locale === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}
          </a>
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="sbtn p self-start disabled:opacity-60"
      >
        {status === "sending" ? t.sending : t.send}
      </button>

      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {status === "sent" ? (
        <div role="status" className="rounded-lg border border-cyan/30 bg-cyan/10 p-4 text-sm">
          <strong>{t.sent}</strong>
          <p className="mt-1 text-secondary">{t.sentNote}</p>
        </div>
      ) : null}
    </form>
  );
}
