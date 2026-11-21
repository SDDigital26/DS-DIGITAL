"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";

type Turn = { role: "user" | "assistant"; content: string };

const TEXT = {
  ru: {
    open: "AI-ассистент",
    title: "AI-ассистент DS DIGITAL",
    subtitle: "Поможет выбрать услугу и оставить заявку",
    placeholder: "Опишите задачу…",
    send: "Отправить",
    cancel: "Отмена",
    close: "Закрыть",
    greeting: "Перед началом нужно согласие: описание задачи и контакт, если вы их предоставите, будут обработаны для подготовки заявки и передачи менеджеру DS DIGITAL. Напишите «да», чтобы продолжить. До согласия текст не сохраняется.",
    thinking: "Печатает…",
    fallbackNote: "Пошаговый сценарий; при подключённом API ответы уточняет языковая модель. Цены и сроки не называются.",
    error: "Не удалось получить ответ. Попробуйте ещё раз или напишите нам через форму контактов.",
    privacy: "Политика конфиденциальности",
  },
  en: {
    open: "AI assistant",
    title: "DS DIGITAL AI assistant",
    subtitle: "Helps you pick a service and leave a request",
    placeholder: "Describe your task…",
    send: "Send",
    cancel: "Cancel",
    close: "Close",
    greeting: "Before we begin, please consent: your task description and any contact details you provide will be processed to prepare your request and share it with a DS DIGITAL manager. Type “yes” to continue. Text entered before consent is not stored.",
    thinking: "Typing…",
    fallbackNote: "Step-by-step script; with a connected API a language model refines replies. No prices or deadlines are quoted.",
    error: "Could not get a reply. Try again or use the contact form.",
    privacy: "Privacy policy",
  },
} as const;

/** AI consultant transparently uses a free scripted flow and server-side session history. */
export function AiConsultant({ locale }: { locale: Locale }) {
  const t = TEXT[locale];
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", content: t.greeting }]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai/consult", { method: "GET", cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const messages = data?.messages;
        if (!Array.isArray(messages) || messages.length === 0) return;
        const safe = messages.filter(
          (message: unknown): message is Turn =>
            typeof message === "object" &&
            message !== null &&
            "role" in message &&
            "content" in message &&
            ((message as Turn).role === "user" || (message as Turn).role === "assistant") &&
            typeof (message as Turn).content === "string",
        );
        if (safe.length > 0) setTurns([{ role: "assistant", content: t.greeting }, ...safe]);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [t.greeting]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [turns, open]);

  // Кнопка на главной (блок «AI-консультант», ТЗ §6.14) открывает виджет.
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("ds:ai-open", onOpen);
    return () => window.removeEventListener("ds:ai-open", onOpen);
  }, []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || pending) return;

    setTurns((list) => [...list, { role: "user", content: message }]);
    setInput("");
    setPending(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, message }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as { reply?: string } | null;
      if (!response.ok || !data?.reply) throw new Error("request failed");
      setTurns((list) => [...list, { role: "assistant", content: data.reply! }]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setTurns((list) => [...list, { role: "assistant", content: t.error }]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setPending(false);
    }
  }, [input, locale, pending, t.error]);

  return (
    <div className="ai">
      {!open ? (
        <button type="button" className="ai-open" onClick={() => setOpen(true)} aria-expanded="false">
          <span aria-hidden="true">✦</span> {t.open}
        </button>
      ) : (
        <section className="ai-panel" aria-label={t.title}>
          <header className="ai-head">
            <div>
              <strong>{t.title}</strong>
              <span>{t.subtitle}</span>
            </div>
            <button type="button" className="ai-close" onClick={() => setOpen(false)} aria-label={t.close}>
              ✕
            </button>
          </header>

          <div className="ai-list" ref={listRef} role="log" aria-live="polite" aria-relevant="additions">
            {turns.map((turn, index) => (
              <p key={`${turn.role}-${index}`} className={`ai-msg ${turn.role}`}>
                {turn.content}
              </p>
            ))}
            {pending ? <p className="ai-msg assistant muted">{t.thinking}</p> : null}
          </div>

          <form
            className="ai-form"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="ai-input">
              {t.placeholder}
            </label>
            <input
              id="ai-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              maxLength={2000}
              autoComplete="off"
            />
            <button type="submit" disabled={pending || !input.trim()}>
              {t.send}
            </button>
            {pending ? (
              <button type="button" onClick={cancel}>
                {t.cancel}
              </button>
            ) : null}
          </form>

          <p className="ai-note">
            {t.fallbackNote} <a href={`/${locale}/privacy`}>{t.privacy}</a>
          </p>
        </section>
      )}
    </div>
  );
}
