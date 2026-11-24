"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type RuleRow = {
  kind: "service" | "feature" | "complexity" | "option";
  key: string;
  price: number;
  weight: number;
  weeksMin: number | null;
  weeksMax: number | null;
  sort: number;
  active: boolean;
  ru: string;
  en: string;
};

type Kind = RuleRow["kind"];

const KIND_LABELS: Record<Kind, string> = {
  service: "Услуги",
  feature: "Функции",
  complexity: "Сложность",
  option: "Опции",
};

const EMPTY: RuleRow = {
  kind: "service",
  key: "",
  price: 0,
  weight: 0,
  weeksMin: null,
  weeksMax: null,
  sort: 0,
  active: true,
  ru: "",
  en: "",
};

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

/**
 * Редактор правил калькулятора: цены меняются без деплоя (ТЗ §12, §17).
 * Изменение цены сразу влияет на публичный расчёт — сервер читает БД.
 */
export function CalculatorRulesEditor({
  rules,
  disclaimer,
}: {
  rules: RuleRow[];
  disclaimer: { ru: string; en: string };
}) {
  const router = useRouter();
  const [rows, setRows] = useState<RuleRow[]>(rules);
  const [draft, setDraft] = useState<RuleRow>({ ...EMPTY });
  // Дисклеймер — локальная копия пропса: мутировать props нельзя (React Compiler).
  const [disclaimerText, setDisclaimerText] = useState(disclaimer);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, setPending] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<Kind, RuleRow[]>();
    for (const row of rows) {
      const list = map.get(row.kind) ?? [];
      list.push(row);
      map.set(row.kind, list);
    }
    return map;
  }, [rows]);

  async function saveRow(row: RuleRow) {
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { issues?: Array<{ path: (string | number)[]; message: string }> }
          | null;
        setNote({
          text: body?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") ?? "Не удалось сохранить.",
          ok: false,
        });
        return;
      }
      setNote({ text: `Правило «${row.key}» сохранено.`, ok: true });
      router.refresh();
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  async function removeRow(row: RuleRow) {
    if (!window.confirm(`Удалить правило «${row.key}»?`)) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/calculator?kind=${row.kind}&key=${encodeURIComponent(row.key)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setNote({ text: "Не удалось удалить.", ok: false });
        return;
      }
      setRows((list) => list.filter((item) => !(item.kind === row.kind && item.key === row.key)));
      setNote({ text: "Удалено.", ok: true });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function saveDisclaimer() {
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disclaimer: disclaimerText }),
      });
      setNote({ text: res.ok ? "Дисклеймер сохранён." : "Не удалось сохранить дисклеймер.", ok: res.ok });
      if (res.ok) router.refresh();
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  function patchRow(index: number, patch: Partial<RuleRow>) {
    setRows((list) => list.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-6">
      {note ? (
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            note.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {note.text}
        </p>
      ) : null}

      {(["service", "feature", "complexity", "option"] as const).map((kind) => (
        <section key={kind} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
          <h2 className="text-lg font-semibold">{KIND_LABELS[kind]}</h2>
          <p className="mt-1 text-xs text-secondary">
            {kind === "complexity"
              ? "Вес — множитель итоговой цены (1 = без изменений)."
              : kind === "service"
                ? "Цена — «от» (USD). Несколько выбранных услуг суммируются, срок берётся максимальный."
                : "Цена прибавляется к сумме выбранных услуг."}
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-secondary">
                <tr>
                  <th className="px-2 py-2">Ключ</th>
                  <th className="px-2 py-2">RU</th>
                  <th className="px-2 py-2">EN</th>
                  <th className="px-2 py-2">Цена $ (от)</th>
                  {kind === "service" ? (
                    <th className="px-2 py-2">Срок, нед. (от–до)</th>
                  ) : null}
                  {kind === "complexity" ? <th className="px-2 py-2">Вес</th> : null}
                  <th className="px-2 py-2">Порядок</th>
                  <th className="px-2 py-2">Вкл</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(grouped.get(kind) ?? []).map((row) => {
                  const index = rows.indexOf(row);
                  return (
                    <tr key={`${row.kind}:${row.key}`} className="border-t border-white/5">
                      <td className="px-2 py-2 font-mono text-xs">{row.key}</td>
                      <td className="px-2 py-2">
                        <input
                          className={`${input} w-44`}
                          value={row.ru}
                          maxLength={120}
                          onChange={(e) => patchRow(index, { ru: e.target.value })}
                          aria-label={`Подпись RU ${row.key}`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className={`${input} w-44`}
                          value={row.en}
                          maxLength={120}
                          onChange={(e) => patchRow(index, { en: e.target.value })}
                          aria-label={`Подпись EN ${row.key}`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          className={`${input} w-24`}
                          value={row.price}
                          onChange={(e) => patchRow(index, { price: Number(e.target.value) })}
                          aria-label={`Цена ${row.key}`}
                        />
                      </td>
                      {kind === "service" ? (
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={520}
                              className={`${input} w-16`}
                              value={row.weeksMin ?? ""}
                              placeholder="—"
                              onChange={(e) =>
                                patchRow(index, { weeksMin: e.target.value === "" ? null : Number(e.target.value) })
                              }
                              aria-label={`Срок от, недель ${row.key}`}
                            />
                            <span className="text-xs text-secondary">–</span>
                            <input
                              type="number"
                              min={0}
                              max={520}
                              className={`${input} w-16`}
                              value={row.weeksMax ?? ""}
                              placeholder="—"
                              onChange={(e) =>
                                patchRow(index, { weeksMax: e.target.value === "" ? null : Number(e.target.value) })
                              }
                              aria-label={`Срок до, недель ${row.key}`}
                            />
                          </div>
                        </td>
                      ) : null}
                      {kind === "complexity" ? (
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.05}
                            className={`${input} w-20`}
                            value={row.weight}
                            onChange={(e) => patchRow(index, { weight: Number(e.target.value) })}
                            aria-label={`Вес ${row.key}`}
                          />
                        </td>
                      ) : null}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          className={`${input} w-20`}
                          value={row.sort}
                          onChange={(e) => patchRow(index, { sort: Number(e.target.value) })}
                          aria-label={`Порядок ${row.key}`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-[#176BFF]"
                          checked={row.active}
                          onChange={(e) => patchRow(index, { active: e.target.checked })}
                          aria-label={`Активно ${row.key}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => saveRow(row)}
                          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/85 disabled:opacity-60"
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => removeRow(row)}
                          className="ml-2 text-xs text-red-300 hover:text-red-200"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {kind === draft.kind ? null : null}
        </section>
      ))}

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Новое правило</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="draft-kind">Вид</label>
            <select
              id="draft-kind"
              className={input}
              value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value as Kind })}
            >
              {(["service", "feature", "complexity", "option"] as const).map((kind) => (
                <option key={kind} value={kind}>{KIND_LABELS[kind]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="draft-key">Ключ (латиница)</label>
            <input
              id="draft-key"
              className={input}
              value={draft.key}
              onChange={(e) => setDraft({ ...draft, key: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="draft-ru">Подпись RU</label>
            <input id="draft-ru" className={input} value={draft.ru} onChange={(e) => setDraft({ ...draft, ru: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="draft-en">Подпись EN</label>
            <input id="draft-en" className={input} value={draft.en} onChange={(e) => setDraft({ ...draft, en: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="draft-price">Цена $ (от)</label>
            <input
              id="draft-price"
              type="number"
              min={0}
              className={input}
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
            />
          </div>
          {draft.kind === "service" ? (
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="draft-weeks">Срок, нед. (от–до)</label>
              <div className="flex items-center gap-1">
                <input
                  id="draft-weeks"
                  type="number"
                  min={0}
                  max={520}
                  className={input}
                  value={draft.weeksMin ?? ""}
                  placeholder="—"
                  onChange={(e) => setDraft({ ...draft, weeksMin: e.target.value === "" ? null : Number(e.target.value) })}
                />
                <span className="text-xs text-secondary">–</span>
                <input
                  type="number"
                  min={0}
                  max={520}
                  className={input}
                  value={draft.weeksMax ?? ""}
                  placeholder="—"
                  onChange={(e) => setDraft({ ...draft, weeksMax: e.target.value === "" ? null : Number(e.target.value) })}
                  aria-label="Срок до, недель"
                />
              </div>
            </div>
          ) : null}
          {draft.kind === "complexity" ? (
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="draft-weight">Вес (сложность)</label>
              <input
                id="draft-weight"
                type="number"
                min={0}
                max={10}
                step={0.05}
                className={input}
                value={draft.weight}
                onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })}
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="draft-sort">Порядок</label>
            <input
              id="draft-sort"
              type="number"
              min={0}
              className={input}
              value={draft.sort}
              onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                await saveRow(draft);
                setRows((list) => {
                  const rest = list.filter((row) => !(row.kind === draft.kind && row.key === draft.key));
                  return [...rest, draft];
                });
                setDraft({ ...EMPTY, kind: draft.kind });
              }}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60"
            >
              Добавить / обновить
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Дисклеймер под результатом</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="disc-ru">RU</label>
            <textarea
              id="disc-ru"
              className={input}
              rows={3}
              defaultValue={disclaimerText.ru}
              onChange={(e) => setDisclaimerText({ ...disclaimerText, ru: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="disc-en">EN</label>
            <textarea
              id="disc-en"
              className={input}
              rows={3}
              defaultValue={disclaimerText.en}
              onChange={(e) => setDisclaimerText({ ...disclaimerText, en: e.target.value })}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={saveDisclaimer}
          className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60"
        >
          Сохранить дисклеймер
        </button>
      </section>
    </div>
  );
}
