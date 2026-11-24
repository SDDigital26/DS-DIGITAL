"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { formatFromPrice, formatWeeks, type CalcRule, type CalcResult } from "@/lib/calculator";
import { trackEvent } from "@/lib/tracking";

type Props = { locale: Locale; compact?: boolean };

type Labels = {
  title: string;
  disclaimer: string;
  services: string;
  options: string;
  other: string;
  result: string;
  from: string;
  weeks: string;
  individual: string;
  selected: string;
  submit: string;
  submitting: string;
  network: string;
  notReady: string;
};

const LABELS: Record<Locale, Labels> = {
  ru: {
    title: "Калькулятор стоимости",
    disclaimer:
      "Расчёт предварительный. Окончательная стоимость и сроки определяются после обсуждения проекта.",
    services: "Что нужно (можно несколько)",
    options: "Дополнительно",
    other: "Другое",
    result: "Предварительная стоимость",
    from: "от",
    weeks: "Срок",
    individual: "Обсудим индивидуально",
    selected: "Вы выбрали",
    submit: "Отправить расчёт",
    submitting: "Считаем…",
    network: "Нет соединения с сервером.",
    notReady:
      "Подберём решение и точную смету индивидуально — оставьте заявку, это ни к чему не обязывает.",
  },
  en: {
    title: "Cost calculator",
    disclaimer:
      "This is a preliminary estimate. The final cost and timeline are agreed after discussing the project.",
    services: "What you need (pick several)",
    options: "Optional",
    other: "Something else",
    result: "Indicative cost",
    from: "from",
    weeks: "Timeline",
    individual: "We will discuss it individually",
    selected: "You selected",
    submit: "Send this estimate",
    submitting: "Calculating…",
    network: "Cannot reach the server.",
    notReady:
      "We will pick a solution and an exact quote individually — leave a request, no strings attached.",
  },
};

/** Ключ клиентской опции «Другое» — в БД не хранится и на сервер не уходит. */
const OTHER_KEY = "__other__";

function groupByKind(rules: CalcRule[], kind: CalcRule["kind"]) {
  return rules.filter((r) => r.kind === kind);
}

/**
 * Публичный калькулятор (цены владельца, 24.11.2026).
 * Услуги — чекбоксы: цена = сумма «от»-цен, срок = максимальный.
 * «Другое» → «Обсудим индивидуально». Правила — из БД, итог считает сервер.
 */
export function Calculator({ locale, compact = false }: Props) {
  const t = LABELS[locale];
  const [rules, setRules] = useState<CalcRule[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [other, setOther] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Правила — из БД через публичный API (только язык текущей страницы).
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/calculator?locale=${locale}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.ok) return;
        setRules(data.rules ?? []);
        setDisclaimer(typeof data.disclaimer?.[locale] === "string" ? (data.disclaimer[locale] as string) : t.disclaimer);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => controller.abort();
  }, [locale, t.disclaimer]);

  // Пересчёт — только на сервере; клиент ждёт ответа.
  const recalc = useCallback(
    async (next: { services: string[]; options: string[] }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/calculator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selection: next, locale }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("bad");
        const data = (await res.json()) as { ok: true; result: CalcResult | null; disclaimer?: Record<string, string> };
        setResult(data.result);
        if (data.disclaimer?.[locale]) setDisclaimer(data.disclaimer[locale]);
      } catch {
        setError(t.network);
      } finally {
        setLoading(false);
      }
    },
    [locale, t.network],
  );

  // Автопересчёт при изменении выбора — с задержкой, чтобы не спамить.
  useEffect(() => {
    if (!loaded || services.length === 0) return;
    const timer = window.setTimeout(() => {
      void recalc({ services, options });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loaded, services, options, recalc]);

  const serviceRules = groupByKind(rules, "service");
  const optionRules = groupByKind(rules, "option");
  // Правил в БД нет — честно предлагаем обсудить задачу (без слов про согласование).
  const notReady = loaded && serviceRules.length === 0;

  const toggle = (list: string[], key: string) =>
    list.includes(key) ? list.filter((k) => k !== key) : [...list, key];

  const hasSelection = services.length > 0 || other;
  const individualOnly = other && services.length === 0;
  // Пока ни одна услуга не выбрана — прежний результат не показываем.
  const visibleResult = services.length > 0 ? result : null;
  const selectedLabels = [
    ...(visibleResult?.selectedLabels ?? []),
    ...(other ? [`${t.other} — ${t.individual.toLowerCase()}`] : []),
  ];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasSelection) return;

    const labels: string[] = selectedLabels;

    const weeks = visibleResult ? formatWeeks(locale, visibleResult.weeksMin, visibleResult.weeksMax) : "";
    const priceText = visibleResult
      ? formatFromPrice(locale, visibleResult.price)
      : t.individual;

    // Снимок расчёта уходит вместе с заявкой (source=calculator) — ТЗ §12.5.
    window.dispatchEvent(
      new CustomEvent("ds:estimate", {
        detail: {
          text: `${t.selected}: ${labels.join(", ")}\n${priceText}${weeks ? ` · ${t.weeks}: ${weeks}` : ""}`,
          snapshot: {
            locale,
            selection: { services, options, other },
            result,
          },
          serviceLabel: serviceRules.find((r) => services.includes(r.key))?.label ?? t.other,
        },
      }),
    );
    // Событие рекламы: расчёт использован (ТЗ §16).
    trackEvent("calc_used");
    document.getElementById("lead")?.scrollIntoView({ behavior: "smooth" });
  };

  if (notReady) {
    return (
      <section id="calc-body" className="calc" aria-label={t.title}>
        <div className="panel not-ready">
          <p>{t.notReady}</p>
          <button
            type="button"
            className="sbtn p"
            onClick={() => document.getElementById("lead")?.scrollIntoView({ behavior: "smooth" })}
          >
            {t.submit}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="calc-body" className="calc" aria-label={t.title}>
      <div className="calc-grid">
        <form className="panel fields" onSubmit={submit}>
          <fieldset className="fld">
            <legend>{t.services}</legend>
            <div className="opts">
              {serviceRules.map((r) => {
                const weeks = formatWeeks(locale, r.weeksMin, r.weeksMax);
                return (
                  <label key={r.key} className="opt" htmlFor={`s_${r.key}`}>
                    <input
                      id={`s_${r.key}`}
                      name="services"
                      type="checkbox"
                      checked={services.includes(r.key)}
                      onChange={() => setServices((v) => toggle(v, r.key))}
                    />
                    <span className="lbl">
                      {r.label}
                      {weeks ? <small className="wk">{weeks}</small> : null}
                    </span>
                    <span className="p">{formatFromPrice(locale, r.price)}</span>
                  </label>
                );
              })}
              <label className="opt" htmlFor={`s_${OTHER_KEY}`}>
                <input
                  id={`s_${OTHER_KEY}`}
                  name="services-other"
                  type="checkbox"
                  checked={other}
                  onChange={() => setOther((v) => !v)}
                />
                <span className="lbl">{t.other}</span>
                <span className="p muted">{t.individual}</span>
              </label>
            </div>
          </fieldset>

          {optionRules.length > 0 ? (
            <fieldset className="fld">
              <legend>{t.options}</legend>
              <div className="opts">
                {optionRules.map((r) => (
                  <label key={r.key} className="opt" htmlFor={`o_${r.key}`}>
                    <input
                      id={`o_${r.key}`}
                      name="options"
                      type="checkbox"
                      checked={options.includes(r.key)}
                      onChange={() => setOptions((v) => toggle(v, r.key))}
                    />
                    <span className="lbl">{r.label}</span>
                    <span className="p">+{formatFromPrice(locale, r.price).replace(/^(от|from) /, "")}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {error ? (
            <p role="alert" className="calc-error">
              {error}
            </p>
          ) : null}
        </form>

        <div className="panel result" aria-live="polite">
          <div className="l note">{t.result}</div>
          <div className="price">
            {individualOnly
              ? t.individual
              : visibleResult
                ? formatFromPrice(locale, visibleResult.price)
                : ""}
          </div>
          {visibleResult && (visibleResult.weeksMin !== null || visibleResult.weeksMax !== null) ? (
            <div className="weeks">
              {t.weeks}: {formatWeeks(locale, visibleResult.weeksMin, visibleResult.weeksMax)}
            </div>
          ) : null}
          {selectedLabels.length ? (
            <ul className="sel">
              {selectedLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : null}
          <p className="note">{disclaimer || t.disclaimer}</p>
          <button type="submit" className="sbtn p" disabled={loading || !hasSelection} onClick={submit}>
            {loading ? t.submitting : t.submit}
          </button>
          {compact ? <span className="sr-only">calculator</span> : null}
        </div>
      </div>
    </section>
  );
}
