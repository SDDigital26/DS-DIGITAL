"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { CalcRule, CalcResult, RuleKind } from "@/lib/calculator";

type Props = { locale: Locale; compact?: boolean };

type Labels = {
  title: string;
  lead: string;
  disclaimer: string;
  service: string;
  features: string;
  complexity: string;
  options: string;
  result: string;
  weeks: string;
  selected: string;
  submit: string;
  submitting: string;
  error: string;
  network: string;
  notReady: string;
};

const LABELS: Record<Locale, Labels> = {
  ru: {
    title: "Калькулятор стоимости",
    lead: "Выберите, что нужно, и получите примерную цену и срок.",
    disclaimer:
      "Расчёт предварительный. Окончательная стоимость и сроки определяются после обсуждения проекта.",
    service: "Что нужно",
    features: "Функции",
    complexity: "Сложность",
    options: "Дополнительно",
    result: "Предварительная стоимость",
    weeks: "Срок",
    selected: "Вы выбрали",
    submit: "Отправить расчёт",
    submitting: "Считаем…",
    error: "Сервер не принял расчёт. Попробуйте ещё раз.",
    network: "Нет соединения с сервером.",
    notReady:
      "Цены пока не согласованы — калькулятор скоро появится. Оставьте заявку ниже: обсудим задачу и сроки.",
  },
  en: {
    title: "Cost calculator",
    lead: "Pick what you need and get an indicative price and timeline.",
    disclaimer:
      "This is a preliminary estimate. The final cost and timeline are agreed after discussing the project.",
    service: "What you need",
    features: "Features",
    complexity: "Complexity",
    options: "Optional",
    result: "Indicative cost",
    weeks: "Timeline",
    selected: "You selected",
    submit: "Send this estimate",
    submitting: "Calculating…",
    error: "The server rejected the estimate. Try again.",
    network: "Cannot reach the server.",
    notReady:
      "Prices are not approved yet — the calculator is coming soon. Send a request below and we will discuss the task and timeline.",
  },
};

function groupByKind(rules: CalcRule[], kind: RuleKind) {
  return rules.filter((r) => r.kind === kind);
}

/** Одна опция — чекбокс/радио с ценой, если она есть. */
function Option({
  id,
  name,
  checked,
  onChange,
  label,
  price,
  locale,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  price: number;
  locale: Locale;
}) {
  return (
    <label className="opt" htmlFor={id}>
      <input id={id} name={name} type={name === "complexity" ? "radio" : "checkbox"} checked={checked} onChange={onChange} />
      <span className="lbl">{label}</span>
      {price > 0 ? <span className="p">{locale === "ru" ? `+$${price}` : `+$${price}`}</span> : null}
    </label>
  );
}

/**
 * Публичный калькулятор. Правила приходят с сервера (БД), итог считает
 * сервер (`POST /api/calculator`) — клиентская сумма не показывается как
 * «настоящая», а только как предпросмотр. Это не фейковый интерфейс:
 * он реально считает и реально передаёт расчёт в заявку.
 */
export function Calculator({ locale, compact = false }: Props) {
  const t = LABELS[locale];
  const [rules, setRules] = useState<CalcRule[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [service, setService] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [complexity, setComplexity] = useState("");
  const [options, setOptions] = useState<string[]>([]);
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
        const rows: CalcRule[] = data.rules ?? [];
        setRules(rows);
        setDisclaimer(typeof data.disclaimer?.[locale] === "string" ? (data.disclaimer[locale] as string) : t.disclaimer);
        const firstService = rows.find((r) => r.kind === "service");
        const firstComplexity = rows.find((r) => r.kind === "complexity");
        if (firstService) setService(firstService.key);
        if (firstComplexity) setComplexity(firstComplexity.key);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => controller.abort();
  }, [locale, t.disclaimer]);

  // Пересчёт — только на сервере; клиент ждёт ответа.
  const recalc = useCallback(
    async (next: { service: string; features: string[]; complexity: string; options: string[] }) => {
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
        const data = (await res.json()) as { ok: true; result: CalcResult; disclaimer?: Record<string, string> };
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
    if (!loaded || !service) return;
    const timer = window.setTimeout(() => {
      void recalc({ service, features, complexity, options });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loaded, service, features, complexity, options, recalc]);

  const services = groupByKind(rules, "service");
  const featureRules = groupByKind(rules, "feature");
  const complexityRules = groupByKind(rules, "complexity");
  const optionRules = groupByKind(rules, "option");
  // Цены ещё не согласованы (нет правил в БД) — честно показываем заглушку.
  const notReady = loaded && services.length === 0;

  const toggle = (list: string[], key: string) =>
    list.includes(key) ? list.filter((k) => k !== key) : [...list, key];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (result) {
      // Снимок расчёта уходит вместе с заявкой (source=calculator) — ТЗ §12.5.
      window.dispatchEvent(
        new CustomEvent("ds:estimate", {
          detail: {
            text: `${t.selected}: ${result.selectedLabels.join(", ")}\n$${result.min} – $${result.max} · ${t.weeks}: ${result.weeksMin}–${result.weeksMax} ${locale === "ru" ? "нед." : "weeks"}`,
            snapshot: {
              locale,
              selection: { service, features, complexity, options },
              result,
            },
            serviceLabel: services.find((r) => r.key === service)?.label ?? service,
          },
        }),
      );
    }
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
          <div className="fld">
            <label htmlFor="calc_svc">{t.service}</label>
            <select id="calc_svc" value={service} onChange={(e) => setService(e.target.value)}>
              {services.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {featureRules.length > 0 ? (
            <fieldset className="fld">
              <legend>{t.features}</legend>
              <div className="opts">
                {featureRules.map((r) => (
                  <Option
                    key={r.key}
                    id={`f_${r.key}`}
                    name="features"
                    label={r.label}
                    price={r.price}
                    locale={locale}
                    checked={features.includes(r.key)}
                    onChange={() => setFeatures((v) => toggle(v, r.key))}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}

          {complexityRules.length > 0 ? (
            <fieldset className="fld">
              <legend>{t.complexity}</legend>
              <div className="seg" role="radiogroup" aria-label={t.complexity}>
                {complexityRules.map((r) => (
                  <label key={r.key} className={complexity === r.key ? "on" : ""}>
                    <input
                      type="radio"
                      name="calc_complexity"
                      checked={complexity === r.key}
                      onChange={() => setComplexity(r.key)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {optionRules.length > 0 ? (
            <fieldset className="fld">
              <legend>{t.options}</legend>
              <div className="opts">
                {optionRules.map((r) => (
                  <Option
                    key={r.key}
                    id={`o_${r.key}`}
                    name="options"
                    label={r.label}
                    price={r.price}
                    locale={locale}
                    checked={options.includes(r.key)}
                    onChange={() => setOptions((v) => toggle(v, r.key))}
                  />
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
            {result ? `$${result.min} – $${result.max}` : "—"}
          </div>
          <div className="weeks">
            {result
              ? `${t.weeks}: ${result.weeksMin}–${result.weeksMax} ${locale === "ru" ? "нед." : "weeks"}`
              : "—"}
          </div>
          {result?.selectedLabels.length ? (
            <ul className="sel">
              {result.selectedLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : null}
          <p className="note">{disclaimer || t.disclaimer}</p>
          <button type="submit" className="sbtn p" disabled={loading || !result} onClick={submit}>
            {loading ? t.submitting : t.submit}
          </button>
          {compact ? <span className="sr-only">calculator</span> : null}
        </div>
      </div>
    </section>
  );
}
