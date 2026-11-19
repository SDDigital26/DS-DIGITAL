/**
 * Формирование CSV (экспорт заявок, ТЗ §17).
 * Правила: экранируем кавычки/запятые/переводы строк, BOM для корректного
 * открытия UTF-8 в Excel, значения не превращаются в формулы (префикс-апостроф
 * перед = + - @).
 */

function sanitizeCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  // Защита от CSV-injection при открытии в Excel/LibreOffice
  const safe = /^[=+\-@]/.test(raw.trimStart()) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(sanitizeCell).join(",");
  const body = rows.map((row) => row.map(sanitizeCell).join(","));
  // BOM — Excel открывает UTF-8 корректно
  return "\uFEFF" + [headerLine, ...body].join("\r\n");
}
