import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("экранирует запятые, кавычки и переводы строк", () => {
    const csv = toCsv(["a", "b"], [["1,2", 'say "hi"']]);
    const line = csv.split("\r\n")[1];
    expect(line).toBe('"1,2","say ""hi"""');
  });

  it("перевод строки внутри ячейки не ломает структуру", () => {
    const csv = toCsv(["a"], [["one\ntwo"]]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('"one\ntwo"');
  });

  it("защита от CSV-инъекции (= + - @)", () => {
    const csv = toCsv(["a"], [["=cmd|' /C calc'!A0"]]);
    expect(csv.split("\r\n")[1]).toBe('"\'=cmd|\' /C calc\'!A0"');
    expect(csv.split("\r\n")[1].startsWith("\"'")).toBe(true);
  });

  it("пустое значение остаётся пустой ячейкой", () => {
    const csv = toCsv(["a", "b"], [[null, undefined]]);
    expect(csv.split("\r\n")[1]).toBe('"",""');
  });

  it("BOM для корректного открытия в Excel, CRLF-окончания", () => {
    const csv = toCsv(["h"], [["x"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("\r\n");
  });

  it("количество строк = 1 заголовок + N значений", () => {
    const csv = toCsv(["a"], [["1"], ["2"], ["3"]]);
    expect(csv.split("\r\n")).toHaveLength(4);
  });
});
