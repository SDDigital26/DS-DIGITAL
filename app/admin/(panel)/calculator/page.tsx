import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getSetting, CALCULATOR_SETTING_KEY } from "@/lib/settings";
import { CalculatorRulesEditor } from "@/components/admin/CalculatorRulesEditor";

export const metadata = { title: "Калькулятор" };

/** /admin/calculator — цены и сценарий расчёта правятся без деплоя. */
export default async function AdminCalculatorPage() {
  await requirePagePermission("settings");

  const [rows, config] = await Promise.all([
    db.calculatorRule.findMany({ orderBy: [{ kind: "asc" }, { sort: "asc" }] }),
    getSetting<Record<string, unknown>>(CALCULATOR_SETTING_KEY),
  ]);

  const readString = (value: unknown): string =>
    typeof value === "string" ? value : "";

  const grouped = new Map<string, { kind: string; key: string; price: number; weight: number; weeksMin: number | null; weeksMax: number | null; sort: number; active: boolean; ru: string; en: string }>();
  for (const row of rows) {
    const id = `${row.kind}:${row.key}`;
    const entry =
      grouped.get(id) ??
      { kind: row.kind, key: row.key, price: row.price, weight: row.weight, weeksMin: row.weeksMin, weeksMax: row.weeksMax, sort: row.sort, active: row.active, ru: "", en: "" };
    if (row.locale === "ru") entry.ru = row.label;
    if (row.locale === "en") entry.en = row.label;
    entry.price = row.price;
    entry.weight = row.weight;
    entry.weeksMin = row.weeksMin;
    entry.weeksMax = row.weeksMax;
    entry.sort = row.sort;
    entry.active = row.active;
    grouped.set(id, entry);
  }

  const rules = [...grouped.values()].sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Калькулятор стоимости</h1>
        <p className="mt-1 text-sm text-secondary">
          Правила хранятся в БД: изменение цены применяется к публичному расчёту без деплоя.
          Цена — «от» (USD); срок — в неделях; несколько выбранных услуг суммируются, срок берётся
          максимальный.
        </p>
      </header>

      <CalculatorRulesEditor
        rules={rules as Parameters<typeof CalculatorRulesEditor>[0]["rules"]}
        disclaimer={{
          ru: readString(config?.ru) || readString(config?.disclaimerRu),
          en: readString(config?.en) || readString(config?.disclaimerEn),
        }}
      />
    </div>
  );
}
